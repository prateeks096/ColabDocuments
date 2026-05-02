# Collab Docs

A minimalist collaborative document editor. Username-only auth, Tiptap rich text, auto-save, and fine-grained sharing.

## Tech Stack

- **Frontend**: React 18 + Vite + Tiptap + React Router
- **Backend**: Express + better-sqlite3
- **Auth**: Username-only (stored in localStorage, sent via `X-Username` header)

## Quick Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start both servers concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Project Structure

```
collab-docs/
├── package.json              # Root (runs both servers)
├── backend/
│   ├── server.js             # Express entry point
│   ├── db/
│   │   └── schema.js         # SQLite schema + db instance
│   ├── middleware/
│   │   └── auth.js           # X-Username header auth
│   └── routes/
│       ├── auth.js           # Login, /me, user search
│       └── docs.js           # CRUD + upload + sharing
└── frontend/
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx            # Router
        ├── styles/globals.css
        ├── utils/api.js       # Axios client
        ├── hooks/
        │   ├── useAuth.jsx    # Auth context + provider
        │   └── useAutoSave.js # Debounced auto-save hook
        ├── pages/
        │   ├── LoginPage.jsx
        │   └── DashboardPage.jsx
        └── components/
            ├── ProtectedRoute.jsx
            ├── editor/
            │   ├── EditorPage.jsx    # Main editor
            │   └── EditorToolbar.jsx # Formatting toolbar
            └── shared/
                └── ShareModal.jsx    # Share with user modal
```

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login or register by username |
| GET | `/api/auth/me` | Verify current session |
| GET | `/api/auth/users/search?q=` | Search users for sharing |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/docs` | My documents |
| GET | `/api/docs/shared` | Shared with me |
| POST | `/api/docs` | Create document |
| POST | `/api/docs/upload` | Upload .txt or .md |
| GET | `/api/docs/:id` | Get single document |
| PATCH | `/api/docs/:id` | Update title/content (auto-save) |
| DELETE | `/api/docs/:id` | Delete document |

### Shares
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/docs/:id/shares` | List shares |
| POST | `/api/docs/:id/shares` | Share with user |
| PATCH | `/api/docs/:id/shares/:shareId` | Change permission |
| DELETE | `/api/docs/:id/shares/:shareId` | Revoke share |

## Database Schema

```sql
users      (id, username UNIQUE, created_at)
documents  (id, owner_id→users, title, content, content_type, created_at, updated_at)
shares     (id, doc_id→documents, shared_by→users, shared_with→users, permission, created_at)
```

## Features

- Username-only login (no password, no email)
- Rich text editing with Tiptap (bold, italic, headings, lists, links, code, highlights, tasks)
- Plain text / Markdown upload support (textarea mode)
- Auto-save with debounce (1.5s) and save status indicator
- Inline document rename
- .txt and .md file upload
- Share with view or edit permissions
- Per-document share management (add, change permission, revoke)
- My Documents and Shared with Me dashboard
- Word/character count in footer
