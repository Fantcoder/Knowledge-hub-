<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/brain-circuit.svg" alt="Knowledge Hub Logo" width="120" height="120" />

  <h1 align="center">Knowledge Hub</h1>
  <p align="center">
    <strong>A secure, AI-powered personal knowledge management system.</strong>
  </p>

  <p align="center">
    <a href="https://knowledge-hub-mocha.vercel.app" target="_blank">
      <img src="https://img.shields.io/badge/Live_Demo-knowledge--hub--mocha.vercel.app-000000?style=for-the-badge&logo=vercel" alt="Live Demo" />
    </a>
    <img src="https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Groq_AI-000000?style=for-the-badge&logo=openai&logoColor=white" alt="Groq" />
  </p>

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#security">Security</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#branches">Branches</a>
  </p>
</div>

---

Knowledge Hub is a **production-grade**, privacy-first personal knowledge management system that blends Notion-style note-taking with a built-in AI assistant. Organize your thoughts, auto-tag them with AI, visualize connections in a knowledge graph, and share your best ideas via public read-only links — all secured with a hardened Spring Security backend.

---

## ✨ Features

### 🧠 AI Second Brain
Powered by **Groq (LLaMA 3.3 70B)**, the built-in AI assistant answers questions based **strictly on your private notes**, with source citations. It never hallucinates from the internet — only from your own knowledge base.

### 🔗 Public Note Sharing (Viral Loop)
Generate a beautiful, public, read-only shareable link (`your-app.com/shared/a3bF9k2x`) for any note. No login required for readers. A built-in "Made with Knowledge Hub" footer drives organic growth.

### 📝 Rich Text Editor
A polished **Tiptap-based** editor with:
- Slash commands (`/`) for rapid formatting
- Floating bubble menus and context toolbars
- Full markdown shortcut support
- Syntax-highlighted code blocks and task lists

### 🕸️ Interactive Knowledge Graph
Notes and tags are visualized in a **D3 force-directed graph**, revealing hidden connections between your ideas.

### ⌨️ Developer-First UX
- **Quick Capture:** `Ctrl+Shift+K` — dump a thought instantly from anywhere
- **Command Palette:** `Ctrl+K` — jump to any note, tag, or setting
- **Zen Mode:** Fullscreen, distraction-free writing environment

---

### ✅ Already Secure
- **BCrypt** password hashing (cost factor 12)
- **JWT** with HMAC-SHA — validated at startup, 15-minute access tokens
- **IDOR Protection** — every query scoped to `findByIdAndUser(id, user)`
- **XSS Backend Sanitization** — Jsoup `Safelist.relaxed()` on all note content
- **CORS** — locked to specific frontend URL from env var (no wildcard)
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, HSTS, Permissions-Policy

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Vanilla CSS, Tiptap, Framer Motion, D3 |
| **Backend** | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL (Neon), managed by Flyway Migrations |
| **AI** | Groq API (LLaMA 3.3 70B) |
| **File Security** | Apache Tika (MIME detection) |
| **Testing** | JUnit 5, Mockito — 24 unit tests |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React / Vite)                   │
│   Tiptap Editor │ D3 Graph │ AI Chat Panel │ Command Palette │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JWT)
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend (Spring Boot 3.2)                   │
│                                                             │
│  SecurityHeadersFilter → RateLimitFilter → JWT Filter       │
│       ↓                                                     │
│  AuthController  NoteController  FileController  AI Routes  │
│       ↓                                                     │
│  AuthService  NoteService  FileStorageService  AiChatService│
│       ↓                          ↓                          │
│  UserRepo    NoteRepo        [Apache Tika]    Groq API      │
└──────────────────────────┬──────────────────────────────────┘
                           │ Flyway Migrations
┌──────────────────────────▼──────────────────────────────────┐
│              PostgreSQL (Neon Serverless)                    │
│  users │ notes │ tags │ files │ links │ refresh_tokens      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech))
- A free [Groq API Key](https://console.groq.com/)

### Option A — Local PostgreSQL via Docker
```bash
docker run --name knowledgehub-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=knowledgehub \
  -p 5432:5432 -d postgres:16
```

### 1. Clone the Repository
```bash
git clone https://github.com/Fantcoder/Knowledge-hub-.git
cd Knowledge-hub-
```

### 2. Backend Setup
```bash
cd backend
```
Set the following environment variables (or create a `.env` file):
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/knowledgehub
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
JWT_SECRET=your-very-long-secret-key-minimum-32-chars
GROQ_API_KEY=your-groq-api-key
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-oauth-client-id
```
```bash
mvn spring-boot:run
# Backend starts on http://localhost:8080
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend starts on http://localhost:5173
```

### 4. Run Tests
```bash
cd backend
mvn test
# 24 unit tests — no database required (all mocked)
```

---

## 🌿 Branches

| Branch | Purpose |
|---|---|
| `main` | Stable production code — original PKM app |
| `builddocs` | Experimental pivot: AI architecture memory for engineering teams |

---

## ☁️ Deployment

| Service | Platform |
|---|---|
| **Frontend** | [Vercel](https://vercel.com) — connect repo, build with `npm run build` |
| **Backend** | [Render](https://render.com) — native Java|
| **Database** | [Neon](https://neon.tech) — serverless PostgreSQL|

---

## 🛡️ License

This project is open-source. Contributions, issues, and feature requests are welcome!

<div align="center">
  <p>Built with ☕, curiosity, and a security audit.</p>
</div>
