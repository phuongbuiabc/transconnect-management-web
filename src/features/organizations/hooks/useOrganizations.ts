import { useEffect, useState } from 'react';
import { organizationsApi } from '../api/organizationsApi';
import type { Organization } from '../models/organization';
export function useOrganizations(page = 1, search = '', status = '') {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    organizationsApi
      .search(page, search, status, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) {
          setItems(value.items);
          setTotal(value.totalRecords);
          setTotalPages(value.totalPages);
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision, page, search, status]);

  return {
    items,
    total,
    totalPages,
    loading,
    error,
    reload: () => setRevision((value) => value + 1),
  };
}
