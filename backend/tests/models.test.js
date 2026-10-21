/**
 * Database / model-layer tests.
 *
 * By default they use an in-memory SQLite database (Node built-ins only).
 * To run the same tests against Turso, point them at a SEPARATE, throwaway
 * Turso database — every test wipes all tables:
 *   $env:TEST_TURSO_DATABASE_URL="libsql://campus-events-test-<you>.turso.io"
 *   $env:TEST_TURSO_AUTH_TOKEN="..."
 *   npm run test:models
 */
process.env.NODE_ENV = 'test';

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, closeDatabase, getDb } = require('../database/db');
const UserModel = require('../models/userModel');
const EventModel = require('../models/eventModel');
const RegistrationModel = require('../models/registrationModel');
const { buildSampleEvents } = require('../database/sampleEvents');
const { validateEvent, validateSignup } = require('../utils/validators');
const { todayISO, addDays } = require('../utils/date');

const today = todayISO();
const TARGET = process.env.TEST_TURSO_DATABASE_URL
  ? { url: process.env.TEST_TURSO_DATABASE_URL, authToken: process.env.TEST_TURSO_AUTH_TOKEN }
  : { dbPath: ':memory:' };

const baseEvent = (overrides = {}) => ({
  title: 'Test Seminar',
  description: 'A seminar used by the automated tests.',
  date: addDays(today, 10),
  time: '10:00',
  location: 'Main Auditorium',
  category: 'Seminars',
  capacity: 2,
  image_url: null,
  ...overrides,
});

let n = 0;
const makeStudent = () => UserModel.create({ name: `Student ${++n}`, email: `student${n}@uol.edu.pk`, passwordHash: 'x' });
const makeStudents = async (count) => {
  const list = [];
  for (let i = 0; i < count; i++) list.push(await makeStudent());
  return list;
};

before(async () => {
  await initDatabase(TARGET);
});
after(() => closeDatabase());
beforeEach(async () => {
  await getDb().exec('DELETE FROM registrations; DELETE FROM events; DELETE FROM users;');
});

describe('schema', () => {
  test('creates users, events and registrations tables', async () => {
    const tables = (await getDb().all("SELECT name FROM sqlite_master WHERE type='table'")).map((t) => t.name);
    for (const t of ['users', 'events', 'registrations']) assert.ok(tables.includes(t), `${t} table missing`);
  });

  test('foreign keys are enforced (local SQLite)', { skip: TARGET.url && 'FK enforcement depends on Turso settings' }, async () => {
    assert.equal((await getDb().get('PRAGMA foreign_keys')).foreign_keys, 1);
    await assert.rejects(
      getDb().run('INSERT INTO registrations (user_id, event_id) VALUES (999, 999)'),
      /FOREIGN KEY constraint failed/
    );
  });
});

describe('users', () => {
  test('insert and select', async () => {
    const u = await UserModel.create({ name: 'Ayesha Khan', email: 'Ayesha@UOL.edu.pk', passwordHash: 'hash' });
    assert.equal(u.email, 'ayesha@uol.edu.pk');
    assert.equal(u.role, 'student');
    assert.equal(u.password_hash, undefined, 'public user object must not expose the hash');
    assert.equal((await UserModel.findByEmailWithHash('ayesha@uol.edu.pk')).password_hash, 'hash');
    assert.equal(await UserModel.emailExists('AYESHA@uol.edu.pk'), true);
  });

  test('email is unique (case-insensitive)', async () => {
    await UserModel.create({ name: 'A User', email: 'dup@uol.edu.pk', passwordHash: 'x' });
    await assert.rejects(UserModel.create({ name: 'B User', email: 'DUP@uol.edu.pk', passwordHash: 'x' }), /UNIQUE/);
  });

  test('role is restricted to student/admin', async () => {
    await assert.rejects(UserModel.create({ name: 'Bad Role', email: 'r@uol.edu.pk', passwordHash: 'x', role: 'root' }), /CHECK/);
  });
});

