# Application Architecture

## Overview

The system is a classic three-tier web application:

```
Browser (React SPA)  ──HTTP/JSON──▶  Express REST API  ──SQL──▶  SQLite (local file, or Turso when deployed)
```

- The **frontend** is a single-page app built with Vite. It holds no event data of its own — everything is fetched from the API.
- The **backend** is a stateless REST API. Identity travels in a signed JWT, so any number of requests can be served without server-side sessions.
- The **database** is SQLite: a file on your laptop, or the same schema hosted on Turso in production, because free hosting can't keep files.

## Backend layers

```
request
  │
  ▼
app.js ─ helmet · cors · express.json · morgan
  │
  ▼
routes/*.js ─ maps URL + method to handlers, attaches middleware
  │            authenticate → requireRole('admin' | 'student')
  ▼
controllers/*.js ─ validate input (utils/validators.js), apply business rules,
  │                 build JSON responses, throw ApiError on failure
  ▼
models/*.js ─ prepared SQL statements, transactions
  │
  ▼
database/db.js ─ same async API for both backends
  │
  ├──▶ local SQLite file (node:sqlite)        — development & tests
  └──▶ Turso hosted SQLite (@libsql/client)    — free deployment
  │
errors from any layer ──▶ middleware/errorHandler.js ──▶ { error, details } + status code
```

| Folder | Responsibility |
|---|---|
| `config/` | Reads `.env`, applies defaults, refuses to start without `JWT_SECRET` |
| `routes/` | `authRoutes`, `eventRoutes`, `registrationRoutes`, `adminRoutes` |
| `middleware/` | `authenticate` (verifies JWT, reloads user), `optionalAuth`, `requireRole`, 404 + error handler |
| `controllers/` | Request handling for each resource |
| `models/` | All SQL: `UserModel`, `EventModel`, `RegistrationModel` |
| `database/` | Database adapter (local file or Turso), schema, init/seed scripts, sample data |
| `utils/` | Validation, `ApiError`, password hashing + JWT, date helpers |
| `scripts/` | `createAdmin.js` |

`app.js` exports a `createApp()` factory and `server.js` starts it. Splitting them lets the tests spin up the app on a random port with an in-memory database.

### Authentication flow

1. `POST /login` → the controller loads the user by email and compares the password with `bcrypt.compare`.
2. On success it signs a JWT `{ sub: userId, role }` with `JWT_SECRET` (expires in `JWT_EXPIRES_IN`).
3. The client stores the token and sends `Authorization: Bearer <token>`.
4. `authenticate` verifies the signature and expiry, then **re-reads the user from the database**, so a deleted account or changed role takes effect immediately.
5. `requireRole('admin')` returns 403 for anyone else.

### Security measures

| Concern | Measure |
|---|---|
| Password storage | bcrypt (10 rounds); hashes never leave the server |
| Credential guessing | Rate limit on `/login` and `/signup`; identical message and similar timing for unknown emails |
| Privilege escalation | Signup always creates `student`; only `create-admin` makes admins |
| Secrets | `JWT_SECRET` from environment only; `.env` git-ignored; startup fails if missing |
| SQL injection | Prepared statements; whitelisted dynamic identifiers |
| HTTP hardening | Helmet security headers, `x-powered-by` disabled, 100 KB JSON limit |
| CORS | Only origins listed in `CLIENT_ORIGIN` |
| Error leaks | Stack traces never sent; internal messages hidden in production |

## Frontend structure

```
main.jsx
 └─ BrowserRouter
     └─ MotionConfig (respects reduced motion)
         └─ ToastProvider
             └─ AuthProvider
                 └─ App (routes)
                     └─ MainLayout (Navbar · <Outlet/> · Footer)
                         ├─ /                Home
                         ├─ /events          Events
                         ├─ /events/:id      EventDetails
                         ├─ /login /signup   Login, Signup
                         ├─ /dashboard       ProtectedRoute(student) → StudentDashboard
                         ├─ /admin           ProtectedRoute(admin)   → AdminDashboard
                         └─ *                NotFound
```

| Folder | Responsibility |
|---|---|
| `services/` | `api.js` (Axios instance: base URL, token header, expired-session handling, error messages) plus one service per resource |
| `context/` | `AuthContext` (user, login, signup, logout, session restore), `ToastContext` |
| `hooks/` | `useFetch` (loading / error / data / refetch), `useDebounce`, `useCountdown`, `useAuth`, `useToast` |
| `components/` | Reusable UI: `EventCard`, `DateTile`, `SeatMeter`, `CategoryVisual`, `Modal`, `FormField`, states, admin modals |
| `pages/` | One component per route |
| `utils/` | Date/time formatting, category colours and icons, client-side validation |

### Data flow example — registering for an event

1. `EventDetails` loads `GET /events/:id` via `useFetch`.
2. Student clicks **Register** → `registrationService.register(id)` → `POST /register`.
3. The API runs the transaction and returns the registration and the updated event.
4. The page replaces its data with the response, so the seat count and "You're registered" state update immediately; a toast confirms.
5. If the event filled up meanwhile, the API returns 409, the page shows the error toast and reloads the event.

### UI design system

- **Colour:** navy `#1A2C6B`, ink `#0E1A3A`, violet `#6A4CF5`, orchid `#A24BD9`, cool background `#F3F5FB`; each event category has its own gradient for quick scanning.
- **Type:** Bricolage Grotesque for headings, Figtree for body text.
- **Signature element:** the "ticket stub" date tile, and the live "Next on campus" ticket with countdown on the home page.
- Tokens are defined once in `src/index.css` (`@theme`) and used through Tailwind utilities.
