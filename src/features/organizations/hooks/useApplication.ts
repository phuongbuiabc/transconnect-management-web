import { useState } from 'react';
import { organizationsApi } from '../api/organizationsApi';
export function useApplication(reload: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  async function submit(
    name: string,
    registrationNumber: string,
    id?: string,
    ownerEmail?: string,
  ) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await organizationsApi.submit(name, registrationNumber, id, ownerEmail);
      reload();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  async function reinvite(id: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      await organizationsApi.reinviteOwner(id);
      setNotice('Đã tiếp nhận gửi lại lời mời Owner.');
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, notice, submit, reinvite };
}