describe('events CRUD', () => {
  test('create, read, update, delete', async () => {
    const e = await EventModel.create(baseEvent());
    assert.equal(e.title, 'Test Seminar');
    assert.equal(e.available_seats, 2);
    assert.equal(e.registered_count, 0);

    const updated = await EventModel.update(e.id, { title: 'Renamed Seminar', capacity: 5 });
    assert.equal(updated.title, 'Renamed Seminar');
    assert.equal(updated.capacity, 5);
    assert.equal(updated.location, 'Main Auditorium', 'unchanged fields are kept');

    assert.equal(await EventModel.delete(e.id), true);
    assert.equal(await EventModel.findById(e.id), null);
    assert.equal(await EventModel.delete(e.id), false);
  });

  test('update ignores columns that are not whitelisted', async () => {
    const e = await EventModel.create(baseEvent());
    await EventModel.update(e.id, { id: 999, created_at: 'hacked' });
    assert.ok(await EventModel.findById(e.id));
  });

  test('database rejects invalid category and capacity', async () => {
    await assert.rejects(EventModel.create(baseEvent({ category: 'Parties' })), /CHECK/);
    await assert.rejects(EventModel.create(baseEvent({ capacity: 0 })), /CHECK/);
  });

  test('search, category filter, upcoming/past and sorting', async () => {
    await EventModel.create(baseEvent({ title: 'Robotics Workshop', category: 'Workshops', date: addDays(today, 3) }));
    await EventModel.create(baseEvent({ title: 'Cricket Final', category: 'Sports', date: addDays(today, 1) }));
    await EventModel.create(baseEvent({ title: 'Old Workshop', category: 'Workshops', date: addDays(today, -5) }));

    assert.deepEqual((await EventModel.findAll({ search: 'robot' })).map((e) => e.title), ['Robotics Workshop']);
    assert.equal((await EventModel.findAll({ category: 'Workshops' })).length, 2);
    assert.equal((await EventModel.findAll({ when: 'upcoming', today })).length, 2);
    assert.deepEqual((await EventModel.findAll({ when: 'past', today })).map((e) => e.title), ['Old Workshop']);
    assert.deepEqual(
      (await EventModel.findAll({ sort: 'date_asc' })).map((e) => e.title),
      ['Old Workshop', 'Cricket Final', 'Robotics Workshop']
    );
    assert.equal((await EventModel.findAll({ sort: 'date_desc' }))[0].title, 'Robotics Workshop');
  });

  test('search treats % and _ literally', async () => {
    await EventModel.create(baseEvent({ title: '100% Attendance Drive' }));
    await EventModel.create(baseEvent({ title: 'Something else' }));
    assert.equal((await EventModel.findAll({ search: '%' })).length, 1);
  });
});

