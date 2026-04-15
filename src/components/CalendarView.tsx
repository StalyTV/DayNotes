import { useState, useEffect } from 'react';
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
  const [noteDates, setNoteDates] = useState<Map<string, string[]>>(new Map());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  useEffect(() => {
    getDatesWithNotes(
      format(calStart, 'yyyy-MM-dd'),
      format(calEnd, 'yyyy-MM-dd')
    ).then(setNoteDates);
  }, [currentMonth]);

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

  function handleDayClick(d: Date) {
    navigate(`/day/${format(d, 'yyyy-MM-dd')}`);
  }

  return (
    <div className="calendar-view">
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
          const categories = noteDates.get(dateStr) ?? [];
          const inMonth = isSameMonth(d, monthStart);
          return (
            <div
              key={i}
              className={`calendar-day${!inMonth ? ' outside' : ''}${isToday(d) ? ' today' : ''}${isSameDay(d, new Date()) ? ' selected' : ''}`}
              onClick={() => handleDayClick(d)}
            >
              <span className="day-number">{format(d, 'd')}</span>
              {categories.length > 0 && (
                <div className="day-dots">
                  {categories.slice(0, 4).map((cat, idx) => (
                    <span
                      key={idx}
                      className={`dot dot-${cat}`}
                    />
                  ))}
                  {categories.length > 4 && (
                    <span className="dot-more">+{categories.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
