import { Link } from 'react-router-dom';
import { Globe, MapPin } from 'lucide-react';
import Logo from './Logo';
import { CATEGORIES } from '../utils/categories';

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white/75">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm">
            Seminars, workshops, matches and society meetups at The University of Lahore — find them and save your
            seat in one place.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orchid" aria-hidden /> 1-KM Defence Road, Lahore, Pakistan
            </li>
            <li className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-orchid" aria-hidden />
              <a href="https://uol.edu.pk" target="_blank" rel="noreferrer" className="hover:text-white">
                uol.edu.pk
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-white">Browse by category</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link to={`/events?category=${encodeURIComponent(c)}`} className="hover:text-white">
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-white">Your account</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/events" className="hover:text-white">All events</Link></li>
            <li><Link to="/signup" className="hover:text-white">Create a student account</Link></li>
            <li><Link to="/login" className="hover:text-white">Log in</Link></li>
            <li><Link to="/dashboard" className="hover:text-white">My registrations</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-white/50">
          © {new Date().getFullYear()} Campus Event Management System — an individual academic project for The
          University of Lahore.
        </p>
      </div>
    </footer>
  );
}
