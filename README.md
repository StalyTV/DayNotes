# DayNotes

A cross-platform desktop app for early childhood educators to track daily observations, notes, tasks, and conversations related to children in their care.

Built with [Tauri](https://tauri.app/) + React + TypeScript.

## Features

- **Calendar View** — Interactive monthly calendar with color-coded category indicators per day
- **Note Categories** — Organize notes into ToDos, Ideas, Observations, and Talks
- **Child Tracking** — Manage children and associate notes with them using `@mention` syntax with autocomplete
- **Day Detail** — View and create notes for any date, grouped by category
- **Category Lists** — Browse all notes of a type, grouped by week and day
- **Child Detail** — See all notes related to a specific child
- **ToDo Completion** — Track and toggle task completion
- **Local Storage** — All data stored locally in SQLite

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop Framework | Tauri v2 |
| Frontend | React 19, React Router 7 |
| Language | TypeScript |
| Database | SQLite (via @tauri-apps/plugin-sql) |
| Build Tool | Vite |
| Icons | FontAwesome |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Rust](https://www.rust-lang.org/tools/install)
- Tauri v2 prerequisites — see [Tauri docs](https://v2.tauri.app/start/prerequisites/)

### Development

```bash
npm install
npm run tauri dev
```

### Build

```bash
npm run tauri build
```

Builds native binaries for macOS, Windows, and Linux.

## Project Structure

```
src/                  # React frontend
  components/         # Calendar, NoteCard, NoteForm, Sidebar
  pages/              # DayDetail, CategoryList, ChildrenManager, ChildDetail
  storage.ts          # SQLite database layer
  types.ts            # TypeScript types
src-tauri/            # Tauri / Rust backend
```

## License

Private
