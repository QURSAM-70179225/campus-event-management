# Testing

Three kinds of testing cover the project:

1. **Automated backend tests** — `npm test` in `backend/`
2. **API testing with Postman** — `documentation/postman_collection.json`
3. **Manual frontend testing** — the checklist below

---

## 1. Automated backend tests

```powershell
cd backend
npm install
npm test
```

Uses Node's built-in test runner (`node:test`) — no extra test framework. Each run uses a fresh **in-memory** database, so your real data is never touched.

### `tests/models.test.js` — database layer (21 tests)

| Area | What is checked |
|---|---|
| Schema | All three tables exist; foreign keys are enforced |
| Users | Insert/select; email lower-cased; unique email (case-insensitive); role CHECK; hash not exposed |
| Events | Create, read, update (partial), delete; column whitelist; invalid category/capacity rejected by DB; search, category, upcoming/past, sorting; `%` treated literally |
| Registrations | Seats decrease; duplicate rejected (409 + UNIQUE); capacity limit; 20 attempts on a 5-seat event → exactly 5 succeed; rollback leaves no open transaction; past/missing events; cancel frees a seat; cascades on event and user delete |
| Validation & seed | Signup and event validators; all 12 sample events valid |

This suite needs no npm packages and can run before `npm install`:

```powershell
npm run test:models
```

**Testing against Turso.** The same tests can run on Turso. Create a **separate throwaway database** for this, because the tests delete everything between cases. Never point it at your live database.

```powershell
$env:TEST_TURSO_DATABASE_URL="libsql://campus-events-test-yourname.turso.io"
$env:TEST_TURSO_AUTH_TOKEN="token-for-the-test-database"
npm run test:models
Remove-Item Env:TEST_TURSO_DATABASE_URL, Env:TEST_TURSO_AUTH_TOKEN
```

Two foreign-key tests are skipped in Turso mode, because enforcement there depends on the host's settings. The app doesn't rely on it.

### `tests/api.test.js` — HTTP endpoints (32 tests)

Starts the Express app on a random port and calls it with `fetch`.

| Area | What is checked |
|---|---|
| General | `/health`; unknown route → 404 JSON; malformed JSON → 400 |
| Auth | Signup validation (400); signup returns student + token; `role: admin` in body ignored; duplicate email 409; wrong password 401; unknown email 401 with same message; admin login; `/me` with no/invalid/valid token |
| Events | 401 anonymous / 403 student on create; admin POST 201; validation 400 with details; list, search, category filter, invalid query 400; details 200/404/400; PUT partial update; student PUT 403 |
| Registrations | Anonymous 401; admin 403; register 201 + seat update + `is_registered`; duplicate 409; full 409; capacity can't go below registrations (409); missing/unknown id; `/my-registrations`; role-aware `/registrations`; cancelling someone else's 403; cancel own frees the seat |
| Admin | Student 403 / anonymous 401; stats values; registrations by event; public stats; DELETE cascades registrations |

### Results recorded during development

These were run in the development sandbox on 21 Oct 2026 with Node v22.22.0. That sandbox could not download npm packages, so the conditions were:

| Check | Conditions | Result |
|---|---|---|
| `npm test` on the developer's Windows PC (Node 22) | Real packages | **53 / 53 passed** |
| Model tests in Turso mode | Stand-in for `@libsql/client` backed by a real SQLite file, separate connection per transaction (no network access to Turso from the sandbox) | 19 passed, 2 skipped (FK-specific), 0 failed |
| Full app in Turso mode | Same stand-in; reset, seed, create-admin, browser flows, Postman sequence | All flows worked; all 28 Postman requests returned the expected status |
| `tests/models.test.js` | Real code, no stand-ins (needs no npm packages) | **21 / 21 passed** |
| `tests/api.test.js` | Real app code; `express`, `jsonwebtoken`, `bcryptjs` and middleware replaced by minimal local stand-ins | 32 / 32 passed — **re-run with the real packages on your machine** |
| Postman collection (28 requests) | Run in order against the running server (same stand-ins) | 28 / 28 returned the expected status |
| Browser flows (headless Chromium) | Real React code bundled with esbuild; React Router, Lucide and Framer Motion replaced by stand-ins; Tailwind compiled with the real compiler | Signup, login, search, filter, register, cancel, admin create/edit/delete, attendee list, role redirects and mobile layout all worked with no console errors |

