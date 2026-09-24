# Ather3D - AR/VR 3D Models & Environment Selling Platform

> An end-to-end platform for exploring, requesting, and managing AR/VR 3D models and spatial environments, powered by Node.js, Express, MongoDB, and integrated with Google Gemini Spatial AI & Luma AI 3D generation.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [How to Run the Project](#how-to-run-the-project)
  - [Step 1: Install Dependencies](#step-1-install-dependencies)
  - [Step 2: Configure Environment Variables](#step-2-configure-environment-variables)
  - [Step 3: Start MongoDB Service](#step-3-start-mongodb-service)
  - [Step 4: Launch the Server](#step-4-launch-the-server)
- [Application URLs & Access](#application-urls--access)
- [User Roles & Default Accounts](#user-roles--default-accounts)
- [API Endpoints Reference](#api-endpoints-reference)
- [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## 🚀 Overview

**Ather3D** bridges the gap between 3D model creators and customers. Customers can submit custom 3D asset/environment requests with blueprint attachments. Administrators can review, accept, and manage orders in a dedicated dashboard, and use the **Ather3D Workspace** — an integrated studio featuring:
- **Spatial AI Assistant** powered by Google Gemini for shader scripting, topology advice, and 3D design workflows.
- **3D & Spatial Video Generations** powered by Luma AI.

The Express backend seamlessly serves both the REST API and the static frontend pages with clean URL redirects.

---

## ✨ Key Features

- **Unified Server**: Single command starts both the RESTful API and serves the full frontend.
- **Role-Based Authentication**: Secure JWT-based authentication with bcrypt password hashing for **Admin** and **Customer** roles.
- **Custom 3D Request Pipeline**: Customers can request bespoke 3D environments with file uploads (blueprints/references via Multer).
- **Admin Dashboard**: Real-time management of requests with status transitions (`pending` ➔ `accepted` ➔ `rejected` ➔ `completed`).
- **Ather3D Workspace Studio**:
  - Interactive Gemini Spatial AI chat with multi-session history.
  - Luma AI integration for text-to-3D asset and video generation with real-time status polling.
- **Clean Routing**: Direct friendly URLs (`/login`, `/signup`, `/admin`, `/workspace`, `/customer`).

---

## 🛠️ Tech Stack

- **Backend**: [Node.js](https://nodejs.org/) (v16+), [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
- **Security & Auth**: [JSON Web Tokens (JWT)](https://jwt.io/), [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **File Uploads**: [Multer](https://github.com/expressjs/multer)
- **Frontend**: Vanilla HTML5, Modern CSS (Glassmorphism & Dark Mode), Vanilla JavaScript (ES6+)
- **External AI Integrations**:
  - Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`)
  - Luma AI Dream Machine / Agents API (`uni-1`, `ray-3.2`)

---

## 📁 Project Structure

```text
Major_Project/
├── Assets/                    # Static assets, branding, and images
├── Backend/
│   ├── .env                   # Environment variables (ignored by git)
│   ├── .env.example           # Example environment template
│   ├── uploads/               # Uploaded blueprints and model references
│   └── src/
│       ├── config/
│       │   └── db.js          # MongoDB connection handler
│       ├── middleware/        # Authentication & request middlewares
│       ├── Modules/
│       │   ├── Chat/          # Gemini Spatial AI chat endpoints
│       │   ├── Luma/          # Luma AI 3D/video generation endpoints
│       │   ├── Product/       # 3D models and listings module
│       │   ├── Request/       # Custom 3D model customer requests
│       │   └── User/          # Auth, signup, login, and user profile
│       └── server.js          # Express app entry point & static file server
├── Front-end/
│   ├── Admin/
│   │   ├── Admin.html         # Admin management dashboard
│   │   ├── Admin.css / Admin.js
│   │   ├── Workspace.html     # Spatial AI & 3D generation studio
│   │   └── Workspace.css / Workspace.js
│   ├── Customer/
│   │   ├── Customer.html      # Customer 3D request submission portal
│   │   └── Customer.css / Customer.js
│   └── Login/
│       ├── login.html / login.js       # User & Admin authentication
│       └── sign-up.html / sign-up.js   # New user registration
├── Readme/
│   └── file_structure         # Architecture and directory reference
├── package.json               # Root npm dependencies and scripts
└── README.md                  # Main documentation
```

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed:

1. **Node.js**: `v16.0.0` or higher ([Download Node.js](https://nodejs.org/))
2. **npm**: Included with Node.js (`v7.0.0`+)
3. **MongoDB**:
   - **Local MongoDB**: [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on default port `27017`.
   - *OR* **Cloud MongoDB**: Free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster connection string.

---

## ⚡ How to Run the Project

Follow these steps to set up and launch the application locally.

### Step 1: Install Dependencies

Open a terminal (PowerShell or Bash) in the root project folder:

```bash
npm install
```

This installs all required packages (`express`, `mongoose`, `dotenv`, `cors`, `bcryptjs`, `jsonwebtoken`, `multer`, `nodemon`).

---

### Step 2: Configure Environment Variables

The backend requires a `Backend/.env` file. A sample template is provided at `Backend/.env.example`.

Create or edit `Backend/.env`:

```env
# Server Port
PORT=5000

# MongoDB Connection String (Local or Atlas)
MONGO_URI=mongodb://127.0.0.1:27017/myapp

# JWT Authentication Secret Key
JWT_SECRET=ather3d_secure_jwt_token_secret_2026

# Designated Admin Email (Users signing up with this email get admin access)
ADMIN_EMAIL=Ather3dAdmin@gmail.com

# Optional: AI Integrations for Ather3D Workspace
GEMINI_API_KEY=your_gemini_api_key_here
LUMA_API_KEY=your_luma_api_key_here
```

> [!NOTE]
> If you don't have Gemini or Luma API keys yet, you can still run the full platform, authenticate, submit requests, and manage orders. The Workspace also allows setting a custom Gemini API key directly in its Settings modal.

---

### Step 3: Start MongoDB Service

Make sure your MongoDB server is active before starting the backend.

- **Windows (PowerShell as Administrator or Services)**:
  ```powershell
  net start MongoDB
  ```
  *(Or start MongoDB Community Server via the Windows Services app or MongoDB Compass)*

- **macOS / Linux**:
  ```bash
  sudo systemctl start mongod
  # Or with Homebrew:
  brew services start mongodb-community
  ```

---

### Step 4: Launch the Server

Run one of the following commands in the project root:

#### Option A: Development Mode (Auto-reloads on file changes)
```bash
npm run dev
```

#### Option B: Standard Production Mode
```bash
npm start
```

When started successfully, the console will display:
```
MongoDB connected: 127.0.0.1
Database: myapp
Server running on http://localhost:5000
```

---

## 🌐 Application URLs & Access

Once the server is running, open your web browser to:

| Page / Feature | URL | Description |
| :--- | :--- | :--- |
| **Home / Login** | [http://localhost:5000](http://localhost:5000) *(redirects to Login)* | Main login page |
| **Sign Up** | [http://localhost:5000/signup](http://localhost:5000/signup) | Register customer or admin account |
| **Admin Dashboard** | [http://localhost:5000/admin](http://localhost:5000/admin) | Manage client 3D model requests |
| **Ather3D Workspace** | [http://localhost:5000/workspace](http://localhost:5000/workspace) | Spatial AI chat & Luma 3D Studio |
| **Customer Portal** | [http://localhost:5000/customer](http://localhost:5000/customer) | Submit custom 3D model requests |
| **API Health Check** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Verify backend status (`JSON`) |

---

## 👤 User Roles & Default Accounts

The system features automatic role assignment:

### 1. Admin Role
- **How to register**: Sign up with the email designated in `ADMIN_EMAIL` (default: `Ather3dAdmin@gmail.com`).
- **Permissions**:
  - Automatically assigned the `admin` role.
  - Redirected to the **Admin Dashboard** (`/admin`).
  - Access to the **Ather3D Workspace** (`/workspace`).
  - View, approve, reject, or complete customer 3D model requests.

### 2. Customer Role
- **How to register**: Sign up with any other email address.
- **Permissions**:
  - Automatically assigned the `customer` role.
  - Redirected to the **Customer Portal** (`/customer`).
  - Fill out 3D model specifications (Dimensions, Poly Count, Format, Blueprints) and submit requests.

---

## 🔌 API Endpoints Reference

### Authentication (`/api/users`)
- `POST /api/users/signup`: Register a new user (`name`, `email`, `password`)
- `POST /api/users/login`: Authenticate existing user and receive JWT token
- `GET /api/users/me`: Retrieve current logged-in user profile (`Bearer <token>`)

### Custom Requests (`/api/requests`)
- `POST /api/requests`: Submit custom 3D model request (supports `multipart/form-data` with file uploads)
- `GET /api/requests`: Retrieve all requests (for Admin Dashboard)
- `PATCH /api/requests/:id/status`: Update request status (`pending`, `accepted`, `rejected`, `completed`)

### Products & Listings (`/api/products`)
- `GET /api/products`: Retrieve all public 3D models and environments
- `POST /api/products`: Create a new 3D model listing

### Spatial AI & Generations
- `POST /api/chat`: Gemini Spatial AI assistant query
- `GET /api/luma/status`: Verify Luma AI API connection
- `POST /api/luma/generations`: Initiate 3D visual or spatial video generation
- `GET /api/luma/generations/:id`: Poll generation status and retrieve download URL

---

## ❓ Troubleshooting & FAQs

### 1. `MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017`
- **Cause**: Local MongoDB service is not running.
- **Fix**: Start the MongoDB service (`net start MongoDB` on Windows, or open MongoDB Compass and connect to verify).
- **Alternative**: If using MongoDB Atlas, replace `MONGO_URI` in `Backend/.env` with your Atlas connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/myapp?retryWrites=true&w=majority`).

### 2. `Port 5000 is already in use` (`EADDRINUSE`)
- **Cause**: Another process is using port 5000.
- **Fix**: Change `PORT=5001` inside `Backend/.env` and update frontend fetch URLs if necessary, or terminate the process on port 5000:
  ```powershell
  # On Windows PowerShell:
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
  ```

### 3. `Could not reach the server` alert in browser
- **Cause**: The frontend is being opened, but the backend server is stopped.
- **Fix**: Run `npm run dev` or `npm start` in your terminal and verify that [http://localhost:5000/api/health](http://localhost:5000/api/health) returns `{"success": true}`.

### 4. Can I use VS Code Live Server?
- **Yes**: You can right-click any HTML file in `Front-end/` and choose **Open with Live Server**. Ensure `npm start` is also running in terminal so that API calls to `http://localhost:5000` succeed.
