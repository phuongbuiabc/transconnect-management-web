import { useState } from 'react';
import { useAuth } from './useAuth';
import { authApi } from '../api/authApi';
export function useAccountSettings() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState('');
  async function run(action: () => Promise<unknown>, password = false) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      await action();
      if (password) {
        await auth.signOut();
      } else {
        await auth.restore();
        setNotice('Đã lưu thông tin.');
      }
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    notice,
    profile: (name: string, phone: string) => run(() => authApi.updateProfile(name, phone)),
    password: (current: string, next: string) =>
      run(() => authApi.changePassword(current, next), true),
    avatar: (file: File) => run(() => authApi.uploadAvatar(file)),
  };
}
