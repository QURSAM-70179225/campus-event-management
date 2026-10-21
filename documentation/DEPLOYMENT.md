# Free Deployment Guide

The whole stack can run on free plans:

| Part | Free host | Role |
|---|---|---|
| React frontend | **Vercel** (Hobby plan) | Serves the website |
| Express backend | **Render** (free web service) | Runs the REST API |
| SQLite database | **Turso** (free plan) | Hosted SQLite — keeps all data permanently |

```
Browser ──▶ Vercel (React) ──API calls──▶ Render (Express) ──HTTPS──▶ Turso (SQLite)
```

### Why Turso?

Render's free web services have an *ephemeral* filesystem: anything written to disk is erased whenever the service restarts, redeploys or goes to sleep. A SQLite **file** on Render would lose every account and registration. Turso hosts the same SQLite database in the cloud, so the data survives no matter what happens to the Render server.

The code chooses automatically:
- `TURSO_DATABASE_URL` **empty** → local file `backend/database/campus_events.db` (your laptop)
- `TURSO_DATABASE_URL` **set** → Turso (the deployed backend)

### Things to know about free plans

- The Render backend **sleeps after 15 minutes without visitors**. The next visit takes about a minute while it wakes up — the site shows a loading state, then works normally. **Open the site a minute before a demo.**
- Free plan limits change over time; check each provider's pricing page if something stops working.

You'll do the steps in this order: **Turso → load data from your laptop → GitHub → Render → Vercel → connect them.**

---

## Step 1 — Create the Turso database (≈5 min)

1. Go to <https://turso.tech> and sign up (signing in with GitHub is quickest). No credit card is needed for the free plan.
2. In the dashboard, **create a new database**. Name it e.g. `campus-events`, and pick the location closest to your users (for Lahore, choose a region in India/Asia if one is offered).
3. Open the database and copy its **URL**. It starts with `libsql://`, e.g. `libsql://campus-events-yourname.turso.io`.
4. **Create a token** for the database (look for *Create Token* / *Generate token* on the database page) with read & write access, and copy it. It is a long string — treat it like a password and never commit it.

## Step 2 — Create the tables, sample events and your admin (from your laptop)

Turso is just a database, so you set it up by pointing your local project at it once.

1. Open `backend\.env` and fill in:

   ```
   TURSO_DATABASE_URL=libsql://campus-events-yourname.turso.io
   TURSO_AUTH_TOKEN=paste-the-token-here
   ```

2. In PowerShell:

   ```powershell
   cd backend
   npm install            # installs the Turso client (@libsql/client)
   npm run db:reset       # creates the tables in Turso and adds the 12 sample events
   npm run create-admin   # your real admin account, stored in Turso
   ```

   Every command prints `📦 Using Turso database …` — that confirms it's talking to Turso, not your local file.

3. Optional check: `npm run dev`, open the site locally and log in as admin — you're now using the cloud database.

4. **When finished, empty those two lines again** (`TURSO_DATABASE_URL=` and `TURSO_AUTH_TOKEN=`) so day-to-day development uses your local file and you can't accidentally wipe the live data with `db:reset`.

> ⚠️ `npm run db:reset` deletes **all** data in whichever database is configured. Only run it against Turso when you mean to.

## Step 3 — Push to GitHub

Follow [GIT_WORKFLOW.md](GIT_WORKFLOW.md). Before pushing, make sure:

- [ ] `backend/package-lock.json` and `frontend/package-lock.json` **are** committed (Render's `npm ci` needs them)
- [ ] `backend/.env` and any `.db` files are **not** committed (`git status` must not list them)

## Step 4 — Deploy the backend on Render (free)

1. Sign up at <https://render.com> with GitHub.
2. **New → Web Service** → connect your repository, then set:

   | Setting | Value |
   |---|---|
   | Name | `campus-events-api` |
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm ci --omit=dev` |
   | Start Command | `npm start` |
   | Instance Type | **Free** |

   *(Alternatively **New → Blueprint** reads `render.yaml` from the repo and fills these in for you.)*

3. **Environment variables** (Environment tab):

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `22.14.0` |
   | `JWT_SECRET` | a new long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `TURSO_DATABASE_URL` | your `libsql://…` URL |
   | `TURSO_AUTH_TOKEN` | your Turso token |
   | `CLIENT_ORIGIN` | leave as `http://localhost:5173` for now — you'll update it in Step 6 |
   | `APP_TIMEZONE` | `Asia/Karachi` |
   | `SEED_SAMPLE_DATA` | `false` (data was already loaded in Step 2) |

4. **Create Web Service.** When the log shows `🚀 Campus Events API running` and `Database: Turso database …`, open
   `https://campus-events-api.onrender.com/api/health` (use your service's URL) — you should see `{"status":"ok", …}`.
   Also try `/api/events` — you should see your sample events.

## Step 5 — Deploy the frontend on Vercel (free)

1. Sign up at <https://vercel.com> with GitHub → **Add New → Project** → import the repository.
2. Set **Root Directory** to `frontend`. Vercel detects **Vite** (build `npm run build`, output `dist`).
3. Add the environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://campus-events-api.onrender.com/api` (your Render URL **+ `/api`**) |

4. **Deploy.** Copy the site URL, e.g. `https://uol-campus-events.vercel.app`.

`frontend/vercel.json` sends every path to `index.html`, so refreshing a page like `/events/3` works.

## Step 6 — Connect them

On Render → your service → **Environment** → set `CLIENT_ORIGIN` to your exact Vercel URL (https, **no trailing slash**) → **Save** (Render redeploys automatically).

If you later add a custom domain or Vercel gives you more URLs, list them comma-separated:
`https://uol-campus-events.vercel.app,https://events.example.com`

## Step 7 — Verify

Open the Vercel URL in Chrome with **F12 → Console** open:

- [ ] Home page shows events (first load may take ~1 minute if the backend was asleep)
- [ ] Sign up as a student, register for an event, refresh — the registration is still there
- [ ] Log in as your admin and create an event
- [ ] On Render, **Manual Deploy → Restart service**, wait, reload the site — **all data is still there** (this proves Turso is doing its job)
- [ ] No red errors in the Console

---

## Updating the live site

Push to the `main` branch on GitHub — Render and Vercel both redeploy automatically. Data in Turso is unaffected by deploys.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Site loads but shows "Cannot reach the server" | `VITE_API_URL` is wrong or missing `/api`. Fix it in Vercel → Settings → Environment Variables, then **Redeploy** (Vite bakes it in at build time). |
| Console shows a **CORS** error | `CLIENT_ORIGIN` on Render doesn't exactly match the Vercel URL (check https, spelling, no trailing `/`). |
| First request is very slow | Normal on the free plan — the backend was asleep. |
| Render log: `TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is missing` | Add the token variable on Render. |
| Render log mentions `401`, `unauthorized` or `token` from Turso | Token expired or wrong — create a new token in Turso and update `TURSO_AUTH_TOKEN`. |
| Render log: `no such table: events` | Step 2 wasn't run against Turso — run `npm run db:reset` locally with the Turso variables set. |
| Render build fails at `npm ci` | `package-lock.json` missing from GitHub — commit `backend/package-lock.json`. |
| Render log: `needs Node.js 22.13 or newer` | Set `NODE_VERSION` to `22.14.0` (or newer). |
| Refreshing a page on Vercel gives 404 | `frontend/vercel.json` wasn't deployed — make sure Root Directory is `frontend`. |
| Login works locally but not live | `JWT_SECRET` missing on Render, or you created the admin in your **local** database instead of Turso — redo Step 2. |
