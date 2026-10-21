# Database Schema

Engine: **SQLite**. Schema file: [`backend/database/schema.sql`](../backend/database/schema.sql).

`backend/database/db.js` provides one promise-based API (`all`, `get`, `run`, `exec`, `transaction`) over two interchangeable backends:

| Mode | When | Driver |
|---|---|---|
| Local file | `TURSO_DATABASE_URL` empty (development, tests) | Node's built-in `node:sqlite` |
| Turso (hosted SQLite) | `TURSO_DATABASE_URL` set (free deployment) | `@libsql/client/web` over HTTPS |

Models never know which one is in use. Locally the app enables `PRAGMA foreign_keys = ON` (SQLite leaves it off by default), sets a 5-second `busy_timeout`, and uses WAL journal mode. Because the local connection is shared and transactions contain `await`, local operations are queued so another request's query can never slip into an open transaction.

## Entity-relationship diagram

```
┌─────────────────────┐        ┌───────────────────────┐        ┌─────────────────────┐
│ users               │        │ registrations         │        │ events              │
├─────────────────────┤        ├───────────────────────┤        ├─────────────────────┤
│ id            PK    │◀──┐    │ id               PK   │    ┌──▶│ id            PK    │
│ name                │   └────│ user_id          FK   │    │   │ title               │
│ email   UNIQUE      │        │ event_id         FK   │────┘   │ description         │
│ password_hash       │        │ registration_date     │        │ date   (YYYY-MM-DD) │
│ role (student|admin)│        │ UNIQUE(user_id,       │        │ time   (HH:MM)      │
│ created_at          │        │        event_id)      │        │ location            │
└─────────────────────┘        └───────────────────────┘        │ category            │
        1 ───────────────< many            many >─────────────1 │ capacity  (> 0)     │
                                                                │ image_url           │
                                                                │ created_at          │
                                                                └─────────────────────┘
```

A user has many registrations; an event has many registrations; each registration links exactly one user to one event (a many-to-many relationship between users and events).

## Tables

### users

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL, 2–100 characters (CHECK) |
| email | TEXT | NOT NULL, **UNIQUE**, case-insensitive (`COLLATE NOCASE`) |
| password_hash | TEXT | NOT NULL — bcrypt hash, never returned by the API |
| role | TEXT | NOT NULL DEFAULT `'student'`, CHECK in (`student`, `admin`) |
| created_at | TEXT | NOT NULL DEFAULT `datetime('now')` (UTC) |

### events

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| title | TEXT | NOT NULL, 3–150 characters |
| description | TEXT | NOT NULL |
| date | TEXT | NOT NULL, format `YYYY-MM-DD` (CHECK with GLOB) |
| time | TEXT | NOT NULL, format `HH:MM` |
| location | TEXT | NOT NULL |
| category | TEXT | NOT NULL, CHECK in the six categories |
| capacity | INTEGER | NOT NULL, CHECK `> 0` |
| image_url | TEXT | nullable |
| created_at | TEXT | NOT NULL DEFAULT `datetime('now')` |

Indexes: `idx_events_date`, `idx_events_category`.

### registrations

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK → `users(id)` **ON DELETE CASCADE** |
| event_id | INTEGER | NOT NULL, FK → `events(id)` **ON DELETE CASCADE** |
| registration_date | TEXT | NOT NULL DEFAULT `datetime('now')` |
| | | **UNIQUE (user_id, event_id)** |

Indexes: `idx_registrations_event_id`, `idx_registrations_user_id`.

## Derived values

`available_seats` is not stored; it is computed in every event query so it can never drift out of sync:

```sql
SELECT e.*, COUNT(r.id) AS registered_count, e.capacity - COUNT(r.id) AS available_seats
FROM events e LEFT JOIN registrations r ON r.event_id = e.id
GROUP BY e.id;
```

## Preventing duplicates and overbooking

`RegistrationModel.register()` (in `backend/models/registrationModel.js`) runs these steps inside `BEGIN IMMEDIATE … COMMIT`:

1. Event exists? → otherwise 404
2. Event date not in the past? → otherwise 400
3. Already registered? → otherwise 409
4. `COUNT(*) < capacity`? → otherwise 409 "fully booked"
5. `INSERT INTO registrations`

`BEGIN IMMEDIATE` (locally) or a Turso `write` transaction takes the write lock before the capacity check, so no other writer can insert between the check and the insert. Any failure triggers `ROLLBACK`. If Turso reports the database as busy because another write holds the lock, the whole transaction is retried after a short wait. The `UNIQUE(user_id, event_id)` constraint is a second line of defence for duplicates.

A test fires 20 registrations for a 5-seat event at the same moment and checks that exactly 5 succeed.

Deleting an event deletes its registrations in the same transaction. This matches `ON DELETE CASCADE` but doesn't depend on foreign-key enforcement settings on the host.

Updating an event's capacity below its current number of registrations is rejected with 409.

## Safe queries

All SQL uses prepared statements with `?` placeholders — user input is never concatenated into SQL. The only dynamic SQL pieces (sort order and updatable column names) are chosen from fixed whitelists in `eventModel.js`. `LIKE` search escapes `%` and `_`.

## Sample data

`backend/database/sampleEvents.js` defines 12 realistic University of Lahore events across all six categories. Dates are calculated relative to the day you seed (10 upcoming, 2 past), so the demo always has upcoming events. No user accounts are seeded.
