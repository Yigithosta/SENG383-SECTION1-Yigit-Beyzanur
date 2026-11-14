import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './client.js';

/**
 * Loads one GET endpoint for a screen.
 *
 *   const { data, error, loading, reload } = useApi(`/api/children/${childId}/events`);
 *
 * The request is cancelled when the path changes or the screen closes.
 * Call reload() after a POST or DELETE to show the new list.
 */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, error: null, loading: true }));

    apiFetch(path, { signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ data: null, error, loading: false });
        }
      });

    return () => controller.abort();
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { ...state, reload };
}
