import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getDatesWithNotes } from '../storage';
import './CalendarView.css';

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();
  const [noteDates, setNoteDates] = useState<Map<string, { category: string; count: number }[]>>(new Map());
  const [zoom, setZoom] = useState<{ rect: DOMRect; date: string } | null>(null);
  const [zoomBack, setZoomBack] = useState<string | null>(() => {
    const d = sessionStorage.getItem('zoomBackDate');
    if (d) sessionStorage.removeItem('zoomBackDate');
    return d;
  });
  const overlayRef = useRef<HTMLDivElement>(null);
  const zoomBackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  useEffect(() => {
    getDatesWithNotes(
      format(calStart, 'yyyy-MM-dd'),
      format(calEnd, 'yyyy-MM-dd')
    ).then(setNoteDates);
  }, [currentMonth, calStart, calEnd]);

  // Set initial overlay position before browser paints
  useLayoutEffect(() => {
    if (!zoomBack) return;
    const overlay = zoomBackRef.current;
    const mainContent = containerRef.current?.closest('.main-content');
    const r = mainContent?.getBoundingClientRect();
    if (overlay && r) {
      overlay.style.top = r.top + 'px';
      overlay.style.left = r.left + 'px';
      overlay.style.width = r.width + 'px';
      overlay.style.height = r.height + 'px';
    }
  }, [zoomBack]);

  // Animate the reverse zoom overlay once it's mounted
  useEffect(() => {
    if (!zoomBack) return;
    // Use a small delay to ensure the overlay and day refs are in the DOM
    const timer = setTimeout(() => {
      const overlay = zoomBackRef.current;
      const dayEl = dayRefs.current.get(zoomBack);
      if (!overlay || !dayEl) {
        setZoomBack(null);
        return;
      }
      const cellRect = dayEl.getBoundingClientRect();
      // Trigger the shrink animation
      requestAnimationFrame(() => {
        overlay.style.top = cellRect.top + 'px';
        overlay.style.left = cellRect.left + 'px';
        overlay.style.width = cellRect.width + 'px';
        overlay.style.height = cellRect.height + 'px';
        overlay.style.borderRadius = '6px';
        overlay.style.background = '#ffffff';
        overlay.style.borderColor = '#e2e8f0';
      });
      // Fade out at the end, then clean up
      setTimeout(() => {
        if (overlay) overlay.style.opacity = '0';
      }, 350);
      setTimeout(() => setZoomBack(null), 500);
    }, 50);
    return () => clearTimeout(timer);
  }, [zoomBack]);

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  function handleDayClick(d: Date, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const dateStr = format(d, 'yyyy-MM-dd');
    setZoom({ rect, date: dateStr });

    // Wait for the overlay to mount, then expand to fill the main-content area
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const mainContent = containerRef.current?.closest('.main-content');
        if (overlayRef.current && mainContent) {
          const mainRect = mainContent.getBoundingClientRect();
          overlayRef.current.style.top = mainRect.top + 'px';
          overlayRef.current.style.left = mainRect.left + 'px';
          overlayRef.current.style.width = mainRect.width + 'px';
          overlayRef.current.style.height = mainRect.height + 'px';
          overlayRef.current.style.borderRadius = '0';
          overlayRef.current.style.background = '#f1f5f9';
          overlayRef.current.style.borderColor = 'transparent';
        }
      });
    });

    // Navigate after animation finishes
    setTimeout(() => {
      navigate(`/day/${dateStr}`);
    }, 400);
  }

  return (
    <div className="calendar-view" ref={containerRef}>
      <div className="calendar-header">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          ‹
        </button>
        <h2>{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          ›
        </button>
      </div>

      <div className="calendar-grid">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="calendar-weekday">
            {d}
          </div>
        ))}

        {weeks.flat().map((d, i) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const catData = noteDates.get(dateStr) ?? [];
          const inMonth = isSameMonth(d, monthStart);
          return (
            <div
              key={i}
              ref={(el) => { if (el) dayRefs.current.set(dateStr, el); }}
              className={`calendar-day${!inMonth ? ' outside' : ''}${isToday(d) ? ' today' : ''}${isSameDay(d, new Date()) ? ' selected' : ''}`}
              onClick={(e) => handleDayClick(d, e)}
            >
              <span className="day-number">{format(d, 'd')}</span>
              {catData.length > 0 && (
                <div className="day-dots">
                  {catData.map((c, ci) => (
                    <div key={ci} className="dot-row">
                      {Array.from({ length: c.count }, (_, di) => (
                        <span
                          key={di}
                          className={`dot dot-${c.category}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {zoom && (
        <div
          ref={overlayRef}
          className="zoom-overlay"
          style={{
            top: zoom.rect.top,
            left: zoom.rect.left,
            width: zoom.rect.width,
            height: zoom.rect.height,
          }}
        />
      )}

      {zoomBack && (
          <div
            ref={zoomBackRef}
            className="zoom-overlay"
            style={{
              borderRadius: '0',
              background: '#f1f5f9',
              borderColor: 'transparent',
            }}
          />
      )}
    </div>
  );
}
