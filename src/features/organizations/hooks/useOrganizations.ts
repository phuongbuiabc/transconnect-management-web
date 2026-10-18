import { useEffect, useState } from 'react';
import { organizationsApi } from '../api/organizationsApi';
import type { Organization } from '../models/organization';
export function useOrganizations() {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    organizationsApi
      .list(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setItems(value);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  return { items, loading, error, reload: () => setRevision((value) => value + 1) };
}
