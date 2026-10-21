import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import CategoryVisual from './CategoryVisual';
import CategoryBadge from './CategoryBadge';
import DateTile from './DateTile';
import SeatMeter from './SeatMeter';
import { formatTime, isPast } from '../utils/format';

export default function EventCard({ event }) {
  const past = isPast(event);
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lift">
      <CategoryVisual event={event} className="h-36">
        <div className="absolute top-3 left-3">
          <CategoryBadge category={event.category} onDark />
        </div>
        {past && (
          <span className="chip absolute top-3 right-3 bg-ink/70 text-white">Ended</span>
        )}
      </CategoryVisual>

      <div className="relative flex flex-1 flex-col px-5 pb-5">
        <DateTile date={event.date} size="sm" className="-mt-8 mb-3" />
        <h3 className="text-lg font-bold">
          <Link
            to={`/events/${event.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none group-hover:text-navy-700"
          >
            {event.title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted">{event.description}</p>

        <dl className="mt-4 space-y-1.5 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-violet" aria-hidden />
            <dt className="sr-only">Time</dt>
            <dd>{formatTime(event.time)}</dd>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet" aria-hidden />
            <dt className="sr-only">Location</dt>
            <dd className="line-clamp-1">{event.location}</dd>
          </div>
        </dl>

        <div className="mt-auto pt-5">
          {past ? (
            <p className="text-sm text-muted">{event.registered_count} students attended</p>
          ) : (
            <SeatMeter capacity={event.capacity} available={event.available_seats} compact />
          )}
          <span className="btn-secondary mt-4 w-full group-hover:border-violet/40 group-hover:bg-violet-50">
            View details
          </span>
        </div>
      </div>
    </article>
  );
}
