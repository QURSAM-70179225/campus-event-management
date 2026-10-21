import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted" role="status">
      <Spinner className="h-7 w-7 text-violet" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet">
          <Icon className="h-7 w-7" aria-hidden />
        </div>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center border-rose-200 px-6 py-12 text-center" role="alert">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>
      <h3 className="text-lg font-bold">Couldn't load this</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-5">
          <RefreshCw className="h-4 w-4" aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}

/** Grey placeholder blocks shown while event cards load. */
export function CardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="h-36 animate-pulse bg-line/60" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-line/70" />
        <div className="h-3 w-full animate-pulse rounded bg-line/50" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-line/50" />
        <div className="h-9 w-full animate-pulse rounded-xl bg-line/40" />
      </div>
    </div>
  );
}
