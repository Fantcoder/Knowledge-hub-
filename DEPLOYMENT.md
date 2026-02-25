# 🚀 Deployment Guide

## Architecture
```
Frontend (Vercel/Netlify)  ──→  Backend (Render/Railway)  ──→  MySQL (PlanetScale/Railway)
     Static SPA                    Spring Boot JAR                  Managed Database
```

---

## Option A: Vercel (Frontend) + Render (Backend)

### 1. Database — PlanetScale or Railway MySQL
1. Create a MySQL database on [PlanetScale](https://planetscale.com) or [Railway](https://railway.app)
2. Note the connection URL, username, and password

### 2. Backend — Render
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set root directory to `backend`
4. **Build Command:** `mvn clean package -DskipTests`
5. **Start Command:** `java -jar target/knowledge-hub-1.0.0.jar`
6. **Environment Variables:**

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://your-db-host:3306/knowledgehub?useSSL=true` |
| `SPRING_DATASOURCE_USERNAME` | your db username |
| `SPRING_DATASOURCE_PASSWORD` | your db password |
| `JWT_SECRET` | Generate: `openssl rand -hex 32` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `FILE_UPLOAD_DIR` | `/tmp/uploads` (or S3 in production) |

7. Set health check path: `/api/health`

### 3. Frontend — Vercel
1. Go to [vercel.com](https://vercel.com) → Import Project
2. Set root directory to `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Environment Variables:**

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://your-backend.onrender.com/api` |

6. Add rewrite rule (for SPA routing) — create `frontend/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Option B: Railway (Full Stack)

Railway can host both frontend and backend:

1. Create a new project on [railway.app](https://railway.app)
2. Add a **MySQL** service
3. Add the **backend** as a service (point to `backend/` directory)
   - Set all env vars from the table above
   - Railway auto-detects Spring Boot
4. Add the **frontend** as a static site
   - Set `VITE_API_BASE_URL` to the backend's Railway URL

---

## Pre-Deployment Checklist

- [ ] **JWT Secret**: Generate a strong random secret (never use the default)
- [ ] **Database**: Create the `knowledgehub` database and run with `ddl-auto=update` once to create tables, then switch to `validate`
- [ ] **CORS**: Set `FRONTEND_URL` to your actual frontend domain
- [ ] **HTTPS**: Both frontend and backend should use HTTPS (handled by Vercel/Render automatically)
- [ ] **File storage**: For production, consider S3/Cloudinary instead of local disk
- [ ] **Backups**: Set up database backups on your MySQL provider

---

## First Deployment Steps

```bash
# 1. Build backend
cd backend
mvn clean package -DskipTests

# 2. Build frontend
cd ../frontend
npm run build

# 3. Verify the backend JAR works
cd ../backend
java -jar target/knowledge-hub-1.0.0.jar
# Should start on port 8080
```

---

## Monitoring

- **Health check**: `GET /api/health` returns `{ status: "UP", uptime: "...", version: "1.0.0" }`
- **Rate limiting**: 60 req/min per IP (API), 10 req/min per IP (auth)
- **Security headers**: X-Content-Type-Options, X-Frame-Options, HSTS, CSP
