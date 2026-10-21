import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Users, Ticket, CalendarCheck2, LayoutGrid } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useAuth from '../hooks/useAuth';
import useCountdown from '../hooks/useCountdown';
import { eventService } from '../services/eventService';
import { getErrorMessage } from '../services/api';
import { CATEGORIES, getCategoryMeta } from '../utils/categories';
import { eventDateTime, formatLongDate, formatTime } from '../utils/format';
import EventCard from '../components/EventCard';
import DateTile from '../components/DateTile';
import CategoryBadge from '../components/CategoryBadge';
import SeatMeter from '../components/SeatMeter';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States';

/* ------------------------------ Hero ticket ------------------------------ */

function CountdownUnit({ value, label }) {
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-mist px-2 py-2 text-center">
      <div className="font-display text-2xl font-bold tabular-nums text-ink">{String(value).padStart(2, '0')}</div>
      <div className="text-[11px] font-medium text-muted">{label}</div>
    </div>
  );
}

function NextEventTicket({ event }) {
  const countdown = useCountdown(event ? eventDateTime(event) : null);
  const meta = event ? getCategoryMeta(event.category) : null;

  if (!event) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-lift">
        <CalendarDays className="mx-auto h-10 w-10 text-violet" aria-hidden />
        <p className="mt-3 font-display text-lg font-bold">No upcoming events yet</p>
        <p className="mt-1 text-sm text-muted">New events appear here as soon as they're published.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* The stub: a ticket split by a perforated line */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-lift">
        <div className="h-2" style={{ backgroundImage: `linear-gradient(90deg, ${meta.from}, ${meta.to})` }} />
        <div className="p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-violet">Next on campus</p>
            <CategoryBadge category={event.category} />
          </div>
          <div className="mt-4 flex gap-4">
            <DateTile date={event.date} size="lg" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">{event.title}</h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <Clock className="h-4 w-4 text-violet" aria-hidden /> {formatTime(event.time)} ·{' '}
                {formatLongDate(event.date)}
              </p>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet" aria-hidden /> {event.location}
              </p>
            </div>
          </div>
        </div>

        <div className="relative border-t-2 border-dashed border-line px-6 pt-5 pb-6">
          {/* notches at each end of the perforation */}
          <span aria-hidden className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-navy" />
          <span aria-hidden className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-violet" />
          {countdown && !countdown.done ? (
            <div className="flex gap-2" aria-label="Time until the event starts">
              <CountdownUnit value={countdown.days} label="days" />
              <CountdownUnit value={countdown.hours} label="hours" />
              <CountdownUnit value={countdown.minutes} label="min" />
              <CountdownUnit value={countdown.seconds} label="sec" />
            </div>
          ) : (
            <p className="text-sm font-semibold text-emerald-700">Happening today</p>
          )}
          <div className="mt-4">
            <SeatMeter capacity={event.capacity} available={event.available_seats} compact />
          </div>
          <Link to={`/events/${event.id}`} className="btn-primary mt-5 w-full">
            <Ticket className="h-4 w-4" aria-hidden /> Save my seat
          </Link>
        </div>
      </div>
    </div>
  );
}

function TicketSkeleton() {
  return <div className="h-[440px] animate-pulse rounded-3xl bg-white/20" aria-hidden />;
}

/* --------------------------------- Page --------------------------------- */

