import { useCallback, useState } from 'react';
import { organizationsApi } from '../../organizations/api/organizationsApi';
import type { Organization } from '../../organizations/models/organization';
import {
  draftFromOrganization,
  emptyDraft,
  parseDraft,
  submitPayload,
  type RegistrationDraft,
} from '../models/registration';

const storageKey = (accountId: string) => 'viego.partner-registration.' + accountId;

function readDraft(accountId: string | undefined) {
  if (!accountId) return null;
  try {
    return parseDraft(window.sessionStorage.getItem(storageKey(accountId)));
  } catch {
    return null;
  }
}

function writeDraft(accountId: string, draft: RegistrationDraft | null) {
  try {
    if (draft) window.sessionStorage.setItem(storageKey(accountId), JSON.stringify(draft));
    else window.sessionStorage.removeItem(storageKey(accountId));
  } catch {
    // Storage bị chặn: wizard vẫn chạy, chỉ mất bản nháp khi tải lại trang.
  }
}

/**
 * Bản nháp doanh nghiệp/dịch vụ theo tài khoản (sessionStorage, không có mật khẩu) và lệnh nộp hồ sơ.
 * Hồ sơ bị từ chối được điền sẵn từ dữ liệu server khi chưa có nháp cho đúng hồ sơ đó.
 */
export function useRegistration(
  accountId: string | undefined,
  rejected: Organization | null,
  onSubmitted: () => void,
) {
  // Mount sau khi dữ liệu partner đã tải: nháp chỉ dùng khi khớp hồ sơ đang cần nộp.
  const [draft, setDraftState] = useState<RegistrationDraft>(() => {
    const stored = readDraft(accountId);
    if (stored && stored.resubmitId === (rejected?.id ?? null)) return stored;
    return rejected ? draftFromOrganization(rejected) : emptyDraft;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [submitted, setSubmitted] = useState<Organization | null>(null);

  const update = useCallback(
    (patch: Partial<RegistrationDraft>) => {
      setDraftState((current) => {
        const next = { ...current, ...patch };
        if (accountId) writeDraft(accountId, next);
        return next;
      });
    },
    [accountId],
  );

  async function submit() {
    if (busy) return false;
    setBusy(true);
    setError(null);
    try {
      const saved = await organizationsApi.apply(submitPayload(draft), draft.resubmitId);
      if (accountId) writeDraft(accountId, null);
      setSubmitted(saved);
      onSubmitted();
      return true;
    } catch (failure) {
      setError(failure);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { draft, update, submit, busy, error, submitted };
}
