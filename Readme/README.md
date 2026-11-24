# Ather3D Documentation

Welcome to the Ather3D documentation hub. Use the links below to find what you need.

---

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [Setup Guide](./Setup_Guide.md) | Install, configure, and run the project from scratch |
| [Architecture Overview](./Architecture.md) | System design, data models, security layers, AI integration |
| [API Reference](./API_Reference.md) | Full REST API — endpoints, request/response shapes, error codes |
| [File Structure](./file_structure) | Project folder layout and file descriptions |

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env in project root (see Setup Guide for all variables)
# PORT, MONGO_URI, JWT_SECRET are required

# 3. Start MongoDB
net start MongoDB

# 4. Seed the admin account (first time only)
node Backend/src/scripts/seedAdmin.js

# 5. Run the server
npm run dev
```

Then open **http://localhost:5000** in your browser.

---

## 🌐 Pages

| URL | Description |
|-----|-------------|
| `/login` | Sign in |
| `/signup` | Create a customer account |
| `/customer` | Customer portal — browse catalog, submit requests, track status |
| `/admin` | Admin dashboard — manage requests, catalog |
| `/workspace` | AI Workspace — Gemini chat, image analysis, Luma generation |
| `/api/health` | JSON health check |

---

## 🔑 Roles

| Role | How to get it | What you can do |
|------|--------------|-----------------|
| **Customer** | Sign up at `/signup` | Browse catalog, submit and track custom 3D requests |
| **Admin** | Seed script (see Setup Guide) | Everything above + manage catalog, review all requests, AI workspace |

---

## 🛡️ Security Notes

- All admin and AI features require a valid login token
- Tokens expire in **15 minutes** — re-login when prompted
- Blueprint files are stored privately and never publicly accessible by URL
- API keys for Gemini and Luma are kept on the server and never sent to the browser

---

## 📐 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| File uploads | Multer |
| Security | Helmet, express-rate-limit, CORS |
| AI | Google Gemini API, Luma Labs API |
| Frontend | Vanilla HTML, CSS, JavaScript |
