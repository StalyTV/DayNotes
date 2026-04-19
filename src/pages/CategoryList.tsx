import { useState, useEffect, useCallback } from 'react';
import type { NoteCategory, Note, Child } from '../types';
import { getNotesByCategory, upsertNote, deleteNote, getAllChildren } from '../storage';
import NoteCard from '../components/NoteCard';
import NoteForm from '../components/NoteForm';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import './CategoryList.css';

interface Props {
  category: NoteCategory;
  title: string;
}

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

function noteMatchesChild(note: Note, childName: string): boolean {
  if (note.childName === childName) return true;
  const text = (note.content || note.title || '').toLowerCase();
  return text.includes(`@${childName.toLowerCase()}`);
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

export default function CategoryList({ category, title }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  const [adding, setAdding] = useState(false);
  const [filterChild, setFilterChild] = useState('');
  const [children, setChildren] = useState<Child[]>([]);

  const refresh = useCallback(() => {
    getNotesByCategory(category).then(setNotes);
    getAllChildren().then(setChildren);
  }, [category]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleSave(note: Note) {
    await upsertNote(note);
    setEditing(null);
    setAdding(false);
    refresh();
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    refresh();
  }

  async function handleToggle(note: Note) {
    await upsertNote({ ...note, completed: !note.completed });
    refresh();
  }

  const showFilter = category === 'observation' || category === 'talk';

  let filtered = notes;
  if (showFilter && filterChild) {
    filtered = filtered.filter((n) => noteMatchesChild(n, filterChild));
  }

  filtered = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const weekGroups = groupByWeekAndDay(filtered);

  return (
    <div className="category-list">
      <div className="category-header">
        <h2>{title}</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setAdding(true);
            setEditing(null);
          }}
        >
          + Neu
        </button>
      </div>

      {showFilter && children.length > 0 && (
        <div className="filter-bar">
          <label>Nach Kind filtern:</label>
          <select
            value={filterChild}
            onChange={(e) => setFilterChild(e.target.value)}
          >
            <option value="">Alle Kinder</option>
            {children.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {editing ? (
        <NoteForm
          date={editing.date}
          category={category}
          existing={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : adding ? (
        <NoteForm
          date={format(new Date(), 'yyyy-MM-dd')}
          category={category}
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      ) : filtered.length === 0 ? (
        <p className="empty-state">
          Noch keine {title.toLowerCase()}. Klicke "+ Neu" um eine hinzuzufügen.
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
                        onToggleComplete={category === 'todo' ? handleToggle : undefined}
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
