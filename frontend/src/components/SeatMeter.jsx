/** Capacity bar: how full an event is, with a plain-language label. */
export default function SeatMeter({ capacity, available, compact = false }) {
  const taken = Math.max(0, capacity - available);
  const pct = capacity ? Math.min(100, Math.round((taken / capacity) * 100)) : 0;
  const full = available <= 0;
  const low = !full && available / capacity <= 0.15;

  const barColor = full ? 'bg-rose-500' : low ? 'bg-amber-500' : 'bg-gradient-to-r from-navy to-violet';
  const label = full ? 'Fully booked' : low ? `Only ${available} seats left` : `${available} of ${capacity} seats left`;

  return (
    <div>
      <div className={`flex items-center justify-between ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className={`font-semibold ${full ? 'text-rose-600' : low ? 'text-amber-700' : 'text-ink'}`}>{label}</span>
        {!compact && <span className="text-muted">{pct}% full</span>}
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={taken}
        aria-label={`${taken} of ${capacity} seats taken`}
      >
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
