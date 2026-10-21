import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async loader and tracks { data, loading, error }.
 * Re-runs when `deps` change; `refetch()` runs it again on demand.
 * Responses from stale requests are ignored.
 */
export default function useFetch(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef
      .current()
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((error) => active && setState({ data: null, loading: false, error }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback(
    (updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })),
    []
  );

  return { ...state, refetch, setData };
}
