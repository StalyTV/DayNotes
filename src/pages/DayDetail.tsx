import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import type { Note, NoteCategory } from '../types';
import { getNotesForDate, upsertNote, deleteNote } from '../storage';
import NoteCard from '../components/NoteCard';
import { v4 as uuidv4 } from 'uuid';
import './DayDetail.css';

export default function DayDetail() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [_editing, setEditing] = useState<Note | null>(null);
  const [adding, setAdding] = useState<NoteCategory | null>(null);
  const [addText, setAddText] = useState('');
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
  const categories: NoteCategory[] = ['todo', 'observation', 'idea', 'talk'];

  async function handleQuickAdd(cat: NoteCategory) {
    const text = addText.trim();
    if (!text || !date) return;
    const now = new Date().toISOString();
    const note: Note = {
      id: uuidv4(),
      date,
      category: cat,
      title: text,
      content: text,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    setAddText('');
    setAdding(null);
    await upsertNote(note);
    refresh();
  }

  function startAdding(cat: NoteCategory) {
    setAdding(cat);
    setAddText('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setAddText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    refresh();
  }

  async function handleToggle(note: Note) {
    await upsertNote({ ...note, completed: !note.completed });
    refresh();
  }

  function handleBack() {
    if (closing) return;
    setClosing(true);
    sessionStorage.setItem('zoomBackDate', date!);
    setTimeout(() => navigate('/'), 300);
  }

  const categoryLabels: Record<NoteCategory, string> = {
    todo: 'ToDo',
    idea: 'Idee',
    observation: 'Beobachtung',
    talk: 'Gespräch',
  };

  return (
    <div className={`day-detail${closing ? ' day-detail-closing' : ''}`}>
      <div className="day-detail-header">
        <button className="btn btn-secondary" onClick={handleBack}>
          ← Back
        </button>
        <h2>{format(dateObj, 'EEEE, MMMM d, yyyy')}</h2>
      </div>

      <div className="day-columns">
        {categories.map((cat) => {
          const catNotes = notes.filter((n) => n.category === cat);
          const isAdding = adding === cat;
          return (
            <div key={cat} className={`day-column day-column-${cat}`}>
              <div className="day-column-header">
                <h3>{categoryLabels[cat]}</h3>
                <span className="day-column-count">{catNotes.length}</span>
              </div>
              <div className="day-column-body">
                {catNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    onEdit={setEditing}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggle}
                  />
                ))}

                {isAdding ? (
                  <div className="inline-add-form">
                    <textarea
                      ref={inputRef}
                      className="inline-add-input"
                      placeholder="Text eingeben..."
                      value={addText}
                      onChange={handleTextareaInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleQuickAdd(cat);
                        }
                        if (e.key === 'Escape') {
                          setAdding(null);
                          setAddText('');
                        }
                      }}
                      rows={1}
                    />
                    <div className="inline-add-actions">
                      <button
                        className={`btn-inline-save btn-inline-save-${cat}`}
                        onClick={() => handleQuickAdd(cat)}
                      >
                        Hinzufügen
                      </button>
                      <button
                        className="btn-inline-cancel"
                        onClick={() => { setAdding(null); setAddText(''); }}
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className={`btn-column-add btn-column-add-${cat}`}
                    onClick={() => startAdding(cat)}
                  >
                    + Hinzufügen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
