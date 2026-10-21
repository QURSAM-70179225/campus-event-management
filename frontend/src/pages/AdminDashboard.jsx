import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CalendarClock,
  GraduationCap,
  Ticket,
  Gauge,
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  ExternalLink,
} from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useToast from '../hooks/useToast';
import useAuth from '../hooks/useAuth';
import { adminService } from '../services/adminService';
import { eventService } from '../services/eventService';
import { getErrorMessage } from '../services/api';
import { formatDate, formatTime, formatTimestamp, isPast, plural } from '../utils/format';
import { getCategoryMeta } from '../utils/categories';
import CategoryBadge from '../components/CategoryBadge';
import { ConfirmDialog } from '../components/Modal';
import { ErrorState, Spinner } from '../components/States';
import EventFormModal from '../components/admin/EventFormModal';
import AttendeesModal from '../components/admin/AttendeesModal';

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

function SeatsCell({ event }) {
  const pct = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));
  const full = event.available_seats <= 0;
  return (
    <div className="w-36">
      <p className="text-sm font-semibold tabular-nums">
        {event.registered_count} / {event.capacity}
        {full && <span className="ml-1.5 text-xs font-semibold text-rose-600">Full</span>}
      </p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mist">
        <div className={`h-full rounded-full ${full ? 'bg-rose-500' : 'bg-gradient-to-r from-navy to-violet'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const stats = useFetch(() => adminService.stats());
  const events = useFetch(() => eventService.list({ when: 'all', sort: 'date_desc' }));

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('upcoming');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [attendeesFor, setAttendeesFor] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (events.data ?? [])
      .filter((e) => (scope === 'all' ? true : scope === 'past' ? isPast(e) : !isPast(e)))
      .filter((e) => !q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q))
      .sort((a, b) => (scope === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  }, [events.data, query, scope]);

  const refreshAll = () => {
    events.refetch();
    stats.refetch();
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (event) => {
    setEditing(event);
    setFormOpen(true);
  };
  const onSaved = () => {
    setFormOpen(false);
    refreshAll();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await eventService.remove(toDelete.id);
      toast.success(
        res.removedRegistrations ? `${plural(res.removedRegistrations, 'registration')} removed with it.` : 'No students were registered.',
        res.message
      );
      setToDelete(null);
      refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the event.'));
    } finally {
      setDeleting(false);
    }
  };

  const s = stats.data;
  const dash = stats.loading && !s ? '–' : stats.error ? '!' : null;
  const maxCategory = Math.max(1, ...(s?.categories ?? []).map((c) => c.registrations));

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-violet">Admin dashboard</p>
          <h1 className="mt-1 text-4xl font-extrabold">Manage campus events</h1>
          <p className="mt-2 text-muted">Signed in as {user.name}. Create events, adjust capacity and see who's coming.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden /> New event
        </button>
      </header>

      {stats.error && (
        <div className="mt-6">
          <ErrorState message={getErrorMessage(stats.error)} onRetry={stats.refetch} />
        </div>
      )}

      <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5" aria-label="Overview statistics">
        <StatCard icon={CalendarDays} label="Total events" value={dash ?? s.totalEvents} />
        <StatCard icon={CalendarClock} label="Upcoming" value={dash ?? s.upcomingEvents} />
        <StatCard icon={GraduationCap} label="Students" value={dash ?? s.totalStudents} />
        <StatCard icon={Ticket} label="Registrations" value={dash ?? s.totalRegistrations} />
        <StatCard
          icon={Gauge}
          label="Seats filled"
          value={dash ?? `${s.occupancyRate}%`}
          note={s ? `of ${s.totalCapacity.toLocaleString()} total seats` : undefined}
        />
      </section>

      {/* Event management table */}
      <section className="card mt-8 overflow-hidden" aria-labelledby="manage-heading">
        <div className="flex flex-col gap-3 border-b border-line p-5 md:flex-row md:items-center md:justify-between">
          <h2 id="manage-heading" className="text-lg font-bold">
            Events
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex rounded-xl bg-mist p-1" role="tablist" aria-label="Which events to show">
              {['upcoming', 'past', 'all'].map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={scope === v}
                  onClick={() => setScope(v)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${
                    scope === v ? 'bg-white text-ink shadow-soft' : 'text-muted hover:text-ink'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <label htmlFor="admin-search" className="sr-only">
                Search events
              </label>
              <input
                id="admin-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title or venue"
                className="input py-2 pl-9 sm:w-64"
              />
            </div>
          </div>
        </div>

        {events.loading && !events.data ? (
          <div className="flex justify-center py-16 text-violet">
            <Spinner className="h-6 w-6" />
          </div>
        ) : events.error ? (
          <div className="p-5">
            <ErrorState message={getErrorMessage(events.error)} onRetry={events.refetch} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-violet" aria-hidden />
            <p className="mt-3 font-display text-lg font-bold">
              {events.data.length === 0 ? 'No events yet' : 'No events match'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {events.data.length === 0 ? 'Create the first event to open registrations.' : 'Try another search or switch tabs.'}
            </p>
            {events.data.length === 0 && (
              <button type="button" className="btn-primary mt-5" onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden /> New event
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-mist text-xs text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Event</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Date &amp; time</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Venue</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Registered / capacity</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((event) => (
                  <tr key={event.id} className="align-middle hover:bg-mist/60">
                    <td className="max-w-xs px-5 py-4">
                      <Link to={`/events/${event.id}`} className="group inline-flex items-center gap-1 font-semibold hover:text-violet">
                        <span className="line-clamp-1">{event.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100" aria-hidden />
                      </Link>
                      <div className="mt-1">
                        <CategoryBadge category={event.category} />
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-medium">{formatDate(event.date)}</p>
                      <p className="text-muted">
                        {formatTime(event.time)}
                        {isPast(event) && <span className="ml-2 chip bg-mist px-2 py-0.5 text-muted">Ended</span>}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-5 py-4 text-muted">
                      <span className="line-clamp-2">{event.location}</span>
                    </td>
                    <td className="px-5 py-4">
                      <SeatsCell event={event} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setAttendeesFor(event)}
                          className="btn-ghost px-2.5 py-1.5"
                          aria-label={`View students registered for ${event.title}`}
                        >
                          <Users className="h-4 w-4" aria-hidden /> Students
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          className="btn-ghost px-2.5 py-1.5"
                          aria-label={`Edit ${event.title}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setToDelete(event)}
                          className="btn-ghost px-2.5 py-1.5 text-rose-600 hover:bg-rose-50"
                          aria-label={`Delete ${event.title}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="text-lg font-bold">
            Latest registrations
          </h2>
          {stats.loading && !s ? (
            <div className="flex justify-center py-8 text-violet"><Spinner /></div>
          ) : !s || s.recentRegistrations.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Registrations will show up here as students sign up for events.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {s.recentRegistrations.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.student_name}</p>
                    <p className="truncate text-muted">{r.event_title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatTimestamp(r.registration_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5" aria-labelledby="cat-heading">
          <h2 id="cat-heading" className="text-lg font-bold">
            Registrations by category
          </h2>
          {stats.loading && !s ? (
            <div className="flex justify-center py-8 text-violet"><Spinner /></div>
          ) : !s || s.categories.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No events yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {s.categories.map((c) => {
                const meta = getCategoryMeta(c.category);
                return (
                  <li key={c.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{c.category}</span>
                      <span className="text-muted tabular-nums">
                        {plural(c.registrations, 'registration')}, {plural(c.events, 'event')}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mist">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(2, (c.registrations / maxCategory) * 100)}%`,
                          backgroundImage: `linear-gradient(90deg, ${meta.from}, ${meta.to})`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <EventFormModal open={formOpen} event={editing} onClose={() => setFormOpen(false)} onSaved={onSaved} />
      <AttendeesModal event={attendeesFor} onClose={() => setAttendeesFor(null)} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        title="Delete this event?"
        message={
          toDelete
            ? `“${toDelete.title}” will be removed permanently${
                toDelete.registered_count ? `, along with ${toDelete.registered_count} student registrations` : ''
              }. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete event"
      />
    </div>
  );
}
