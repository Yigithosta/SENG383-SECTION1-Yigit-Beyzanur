import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDemoData } from './api.js';

export function useDemoData() {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const controllerRef = useRef(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) => ({ ...prev, error: null, loading: true }));
    try {
      const data = await fetchDemoData(controller.signal);
      setState({ data, error: null, loading: false });
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({ data: null, error, loading: false });
      }
    }
  }, []);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { ...state, reload: load };
}
