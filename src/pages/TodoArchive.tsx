import { useState, useEffect, useCallback } from 'react';
import type { Note } from '../types';
import { getCompletedTodos, upsertNote } from '../storage';
import NoteCard from '../components/NoteCard';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import './CategoryList.css';

interface DayGroup {
  date: string;
  label: string;
  notes: Note[];
}

interface WeekGroup {
  weekStart: string;
  weekLabel: string;
  days: DayGroup[];
}

function groupByWeekAndDay(notes: Note[]): WeekGroup[] {
  const weekMap = new Map<string, Map<string, Note[]>>();

  for (const note of notes) {
    const dateObj = parseISO(note.date);
    const ws = format(startOfWeek(dateObj, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!weekMap.has(ws)) weekMap.set(ws, new Map());
    const dayMap = weekMap.get(ws)!;
    if (!dayMap.has(note.date)) dayMap.set(note.date, []);
    dayMap.get(note.date)!.push(note);
  }

  const weeks: WeekGroup[] = [];
  const sortedWeeks = [...weekMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  for (const [ws, dayMap] of sortedWeeks) {
    const wsDate = parseISO(ws);
    const weDate = endOfWeek(wsDate, { weekStartsOn: 1 });
    const weekLabel = `${format(wsDate, 'd. MMM', { locale: de })} – ${format(weDate, 'd. MMM yyyy', { locale: de })}`;

    const sortedDays = [...dayMap.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    const days: DayGroup[] = sortedDays.map(([date, dayNotes]) => ({
      date,
      label: format(parseISO(date), 'EEEE, d. MMMM', { locale: de }),
      notes: dayNotes,
    }));

    weeks.push({ weekStart: ws, weekLabel, days });
  }

  return weeks;
}

export default function TodoArchive() {
  const [notes, setNotes] = useState<Note[]>([]);

  const refresh = useCallback(() => {
    getCompletedTodos().then(setNotes);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRestore(note: Note) {
    await upsertNote({ ...note, completed: false });
    refresh();
  }

  const weekGroups = groupByWeekAndDay(notes);

  return (
    <div className="category-list">
      <div className="category-header">
        <h2>Todo Archiv</h2>
      </div>

      {notes.length === 0 ? (
        <p className="empty-state">Noch keine erledigten Aufgaben.</p>
      ) : (
        <div className="notes-grouped">
          {weekGroups.map((week) => (
            <div key={week.weekStart} className="week-group">
              <div className="week-group-header">{week.weekLabel}</div>
              {week.days.map((day) => (
                <div key={day.date} className="day-group">
                  <div className="day-group-header">{day.label}</div>
                  <div className="day-group-notes">
                    {day.notes.map((n) => (
                      <NoteCard
                        key={n.id}
                        note={n}
                        onEdit={() => {}}
                        onDelete={() => {}}
                        onRestore={handleRestore}
                        archiveMode
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
