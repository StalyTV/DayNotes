export type NoteCategory = 'todo' | 'idea' | 'observation' | 'talk';

export interface Note {
  id: string;
  date: string;        // ISO date string YYYY-MM-DD
  category: NoteCategory;
  title: string;
  content: string;
  childName?: string;   // only relevant for observations
  completed?: boolean;  // only relevant for todos
  createdAt: string;    // ISO datetime
  updatedAt: string;    // ISO datetime
}

export interface Child {
  id: string;
  name: string;
}
