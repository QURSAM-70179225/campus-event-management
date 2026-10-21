import { Link } from 'react-router-dom';

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="UOL Campus Events home">
      <img src="/favicon.svg" alt="" className="h-9 w-9" />
      <span className="leading-tight">
        <span className={`block font-display text-[15px] font-bold ${light ? 'text-white' : 'text-ink'}`}>
          Campus Events
        </span>
        <span className={`block text-xs ${light ? 'text-white/70' : 'text-muted'}`}>The University of Lahore</span>
      </span>
    </Link>
  );
}
