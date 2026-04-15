import { useState, useEffect, type FormEvent } from 'react';
import type { Note, NoteCategory, Child } from '../types';
import { getAllChildren } from '../storage';
import { v4 as uuidv4 } from 'uuid';
import './NoteForm.css';

interface Props {
  date: string;
  category?: NoteCategory;
  existing?: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
}

export default function NoteForm({
  date,
  category,
  existing,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [content, setContent] = useState(existing?.content ?? '');
  const [cat, setCat] = useState<NoteCategory>(
    existing?.category ?? category ?? 'todo'
  );
  const [childName, setChildName] = useState(existing?.childName ?? '');
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    getAllChildren().then(setChildren);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const note: Note = {
      id: existing?.id ?? uuidv4(),
      date,
      category: cat,
      title,
      content,
      childName: cat === 'observation' ? childName : undefined,
      completed: existing?.completed ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(note);
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Category</label>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value as NoteCategory)}
          disabled={!!category}
        >
          <option value="todo">ToDo</option>
          <option value="idea">Idea</option>
          <option value="observation">Observation</option>
          <option value="talk">Talk</option>
        </select>
      </div>

      <div className="form-group">
        <label>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          required
        />
      </div>

      {cat === 'observation' && (
        <div className="form-group">
          <label>Child</label>
          <select
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
          >
            <option value="">-- Select child --</option>
            {children.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label>Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note..."
          rows={6}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {existing ? 'Update' : 'Save'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
