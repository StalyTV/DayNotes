import Database from '@tauri-apps/plugin-sql';
import type { Note, Child } from './types';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:daynotes.db');
  }
  return db;
}

// --- Notes ---

interface NoteRow {
  id: string;
  date: string;
  category: string;
  title: string;
  content: string;
  child_name: string | null;
  completed: number;
  created_at: string;
  updated_at: string;
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    date: row.date,
    category: row.category as Note['category'],
    title: row.title,
    content: row.content,
    childName: row.child_name ?? undefined,
    completed: row.completed === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllNotes(): Promise<Note[]> {
  const d = await getDb();
  const rows = await d.select<NoteRow[]>('SELECT * FROM notes ORDER BY date DESC');
  return rows.map(rowToNote);
}

export async function getNotesForDate(date: string): Promise<Note[]> {
  const d = await getDb();
  const rows = await d.select<NoteRow[]>('SELECT * FROM notes WHERE date = ? ORDER BY created_at', [date]);
  return rows.map(rowToNote);
}

export async function getNotesByCategory(category: string): Promise<Note[]> {
  const d = await getDb();
  const rows = await d.select<NoteRow[]>('SELECT * FROM notes WHERE category = ? ORDER BY date DESC', [category]);
  return rows.map(rowToNote);
}

export async function getNotesByChild(childName: string): Promise<Note[]> {
  const d = await getDb();
  const rows = await d.select<NoteRow[]>(
    `SELECT * FROM notes WHERE category IN ('observation', 'talk') AND (child_name = ? OR content LIKE ? OR title LIKE ?) ORDER BY date DESC`,
    [childName, `%@${childName}%`, `%@${childName}%`]
  );
  return rows.map(rowToNote);
}

export async function upsertNote(note: Note): Promise<void> {
  const d = await getDb();
  const now = new Date().toISOString();
  await d.execute(
    `INSERT INTO notes (id, date, category, title, content, child_name, completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       content = excluded.content,
       child_name = excluded.child_name,
       completed = excluded.completed,
       updated_at = ?`,
    [
      note.id,
      note.date,
      note.category,
      note.title,
      note.content,
      note.childName ?? null,
      note.completed ? 1 : 0,
      note.createdAt,
      now,
      now,
    ]
  );
}

export async function deleteNote(id: string): Promise<void> {
  const d = await getDb();
  await d.execute('DELETE FROM notes WHERE id = ?', [id]);
}

// --- Children ---

interface ChildRow {
  id: string;
  name: string;
  created_at: string;
}

export async function getAllChildren(): Promise<Child[]> {
  const d = await getDb();
  const rows = await d.select<ChildRow[]>('SELECT * FROM children ORDER BY name');
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

export async function addChild(child: Child): Promise<void> {
  const d = await getDb();
  await d.execute('INSERT INTO children (id, name) VALUES (?, ?)', [child.id, child.name]);
}

export async function removeChild(id: string): Promise<void> {
  const d = await getDb();
  await d.execute('DELETE FROM children WHERE id = ?', [id]);
}

// --- Dates with notes (for calendar dots) ---

export async function getDatesWithNotes(startDate: string, endDate: string): Promise<Map<string, { category: string; count: number }[]>> {
  const d = await getDb();
  const rows = await d.select<{ date: string; category: string; cnt: number }[]>(
    'SELECT date, category, COUNT(*) as cnt FROM notes WHERE date >= ? AND date <= ? GROUP BY date, category ORDER BY date',
    [startDate, endDate]
  );
  const map = new Map<string, { category: string; count: number }[]>();
  for (const row of rows) {
    const existing = map.get(row.date) ?? [];
    existing.push({ category: row.category, count: row.cnt });
    map.set(row.date, existing);
  }
  return map;
}

