# REST API Reference

Base URL (local): `http://localhost:5000/api`

All requests and responses use JSON. Protected endpoints need the header:

```
Authorization: Bearer <token>
```

The token is returned by `/signup` and `/login` and is valid for 7 days by default.

## Error format

Every error response has the same shape:

```json
{
  "error": "Please fix the highlighted fields.",
  "details": { "email": "Enter a valid email address." }
}
```

`details` is present only for validation errors.

| Status | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation failed / malformed JSON / bad id |
| 401 | Not logged in, invalid or expired token, wrong credentials |
| 403 | Logged in but not allowed (wrong role or not the owner) |
| 404 | Event, registration or route not found |
| 409 | Conflict: duplicate email, already registered, event full, capacity below registrations |
| 413 | Request body too large (> 100 KB) |
| 429 | Too many login/signup attempts (20 per 15 minutes per IP) |
| 500 | Unexpected server error |

---

## Authentication

### POST /signup

Creates a **student** account. A `role` field in the body is ignored.

```json
{ "name": "Ayesha Khan", "email": "ayesha@student.uol.edu.pk", "password": "Student123", "confirmPassword": "Student123" }
```

Rules: name 2–100 chars · valid email · password 8–72 chars with at least one letter and one number · `confirmPassword` (optional) must match.

**201**
```json
{
  "message": "Account created successfully.",
  "token": "eyJhbGciOi...",
  "user": { "id": 2, "name": "Ayesha Khan", "email": "ayesha@student.uol.edu.pk", "role": "student", "created_at": "2026-10-21 09:15:02" }
}
```
Errors: **400** validation · **409** email already registered.

### POST /login

```json
{ "email": "ayesha@student.uol.edu.pk", "password": "Student123" }
```
**200** `{ "message": "Welcome back, Ayesha Khan!", "token": "...", "user": { ... } }`
Errors: **400** validation · **401** `Incorrect email or password.` (same message whether or not the email exists).

### GET /me 🔒

**200** `{ "user": { "id": 2, "name": "...", "email": "...", "role": "student", "created_at": "..." } }`

---

## Events

Every event object includes computed seat information:

```json
{
  "id": 7,
  "title": "Cybersecurity Essentials Workshop",
  "description": "Learn the fundamentals of securing web applications...",
  "date": "2026-11-04",
  "time": "11:00",
  "location": "Networking Lab, Faculty of Information Technology",
  "category": "Workshops",
  "capacity": 30,
  "image_url": null,
  "created_at": "2026-10-21 09:00:00",
  "registered_count": 12,
  "available_seats": 18
}
```

Categories: `Seminars`, `Workshops`, `Sports`, `Competitions`, `Conferences`, `Student Society Activities`.

### GET /events

| Query | Values | Default |
|---|---|---|
| `search` | text matched against title (case-insensitive) | – |
| `category` | one of the categories above | all |
| `when` | `upcoming`, `past`, `all` | `all` |
| `sort` | `date_asc`, `date_desc`, `popular`, `newest` | `date_asc` |
| `limit` | 1–100 | none |

Example: `GET /events?when=upcoming&category=Workshops&sort=date_asc`

**200** `{ "events": [ ... ], "count": 2 }` · **400** invalid category/sort/when/limit.

### GET /events/:id

Public. If a valid token is sent, the response also tells you whether you are registered.

**200**
```json
{
  "event": { "...": "...", "is_past": false },
  "registration": { "id": 5, "user_id": 2, "event_id": 7, "registration_date": "2026-10-21 09:30:11" },
  "is_registered": true
}
```
**400** id not a positive integer · **404** not found.

### POST /events 🔒 admin

```json
{
  "title": "Cloud Computing Workshop",
  "description": "Deploy a full-stack app to the cloud in one afternoon.",
  "date": "2026-12-01",
  "time": "13:00",
  "location": "Computer Lab 2",
  "category": "Workshops",
  "capacity": 40,
  "image_url": "https://example.com/cloud.jpg"
}
```
Rules: title 3–150 · description 10–5000 · `date` real date `YYYY-MM-DD` · `time` 24-hour `HH:MM` · location 2–200 · valid category · capacity integer 1–100000 · `image_url` optional http(s) URL.

**201** `{ "message": "Event created successfully.", "event": { ... } }` · **400** · **401** · **403**.

### PUT /events/:id 🔒 admin

Send only the fields to change, e.g. `{ "capacity": 60 }`.

**200** `{ "message": "Event updated successfully.", "event": { ... } }`
**409** `Capacity cannot be lower than the 12 students already registered.` · **400** · **404**.

### DELETE /events/:id 🔒 admin

Deletes the event and (by cascade) all its registrations.

**200** `{ "message": "\"Cloud Computing Workshop\" was deleted.", "removedRegistrations": 3 }` · **404**.

---

## Registrations

### POST /register 🔒 student

```json
{ "event_id": 7 }
```

Runs inside one database write transaction: checks the event exists and has not passed, that you are not already registered, and that a seat is free — then inserts.

**201**
```json
{
  "message": "You're registered for \"Cybersecurity Essentials Workshop\"!",
  "registration": { "id": 5, "event_id": 7, "event_title": "...", "student_email": "...", "...": "..." },
  "event": { "...": "...", "available_seats": 17 }
}
```
Errors: **400** missing id / event already happened · **403** admins cannot register · **404** event not found · **409** already registered or fully booked.

### GET /my-registrations 🔒

Your registrations, ordered by event date. `status` is `confirmed` (upcoming) or `attended` (event date passed).

**200** `{ "registrations": [ { "id": 5, "event_id": 7, "event_title": "...", "event_date": "2026-11-04", "event_time": "11:00", "event_location": "...", "event_category": "Workshops", "registration_date": "...", "status": "confirmed" } ], "count": 1 }`

### GET /registrations 🔒

Students get their own registrations (same as above). Admins get every registration, newest first; filter with `?event_id=7`.

### DELETE /registrations/:id 🔒

Students may cancel their own registrations for events that haven't happened yet; admins may cancel any.

**200** `{ "message": "Registration for \"...\" was cancelled.", "event": { "...": "...", "available_seats": 18 } }`
**403** not your registration · **404** not found · **400** past event.

---

## Admin

### GET /admin/stats 🔒 admin

```json
{
  "totalEvents": 12, "upcomingEvents": 10, "totalStudents": 45, "totalAdmins": 1,
  "totalRegistrations": 230, "totalCapacity": 2750, "occupancyRate": 8.4,
  "categories": [ { "category": "Workshops", "events": 2, "registrations": 41 } ],
  "popularEvents": [ { "...": "event" } ],
  "recentRegistrations": [ { "...": "registration with student and event details" } ]
}
```

### GET /admin/registrations 🔒 admin

Optional `?event_id=7`. **200** `{ "event": { ... } | null, "registrations": [ { "student_name": "...", "student_email": "...", "registration_date": "...", "...": "..." } ], "count": 12 }`

---

## Public utilities

| Endpoint | Response |
|---|---|
| `GET /stats` | `{ totalEvents, upcomingEvents, totalRegistrations, totalStudents, categories }` |
| `GET /categories` | `{ categories: [ ... ] }` |
| `GET /health` | `{ status: "ok", time: "..." }` |
