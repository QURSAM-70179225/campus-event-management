import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, X } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import { eventService } from '../services/eventService';
import { getErrorMessage } from '../services/api';
import { CATEGORIES, getCategoryMeta } from '../utils/categories';
import EventCard from '../components/EventCard';
import { CardSkeleton, EmptyState, ErrorState } from '../components/States';
import { plural } from '../utils/format';

const SORTS = [
  { value: 'date_asc', label: 'Soonest first' },
  { value: 'date_desc', label: 'Latest first' },
  { value: 'popular', label: 'Most popular' },
];

export default function Events() {
  const [params, setParams] = useSearchParams();
  const category = CATEGORIES.includes(params.get('category')) ? params.get('category') : '';
  const sort = SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'date_asc';
  const showPast = params.get('past') === '1';

  // The search box updates instantly; the URL and API call follow 300ms later.
  const [searchInput, setSearchInput] = useState(params.get('q') || '');
  const search = useDebounce(searchInput.trim(), 300);

  const updateParam = (key, value) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    if ((params.get('q') || '') !== search) updateParam('q', search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data: events, loading, error, refetch } = useFetch(
    () => eventService.list({ search, category, sort, when: showPast ? 'all' : 'upcoming' }),
    [search, category, sort, showPast]
  );

  const hasFilters = Boolean(search || category || showPast);
  const clearFilters = () => {
    setSearchInput('');
    setParams({}, { replace: true });
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-extrabold sm:text-5xl">University events</h1>
        <p className="mt-3 text-lg text-muted">
          Search the calendar, filter by category and register for anything with seats left.
        </p>
      </header>

      {/* Filters */}
      <div className="card mt-8 p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <label htmlFor="event-search" className="sr-only">
              Search events by title
            </label>
            <input
              id="event-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by event title…"
              className="input pl-10"
            />
          </div>
          <div className="flex gap-3">
            <label htmlFor="event-sort" className="sr-only">
              Sort events
            </label>
            <select
              id="event-sort"
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value === 'date_asc' ? '' : e.target.value)}
              className="input w-auto"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium whitespace-nowrap">
              <input
                type="checkbox"
                checked={showPast}
                onChange={(e) => updateParam('past', e.target.checked ? '1' : '')}
                className="h-4 w-4 accent-violet"
              />
              Include past
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => updateParam('category', '')}
            aria-pressed={!category}
            className={`chip shrink-0 px-3.5 py-2 text-sm transition ${
              !category ? 'bg-ink text-white' : 'bg-mist text-ink hover:bg-line/60'
            }`}
          >
            All categories
          </button>
          {CATEGORIES.map((c) => {
            const meta = getCategoryMeta(c);
            const Icon = meta.icon;
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => updateParam('category', active ? '' : c)}
                aria-pressed={active}
                className={`chip shrink-0 px-3.5 py-2 text-sm transition ${
                  active ? 'text-white' : `${meta.soft} ${meta.text} hover:brightness-95`
                }`}
                style={active ? { backgroundImage: `linear-gradient(135deg, ${meta.from}, ${meta.to})` } : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden /> {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 flex min-h-6 items-center justify-between gap-4" aria-live="polite">
        {!loading && !error && (
          <p className="text-sm text-muted">
            {plural(events.length, 'event')} {showPast ? 'found' : 'coming up'}
            {category && ` in ${category}`}
            {search && ` matching “${search}”`}
          </p>
        )}
        {hasFilters && (
          <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-sm font-semibold text-violet hover:underline">
            <X className="h-4 w-4" aria-hidden /> Clear filters
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)
        ) : error ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
          </div>
        ) : events.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={SearchX}
              title={hasFilters ? 'No events match these filters' : 'No upcoming events yet'}
              message={
                hasFilters
                  ? 'Try a different search term, pick another category or include past events.'
                  : 'New events will appear here as soon as the university publishes them.'
              }
              action={
                hasFilters && (
                  <button type="button" onClick={clearFilters} className="btn-secondary">
                    Clear filters
                  </button>
                )
              }
            />
          </div>
        ) : (
          events.map((event) => <EventCard key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
