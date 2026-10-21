import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import Logo from './Logo';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-violet-50 text-violet' : 'text-ink/80 hover:bg-mist hover:text-ink'
  }`;

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.info('You have been logged out.');
    navigate('/');
  };

  const dashboardPath = isAdmin ? '/admin' : '/dashboard';
  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/events" className={linkClass}>
            Events
          </NavLink>
          {user && (
            <NavLink to={dashboardPath} className={linkClass}>
              {isAdmin ? 'Admin dashboard' : 'My dashboard'}
            </NavLink>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <div className="flex items-center gap-2 rounded-full bg-mist py-1 pr-3 pl-1">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-navy to-violet text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="max-w-36 truncate text-sm font-semibold">{user.name.split(' ')[0]}</span>
                {isAdmin && <span className="chip bg-violet-50 px-2 py-0.5 text-violet">Admin</span>}
              </div>
              <button type="button" onClick={handleLogout} className="btn-ghost px-3" aria-label="Log out">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn-ghost">
                Log in
              </NavLink>
              <NavLink to="/signup" className="btn-primary">
                Sign up
              </NavLink>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink hover:bg-mist md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/events" className={linkClass}>
              Events
            </NavLink>
            {user ? (
              <>
                <NavLink to={dashboardPath} className={linkClass}>
                  <span className="inline-flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> {isAdmin ? 'Admin dashboard' : 'My dashboard'}
                  </span>
                </NavLink>
                <p className="px-3 pt-2 text-xs text-muted">Signed in as {user.email}</p>
                <button type="button" onClick={handleLogout} className="btn-secondary mt-2">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <NavLink to="/login" className="btn-secondary">
                  Log in
                </NavLink>
                <NavLink to="/signup" className="btn-primary">
                  Sign up
                </NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
