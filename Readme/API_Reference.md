# Ather3D — API Reference

> **Base URL:** `http://localhost:5000/api` (development)  
> **Response format:** Every endpoint returns `{ success: boolean, ...payload }` on success, or `{ success: false, code, message }` on error.  
> **Authentication:** Send `Authorization: Bearer <token>` in the request header. Tokens are obtained from the login endpoint.

---

## Authentication Legend

| Symbol | Meaning |
|--------|---------|
| 🌐 Public | No token required |
| 🔑 Authenticated | Any valid logged-in user |
| 🛡️ Admin | Admin role required |

---

## 1. Health

### `GET /api/health`
Check if the server is running.

**Auth:** 🌐 Public

**Response**
```json
{
  "success": true,
  "message": "Ather3D API is running",
  "timestamp": "2026-11-24T10:00:00.000Z"
}
```

---

## 2. Users

### `POST /api/users/signup`
Create a new customer account.

**Auth:** 🌐 Public · Rate-limited (20 requests / 15 min)

**Request body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "mypassword"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | Display name |
| `email` | string | ✅ | Must be unique |
| `password` | string | ✅ | Minimum 6 characters |

**Success `201`**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer"
  }
}
```

**Error codes**

| HTTP | `code` | Reason |
|------|--------|--------|
| 400 | `VALIDATION_FAILED` | Missing or invalid fields |
| 409 | `DUPLICATE_KEY` | Email already registered |
| 429 | `RATE_LIMIT` | Too many signup attempts |

---

### `POST /api/users/login`
Log in and receive a JWT.

**Auth:** 🌐 Public · Rate-limited (20 requests / 15 min)

**Request body**
```json
{
  "email": "jane@example.com",
  "password": "mypassword"
}
```

**Success `200`**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer"
  }
}
```

**Error codes**

| HTTP | `code` | Reason |
|------|--------|--------|
| 400 | `VALIDATION_FAILED` | Missing fields |
| 401 | `AUTH_REQUIRED` | Invalid email or password |
| 429 | `RATE_LIMIT` | Too many attempts |

> **Token expiry:** Tokens expire in 15 minutes. Re-authenticate when you receive `401 AUTH_REQUIRED`.

---

### `GET /api/users/me`
Get the currently authenticated user's profile.

**Auth:** 🔑 Authenticated

