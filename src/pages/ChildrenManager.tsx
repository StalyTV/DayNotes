import { useState, useEffect, type FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getAllChildren, addChild, removeChild } from '../storage';
import type { Child } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import './ChildrenManager.css';

export default function ChildrenManager() {
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    getAllChildren().then(setChildren);
  }, []);

  function refresh() {
    getAllChildren().then(setChildren);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await addChild({ id: uuidv4(), name: name.trim() });
    setName('');
    refresh();
  }

  async function handleRemove(id: string) {
    await removeChild(id);
    refresh();
  }

  return (
    <div className="children-manager">
      <h2>Manage Children</h2>
      <p className="children-desc">
        Add the children in your kindergarten group. These names will appear
        when creating Observations.
      </p>

      <form className="add-child-form" onSubmit={handleAdd}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Child's name..."
          required
        />
        <button type="submit" className="btn btn-primary">
          + Add
        </button>
      </form>

      {children.length === 0 ? (
        <p className="empty-state">No children added yet.</p>
      ) : (
        <ul className="children-list">
          {children.map((c) => (
            <li key={c.id} className="child-item">
              <span>🧒 {c.name}</span>
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
