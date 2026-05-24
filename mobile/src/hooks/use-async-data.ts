import { useCallback, useEffect, useRef, useState } from 'react';

type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean; // true only during the initial load (no data yet)
  refreshing: boolean; // true during a refetch when data already exists
  refetch: () => void;
};

/**
 * Runs an async fetcher, exposing loading/refreshing/error/data plus refetch().
 * Requests are aborted on unmount / refetch so we never set state on a gone screen.
 */
export function useAsyncData<T>(fetcher: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const dataRef = useRef<T | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const isInitial = dataRef.current === null;
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        dataRef.current = result;
        setData(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Something went wrong');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return { data, error, loading, refreshing, refetch };
}
