import { useEffect, useState } from 'react';
import { accountsApi, type Account, type AccountAudit } from '../api/accountsApi';
export function useAccountDetail(id: string) {
  const [data, setData] = useState<{
    account: Account;
    audit: AccountAudit[];
    totalPages: number;
  } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    Promise.all([
      accountsApi.detail(id, controller.signal),
      accountsApi.audit(id, page, controller.signal),
    ])
      .then(([account, audit]) => {
        if (!controller.signal.aborted)
          setData({ account, audit: audit.items, totalPages: audit.totalPages });
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      });
    return () => controller.abort();
  }, [id, page]);
  return { data, error, page, setPage };
}
