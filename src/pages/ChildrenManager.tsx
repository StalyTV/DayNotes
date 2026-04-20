import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getAllChildren, addChild, removeChild } from '../storage';
import type { Child } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import './ChildrenManager.css';

export default function ChildrenManager() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getAllChildren().then(setChildren);
  }, []);

  function refresh() {
    getAllChildren().then(setChildren);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (/\s/.test(trimmed)) {
      setError('Der Name darf keine Leerzeichen enthalten.');
      return;
    }
    setError('');
    await addChild({ id: uuidv4(), name: trimmed });
    setName('');
    refresh();
  }

  async function handleRemove(id: string) {
    await removeChild(id);
    refresh();
  }

  return (
    <div className="children-manager">
      <h2>Kinder verwalten</h2>
      <p className="children-desc">
        Füge Kinder hinzu, um sie bei Beobachtungen und Gesprächen zu erwähnen. Du kannst jederzeit Kinder entfernen - die zugehörigen Notizen bleiben erhalten.
      </p>

      <form className="add-child-form" onSubmit={handleAdd}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Child's name..."
          required
        />
        <button type="submit" className="btn btn-primary">
          + Hinzufügen
        </button>
      </form>
      {error && <p className="add-child-error">{error}</p>}

      {children.length === 0 ? (
        <p className="empty-state">No children added yet.</p>
      ) : (
        <ul className="children-list">
          {children.map((c) => (
            <li key={c.id} className="child-item">
              <span
                className="child-item-name"
                onClick={() => navigate(`/children/${encodeURIComponent(c.name)}`)}
              >
                {c.name}
              </span>
              <button
                className="btn-icon"
                title="Remove"
                onClick={() => handleRemove(c.id)}
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
