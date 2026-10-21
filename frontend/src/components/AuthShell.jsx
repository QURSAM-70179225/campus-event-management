import { CalendarCheck2, Ticket, BellRing } from 'lucide-react';

const POINTS = [
  { icon: Ticket, text: 'Register for seminars, workshops and matches in one click' },
  { icon: CalendarCheck2, text: 'See every event you’ve booked in your dashboard' },
  { icon: BellRing, text: 'Cancel anytime to free your seat for someone else' },
];

/** Two-column layout shared by the login and signup pages. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="relative hidden h-full max-h-[640px] overflow-hidden rounded-3xl bg-ink p-10 text-white lg:flex lg:flex-col lg:justify-end">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(70% 60% at 80% 0%, rgba(106,76,245,.6), transparent 60%), radial-gradient(60% 60% at 0% 100%, rgba(162,75,217,.4), transparent 60%), linear-gradient(160deg,#0E1A3A,#1A2C6B)',
          }}
        />
        <div className="relative">
          <p className="font-display text-3xl leading-tight font-bold">Your seat at every UOL event, sorted.</p>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-white/85">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
