import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import type { Note, NoteCategory, Child } from '../types';
import { getNotesForDate, upsertNote, deleteNote, getAllChildren } from '../storage';
import NoteCard from '../components/NoteCard';
import { v4 as uuidv4 } from 'uuid';
import './DayDetail.css';

export default function DayDetail() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');
  const [adding, setAdding] = useState<NoteCategory | null>(null);
  const [addText, setAddText] = useState('');
  const [closing, setClosing] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionPos, setMentionPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const refresh = useCallback(() => {
    if (date) {
      getNotesForDate(date).then(setNotes);
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    getAllChildren().then(setChildren);
  }, []);

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
    setEditing(null);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function startEditing(note: Note) {
    setEditing(note);
    setEditText(note.content || note.title);
    setAdding(null);
    setMentionQuery(null);
    setTimeout(() => {
      const el = editRef.current;
      if (el) {
        el.focus();
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      }
    }, 0);
  }

  async function handleEditSave() {
    if (!editing) return;
    const text = editText.trim();
    if (!text) return;
    await upsertNote({ ...editing, title: text, content: text, updatedAt: new Date().toISOString() });
    setEditing(null);
    setEditText('');
    setMentionQuery(null);
    refresh();
  }

  function getActiveText() {
    return editing ? editText : addText;
  }

  function setActiveText(val: string) {
    if (editing) setEditText(val);
    else setAddText(val);
  }

  function getActiveRef() {
    return editing ? editRef : inputRef;
  }

  function detectMention(text: string, cursorPos: number) {
    const before = text.slice(0, cursorPos);
    const match = before.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
      const el = getActiveRef().current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setMentionPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
    } else {
      setMentionQuery(null);
    }
  }

  const filteredChildren = mentionQuery !== null
    ? children.filter(c => c.name.toLowerCase().startsWith(mentionQuery.toLowerCase()))
    : [];

  function insertMention(name: string) {
    const el = getActiveRef().current;
    if (!el) return;
    const text = getActiveText();
    const pos = el.selectionStart;
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const atIdx = before.lastIndexOf('@');
    const newText = before.slice(0, atIdx) + '@' + name + ' ' + after;
    setActiveText(newText);
    setMentionQuery(null);
    setTimeout(() => {
      const newPos = atIdx + name.length + 2;
      el.focus();
      el.selectionStart = newPos;
      el.selectionEnd = newPos;
    }, 0);
  }

  function handleTextareaInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setActiveText(val);
    detectMention(val, e.target.selectionStart);
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
                  editing?.id === n.id ? (
                    <div key={n.id} className="inline-add-form">
                      <div className="inline-add-input-wrapper">
                        <textarea
                          ref={editRef}
                          className="inline-add-input"
                          placeholder="Text eingeben..."
                          value={editText}
                          onChange={handleTextareaInput}
                          onKeyDown={(e) => {
                            if (mentionQuery !== null && filteredChildren.length > 0) {
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setMentionIndex(i => (i + 1) % filteredChildren.length);
                                return;
                              }
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setMentionIndex(i => (i - 1 + filteredChildren.length) % filteredChildren.length);
                                return;
                              }
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                insertMention(filteredChildren[mentionIndex].name);
                                return;
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                setMentionQuery(null);
                                return;
                              }
                            }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleEditSave();
                            }
                            if (e.key === 'Escape') {
                              setEditing(null);
                              setEditText('');
                            }
                          }}
                          rows={1}
                        />
                      </div>
                      <div className="inline-add-actions">
                        <button
                          className={`btn-inline-save btn-inline-save-${cat}`}
                          onClick={() => handleEditSave()}
                        >
                          Speichern
                        </button>
                        <button
                          className="btn-inline-cancel"
                          onClick={() => { setEditing(null); setEditText(''); }}
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <NoteCard
                      key={n.id}
                      note={n}
                      onEdit={startEditing}
                      onDelete={handleDelete}
                      onToggleComplete={handleToggle}
                    />
                  )
                ))}

                {isAdding ? (
                  <div className="inline-add-form">
                    <div className="inline-add-input-wrapper">
                    <textarea
                      ref={inputRef}
                      className="inline-add-input"
                      placeholder="Text eingeben..."
                      value={addText}
                      onChange={handleTextareaInput}
                      onKeyDown={(e) => {
                        if (mentionQuery !== null && filteredChildren.length > 0) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setMentionIndex(i => (i + 1) % filteredChildren.length);
                            return;
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setMentionIndex(i => (i - 1 + filteredChildren.length) % filteredChildren.length);
                            return;
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            insertMention(filteredChildren[mentionIndex].name);
                            return;
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setMentionQuery(null);
                            return;
                          }
                        }
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
                    </div>
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

      {mentionQuery !== null && filteredChildren.length > 0 && (
        <ul
          className="mention-dropdown"
          style={{ top: mentionPos.top, left: mentionPos.left, width: mentionPos.width }}
        >
          {filteredChildren.map((c, i) => (
            <li
              key={c.id}
              className={`mention-item${i === mentionIndex ? ' mention-item-active' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); insertMention(c.name); }}
              onMouseEnter={() => setMentionIndex(i)}
            >
              @{c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
