import { useState, useEffect, useCallback } from 'react';
import type { NoteCategory, Note, Child } from '../types';
import { getNotesByCategory, upsertNote, deleteNote, getAllChildren } from '../storage';
import NoteCard from '../components/NoteCard';
import NoteForm from '../components/NoteForm';
import { format } from 'date-fns';
import './CategoryList.css';

interface Props {
  category: NoteCategory;
  title: string;
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

  let filtered = notes;
  if (category === 'observation' && filterChild) {
    filtered = filtered.filter((n) => n.childName === filterChild);
  }

  // Sort: most recent first
  filtered = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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
          + New
        </button>
      </div>

      {category === 'observation' && children.length > 0 && (
        <div className="filter-bar">
          <label>Filter by child:</label>
          <select
            value={filterChild}
            onChange={(e) => setFilterChild(e.target.value)}
          >
            <option value="">All children</option>
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
          No {title.toLowerCase()} yet. Click "+ New" to add one.
        </p>
      ) : (
        <div className="notes-list">
          {filtered.map((n) => (
            <div key={n.id}>
              <span className="note-date-label">{n.date}</span>
              <NoteCard
                note={n}
                onEdit={setEditing}
                onDelete={handleDelete}
                onToggleComplete={category === 'todo' ? handleToggle : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
