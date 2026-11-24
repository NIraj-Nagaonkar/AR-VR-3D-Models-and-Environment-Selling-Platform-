# Ather3D — AR/VR 3D Models Platform

## Project Overview
An AR/VR 3D models and environment selling platform built with Node.js + Express backend and vanilla HTML/CSS/JS frontend.

## Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT auth, Multer (file uploads), Helmet, express-rate-limit
- **Frontend**: Vanilla HTML, CSS, JavaScript (served statically by Express)
- **AI Integrations**: Gemini API (server-side key), Luma AI (server-side key)

## Project Structure
```
C:\MajorApp\
├── Backend/
│   ├── src/
│   │   ├── server.js              ← Entry point (port 5000)
│   │   ├── config/db.js           ← MongoDB connection
│   │   ├── middleware/
│   │   │   ├── authenticate.js    ← authenticate + requireRole
│   │   │   └── errorHandler.js    ← Global error handler
│   │   ├── scripts/
│   │   │   └── seedAdmin.js       ← One-time admin account seeder
│   │   └── Modules/
│   │       ├── User/              ← Auth: login, signup, JWT
│   │       ├── Product/           ← 3D model listings (draft/published)
│   │       ├── Request/           ← Custom model requests (linked to user)
│   │       ├── Chat/              ← Gemini proxy (admin-only)
│   │       └── Luma/              ← AI 3D generation (admin-only)
│   └── uploads/                   ← Uploaded files (gitignored, private)
├── Front-end/
│   ├── Login/                     ← login.html, sign-up.html
│   ├── Admin/                     ← Admin.html, Workspace.html, Admin.css
│   └── Customer/                  ← Customer.html
├── Assets/                        ← Static assets
├── package.json
└── .env                           ← Secrets (gitignored)
```

## Running the Project
```bash
cd C:\MajorApp
node Backend/src/server.js        # production
npm run dev                       # nodemon (auto-restart)
```
Server: http://localhost:5000

## First-Time Admin Setup
Run once to seed the admin account (never sign up via UI with admin email):
```bash
# Add to .env first:
# ADMIN_NAME=Admin
# ADMIN_EMAIL=ather3dadmin@gmail.com
# ADMIN_PASSWORD=your_secure_password

node Backend/src/scripts/seedAdmin.js
```

## Key Routes
| URL | Auth | Description |
|-----|------|-------------|
| `/` | Public | Redirects to login |
| `/login` | Public | Login page |
| `/signup` | Public | Sign-up page |
| `/admin` | Public | Admin dashboard |
| `/workspace` | Public | Admin workspace |
| `/customer` | Public | Customer portal |
| `/api/health` | Public | Health check |
| `POST /api/users/signup` | Public (rate-limited) | Create account |
| `POST /api/users/login` | Public (rate-limited) | Get token |
| `GET /api/users/me` | Authenticated | Current profile |
| `GET /api/products` | Public | Paginated published catalog |
| `POST/PUT/DELETE /api/products` | Admin only | Manage catalog |
| `POST /api/requests` | Authenticated | Submit custom request |
| `GET /api/requests` | Admin only | View all requests |
| `GET /api/requests/mine` | Authenticated | Customer's own requests |
| `PATCH /api/requests/:id/status` | Admin only | Update request status |
| `POST /api/chat` | Admin only | Gemini text chat |
| `POST /api/chat/analyze-image` | Admin only | Gemini vision |
| `POST /api/luma/generations` | Admin only | Start Luma generation |
| `GET /api/luma/generations/:id` | Admin only | Poll generation |

## Environment Variables (.env)
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ar_vr_platform
JWT_SECRET=<strong-random-secret>   # required — startup fails if missing
ALLOWED_ORIGINS=http://localhost:5000
ADMIN_EMAIL=ather3dadmin@gmail.com
ADMIN_NAME=Admin
ADMIN_PASSWORD=<secure-password>
GEMINI_API_KEY=<your-key>
LUMA_API_KEY=<your-key>
```

## Coding Conventions
- Backend: CommonJS (`require`/`module.exports`), MVC pattern per module
- Frontend: Vanilla JS, no framework — keep it simple; use relative API URLs (`/api/...`)
- File uploads via Multer stored in `Backend/uploads/` (private — not served statically)
- All API responses: `{ success: true/false, data/message, code? }`
- Error codes: `AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_FAILED`, `NOT_FOUND`, `DUPLICATE_KEY`, `RATE_LIMIT`

## Security Checklist (Phase 1 complete)
- [x] authenticate + requireRole middleware on all protected routes
- [x] Admin role seeded via script, not email-matching at login
- [x] SSRF-fixed proxy-image (Luma CDN allow-list only)
- [x] AI routes (chat, luma) require admin auth
- [x] Uploads removed from static serving
- [x] JWT_SECRET required at startup (no fallback)
- [x] File type allow-list on uploads (ext + MIME)
- [x] Helmet security headers
- [x] CORS restricted to ALLOWED_ORIGINS
- [x] Rate limiting: global (200/15min) + auth (20/15min)
- [x] password field select:false on User model
- [x] Global error handler with stable error codes
