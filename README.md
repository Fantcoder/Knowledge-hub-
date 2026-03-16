<p align="center">
  <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL_8-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq_AI-000000?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" />
</p>

<h1 align="center">Knowledge Hub</h1>
<p align="center">
  <strong>A secure, AI-powered personal knowledge management system.</strong><br/>
  Capture notes, manage files, save links, visualize connections — all from a single interface.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-reference">API</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## Features

| Category | Details |
|----------|---------|
| **Rich Text Editor** | Tiptap-based Notion-style editor with slash commands, floating menus, bubble menus, Markdown shortcuts, code blocks with syntax highlighting, task lists |
| **AI Assistant** | Groq-powered AI brain (LLaMA 3.3 70B) — ask questions about your notes, get context-aware answers with source citations |
| **Knowledge Graph** | Interactive force-directed graph visualization of notes and tags using D3 |
| **Offline-First** | PWA with Service Worker caching + IndexedDB (Dexie) for instant load and offline access |
| **Quick Capture** | `Ctrl+Shift+K` instant capture modal — dump thoughts without leaving your current page |
| **Command Palette** | `Ctrl+K` global search and navigation — jump anywhere in the app instantly |
| **Zen Focus Mode** | Fullscreen distraction-free writing environment with animated transitions |
| **File Management** | Upload, preview, and attach files (PDF, DOCX, images) to notes |
| **Link Vault** | Save, categorize, and manage web links with auto-metadata extraction |
| **Tagging System** | Create, assign, and filter notes by tags — reflected across sidebar, graph, and search |
| **Google OAuth** | One-click sign in with Google alongside email/password auth |
| **Data Export** | Export all notes and data in JSON/Markdown format |

---

## Tech Stack

### Frontend

| Tool | Purpose |
|------|---------|
| React 18 + Vite | UI framework + build tooling |
| Tailwind CSS 3 | Utility-first styling with custom design tokens |
| Tiptap 3 | Extensible block editor (replaces React Quill) |
| Framer Motion | Page transitions and Zen Mode animation |
| React Force Graph 2D | Knowledge graph visualization |
| Dexie.js | IndexedDB wrapper for offline caching |
| Vite PWA Plugin | Service Worker generation for offline-first |
| cmdk | Command palette UI |
| React Virtuoso | Virtualized note list rendering |
| Lucide React | Icon system |

### Backend

| Tool | Purpose |
|------|---------|
| Spring Boot 3.2 | REST API framework |
| Spring Security 6 | Authentication and authorization |
| Spring Data JPA | ORM and database access |
| MySQL 8 | Primary data store |
| Flyway | Database schema migrations |
| Caffeine | In-memory caching layer |
| JWT (jjwt 0.12) | Stateless auth with access + refresh tokens |
| Spring WebFlux | Async HTTP client for AI API calls |
| Jsoup | HTML sanitization for note content |
| Groq API | LLM inference (LLaMA 3.3 70B) |
| Google API Client | Server-side Google OAuth verification |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)               │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Tiptap   │  │ Graph    │  │ AI Chat Panel │  │
│  │ Editor   │  │ (D3)     │  │ (Streaming)   │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ IndexedDB (Dexie) + Service Worker (PWA) │    │
│  └──────────────────────────────────────────┘    │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS / REST
┌──────────────────▼──────────────────────────────┐
│              Backend (Spring Boot)               │
│                                                  │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Auth       │  │ Notes    │  │ AI Service  │  │
│  │ (JWT+OAuth)│  │ CRUD     │  │ (Groq API)  │  │
│  └────────────┘  └──────────┘  └─────────────┘  │
│                                                  │
│  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Files      │  │ Links    │  │ Graph       │  │
│  │ Upload     │  │ Manager  │  │ Service     │  │
│  └────────────┘  └──────────┘  └─────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │ MySQL 8 + Flyway + Caffeine Cache       │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+
- MySQL 8+

### 1. Clone

```bash
git clone https://github.com/Fantcoder/Knowledge-hub-.git
cd Knowledge-hub-
```

### 2. Backend Setup

```bash
cd backend

# Configure environment
cp .env.example .env
# Set: SPRING_DATASOURCE_PASSWORD, JWT_SECRET, GROQ_API_KEY
```

**Generate a JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```bash
mvn spring-boot:run
# → http://localhost:8080
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Environment Variables

**Backend** (`application.properties`)

| Variable | Required | Default |
|----------|----------|---------|
| `SPRING_DATASOURCE_URL` | No | `jdbc:mysql://localhost:3306/knowledgehub` |
| `SPRING_DATASOURCE_PASSWORD` | **Yes** | — |
| `JWT_SECRET` | **Yes** | — |
| `GROQ_API_KEY` | **Yes** | — |
| `FRONTEND_URL` | No | `http://localhost:5173` |
| `FILE_UPLOAD_DIR` | No | `./uploads` |

**Frontend** (`.env`)

| Variable | Required | Default |
|----------|----------|---------|
| `VITE_API_BASE_URL` | No | `/api` |
| `VITE_GOOGLE_CLIENT_ID` | No | — |

---

## API Reference

### Auth
```
POST   /api/auth/register       Register
POST   /api/auth/login          Login → tokens
POST   /api/auth/google         Google OAuth
POST   /api/auth/refresh        Refresh access token
POST   /api/auth/logout         Invalidate session
```

### Notes
```
GET    /api/notes               List (filter, tag, pagination)
POST   /api/notes               Create
GET    /api/notes/:id           Read
PUT    /api/notes/:id           Update
DELETE /api/notes/:id           Soft delete
PATCH  /api/notes/:id/pin       Toggle pin
PATCH  /api/notes/:id/archive   Toggle archive
PATCH  /api/notes/:id/restore   Restore from trash
DELETE /api/notes/:id/permanent Hard delete
GET    /api/notes/search        Full-text search (?q=&tag=)
```

### Files
```
POST   /api/files/upload        Upload (multipart, ≤10MB)
GET    /api/files/:id/download  Download
GET    /api/files               List
DELETE /api/files/:id           Delete
```

### Links · Tags · Graph · AI · Export
```
CRUD   /api/links               Saved links management
CRUD   /api/tags                Tag management
GET    /api/graph               Knowledge graph data
POST   /api/ai/chat             AI conversation
GET    /api/export              Export all user data
```

---

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Database | [Railway](https://railway.app) (MySQL) |

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

---

## Project Structure

```
├── backend/
│   └── src/main/java/com/knowledgehub/
│       ├── ai/              # AI chat service + Groq integration
│       ├── config/          # Security, CORS, caching config
│       ├── controller/      # REST endpoints
│       ├── dto/             # Request/response objects
│       ├── entity/          # JPA entities
│       ├── exception/       # Global error handling
│       ├── repository/      # Data access layer
│       ├── security/        # JWT filter, auth providers
│       └── service/         # Business logic
│
├── frontend/
│   └── src/
│       ├── components/      # UI components
│       │   ├── ai/          # AI chat panel
│       │   ├── editor/      # Tiptap block editor
│       │   ├── layout/      # Sidebar, TopBar
│       │   ├── notes/       # NoteCard, NoteGrid, NoteEditor
│       │   └── common/      # CommandPalette, ErrorBoundary
│       ├── context/         # Auth + Notes state management
│       ├── pages/           # Route-level page components
│       ├── services/        # API clients + IndexedDB
│       └── hooks/           # Custom React hooks
```

---

## License

This project is private and not licensed for redistribution.