export default function Home() {
  const { user, isAdmin } = useAuth();
  const upcoming = useFetch(() => eventService.list({ when: 'upcoming', sort: 'date_asc', limit: 7 }));
  const popular = useFetch(() => eventService.list({ when: 'upcoming', sort: 'popular', limit: 3 }));
  const stats = useFetch(() => eventService.publicStats());

  const next = upcoming.data?.[0];
  const agenda = upcoming.data?.slice(1) ?? [];
  const categoryCounts = Object.fromEntries((stats.data?.categories ?? []).map((c) => [c.category, c.events]));

  const statItems = [
    { icon: CalendarCheck2, value: stats.data?.upcomingEvents, label: 'upcoming events' },
    { icon: Users, value: stats.data?.totalRegistrations, label: 'seats booked' },
    { icon: LayoutGrid, value: CATEGORIES.length, label: 'event categories' },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(60% 80% at 85% 10%, rgba(106,76,245,.55) 0%, transparent 60%), radial-gradient(50% 70% at 10% 100%, rgba(162,75,217,.35) 0%, transparent 60%), linear-gradient(160deg, #0E1A3A 0%, #1A2C6B 100%)',
          }}
        />
        <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-sm font-semibold text-white/70">The University of Lahore</p>
            <h1 className="mt-3 max-w-xl text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              Everything happening on campus, in one place.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/75">
              Find seminars, workshops, matches and society meetups — then register in one click and keep track of
              every seat you've booked.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/events" className="btn-light px-6 py-3 text-base">
                Explore events
              </Link>
              {user ? (
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/10"
                >
                  {isAdmin ? 'Manage events' : 'My registrations'}
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/10"
                >
                  Create a student account
                </Link>
              )}
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {statItems.map(({ icon: Icon, value, label }) => (
                <div key={label}>
                  <dt className="flex items-center gap-1.5 text-xs text-white/60">
                    <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                  </dt>
                  <dd className="mt-1 font-display text-3xl font-bold tabular-nums">
                    {stats.loading ? '—' : stats.error ? '–' : value ?? 0}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-md text-ink"
          >
            {upcoming.loading ? (
              <TicketSkeleton />
            ) : upcoming.error ? (
              <div className="rounded-3xl bg-white p-6 text-sm text-rose-700 shadow-lift" role="alert">
                {getErrorMessage(upcoming.error)}
              </div>
            ) : (
              <NextEventTicket event={next} />
            )}
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-page pt-16">
        <h2 className="text-3xl font-bold">Browse by category</h2>
        <p className="mt-2 text-muted">Pick what you're into and see everything coming up.</p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => {
            const meta = getCategoryMeta(category);
            const Icon = meta.icon;
            const count = categoryCounts[category] ?? 0;
            return (
              <Link
                key={category}
                to={`/events?category=${encodeURIComponent(category)}`}
                className="card group flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl text-white"
                  style={{ backgroundImage: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="mt-4 font-display font-bold leading-snug">{category}</span>
                <span className="mt-1 text-xs text-muted">{meta.blurb}</span>
                <span className={`mt-3 text-xs font-semibold ${meta.text}`}>
                  {stats.loading ? '…' : `${count} ${count === 1 ? 'event' : 'events'}`}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-page pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Filling up fast</h2>
            <p className="mt-2 text-muted">The upcoming events students are booking the most.</p>
          </div>
          <Link to="/events?sort=popular" className="btn-secondary">
            See all popular events
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {popular.loading ? (
            [0, 1, 2].map((i) => <CardSkeleton key={i} />)
          ) : popular.error ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <ErrorState message={getErrorMessage(popular.error)} onRetry={popular.refetch} />
            </div>
          ) : popular.data.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState icon={CalendarDays} title="No events yet" message="Check back soon — new events are added regularly." />
            </div>
          ) : (
            popular.data.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      </section>

      {/* UPCOMING AGENDA */}
      <section className="container-page pt-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-3xl font-bold">Coming up next</h2>
            <p className="mt-2 text-muted">The next few events on the university calendar, in date order.</p>
            <Link to="/events" className="btn-primary mt-6">
              View the full calendar
            </Link>
          </div>
          <div className="card divide-y divide-line overflow-hidden">
            {upcoming.loading &&
              [0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-5" aria-hidden>
                  <div className="h-16 w-14 animate-pulse rounded-xl bg-line/60" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-line/70" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-line/50" />
                  </div>
                </div>
              ))}
            {!upcoming.loading && !upcoming.error && agenda.length === 0 && (
              <p className="p-6 text-sm text-muted">
                {next ? 'That ticket above is the only upcoming event right now.' : 'No upcoming events have been published yet.'}
              </p>
            )}
            {upcoming.error && (
              <p className="p-6 text-sm text-rose-700" role="alert">
                {getErrorMessage(upcoming.error)}
              </p>
            )}
            {agenda.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="flex items-center gap-4 p-4 transition hover:bg-mist sm:p-5"
              >
                <DateTile date={event.date} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold">{event.title}</p>
                  <p className="mt-0.5 truncate text-sm text-muted">
                    {formatTime(event.time)} · {event.location}
                  </p>
                </div>
                <div className="hidden shrink-0 sm:block">
                  <CategoryBadge category={event.category} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SIGN-UP PROMPT */}
      {!user && (
        <section className="container-page pt-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-violet px-6 py-12 text-white sm:px-12">
            <div className="relative max-w-2xl">
              <h2 className="text-3xl font-bold text-white">Never miss an event you care about.</h2>
              <p className="mt-3 text-white/80">
                Create a free student account to register for events, cancel if your plans change, and see everything
                you've signed up for in your dashboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/signup" className="btn-light px-6 py-3">
                  Create a student account
                </Link>
                <Link to="/login" className="inline-flex items-center rounded-xl px-6 py-3 font-semibold ring-1 ring-white/40 hover:bg-white/10">
                  I already have an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
