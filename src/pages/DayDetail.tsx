import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import type { Note, NoteCategory } from '../types';
import { getNotesForDate, upsertNote, deleteNote } from '../storage';
import NoteCard from '../components/NoteCard';
import NoteForm from '../components/NoteForm';
import './DayDetail.css';

export default function DayDetail() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  const [adding, setAdding] = useState<NoteCategory | null>(null);

  const refresh = useCallback(() => {
    if (date) {
      getNotesForDate(date).then(setNotes);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!date) return null;

  const dateObj = parseISO(date);
  const categories: NoteCategory[] = ['todo', 'idea', 'observation', 'talk'];

  async function handleSave(note: Note) {
    await upsertNote(note);
    setEditing(null);
    setAdding(null);
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

  return (
    <div className="day-detail">
      <div className="day-detail-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← Back
        </button>
        <h2>{format(dateObj, 'EEEE, MMMM d, yyyy')}</h2>
      </div>

      {editing ? (
        <NoteForm
          date={date}
          existing={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      ) : adding ? (
        <NoteForm
          date={date}
          category={adding}
          onSave={handleSave}
          onCancel={() => setAdding(null)}
        />
      ) : (
        <>
          <div className="add-buttons">
            {categories.map((c) => (
              <button
                key={c}
                className={`btn btn-add btn-add-${c}`}
                onClick={() => setAdding(c)}
              >
                + {c === 'todo' ? 'ToDo' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {notes.length === 0 ? (
            <p className="empty-state">No notes for this day yet. Add one above!</p>
          ) : (
            <div className="notes-list">
              {notes.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onEdit={setEditing}
                  onDelete={handleDelete}
                  onToggleComplete={handleToggle}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
