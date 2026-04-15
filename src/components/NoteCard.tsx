import type { Note } from '../types';
import './NoteCard.css';

interface Props {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onToggleComplete?: (note: Note) => void;
}

const categoryLabels: Record<string, string> = {
  todo: "ToDo",
  idea: "Idea",
  observation: "Observation",
  talk: "Talk",
};

const categoryIcons: Record<string, string> = {
  todo: '✅',
  idea: '💡',
  observation: '👀',
  talk: '💬',
};

export default function NoteCard({
  note,
  onEdit,
  onDelete,
  onToggleComplete,
}: Props) {
  return (
    <div className={`note-card note-card-${note.category}${note.completed ? ' completed' : ''}`}>
      <div className="note-card-header">
        <span className="note-category-badge">
          {categoryIcons[note.category]} {categoryLabels[note.category]}
        </span>
        {note.childName && (
          <span className="note-child-badge">🧒 {note.childName}</span>
        )}
        <div className="note-card-actions">
          {note.category === 'todo' && onToggleComplete && (
            <button
              className="btn-icon"
              title={note.completed ? 'Mark incomplete' : 'Mark complete'}
              onClick={() => onToggleComplete(note)}
            >
              {note.completed ? '↩️' : '✔️'}
            </button>
          )}
          <button className="btn-icon" title="Edit" onClick={() => onEdit(note)}>
            ✏️
          </button>
          <button
            className="btn-icon"
            title="Delete"
            onClick={() => onDelete(note.id)}
          >
            🗑️
          </button>
        </div>
      </div>
      <h3 className="note-card-title">{note.title}</h3>
      {note.content && <p className="note-card-content">{note.content}</p>}
    </div>
  );
}
