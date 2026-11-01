import { useEffect, useRef, useState } from 'react';
import { locationsApi } from '../api/locationsApi';
import type { PlaceSearchResult } from '../models/location';

export function usePlaceSearch() {
  const [items, setItems] = useState<PlaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [searched, setSearched] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  function clear() {
    active.current?.abort();
    active.current = null;
    setItems([]);
    setError(null);
    setLoading(false);
    setSearched(false);
  }
  async function search(query: string) {
    active.current?.abort();
    const abort = new AbortController();
    active.current = abort;
    setLoading(true);
    setError(null);
    setItems([]);
    setSearched(false);
    try {
      const result = await locationsApi.searchPlaces(query.trim(), abort.signal);
      if (!abort.signal.aborted) {
        setItems(result);
        setSearched(true);
      }
    } catch (failure) {
      if (!abort.signal.aborted) setError(failure);
    } finally {
      if (!abort.signal.aborted) setLoading(false);
    }
  }
  return { items, loading, error, searched, search, clear };
}