**Success `200`**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer",
    "createdAt": "2026-11-01T00:00:00.000Z"
  }
}
```

---

## 3. Products (Catalog)

### `GET /api/products`
Browse the published catalog of 3D models and environments.

**Auth:** 🌐 Public

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `category` | string | Filter by `AR`, `VR`, `3D Model`, or `Environment` |
| `search` | string | Full-text search across title, description, tags |

**Success `200`**
```json
{
  "success": true,
  "total": 48,
  "page": 1,
  "limit": 20,
  "products": [
    {
      "id": "...",
      "title": "City Block Environment",
      "description": "...",
      "category": "Environment",
      "price": 1499,
      "previewUrl": "https://...",
      "thumbnailUrl": "https://...",
      "tags": ["urban", "lowpoly"],
      "format": ["GLB", "FBX"],
      "polyCount": 24000,
      "status": "published"
    }
  ]
}
```

> **Note:** The private download asset is never included in public catalog responses.

---

### `GET /api/products/:id`
Get full detail of a single published product.

**Auth:** 🌐 Public

**Success `200`** — same shape as a single item from the list above.

**Error codes**

| HTTP | `code` | Reason |
|------|--------|--------|
| 404 | `NOT_FOUND` | Product not found or not published |

---

### `POST /api/products`
Create a new product listing.

**Auth:** 🛡️ Admin

**Request body**
```json
{
  "title": "Space Station VR",
  "description": "High-detail modular space station for VR.",
  "category": "VR",
  "price": 2499,
  "previewUrl": "https://cdn.example.com/previews/space-station.webp",
  "assetKey": "assets/space-station-v1.glb",
  "thumbnailUrl": "https://cdn.example.com/thumbs/space-station.jpg",
  "tags": ["sci-fi", "modular"],
  "format": ["GLB"],
  "polyCount": 85000,
  "status": "draft"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `title` | ✅ | |
| `category` | ✅ | `AR`, `VR`, `3D Model`, `Environment` |
| `price` | ✅ | In smallest currency unit (e.g. paise) |
| `status` | — | `draft` (default) or `published` |
| `assetKey` | — | Private storage key — never exposed publicly |

**Success `201`**
```json
{ "success": true, "message": "Product created", "product": { ... } }
```

---

### `PUT /api/products/:id`
Update a product.

**Auth:** 🛡️ Admin

**Request body** — any subset of the create fields.

**Success `200`**
```json
{ "success": true, "message": "Product updated", "product": { ... } }
```

---

### `DELETE /api/products/:id`
Delete a product.

**Auth:** 🛡️ Admin

**Success `200`**
```json
{ "success": true, "message": "Product deleted" }
```

---

## 4. Custom Requests

### `POST /api/requests`
Submit a custom 3D model commission request.

**Auth:** 🔑 Authenticated

**Content-Type:** `multipart/form-data`

**Form fields**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `fullName` | text | ✅ | Name or company |
| `workEmail` | text | ✅ | Contact email |
| `targetPlatform` | text | ✅ | e.g. `Unity AR`, `Unreal VR` |
| `specifications` | text | ✅ | Detailed description |
| `blueprintFile` | file | — | Max 50 MB · allowed: `.pdf .png .jpg .jpeg .glb .gltf .fbx .obj .zip` |

**Success `201`**
```json
{
  "success": true,
  "message": "Request submitted successfully",
  "request": {
    "id": "...",
    "status": "Pending",
    "createdAt": "..."
  }
}
```

---

### `GET /api/requests/mine`
Get all requests submitted by the current user.

**Auth:** 🔑 Authenticated

**Success `200`**
```json
{
  "success": true,
  "count": 3,
  "requests": [
    {
      "id": "...",
      "fullName": "Jane Doe",
      "targetPlatform": "Unity AR",
      "status": "Accepted",
      "adminNote": "We will start this week.",
      "quotedPrice": 5000,
      "createdAt": "..."
    }
  ]
}
```

---

### `GET /api/requests`
Get all requests (admin queue), with optional filters.

**Auth:** 🛡️ Admin

**Query parameters**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page (max 100) |
| `status` | string | Filter: `Pending`, `Accepted`, `InProgress`, `Completed`, `Delivered`, `Rejected` |

**Success `200`**
```json
{
  "success": true,
  "total": 12,
  "page": 1,
  "limit": 20,
  "requests": [
    {
      "id": "...",
      "user": { "id": "...", "name": "Jane Doe", "email": "jane@example.com" },
      "fullName": "Jane Doe",
      "targetPlatform": "Unity AR",
      "specifications": "...",
      "fileName": "blueprint.pdf",
      "status": "Pending",
      "createdAt": "..."
    }
  ]
}
```

---

### `PATCH /api/requests/:id/status`
Update the status of a request and optionally add a note or quote.

**Auth:** 🛡️ Admin

**Request body**
```json
{
  "status": "Accepted",
  "adminNote": "Starting development next Monday.",
  "quotedPrice": 7500
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `status` | ✅ | `Pending`, `Accepted`, `InProgress`, `Completed`, `Delivered`, `Rejected` |
| `adminNote` | — | Optional message visible to customer |
| `quotedPrice` | — | Price in smallest currency unit |

**Success `200`**
```json
{ "success": true, "message": "Status updated", "request": { ... } }
```

---

## 5. AI — Gemini Chat *(Admin only)*

### `POST /api/chat`
Send a message to the Gemini AI spatial assistant.

**Auth:** 🛡️ Admin

**Request body**
```json
{
  "prompt": "How do I optimise polygon count for AR on mobile?",
  "model": "gemini-3.6-flash"
}
```

**Success `200`**
```json
{
  "success": true,
  "reply": "For mobile AR, aim for under 50k polygons total scene budget ...",
  "modelUsed": "gemini-3.6-flash"
}
```

---

### `POST /api/chat/analyze-image`
Analyse a 3D render or texture using Gemini Vision.

**Auth:** 🛡️ Admin

**Request body**
```json
{
  "image": "<base64-encoded-image>",
  "mimeType": "image/png",
  "prompt": "Review this PBR material for realism issues.",
  "task": "topology"
}
```

| `task` value | Description |
|-------------|-------------|
| `topology` | Polygon / mesh analysis |
| `pbr` | PBR material review |
| `lighting` | Lighting quality assessment |
| `prompt` | Generate a Luma-ready prompt from the image |

**Success `200`**
```json
{
  "success": true,
  "task": "topology",
  "analysis": "The mesh shows good edge-loop distribution ...",
  "modelUsed": "gemini-flash-latest"
}
```

---

## 6. AI — Luma Generation *(Admin only)*

### `POST /api/luma/generations`
Start a Luma AI image or video generation.

**Auth:** 🛡️ Admin

**Request body**
```json
{
  "prompt": "A futuristic city block at night, neon lights, photorealistic",
  "model": "uni-1",
  "aspect_ratio": "16:9",
  "type": "image"
}
```

| Field | Default | Notes |
|-------|---------|-------|
| `prompt` | — | Required |
| `model` | `uni-1` | `uni-1` for images · `ray-3.2` for video |
| `aspect_ratio` | `16:9` | |
| `type` | `image` | `image` or `video` |

**Success `200`**
```json
{
  "success": true,
  "data": {
    "id": "gen_abc123",
    "state": "queued"
  }
}
```

---

### `GET /api/luma/generations/:id`
Poll a generation for its current status and output URL.

**Auth:** 🛡️ Admin

**Success `200`**
```json
{
  "success": true,
  "data": {
    "id": "gen_abc123",
    "state": "completed",
    "normalizedAssetUrl": "https://cdn.lumalabs.ai/...",
    "normalizedAssetType": "image"
  }
}
```

| `state` | Meaning |
|---------|---------|
| `queued` | Waiting to start |
| `dreaming` | Generating |
| `completed` | Done — `normalizedAssetUrl` is set |
| `failed` | Generation failed |

---

## Standard Error Response

All errors follow this shape:

```json
{
  "success": false,
  "code": "AUTH_REQUIRED",
  "message": "Authentication token required"
}
```

**Common error codes**

| `code` | HTTP | Description |
|--------|------|-------------|
| `AUTH_REQUIRED` | 401 | Missing, invalid, or expired token |
| `FORBIDDEN` | 403 | Authenticated but insufficient role |
| `VALIDATION_FAILED` | 400 | Missing or invalid request fields |
| `NOT_FOUND` | 404 | Resource does not exist |
| `DUPLICATE_KEY` | 409 | Unique constraint violated |
| `RATE_LIMIT` | 429 | Too many requests |
| `FILE_TOO_LARGE` | 413 | Upload exceeds 50 MB limit |
| `SERVER_ERROR` | 500 | Unexpected server error |
