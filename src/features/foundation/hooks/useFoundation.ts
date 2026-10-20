import { useEffect, useRef, useState } from 'react';
export function useFoundation<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    const started = ++generation.current;
    const controller = new AbortController();
    setData(null);
    setLoading(true);
    setError(null);
    setBusy(false);
    load(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      generation.current = started + 1;
    };
  }, [load, revision]);
  async function mutate(action: () => Promise<unknown>) {
    if (busy) return false;
    const started = generation.current;
    setBusy(true);
    setError(null);
    try {
      await action();
      if (generation.current === started) setRevision((value) => value + 1);
      return true;
    } catch (failure) {
      if (generation.current === started) setError(failure);
      return false;
    } finally {
      if (generation.current === started) setBusy(false);
    }
  }
  return { data, loading, error, busy, mutate, reload: () => setRevision((value) => value + 1) };
}
