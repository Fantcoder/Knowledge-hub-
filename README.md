# KnowledgeHub — Personal Knowledge Management App

A full-stack, production-ready personal knowledge management application. Capture notes with a rich text editor, save links, upload files, tag & organize content, and search everything — all behind secure JWT authentication.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, Tailwind CSS v3, React Router v6, Axios, React Quill |
| Backend | Spring Boot 3.2, Spring Security 6, Spring Data JPA |
| Auth | JWT (jjwt 0.12.x) — access + refresh tokens |
| Database | MySQL 8+ |
| Build | Maven (backend), npm (frontend) |

---

## 📋 Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 18+ and npm 9+
- MySQL 8+

---

## 🚀 Local Setup

### 1. Database

```bash
# Login to MySQL
mysql -u root -p

# Run the schema
source /path/to/backend/schema.sql
```

### 2. Backend

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env with your MySQL password and JWT secret

# Set environment variables (Windows PowerShell)
$env:SPRING_DATASOURCE_PASSWORD="yourpassword"
$env:JWT_SECRET="your-base64-secret"

# Run
mvn spring-boot:run
```

Backend starts at: `http://localhost:8080`

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend starts at: `http://localhost:5173`

---

## 🔐 Environment Variables

### Backend (`application.properties` placeholders)

| Variable | Description | Default |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | MySQL JDBC URL | `jdbc:mysql://localhost:3306/knowledgehub` |
| `SPRING_DATASOURCE_USERNAME` | MySQL username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | MySQL password | *(required)* |
| `JWT_SECRET` | 256-bit Base64 secret | *(required)* |
| `JWT_ACCESS_EXPIRATION` | Access token TTL (ms) | `900000` (15 min) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL (ms) | `604800000` (7 days) |
| `FILE_UPLOAD_DIR` | Upload directory | `./uploads` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

**Generate JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Frontend (`.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |

---

## 🌐 API Overview

### Auth
```
POST /api/auth/register    — Create account
POST /api/auth/login       — Get tokens
POST /api/auth/refresh     — Refresh access token
POST /api/auth/logout      — Invalidate session
```

### Notes
```
GET    /api/notes              — List notes (filter: active/archived/deleted/pinned, tag)
POST   /api/notes              — Create note
GET    /api/notes/{id}         — Get note
PUT    /api/notes/{id}         — Update note
DELETE /api/notes/{id}         — Soft delete
PATCH  /api/notes/{id}/pin     — Toggle pin
PATCH  /api/notes/{id}/archive — Toggle archive
PATCH  /api/notes/{id}/restore — Restore from trash
DELETE /api/notes/{id}/permanent — Hard delete
GET    /api/notes/search?q=&tag= — Full-text search
```

### Files
```
POST /api/files/upload              — Upload file (multipart)
GET  /api/files/{id}/download       — Download file
GET  /api/files                     — List user files
DELETE /api/files/{id}              — Delete file
```

### Links / Tags
```
GET/POST/PUT/DELETE /api/links
GET/POST/DELETE     /api/tags
```

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step Vercel + Render deployment.

---

## 🔧 Troubleshooting

### Backend won't start
- Check MySQL is running and `knowledgehub` database exists
- Verify `SPRING_DATASOURCE_PASSWORD` is set correctly
- Ensure Java 17+ is installed: `java -version`

### Frontend can't reach backend
- Confirm backend is running on port 8080
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Verify `FRONTEND_URL` in backend matches the frontend URL exactly

### JWT errors
- Regenerate `JWT_SECRET` (must be Base64-encoded, 32+ bytes)
- Clear browser localStorage if tokens are stale

### File upload fails
- Check `./uploads` directory exists and is writable
- File must be ≤ 10MB and one of: PDF, DOCX, PNG, JPG, WEBP, TXT

### CORS errors
- `FRONTEND_URL` in backend must exactly match the frontend origin (including port)
