import type { Note } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrashCan, faChildren } from '@fortawesome/free-solid-svg-icons';
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

function renderWithMentions(text: string) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') && part.length > 1 ? (
      <span key={i} className="mention-badge">{part.slice(1)}</span>
    ) : (
      part
    )
  );
}

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
          <span className="note-child-badge"><FontAwesomeIcon icon={faChildren} /> {note.childName}</span>
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
            <FontAwesomeIcon icon={faPencil} />
          </button>
          <button
            className="btn-icon"
            title="Delete"
            onClick={() => onDelete(note.id)}
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </div>
      </div>
      <p className="note-card-content">{renderWithMentions(note.content || note.title)}</p>
    </div>
  );
}
