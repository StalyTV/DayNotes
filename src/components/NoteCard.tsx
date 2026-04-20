import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Note } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrashCan, faChildren } from '@fortawesome/free-solid-svg-icons';
import './NoteCard.css';

interface Props {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onToggleComplete?: (note: Note) => void;
  onRestore?: (note: Note) => void;
  archiveMode?: boolean;
}

const categoryLabels: Record<string, string> = {
  todo: "ToDo",
  idea: "Idee",
  observation: "Beobachung",
  talk: "Gespräch",
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
  onRestore,
  archiveMode,
}: Props) {
  const [completing, setCompleting] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [collapseHeight, setCollapseHeight] = useState<number | null>(null);
  const [burstRect, setBurstRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startBurst = useCallback(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setBurstRect({ x: rect.left, y: rect.top, w: rect.width, h: rect.height });
    }
    setCompleting(false);
    setBursting(true);
    setTimeout(() => {
      // Measure card height, then collapse
      if (cardRef.current) {
        setCollapseHeight(cardRef.current.offsetHeight);
      }
      requestAnimationFrame(() => {
        setCollapsing(true);
        setTimeout(() => {
          if (onToggleComplete) onToggleComplete(note);
        }, 350);
      });
    }, 600);
  }, [note, onToggleComplete]);

  function handleComplete() {
    setCompleting(true);
    timerRef.current = setTimeout(() => {
      startBurst();
    }, 10);
  }

  if (collapsing) {
    return (
      <div
        className="note-card-collapsing"
        style={{ height: 0 }}
      />
    );
  }

  if (collapseHeight !== null && !collapsing) {
    return (
      <div
        className="note-card-collapse-setup"
        style={{ height: collapseHeight }}
      />
    );
  }

  // Lines originate from card edges and shoot outward
  // ox/oy = start position as fraction of card (0=left/top, 1=right/bottom)
  // tx/ty = travel distance from that edge point
  const burstLines = [
    // Top edge
    { ox: 0.2, oy: 0, tx: -30, ty: -55, rot: -20 },
    { ox: 0.5, oy: 0, tx: 0, ty: -65, rot: 0 },
    { ox: 0.8, oy: 0, tx: 30, ty: -55, rot: 20 },
    // Bottom edge
    { ox: 0.2, oy: 1, tx: -30, ty: 55, rot: 20 },
    { ox: 0.5, oy: 1, tx: 0, ty: 60, rot: 0 },
    { ox: 0.8, oy: 1, tx: 30, ty: 55, rot: -20 },
    // Left edge
    { ox: 0, oy: 0.3, tx: -65, ty: -15, rot: -60 },
    { ox: 0, oy: 0.7, tx: -65, ty: 15, rot: 60 },
    // Right edge
    { ox: 1, oy: 0.3, tx: 65, ty: -15, rot: 60 },
    { ox: 1, oy: 0.7, tx: 65, ty: 15, rot: -60 },
    // Corners
    { ox: 0, oy: 0, tx: -45, ty: -45, rot: -45 },
    { ox: 1, oy: 0, tx: 45, ty: -45, rot: 45 },
    { ox: 0, oy: 1, tx: -45, ty: 45, rot: 45 },
    { ox: 1, oy: 1, tx: 45, ty: 45, rot: -45 },
  ];

  return (
    <>
      {burstRect && createPortal(
        <div className="burst-overlay" style={{ left: burstRect.x, top: burstRect.y, width: burstRect.w, height: burstRect.h }}>
          {burstLines.map((l, i) => (
            <span
              key={i}
              className="burst-line"
              style={{
                left: `${l.ox * 100}%`,
                top: `${l.oy * 100}%`,
                '--bx': `${l.tx}px`,
                '--by': `${l.ty}px`,
                '--rot': `${l.rot}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>,
        document.body
      )}
      <div
        ref={cardRef}
        className={`note-card note-card-${note.category}${completing ? ' completing' : ''}${bursting ? ' bursting' : ''}${archiveMode ? '' : note.completed ? ' completed' : ''}`}
      >
      <div className="note-card-header">
        <span className="note-category-badge">
          {categoryLabels[note.category]}
        </span>
        {note.childName && (
          <span className="note-child-badge"><FontAwesomeIcon icon={faChildren} /> {note.childName}</span>
        )}
        <div className="note-card-actions">
          {archiveMode && onRestore ? (
            <button
              className="btn-restore"
              onClick={() => onRestore(note)}
            >
              Wiederherstellen
            </button>
          ) : note.category === 'todo' && onToggleComplete && !note.completed && !completing && !bursting ? (
              <button
                className="btn-icon"
                title="Mark complete"
                onClick={handleComplete}
              >
                ✔️
              </button>
          ) : null}
          {!archiveMode && (
            <>
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
            </>
          )}
        </div>
      </div>
      <p className="note-card-content">{renderWithMentions(note.content || note.title)}</p>
      </div>
    </>
  );
}