describe('registrations', () => {
  test('register updates available seats', async () => {
    const e = await EventModel.create(baseEvent({ capacity: 3 }));
    const s = await makeStudent();
    const r = await RegistrationModel.register(s.id, e.id, today);
    assert.equal(r.event_title, 'Test Seminar');
    assert.equal(r.student_email, s.email);
    assert.equal((await EventModel.findById(e.id)).available_seats, 2);
  });

  test('duplicate registration is rejected (409) and DB enforces unique pair', async () => {
    const e = await EventModel.create(baseEvent());
    const s = await makeStudent();
    await RegistrationModel.register(s.id, e.id, today);
    await assert.rejects(RegistrationModel.register(s.id, e.id, today), (err) => err.status === 409);
    await assert.rejects(getDb().run('INSERT INTO registrations (user_id, event_id) VALUES (?, ?)', [s.id, e.id]), /UNIQUE/);
    assert.equal(await RegistrationModel.countForEvent(e.id), 1);
  });

  test('capacity limit prevents overbooking', async () => {
    const e = await EventModel.create(baseEvent({ capacity: 2 }));
    const [a, b, c] = await makeStudents(3);
    await RegistrationModel.register(a.id, e.id, today);
    await RegistrationModel.register(b.id, e.id, today);
    await assert.rejects(
      RegistrationModel.register(c.id, e.id, today),
      (err) => err.status === 409 && /fully booked/.test(err.message)
    );
    assert.equal((await EventModel.findById(e.id)).available_seats, 0);
  });

  test('20 simultaneous registrations for 5 seats: exactly 5 succeed', async () => {
    const e = await EventModel.create(baseEvent({ capacity: 5 }));
    const students = await makeStudents(20);
    const results = await Promise.allSettled(students.map((s) => RegistrationModel.register(s.id, e.id, today)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const rejected = results.filter((r) => r.status === 'rejected');
    assert.equal(ok, 5);
    assert.ok(rejected.every((r) => r.reason.status === 409), 'every failure is a "fully booked" 409');
    assert.equal(await RegistrationModel.countForEvent(e.id), 5);
  });

  test('a failed registration rolls back and the database keeps working', async () => {
    const e = await EventModel.create(baseEvent({ capacity: 1 }));
    const [a, b] = await makeStudents(2);
    await RegistrationModel.register(a.id, e.id, today);
    await assert.rejects(RegistrationModel.register(b.id, e.id, today));
    // If a transaction were left open this would fail
    const e2 = await EventModel.create(baseEvent());
    assert.ok(await RegistrationModel.register(b.id, e2.id, today));
  });

  test('past events and missing events cannot be registered', async () => {
    const past = await EventModel.create(baseEvent({ date: addDays(today, -1) }));
    const s = await makeStudent();
    await assert.rejects(RegistrationModel.register(s.id, past.id, today), (err) => err.status === 400);
    await assert.rejects(RegistrationModel.register(s.id, 424242, today), (err) => err.status === 404);
  });

  test('cancelling frees a seat; deleting an event removes its registrations', async () => {
    const e = await EventModel.create(baseEvent({ capacity: 1 }));
    const [a, b] = await makeStudents(2);
    const r = await RegistrationModel.register(a.id, e.id, today);
    assert.equal(await RegistrationModel.delete(r.id), true);
    assert.ok(await RegistrationModel.register(b.id, e.id, today), 'seat was freed');

    await EventModel.delete(e.id);
    assert.equal(await RegistrationModel.count(), 0, 'registrations removed with the event');
  });

  test('deleting a user cascades to their registrations (local SQLite)', { skip: TARGET.url && 'FK enforcement depends on Turso settings' }, async () => {
    const e = await EventModel.create(baseEvent());
    const s = await makeStudent();
    await RegistrationModel.register(s.id, e.id, today);
    await getDb().run('DELETE FROM users WHERE id = ?', [s.id]);
    assert.equal(await RegistrationModel.count(), 0);
  });
});

describe('validators and seed data', () => {
  test('signup validation', () => {
    assert.deepEqual(
      validateSignup({ name: 'Ali Raza', email: 'ali@uol.edu.pk', password: 'secret123', confirmPassword: 'secret123' }).errors,
      {}
    );
    const { errors } = validateSignup({ name: 'A', email: 'nope', password: 'short', confirmPassword: 'x' });
    assert.deepEqual(Object.keys(errors).sort(), ['confirmPassword', 'email', 'name', 'password']);
  });

  test('event validation (full and partial)', () => {
    assert.deepEqual(validateEvent(baseEvent()).errors, {});
    const bad = validateEvent({ ...baseEvent(), date: '2026-02-30', time: '25:00', image_url: 'javascript:alert(1)' });
    assert.ok(bad.errors.date && bad.errors.time && bad.errors.image_url);
    assert.deepEqual(validateEvent({ capacity: 10 }, { partial: true }).errors, {});
    assert.ok(validateEvent({}, { partial: true }).errors._);
  });

  test('every sample event is valid and inserts cleanly', async () => {
    const events = buildSampleEvents(today);
    assert.ok(events.length >= 10);
    for (const e of events) {
      assert.deepEqual(validateEvent(e).errors, {}, `invalid sample: ${e.title}`);
      await EventModel.create(e);
    }
    assert.equal(await EventModel.count(), events.length);
    assert.ok((await EventModel.countUpcoming(today)) >= 8);
  });
});
