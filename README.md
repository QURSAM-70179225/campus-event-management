# Campus Event Management System

A full-stack web application for **The University of Lahore** where students discover campus events, register for them and manage their registrations, and administrators create, edit, delete and monitor events.

> **Individual project.** Designed, built, tested and documented by one developer.

| | |
|---|---|
| **Developer** | `[Your Full Name]` |
| **Registration no.** | `[Your Roll / Registration Number]` |
| **Program** | `[Degree Program, Semester]` |
| **Course** | `[Course Name & Code]` |
| **Instructor** | `[Instructor Name]` |
| **Repository** | `https://github.com/<your-username>/campus-event-management` |

## 🌐 Live demo

| | Link |
|---|---|
| Website | https://campus-event-management-mhbm.vercel.app |
| REST API | https://campus-event-management-x65m.onrender.com/api/events |

> Hosted free on Vercel (frontend), Render (backend) and Turso (SQLite database).
> The backend sleeps after 15 minutes of inactivity — the first visit may take up to a minute to load.



---

## Contents

1. [Features](#features)
2. [Technology stack](#technology-stack)
3. [Architecture](#architecture)
4. [Folder structure](#folder-structure)
5. [Getting started on Windows](#getting-started-on-windows)
6. [Environment variables](#environment-variables)
7. [Database setup](#database-setup)
8. [Creating the first admin](#creating-the-first-admin)
9. [API overview](#api-overview)
10. [Testing](#testing)
11. [Git & GitHub workflow](#git--github-workflow)
12. [Deployment](#deployment)
13. [Screenshots](#screenshots)

---

## Features

**Students**
- Create an account and log in (JWT, bcrypt-hashed passwords)
- Browse events loaded live from the API; search by title, filter by category, sort by date or popularity, optionally include past events
- Event details page with venue, date, time, capacity and a live remaining-seats meter
- One-click registration with instant seat-count update; logged-out users are sent to login and returned to the event afterwards
- Dashboard with upcoming registrations, full registration history with status, cancellation, profile card and suggested events

**Administrators**
- Overview statistics: total/upcoming events, students, registrations and seat occupancy
- Event management table with search and upcoming/past/all tabs
- Create, edit and delete events (with validation and confirmation)
- Manage capacity — the API refuses to lower capacity below the number already registered
- View registered students for any event and download the list as CSV
- Latest registrations feed and registrations-by-category chart

**Platform**
- Overbooking prevention using a SQLite write transaction (`BEGIN IMMEDIATE`) plus a `UNIQUE(user_id, event_id)` constraint
- Role-based authorization on both frontend routes and backend endpoints
- Input validation on client and server; consistent JSON error responses with field-level details
- Loading skeletons, empty states, error states with retry, and toast notifications
- Responsive from 360 px phones to desktop; keyboard focus styles; respects "reduce motion"

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 7, JavaScript, Tailwind CSS 4, React Router 7, Axios, Lucide React, Framer Motion |
| Backend | Node.js (≥ 22.13), Express 5, JSON Web Tokens (`jsonwebtoken`), bcrypt (`bcryptjs`), Helmet, CORS, express-rate-limit, Morgan |
| Database | SQLite — a local file via Node's built-in `node:sqlite` in development, [Turso](https://turso.tech) (hosted SQLite, `@libsql/client`) when deployed |
| Testing | Node's built-in test runner (`node:test`) + `fetch` |
| Tools | VS Code, Git, GitHub, Postman, npm |

**Why `node:sqlite`?** It ships inside Node.js, so there is no native module to compile — it installs cleanly on Windows without Visual Studio Build Tools. **Why Turso in production?** Free hosting wipes local files on restart; Turso keeps the same SQLite database in the cloud. One setting (`TURSO_DATABASE_URL`) switches between them, with no other code changes. **Why `bcryptjs`?** It is the bcrypt algorithm implemented in pure JavaScript for the same reason; hashes are standard `$2b$` bcrypt hashes.

## Architecture

```
┌──────────────────────────┐   HTTP + JSON    ┌───────────────────────────────┐   SQL   ┌──────────────┐
│  React SPA (Vite)        │ ───────────────▶ │ Express REST API              │ ──────▶ │ SQLite file  │
│  pages / components      │  Authorization:  │ routes → middleware →         │         │ users        │
│  AuthContext (JWT)       │  Bearer <token>  │ controllers → models          │         │ events       │
│  Axios service layer     │ ◀─────────────── │ (validation, auth, errors)    │ ◀────── │ registrations│
└──────────────────────────┘                  └───────────────────────────────┘         └──────────────┘
```

- **Frontend:** pages call service modules (`src/services/*`) which wrap a single Axios instance that adds the JWT and handles expired sessions.
- **Backend:** `routes` declare endpoints and attach middleware (`authenticate`, `requireRole`); `controllers` validate input and shape responses; `models` contain all SQL using prepared statements.
- In development Vite proxies `/api` to `http://localhost:5000`, so there are no CORS issues locally.

Full details: [`documentation/ARCHITECTURE.md`](documentation/ARCHITECTURE.md).

## Folder structure

```
campus-event-management/
├── backend/
│   ├── config/env.js              # environment variables + startup checks
│   ├── controllers/               # auth, events, registrations, admin
│   ├── database/                  # db.js, schema.sql, init.js, seed.js, sampleEvents.js
│   ├── middleware/                # auth.js (JWT + roles), errorHandler.js
│   ├── models/                    # userModel, eventModel, registrationModel (SQL)
│   ├── routes/                    # Express routers
│   ├── scripts/createAdmin.js     # first admin account
│   ├── tests/                     # models.test.js, api.test.js
│   ├── utils/                     # validators, ApiError, auth helpers, dates
│   ├── app.js                     # Express app factory (used by tests)
│   ├── server.js                  # starts the server
│   └── .env.example
├── frontend/
│   ├── public/                    # favicon, _redirects (Netlify)
│   ├── src/
│   │   ├── components/            # Navbar, EventCard, Modal, admin/…
│   │   ├── context/               # AuthContext, ToastContext
│   │   ├── hooks/                 # useAuth, useFetch, useDebounce, useCountdown…
│   │   ├── layouts/MainLayout.jsx
│   │   ├── pages/                 # Home, Events, EventDetails, Login, Signup, dashboards
│   │   ├── services/              # Axios API layer
│   │   ├── utils/                 # formatting, categories, validation
│   │   ├── App.jsx  main.jsx  index.css
│   ├── vite.config.js  vercel.json
│   └── .env.example
├── documentation/                 # API, database, architecture, testing, Git, deployment
├── screenshots/
├── render.yaml                    # Render (free) deployment blueprint
├── package.json                   # convenience scripts for both apps
├── README.md  LICENSE  .gitignore
```

## Getting started on Windows

**Prerequisites:** [Node.js 22 LTS or newer](https://nodejs.org) (22.13+), Git, VS Code.

Check your versions in PowerShell:

```powershell
node -v    # must be v22.13.0 or newer
npm -v
git --version
```

### 1. Install dependencies

```powershell
cd campus-event-management
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure the backend

```powershell
Copy-Item backend\.env.example backend\.env
# Generate a secret and paste it into backend\.env as JWT_SECRET=...
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Create the database and your admin account

```powershell
cd backend
npm run db:reset        # creates tables and inserts 12 sample UOL events
npm run create-admin    # prompts for your admin name, email and password
```

### 4. Run both apps (two terminals)

```powershell
# Terminal 1 — API on http://localhost:5000
cd backend
npm run dev

# Terminal 2 — website on http://localhost:5173
cd frontend
npm run dev
```

Open **http://localhost:5173**. Sign up as a student to register for events, or log in with your admin account to manage them.

> VS Code tip: use **Terminal → Split Terminal** to run both side by side.

## Environment variables

**`backend/.env`**

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `JWT_SECRET` | **yes** | – | Secret used to sign tokens. Long random string; ≥ 32 chars in production. |
| `PORT` | no | `5000` | API port |
| `NODE_ENV` | no | `development` | `production` hides internal error details |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `DB_PATH` | no | `database/campus_events.db` | Local SQLite file (relative to `backend/` or absolute) |
| `TURSO_DATABASE_URL` | no | – | When set (`libsql://…`), the app uses this Turso database instead of the local file |
| `TURSO_AUTH_TOKEN` | with Turso | – | Token for the Turso database |
| `CLIENT_ORIGIN` | no | `http://localhost:5173` | Allowed CORS origin(s), comma-separated |
| `APP_TIMEZONE` | no | `Asia/Karachi` | Decides whether an event is upcoming or past |
| `SEED_SAMPLE_DATA` | no | `false` | When `true`, inserts sample events if the table is empty at startup |

**`frontend/.env`** (optional)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL in production, e.g. `https://campus-events-api.onrender.com/api`. Leave empty locally. |

Never commit `.env` files — they are listed in `.gitignore`.

## Database setup

Three relational tables with foreign keys (`ON DELETE CASCADE`), a unique email, and a unique `(user_id, event_id)` pair. See [`documentation/DATABASE.md`](documentation/DATABASE.md) for the full schema and ER diagram.

| Command (in `backend/`) | What it does |
|---|---|
| `npm run db:init` | Creates tables if they don't exist |
| `npm run db:seed` | Adds sample events if the events table is empty |
| `npm run db:reset` | **Deletes all data**, recreates tables and seeds |

These commands, `create-admin` and the server all use Turso instead of the local file when `TURSO_DATABASE_URL` is set in `backend/.env`.

To browse the data, open `backend/database/campus_events.db` with the VS Code *SQLite Viewer* extension or [DB Browser for SQLite](https://sqlitebrowser.org/).

## Creating the first admin

Sign-up always creates **student** accounts, and no default admin password exists anywhere in the code. Create the admin yourself:

```powershell
cd backend
npm run create-admin
```

You'll be asked for a name, email and password (input hidden). Running it with an email that already exists promotes that account to admin.

For a hosting shell where prompts aren't convenient, pass the values as environment variables for that single command:

```powershell
$env:ADMIN_NAME="Your Name"; $env:ADMIN_EMAIL="you@uol.edu.pk"; $env:ADMIN_PASSWORD="ChooseAStrongOne123"; npm run create-admin
Remove-Item Env:ADMIN_PASSWORD
```

## API overview

Base URL: `http://localhost:5000/api` · 🔒 = requires `Authorization: Bearer <token>`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Create a student account → `{ token, user }` |
| POST | `/login` | Public | Log in → `{ token, user }` |
| GET | `/me` | 🔒 Any | Current user |
| GET | `/events` | Public | List events (`search`, `category`, `when`, `sort`, `limit`) |
| GET | `/events/:id` | Public (🔒 optional) | Event details (+ your registration if logged in) |
| POST | `/events` | 🔒 Admin | Create event |
| PUT | `/events/:id` | 🔒 Admin | Update event (partial) |
| DELETE | `/events/:id` | 🔒 Admin | Delete event (and its registrations) |
| POST | `/register` | 🔒 Student | Register `{ event_id }` |
| GET | `/my-registrations` | 🔒 Any | Your registrations with event details and status |
| GET | `/registrations` | 🔒 Any | Student: own · Admin: all (`?event_id=`) |
| DELETE | `/registrations/:id` | 🔒 Owner/Admin | Cancel a registration |
| GET | `/admin/stats` | 🔒 Admin | Dashboard statistics |
| GET | `/admin/registrations` | 🔒 Admin | Registrations with student details (`?event_id=`) |
| GET | `/stats` | Public | Home-page numbers |
| GET | `/health` | Public | Health check |

Request/response examples and status codes: [`documentation/API.md`](documentation/API.md). A ready-made Postman collection is in [`documentation/postman_collection.json`](documentation/postman_collection.json).

## Testing

```powershell
cd backend
npm test
```

This runs two suites with Node's built-in test runner against a temporary in-memory database:

- `tests/models.test.js` — 21 tests: schema, foreign keys, CRUD, unique email, duplicate-registration prevention, capacity limits, 20 simultaneous registrations for 5 seats, transaction rollback, cascades, validation, seed data. Can also be pointed at a separate Turso test database.
- `tests/api.test.js` — 32 tests: every endpoint, authentication, role authorization, validation errors, 404/409 handling, capacity and cancellation flows.

Manual frontend test checklist and Postman instructions: [`documentation/TESTING.md`](documentation/TESTING.md).

## Git & GitHub workflow

One repository, `main` always working, one feature branch per area of work, merged through pull requests you open and merge yourself. Commands and suggested commit plan: [`documentation/GIT_WORKFLOW.md`](documentation/GIT_WORKFLOW.md).

## Deployment

Everything runs on free plans:

- **Frontend:** Vercel (static Vite build)
- **Backend:** Render free web service
- **Database:** Turso free plan (hosted SQLite) — data survives Render restarts, which a SQLite file on Render's free disk would not

The free backend sleeps after 15 idle minutes and takes about a minute to wake. Step-by-step guide: [`documentation/DEPLOYMENT.md`](documentation/DEPLOYMENT.md).

## Screenshots

Add your own screenshots to the `screenshots/` folder and they'll show here.

| Page | Screenshot |
|---|---|
| Home | `![Home](screenshots/home.png)` |
| All events | `![Events](screenshots/events.png)` |
| Event details | `![Event details](screenshots/event-details.png)` |
| Student dashboard | `![Student dashboard](screenshots/student-dashboard.png)` |
| Admin dashboard | `![Admin dashboard](screenshots/admin-dashboard.png)` |
| Mobile | `![Mobile](screenshots/mobile.png)` |

## License

[MIT](LICENSE)