Because of the stand-ins, treat the API and browser results as strong evidence, not final proof. Run `npm test` and the manual checklist yourself after `npm install` and record the outcome below.

### Recording your results

Run the tests and paste the summary lines here, e.g.:

```
# tests 53
# pass 53
# fail 0
```

| Date | Node version | Tests | Passed | Failed | Notes |
|---|---|---|---|---|---|
| | | | | | |

---

## 2. Postman

1. Start the backend (`npm run dev` in `backend/`).
2. In Postman: **Import → File →** `documentation/postman_collection.json`.
3. The collection variable `baseUrl` is `http://localhost:5000/api`.
4. Run **Auth → Login (admin)** first — a test script saves the token into `adminToken`. Run **Auth → Signup (student)** or **Login (student)** to fill `studentToken`.
5. Run the remaining requests in order, or use **Run collection**.

Suggested manual checks in Postman:

| Request | Expected |
|---|---|
| Create event without token | 401 |
| Create event with student token | 403 |
| Create event with `capacity: 0` | 400 with `details.capacity` |
| Register twice for the same event | 201, then 409 |
| Register for a full event | 409 "fully booked" |
| PUT capacity below registrations | 409 |
| DELETE event, then GET it | 200, then 404 |

---

## 3. Manual frontend checklist

Run both apps, then work through this list. Tick each item and note anything unexpected.

### Navigation & layout
- [ ] Navbar links go to Home, Events, and (when logged in) the correct dashboard
- [ ] Active link is highlighted; unknown URL shows the "page doesn't exist" screen
- [ ] At 375 px width the menu button opens/closes the mobile menu; no sideways scrolling
- [ ] Tab through a page: focus outline is always visible

### Home
- [ ] "Next on campus" ticket shows the soonest event with a running countdown
- [ ] Statistics, category counts, "Filling up fast" and "Coming up next" load from the API
- [ ] Stop the backend and reload: friendly error messages appear instead of a crash

### Events page
- [ ] Events appear from the backend (not hard-coded)
- [ ] Typing in search filters by title (after a short pause)
- [ ] Category chips filter; "All categories" resets
- [ ] Sort: soonest first / latest first / most popular
- [ ] "Include past" shows ended events with an "Ended" label
- [ ] Filters with no results show the empty state with "Clear filters"
- [ ] Filters survive a page refresh (they're in the URL)

### Signup & login
- [ ] Empty signup shows field errors; mismatched passwords flagged; strength bar updates
- [ ] Signing up with an existing email shows "An account with this email already exists."
- [ ] Wrong password shows "Incorrect email or password."
- [ ] Student login → `/dashboard`; admin login → `/admin`
- [ ] Refreshing the page keeps you logged in; Log out works

### Registration
- [ ] Logged out → "Log in to register" → after login you return to the same event
- [ ] Register → success toast, "You're registered", seats remaining decreases by 1
- [ ] The event appears in the student dashboard under Upcoming
- [ ] Cancel (from event page or dashboard) → confirmation dialog → seat count increases
- [ ] A full event shows a disabled "Fully booked" button
- [ ] A student visiting `/admin` is redirected to `/dashboard`

### Admin dashboard
- [ ] Statistics match the data
- [ ] New event: empty form shows errors; valid form creates the event and it appears on the Events page
- [ ] Edit: change title and capacity; lowering capacity below registered students is blocked
- [ ] Students: shows registered students; Download CSV produces a file
- [ ] Delete: confirmation dialog; event disappears and its registrations are removed

### Responsive layouts
Check Home, Events, Event details and both dashboards at 375 px, 768 px and 1366 px (Chrome DevTools → device toolbar).
