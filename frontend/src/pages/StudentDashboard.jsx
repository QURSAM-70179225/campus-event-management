import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck2, CalendarPlus, History, Mail, MapPin, Clock, UserRound, CalendarDays } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import useFetch from '../hooks/useFetch';
import { registrationService } from '../services/registrationService';
import { eventService } from '../services/eventService';
import { getErrorMessage } from '../services/api';
import { formatTime, formatTimestamp, plural } from '../utils/format';
import DateTile from '../components/DateTile';
import CategoryBadge from '../components/CategoryBadge';
import EventCard from '../components/EventCard';
import { ConfirmDialog } from '../components/Modal';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States';

function StatusBadge({ status }) {
  return status === 'confirmed' ? (
    <span className="chip bg-emerald-50 text-emerald-700">Confirmed</span>
  ) : (
    <span className="chip bg-mist text-muted">Event ended</span>
  );
}

function RegistrationRow({ reg, onCancel }) {
  return (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <DateTile date={reg.event_date} size="sm" />
        <div className="min-w-0">
          <Link to={`/events/${reg.event_id}`} className="font-display font-bold hover:text-violet">
            {reg.event_title}
          </Link>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {formatTime(reg.event_time)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {reg.event_location}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">Registered {formatTimestamp(reg.registration_date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <CategoryBadge category={reg.event_category} />
        <StatusBadge status={reg.status} />
        {reg.status === 'confirmed' && (
          <button type="button" onClick={() => onCancel(reg)} className="btn-ghost px-3 py-1.5 text-rose-600 hover:bg-rose-50">
            Cancel
          </button>
        )}
      </div>
    </li>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('upcoming');
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const regs = useFetch(() => registrationService.mine());
  const upcomingEvents = useFetch(() => eventService.list({ when: 'upcoming', sort: 'date_asc', limit: 12 }));

  const list = regs.data ?? [];
  const confirmed = list.filter((r) => r.status === 'confirmed');
  const attended = list.filter((r) => r.status === 'attended');
  const shown = tab === 'upcoming' ? confirmed : [...list].sort((a, b) => b.registration_date.localeCompare(a.registration_date));

  // Suggest upcoming events the student hasn't joined yet and that still have seats.
  const suggestions = useMemo(() => {
    const joined = new Set(list.map((r) => r.event_id));
    return (upcomingEvents.data ?? []).filter((e) => !joined.has(e.id) && e.available_seats > 0).slice(0, 3);
  }, [list, upcomingEvents.data]);

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      const res = await registrationService.cancel(toCancel.id);
      regs.setData((prev) => prev.filter((r) => r.id !== toCancel.id));
      upcomingEvents.refetch();
      toast.success(res.message);
      setToCancel(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel this registration.'));
    } finally {
      setCancelling(false);
    }
  };

  const firstName = user.name.split(' ')[0];

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-violet">Student dashboard</p>
          <h1 className="mt-1 text-4xl font-extrabold">Hi {firstName}, here's your schedule</h1>
          <p className="mt-2 text-muted">
            {regs.loading
              ? 'Loading your registrations…'
              : confirmed.length
                ? `You're registered for ${plural(confirmed.length, 'upcoming event')}.`
                : "You haven't registered for any upcoming events yet."}
          </p>
        </div>
        <Link to="/events" className="btn-primary">
          <CalendarPlus className="h-4 w-4" aria-hidden /> Find events
        </Link>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card overflow-hidden" aria-labelledby="regs-heading">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 id="regs-heading" className="text-lg font-bold">
              My registrations
            </h2>
            <div className="flex rounded-xl bg-mist p-1" role="tablist" aria-label="Registration view">
              {[
                { id: 'upcoming', label: `Upcoming (${confirmed.length})`, icon: CalendarCheck2 },
                { id: 'history', label: `History (${list.length})`, icon: History },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    tab === id ? 'bg-white text-ink shadow-soft' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden /> {label}
                </button>
              ))}
            </div>
          </div>

          {regs.loading ? (
            <ul className="divide-y divide-line" aria-hidden>
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex gap-4 p-5">
                  <div className="h-16 w-14 animate-pulse rounded-xl bg-line/60" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-1/2 animate-pulse rounded bg-line/70" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-line/50" />
                  </div>
                </li>
              ))}
            </ul>
          ) : regs.error ? (
            <div className="p-5">
              <ErrorState message={getErrorMessage(regs.error)} onRetry={regs.refetch} />
            </div>
          ) : shown.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-violet" aria-hidden />
              <p className="mt-3 font-display text-lg font-bold">
                {tab === 'upcoming' ? 'No upcoming registrations' : 'No registration history yet'}
              </p>
              <p className="mt-1 text-sm text-muted">Browse the calendar and register for something that interests you.</p>
              <Link to="/events" className="btn-secondary mt-5">
                Browse events
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((reg) => (
                <RegistrationRow key={reg.id} reg={reg} onCancel={setToCancel} />
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <section className="card p-5" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="text-lg font-bold">
              Profile
            </h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-navy to-violet text-lg font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="text-sm text-muted capitalize">{user.role}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted">
                <Mail className="h-4 w-4" aria-hidden />
                <dt className="sr-only">Email</dt>
                <dd className="truncate text-ink">{user.email}</dd>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <UserRound className="h-4 w-4" aria-hidden />
                <dt className="sr-only">Member since</dt>
                <dd>Member since {formatTimestamp(user.created_at).split(',')[0]}</dd>
              </div>
            </dl>
          </section>

          <section className="card grid grid-cols-2 gap-3 p-5" aria-label="Your numbers">
            <div className="rounded-xl bg-violet-50 p-3">
              <p className="font-display text-3xl font-bold text-violet">{regs.loading ? '–' : confirmed.length}</p>
              <p className="text-xs font-medium text-muted">upcoming</p>
            </div>
            <div className="rounded-xl bg-mist p-3">
              <p className="font-display text-3xl font-bold">{regs.loading ? '–' : attended.length}</p>
              <p className="text-xs font-medium text-muted">attended</p>
            </div>
          </section>
        </aside>
      </div>

      <section className="mt-14" aria-labelledby="suggest-heading">
        <h2 id="suggest-heading" className="text-2xl font-bold">
          Upcoming events you might like
        </h2>
        <p className="mt-1 text-muted">Events with seats still available that you haven't joined.</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.loading || regs.loading ? (
            [0, 1, 2].map((i) => <CardSkeleton key={i} />)
          ) : upcomingEvents.error ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <ErrorState message={getErrorMessage(upcomingEvents.error)} onRetry={upcomingEvents.refetch} />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={CalendarCheck2}
                title="You're all caught up"
                message="You've registered for every upcoming event with open seats."
              />
            </div>
          ) : (
            suggestions.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(toCancel)}
        onClose={() => setToCancel(null)}
        onConfirm={confirmCancel}
        busy={cancelling}
        title="Cancel this registration?"
        message={toCancel ? `Your seat at “${toCancel.event_title}” will be released for another student.` : ''}
        confirmLabel="Cancel registration"
      />
    </div>
  );
}
