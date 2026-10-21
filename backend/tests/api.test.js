/**
 * HTTP-level tests for the REST API. Starts the Express app on a random port
 * with an in-memory database and calls it with fetch (built into Node 18+).
 * Requires `npm install` (express, jsonwebtoken, bcryptjs, ...).
 */
process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, closeDatabase } = require('../database/db');
const { createApp } = require('../app');
const UserModel = require('../models/userModel');
const { hashPassword } = require('../utils/auth');
const { todayISO, addDays } = require('../utils/date');

let server;
let baseUrl;
const today = todayISO();

async function api(method, path, { body, token } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const eventPayload = (o = {}) => ({
  title: 'API Test Workshop',
  description: 'Workshop created by the API integration tests.',
  date: addDays(today, 7),
  time: '14:30',
  location: 'Computer Lab 1',
  category: 'Workshops',
  capacity: 2,
  ...o,
});

let adminToken;
let studentToken;
let student2Token;
let student3Token;
let eventId;

before(async () => {
  await initDatabase({ dbPath: ':memory:' });
  await UserModel.create({
    name: 'Test Admin',
    email: 'admin@uol.edu.pk',
    passwordHash: await hashPassword('Admin12345'),
    role: 'admin',
  });
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await closeDatabase();
});

describe('health & errors', () => {
  test('GET /api/health', async () => {
    const res = await api('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  test('unknown route returns 404 JSON', async () => {
    const res = await api('GET', '/does-not-exist');
    assert.equal(res.status, 404);
    assert.match(res.body.error, /Route not found/);
  });

  test('malformed JSON returns 400', async () => {
    const res = await api('POST', '/login', { body: '{"email": ' });
    assert.equal(res.status, 400);
  });
});

describe('authentication', () => {
  test('signup validates input', async () => {
    const res = await api('POST', '/signup', { body: { name: 'A', email: 'bad', password: '123' } });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.name && res.body.details.email && res.body.details.password);
  });

  test('signup creates a student and returns a token', async () => {
    const res = await api('POST', '/signup', {
      body: { name: 'Fatima Noor', email: 'fatima@uol.edu.pk', password: 'Student123', confirmPassword: 'Student123' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'student');
    assert.equal(res.body.user.password_hash, undefined);
    assert.ok(res.body.token);
    studentToken = res.body.token;
  });

  test('signup cannot self-assign admin role', async () => {
    const res = await api('POST', '/signup', {
      body: { name: 'Sneaky User', email: 'sneaky@uol.edu.pk', password: 'Student123', role: 'admin' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'student');
    student2Token = res.body.token;
  });

  test('duplicate email returns 409', async () => {
    const res = await api('POST', '/signup', {
      body: { name: 'Fatima Again', email: 'FATIMA@uol.edu.pk', password: 'Student123' },
    });
    assert.equal(res.status, 409);
  });

  test('login with wrong password returns 401', async () => {
    const res = await api('POST', '/login', { body: { email: 'fatima@uol.edu.pk', password: 'wrongpass1' } });
    assert.equal(res.status, 401);
  });

  test('login with unknown email returns 401 (same message)', async () => {
    const res = await api('POST', '/login', { body: { email: 'nobody@uol.edu.pk', password: 'whatever1' } });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Incorrect email or password.');
  });

  test('admin login returns admin role', async () => {
    const res = await api('POST', '/login', { body: { email: 'admin@uol.edu.pk', password: 'Admin12345' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.role, 'admin');
    adminToken = res.body.token;
  });

  test('GET /api/me requires a valid token', async () => {
    assert.equal((await api('GET', '/me')).status, 401);
    assert.equal((await api('GET', '/me', { token: 'not.a.jwt' })).status, 401);
    const res = await api('GET', '/me', { token: studentToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'fatima@uol.edu.pk');
  });
});

describe('events', () => {
  test('students cannot create events (403); anonymous gets 401', async () => {
    assert.equal((await api('POST', '/events', { body: eventPayload() })).status, 401);
    assert.equal((await api('POST', '/events', { body: eventPayload(), token: studentToken })).status, 403);
  });

  test('admin creates an event (POST)', async () => {
    const res = await api('POST', '/events', { body: eventPayload(), token: adminToken });
    assert.equal(res.status, 201);
    assert.equal(res.body.event.available_seats, 2);
    eventId = res.body.event.id;
  });

  test('event validation errors return 400 with details', async () => {
    const res = await api('POST', '/events', {
      body: eventPayload({ category: 'Parties', capacity: -1, date: 'tomorrow' }),
      token: adminToken,
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.details.category && res.body.details.capacity && res.body.details.date);
  });

  test('GET /api/events lists, searches and filters', async () => {
    await api('POST', '/events', {
      body: eventPayload({ title: 'Annual Sports Gala', category: 'Sports', capacity: 50, date: addDays(today, 2) }),
      token: adminToken,
    });
    const all = await api('GET', '/events');
    assert.equal(all.status, 200);
    assert.equal(all.body.count, 2);
    assert.equal(all.body.events[0].title, 'Annual Sports Gala', 'sorted by date ascending by default');

    const search = await api('GET', '/events?search=gala');
    assert.deepEqual(search.body.events.map((e) => e.title), ['Annual Sports Gala']);

    const filtered = await api('GET', '/events?category=Workshops');
    assert.deepEqual(filtered.body.events.map((e) => e.id), [eventId]);

    assert.equal((await api('GET', '/events?category=Nope')).status, 400);
    assert.equal((await api('GET', '/events?sort=random')).status, 400);
  });

  test('GET /api/events/:id returns details or 404/400', async () => {
    const res = await api('GET', `/events/${eventId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.event.title, 'API Test Workshop');
    assert.equal(res.body.is_registered, false);
    assert.equal((await api('GET', '/events/99999')).status, 404);
    assert.equal((await api('GET', '/events/abc')).status, 400);
  });

  test('admin updates an event (PUT, partial)', async () => {
    const res = await api('PUT', `/events/${eventId}`, { body: { title: 'API Test Workshop (Updated)' }, token: adminToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.event.title, 'API Test Workshop (Updated)');
    assert.equal(res.body.event.capacity, 2);
    assert.equal((await api('PUT', `/events/${eventId}`, { body: { title: 'x' }, token: studentToken })).status, 403);
  });
});

describe('registrations', () => {
  test('anonymous users cannot register (401)', async () => {
    assert.equal((await api('POST', '/register', { body: { event_id: eventId } })).status, 401);
  });

  test('admins cannot register as attendees (403)', async () => {
    assert.equal((await api('POST', '/register', { body: { event_id: eventId }, token: adminToken })).status, 403);
  });

  test('student registers and seats update', async () => {
    const res = await api('POST', '/register', { body: { event_id: eventId }, token: studentToken });
    assert.equal(res.status, 201);
    assert.equal(res.body.event.available_seats, 1);

    const detail = await api('GET', `/events/${eventId}`, { token: studentToken });
    assert.equal(detail.body.is_registered, true);
  });

  test('duplicate registration returns 409', async () => {
    const res = await api('POST', '/register', { body: { event_id: eventId }, token: studentToken });
    assert.equal(res.status, 409);
  });

  test('capacity is enforced', async () => {
    assert.equal((await api('POST', '/register', { body: { event_id: eventId }, token: student2Token })).status, 201);
    const s3 = await api('POST', '/signup', { body: { name: 'Third Student', email: 's3@uol.edu.pk', password: 'Student123' } });
    student3Token = s3.body.token;
    const full = await api('POST', '/register', { body: { event_id: eventId }, token: student3Token });
    assert.equal(full.status, 409);
    assert.match(full.body.error, /fully booked/);
  });

  test('capacity cannot be reduced below registrations', async () => {
    const res = await api('PUT', `/events/${eventId}`, { body: { capacity: 1 }, token: adminToken });
    assert.equal(res.status, 409);
  });

  test('missing or invalid event id', async () => {
    assert.equal((await api('POST', '/register', { body: {}, token: studentToken })).status, 400);
    assert.equal((await api('POST', '/register', { body: { event_id: 99999 }, token: studentToken })).status, 404);
  });

  test('GET /api/my-registrations and role-aware /api/registrations', async () => {
    const mine = await api('GET', '/my-registrations', { token: studentToken });
    assert.equal(mine.status, 200);
    assert.equal(mine.body.count, 1);
    assert.equal(mine.body.registrations[0].status, 'confirmed');

    const studentView = await api('GET', '/registrations', { token: studentToken });
    assert.equal(studentView.body.count, 1);

    const adminView = await api('GET', `/registrations?event_id=${eventId}`, { token: adminToken });
    assert.equal(adminView.body.count, 2);
  });

  test('students cannot cancel other students\' registrations', async () => {
    const theirs = await api('GET', '/my-registrations', { token: student2Token });
    const res = await api('DELETE', `/registrations/${theirs.body.registrations[0].id}`, { token: studentToken });
    assert.equal(res.status, 403);
  });

  test('student cancels own registration (DELETE) and seat is freed', async () => {
    const mine = await api('GET', '/my-registrations', { token: studentToken });
    const res = await api('DELETE', `/registrations/${mine.body.registrations[0].id}`, { token: studentToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.event.available_seats, 1);
    assert.equal((await api('POST', '/register', { body: { event_id: eventId }, token: student3Token })).status, 201);
  });
});

describe('admin', () => {
  test('admin endpoints reject students', async () => {
    assert.equal((await api('GET', '/admin/stats', { token: studentToken })).status, 403);
    assert.equal((await api('GET', '/admin/registrations', { token: studentToken })).status, 403);
    assert.equal((await api('GET', '/admin/stats')).status, 401);
  });

  test('GET /api/admin/stats', async () => {
    const res = await api('GET', '/admin/stats', { token: adminToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.totalEvents, 2);
    assert.equal(res.body.totalStudents, 3);
    assert.equal(res.body.totalRegistrations, 2);
    assert.ok(Array.isArray(res.body.categories));
  });

  test('GET /api/admin/registrations?event_id=', async () => {
    const res = await api('GET', `/admin/registrations?event_id=${eventId}`, { token: adminToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 2);
    assert.ok(res.body.registrations[0].student_email);
  });

  test('public stats', async () => {
    const res = await api('GET', '/stats');
    assert.equal(res.status, 200);
    assert.equal(res.body.totalEvents, 2);
  });

  test('admin deletes event (DELETE) and registrations cascade', async () => {
    const res = await api('DELETE', `/events/${eventId}`, { token: adminToken });
    assert.equal(res.status, 200);
    assert.equal(res.body.removedRegistrations, 2);
    assert.equal((await api('GET', `/events/${eventId}`)).status, 404);
    const stats = await api('GET', '/admin/stats', { token: adminToken });
    assert.equal(stats.body.totalRegistrations, 0);
  });
});
