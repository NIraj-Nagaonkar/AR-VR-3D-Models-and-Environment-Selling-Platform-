# Ather3D — Setup & Getting Started

## Prerequisites

| Requirement | Minimum version | Download |
|-------------|-----------------|---------|
| Node.js | v18 LTS | [nodejs.org](https://nodejs.org) |
| MongoDB Community | v6 | [mongodb.com](https://www.mongodb.com/try/download/community) |
| npm | v9 (bundled with Node) | — |

---

## 1. Clone / Obtain the Project

```bash
git clone <your-repo-url>
cd Major
```

> If your repository is on OneDrive, **work from a local copy** (`C:\MajorApp`) to avoid OneDrive file-lock issues with `node_modules`.

---

## 2. Install Dependencies

```bash
npm install
```

This installs all backend dependencies (Express, Mongoose, bcryptjs, JWT, Multer, Helmet, etc.).

---

## 3. Configure Environment Variables

Create a `.env` file in the **project root** (same folder as `package.json`):

```env
# Server
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ar_vr_platform
JWT_SECRET=replace_with_a_long_random_string
ALLOWED_ORIGINS=http://localhost:5000

# Admin account (used by the seed script — see Step 5)
ADMIN_NAME=Admin
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_secure_password

# AI services (optional — features degrade gracefully if absent)
GEMINI_API_KEY=
LUMA_API_KEY=
```

> **Never commit `.env` to git.** The `.gitignore` already excludes it.

### Where to get the AI keys
| Key | Source |
|-----|--------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `LUMA_API_KEY` | [Luma Labs dashboard](https://lumalabs.ai) |

---

## 4. Start MongoDB

**Windows (service)**
```powershell
net start MongoDB
```

**Windows (manual)**
```powershell
mongod --dbpath "C:\data\db"
```

**macOS / Linux**
```bash
sudo systemctl start mongod
```

Verify it's running:
```bash
mongosh --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }
```

---

## 5. Create the Admin Account (first time only)

> Admin accounts must be created via the seed script. **Do not sign up through the UI with an admin email** — that account will be created as a regular customer.

```bash
node Backend/src/scripts/seedAdmin.js
```

Expected output:
```
Connected to MongoDB
Admin created: your_admin_email@example.com
Done.
```

Re-running the script on an existing admin is safe — it updates the role without changing other data.

---

## 6. Start the Server

**Development (auto-restart on file changes)**
```bash
npm run dev
```

**Production**
```bash
npm start
```

You should see:
```
Server running on http://localhost:5000
MongoDB connected: 127.0.0.1
Database: ar_vr_platform
```

---

## 7. Open in Browser

| URL | Page |
|-----|------|
| http://localhost:5000 | Redirects to login |
| http://localhost:5000/login | Customer / Admin login |
| http://localhost:5000/signup | New customer registration |
| http://localhost:5000/admin | Admin dashboard |
| http://localhost:5000/workspace | AI Workspace (Gemini + Luma) |
| http://localhost:5000/customer | Customer portal |
| http://localhost:5000/api/health | API health check (JSON) |

---

## User Roles

| Role | How to obtain | Access |
|------|--------------|--------|
| **Customer** | Sign up via `/signup` | Browse catalog, submit custom requests, track own requests |
| **Admin** | Seed script only | Everything above + manage catalog, review all requests, use AI workspace |

---

## Troubleshooting

### `Error: JWT_SECRET is not set`
Your `.env` file is missing or not being found. Make sure it exists in the project root (same level as `package.json`) and contains a `JWT_SECRET` value.

### `MongoDB connection failed`
MongoDB is not running. Follow Step 4 above to start it.

### `Error: UNKNOWN: unknown error, read` (node_modules)
This happens when `node_modules` is on OneDrive and files are cloud-only. Run the project from a local path and re-run `npm install` there.

### Port 5000 already in use
```bash
# Windows — find and kill the process using port 5000
netstat -ano | findstr :5000
taskkill /PID <pid> /F
```

### File upload failing
- Max file size is **50 MB**
- Allowed types: `.pdf .png .jpg .jpeg .glb .gltf .fbx .obj .zip`
- Other formats are rejected with a `VALIDATION_FAILED` error

---

## Environment Variables Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `PORT` | — | `5000` | Server listen port |
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `JWT_SECRET` | ✅ | — | Signs authentication tokens — keep secret |
| `ALLOWED_ORIGINS` | — | `http://localhost:5000` | Comma-separated CORS origins |
| `ADMIN_EMAIL` | ✅ for seed | — | Email for the seeded admin account |
| `ADMIN_NAME` | — | `Admin` | Display name for seeded admin |
| `ADMIN_PASSWORD` | ✅ for seed | — | Password for seeded admin |
| `GEMINI_API_KEY` | — | — | Enables Gemini AI chat and image analysis |
| `LUMA_API_KEY` | — | — | Enables Luma AI 3D/video generation |
