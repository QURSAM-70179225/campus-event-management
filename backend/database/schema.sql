-- Campus Event Management System — SQLite schema
-- Safe to run repeatedly (IF NOT EXISTS).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 100),
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 150),
  description TEXT    NOT NULL,
  date        TEXT    NOT NULL CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  time        TEXT    NOT NULL CHECK (time GLOB '[0-2][0-9]:[0-5][0-9]'),
  location    TEXT    NOT NULL,
  category    TEXT    NOT NULL CHECK (category IN (
                'Seminars', 'Workshops', 'Sports', 'Competitions',
                'Conferences', 'Student Society Activities')),
  capacity    INTEGER NOT NULL CHECK (capacity > 0),
  image_url   TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS registrations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  event_id          INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_date TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_events_date            ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category        ON events(category);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id  ON registrations(user_id);
