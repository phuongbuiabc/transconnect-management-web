import { useEffect, useRef, useState } from 'react';
export function useLocations<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const current = ++generation.current;
    const abort = new AbortController();
    setLoading(true);
    setData(null);
    setError(null);
    setBusy(false);
    load(abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setData(value);
      })
      .catch((failure) => {
        if (!abort.signal.aborted) setError(failure);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => {
      abort.abort();
      generation.current = current + 1;
    };
  }, [load, revision]);
  async function mutate(action: () => Promise<unknown>) {
    if (busy) return false;
    const current = generation.current;
    setBusy(true);
    setError(null);
    try {
      await action();
      if (current !== generation.current) return false;
      setRevision((v) => v + 1);
      return true;
    } catch (failure) {
      if (current === generation.current) setError(failure);
      return false;
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  return { data, loading, error, busy, mutate, reload: () => setRevision((v) => v + 1) };
}
