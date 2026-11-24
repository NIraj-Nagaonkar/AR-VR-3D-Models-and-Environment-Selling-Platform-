# Ather3D — Architecture Overview

## What is Ather3D?

Ather3D is a web platform for buying and commissioning AR/VR 3D models and environments. It has two user-facing portals (Customer and Admin), a REST API backend, and an AI-powered workspace for spatial content generation.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│                                                      │
│  Login / Sign-up  │  Customer Portal  │  Admin       │
│                   │                   │  Dashboard   │
│                        Workspace (AI)               │
└──────────────┬──────────────────────────────────────┘
               │  HTTPS  (fetch / multipart)
               ▼
┌─────────────────────────────────────────────────────┐
│          Express Server  (port 5000)                 │
│                                                      │
│  Security layer                                      │
│  ├── Helmet (security headers)                       │
│  ├── CORS (restricted origins)                       │
│  ├── Rate limiter (global + auth)                    │
│  └── authenticate / requireRole middleware           │
│                                                      │
│  REST API                                            │
│  ├── /api/users     — auth (signup, login, profile)  │
│  ├── /api/products  — catalog (public read)          │
│  ├── /api/requests  — custom commissions             │
│  ├── /api/chat      — Gemini AI proxy (admin only)   │
│  └── /api/luma      — Luma AI generation (admin)     │
│                                                      │
│  Static serving                                      │
│  ├── /Front-end     — HTML / CSS / JS pages          │
│  └── /Assets        — Branding, images               │
└───────┬──────────────────────┬────────────────────────┘
        │                      │
        ▼                      ▼
┌───────────────┐   ┌──────────────────────────────────┐
│    MongoDB    │   │          External AI APIs        │
│               │   │                                  │
│  Users        │   │  Google Gemini API               │
│  Products     │   │  ├── Text / spatial chat         │
│  Requests     │   │  └── Vision / render analysis    │
│               │   │                                  │
│               │   │  Luma Labs API                   │
│               │   │  ├── Image generation            │
│               │   │  └── Video generation            │
└───────────────┘   └──────────────────────────────────┘
```

---

## Module Map

```
Backend/src/
├── server.js           Entry point — registers all middleware and routes
├── config/
│   └── db.js           MongoDB connection (Mongoose)
├── middleware/
│   ├── authenticate.js  Verifies JWT, loads req.user; requireRole guard
│   └── errorHandler.js  Global error handler — stable error codes
└── Modules/
    ├── User/           Signup, login, profile (JWT, bcrypt)
    ├── Product/        Catalog management (admin write, public read)
    ├── Request/        Custom commission pipeline (upload, status workflow)
    ├── Chat/           Gemini AI proxy with model fallback chain
    └── Luma/           Luma AI generation — start + poll pattern
```

---

## Data Model

### User
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Display name |
| `email` | string | Unique, lowercase |
| `password` | string (hash) | Never returned in queries |
| `role` | `customer` \| `admin` | Set at creation; admin only via seed script |

### Product
| Field | Type | Notes |
|-------|------|-------|
| `title` | string | |
| `category` | enum | `AR`, `VR`, `3D Model`, `Environment` |
| `price` | number | In smallest currency unit |
| `previewUrl` | string | Public watermarked preview |
| `assetKey` | string | Private storage key — never sent to public clients |
| `tags` | string[] | Full-text searchable |
| `format` | string[] | e.g. `["GLB", "FBX"]` |
| `polyCount` | number | |
| `status` | `draft` \| `published` | Only published items appear in public catalog |

### Request (Custom Commission)
| Field | Type | Notes |
|-------|------|-------|
| `user` | ObjectId → User | Linked to the submitting customer |
| `fullName` | string | |
| `workEmail` | string | |
| `targetPlatform` | string | e.g. `Unity AR` |
| `specifications` | string | Detailed brief |
| `fileName` | string | Original filename shown to admin |
| `fileKey` | string | Storage key (local path now; object store key in Phase 3) |
| `status` | enum | `Pending` → `Accepted` → `InProgress` → `Completed` → `Delivered` (or `Rejected`) |
| `adminNote` | string | Visible to customer |
| `quotedPrice` | number | Set by admin on acceptance |

---

## Request Status Workflow

```
         Submit
            │
            ▼
        ┌───────┐
        │Pending│  ◄─── Default on submission
        └───┬───┘
            │  Admin reviews
     ┌──────┴──────┐
     ▼             ▼
┌──────────┐  ┌──────────┐
│ Accepted │  │ Rejected │
└────┬─────┘  └──────────┘
     │  Work begins
     ▼
┌────────────┐
│ InProgress │
└─────┬──────┘
      │  Work done
      ▼
┌───────────┐
│ Completed │
└─────┬─────┘
      │  Delivered to client
      ▼
┌───────────┐
│ Delivered │
└───────────┘
```

---

## Security Design

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS in production; HTTP only on localhost |
| Authentication | JWT (Bearer token), 15-minute expiry |
| Authorisation | `authenticate` middleware on every protected route; `requireRole('admin')` on admin-only routes |
| Headers | Helmet sets `X-Content-Type-Options`, `X-Frame-Options`, CSP, etc. |
| Rate limiting | Global: 200 req / 15 min · Auth endpoints: 20 req / 15 min |
| CORS | Only origins in `ALLOWED_ORIGINS` env variable are accepted |
| Uploads | Extension + MIME type allow-list; random stored filenames; files are **not** served publicly |
| AI proxy | SSRF-hardened: image proxy only forwards to known Luma CDN hostnames |
| Secrets | Server-side only; `JWT_SECRET` and AI keys never sent to the browser |
| Admin creation | Seed script only — sign-up cannot produce an admin account |

---

## AI Integration

### Gemini (Text + Vision)

The workspace uses Google Gemini for two tasks:

1. **Spatial chat** — conversational assistant for 3D/AR/VR topics  
2. **Vision analysis** — reviews renders for topology, PBR quality, and lighting

A **model fallback chain** automatically retries with the next available Gemini model if one is overloaded (HTTP 429 / 503).

### Luma AI (Generation)

Luma generates images and videos from text prompts using an **async polling pattern**:

1. Admin submits a prompt → server starts a generation job
2. Frontend polls `GET /api/luma/generations/:id` until `state: "completed"`
3. Output URL is normalised and returned

Both integrations use **server-side API keys only** — the browser never sees or sends an AI key.

---

## Planned Improvements (Phase 2 & 3)

| Phase | Work |
|-------|------|
| **Phase 2** | Storefront (browse, search, 3D preview), cart, orders, payments, download entitlements, email notifications, customer "My Orders" page |
| **Phase 3** | Object storage (S3 / R2) for files and assets, CDN for frontend, BullMQ worker for async Luma jobs, persisted chat sessions, Redis cache, Docker, CI/CD pipeline, monitoring |
