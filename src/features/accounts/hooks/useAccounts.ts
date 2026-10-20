import { useEffect, useState } from 'react';
import { accountsApi, type Account, type AccountPage } from '../api/accountsApi';
export function useAccounts(page: number, search: string) {
  const [data, setData] = useState<AccountPage | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    accountsApi
      .list(page, search, controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, search, revision]);
  async function change(account: Account, reason: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await accountsApi.status(account.id, !account.isActive, reason);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return { data, error, loading, busy, change };
}
