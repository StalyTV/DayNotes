import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Note } from '../types';
import { getNotesByChild, upsertNote, deleteNote } from '../storage';
import NoteCard from '../components/NoteCard';
import NoteForm from '../components/NoteForm';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChildren } from '@fortawesome/free-solid-svg-icons';
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

export default function ChildDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);

  const childName = decodeURIComponent(name || '');

  const refresh = useCallback(() => {
    if (childName) {
      getNotesByChild(childName).then(setNotes);
    }
  }, [childName]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSave(note: Note) {
    await upsertNote(note);
    setEditing(null);
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    refresh();
  }

  const sorted = [...notes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const weekGroups = groupByWeekAndDay(sorted);

  return (
    <div className="category-list">
      <div className="category-header">
        <button className="btn btn-secondary" onClick={() => navigate('/children')}>
          ← Zurück
        </button>
        <h2><FontAwesomeIcon icon={faChildren} /> {childName}</h2>
      </div>

      {editing ? (
        <NoteForm
          date={editing.date}
          category={editing.category}
          existing={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : sorted.length === 0 ? (
        <p className="empty-state">
          Noch keine Beobachtungen oder Gespräche für {childName}.
        </p>
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
                        onEdit={setEditing}
                        onDelete={handleDelete}
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
