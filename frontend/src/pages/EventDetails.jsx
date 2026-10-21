import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Tag,
  CalendarX2,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { eventService } from '../services/eventService';
import { registrationService } from '../services/registrationService';
import { getErrorMessage } from '../services/api';
import { formatLongDate, formatTime, formatTimestamp } from '../utils/format';
import CategoryVisual from '../components/CategoryVisual';
import CategoryBadge from '../components/CategoryBadge';
import SeatMeter from '../components/SeatMeter';
import { ConfirmDialog } from '../components/Modal';
import { EmptyState, ErrorState, PageLoader, Spinner } from '../components/States';

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium text-muted">{label}</dt>
        <dd className="font-semibold text-ink">{children}</dd>
      </div>
    </div>
  );
}

export default function EventDetails() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error, refetch, setData } = useFetch(() => eventService.get(id), [id, user?.id]);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (loading && !data) return <PageLoader label="Loading event…" />;

  if (error) {
    if (error.response?.status === 404 || error.response?.status === 400) {
      return (
        <div className="container-page py-16">
          <EmptyState
            icon={CalendarX2}
            title="Event not found"
            message="It may have been removed or the link is wrong."
            action={<Link to="/events" className="btn-primary">Browse all events</Link>}
          />
        </div>
      );
    }
    return (
      <div className="container-page py-16">
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      </div>
    );
  }

  const { event, registration } = data;
  const full = event.available_seats <= 0;

  const handleRegister = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setBusy(true);
    try {
      const res = await registrationService.register(event.id);
      setData({ event: { ...res.event, is_past: false }, registration: res.registration, is_registered: true });
      toast.success('It will appear in your dashboard.', res.message);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not complete your registration.'));
      refetch(); // seat count may have changed
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setBusy(true);
    try {
      const res = await registrationService.cancel(registration.id);
      setData({ event: { ...res.event, is_past: false }, registration: null, is_registered: false });
      toast.success(res.message);
      setConfirmCancel(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel your registration.'));
    } finally {
      setBusy(false);
    }
  };

  /* The registration panel has one clear state at a time. */
  let action;
  if (event.is_past) {
    action = (
      <div className="rounded-xl bg-mist p-4 text-sm text-muted">
        This event has ended. {registration ? 'You were registered for it.' : 'Registration is closed.'}
      </div>
    );
  } else if (isAdmin) {
    action = (
      <div className="rounded-xl bg-violet-50 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-violet">
          <ShieldCheck className="h-4 w-4" aria-hidden /> You're signed in as an admin
        </p>
        <p className="mt-1 text-muted">Admins manage events and attendees from the dashboard.</p>
        <Link to="/admin" className="btn-secondary mt-3 w-full">
          Open admin dashboard
        </Link>
      </div>
    );
  } else if (registration) {
    action = (
      <div>
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div className="text-sm">
            <p className="font-semibold text-emerald-800">You're registered</p>
            <p className="text-emerald-700">Registered on {formatTimestamp(registration.registration_date)}</p>
          </div>
        </div>
        <button type="button" className="btn-secondary mt-3 w-full" onClick={() => setConfirmCancel(true)} disabled={busy}>
          Cancel registration
        </button>
      </div>
    );
  } else if (full) {
    action = (
      <button type="button" className="btn-secondary w-full" disabled>
        Fully booked
      </button>
    );
  } else {
    action = (
      <button type="button" className="btn-primary w-full py-3 text-base" onClick={handleRegister} disabled={busy}>
        {busy ? <Spinner className="h-4 w-4" /> : user ? null : <LogIn className="h-4 w-4" aria-hidden />}
        {busy ? 'Registering…' : user ? 'Register for this event' : 'Log in to register'}
      </button>
    );
  }

  return (
    <div className="pb-6">
      <CategoryVisual event={event} className="h-64 sm:h-80" iconSize="h-56 w-56">
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <div className="container-page relative flex h-full flex-col justify-between py-6">
          <Link
            to="/events"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> All events
          </Link>
          <div>
            <CategoryBadge category={event.category} onDark full />
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-white sm:text-5xl">{event.title}</h1>
          </div>
        </div>
      </CategoryVisual>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <article className="card p-6 sm:p-8">
          <h2 className="text-2xl font-bold">About this event</h2>
          <p className="mt-4 max-w-[70ch] whitespace-pre-line text-ink/85">{event.description}</p>

          <dl className="mt-8 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
            <InfoRow icon={CalendarDays} label="Date">{formatLongDate(event.date)}</InfoRow>
            <InfoRow icon={Clock} label="Start time">{formatTime(event.time)}</InfoRow>
            <InfoRow icon={MapPin} label="Venue">{event.location}</InfoRow>
            <InfoRow icon={Tag} label="Category">{event.category}</InfoRow>
          </dl>
        </article>

        <aside className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start">
          <motion.div layout className="card p-6">
            <h2 className="text-lg font-bold">Registration</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-mist p-3">
                <dt className="flex items-center gap-1.5 text-muted">
                  <Users className="h-4 w-4" aria-hidden /> Capacity
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold">{event.capacity}</dd>
              </div>
              <div className="rounded-xl bg-mist p-3">
                <dt className="text-muted">Seats remaining</dt>
                <dd className={`mt-1 font-display text-2xl font-bold ${full ? 'text-rose-600' : ''}`}>
                  {Math.max(0, event.available_seats)}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <SeatMeter capacity={event.capacity} available={event.available_seats} />
            </div>
            <div className="mt-6">{action}</div>
            {!user && !event.is_past && (
              <p className="mt-3 text-center text-sm text-muted">
                New here?{' '}
                <Link to="/signup" state={{ from: location }} className="font-semibold text-violet hover:underline">
                  Create a student account
                </Link>
              </p>
            )}
          </motion.div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        busy={busy}
        title="Cancel your registration?"
        message={`Your seat at “${event.title}” will be released for another student. You can register again later if seats are still available.`}
        confirmLabel="Cancel registration"
      />
    </div>
  );
}
