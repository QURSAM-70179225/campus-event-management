import { parseDate } from '../utils/format';

/** The tear-off "ticket stub" date: month, big day number, weekday. */
export default function DateTile({ date, size = 'md', className = '' }) {
  const d = parseDate(date);
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const sizes = {
    sm: { box: 'w-14', day: 'text-2xl', pad: 'py-1.5' },
    md: { box: 'w-16', day: 'text-3xl', pad: 'py-2' },
    lg: { box: 'w-20', day: 'text-4xl', pad: 'py-2.5' },
  }[size];

  return (
    <div
      className={`${sizes.box} shrink-0 overflow-hidden rounded-xl bg-white text-center shadow-soft ring-1 ring-line/80 ${className}`}
      aria-label={d.toDateString()}
    >
      <div className="bg-navy py-0.5 text-[11px] font-bold tracking-wide text-white">{month}</div>
      <div className={`${sizes.pad} border-b border-dashed border-line`}>
        <div className={`font-display font-bold leading-none text-ink ${sizes.day}`}>{d.getDate()}</div>
      </div>
      <div className="py-0.5 text-[11px] font-semibold text-muted">{weekday}</div>
    </div>
  );
}
