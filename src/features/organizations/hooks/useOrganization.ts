import { useEffect, useRef, useState, type FormEvent } from 'react';
import { organizationsApi } from '../api/organizationsApi';
import type { Organization } from '../models/organization';
export function useOrganization(id: string | undefined) {
  const [item, setItem] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [reviewError, setReviewError] = useState<unknown>(null);
  const [success, setSuccess] = useState('');
  const version = useRef(0);
  useEffect(() => {
    const started = ++version.current;
    return () => {
      version.current = started + 1;
    };
  }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setSaving(false);
    setError(null);
    setItem(null);
    setDecision(null);
    setNote('');
    setReviewError(null);
    setSuccess('');
    organizationsApi
      .get(id || '', controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setItem(value);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) setError(failure);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, revision]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item || !decision || !note.trim() || saving || item.reviewStatus !== 'Pending') return;
    const started = version.current;
    setSaving(true);
    setReviewError(null);
    try {
      const updated = await organizationsApi.review(item.id, decision === 'approve', note.trim());
      if (version.current !== started) return;
      setItem(updated);
      setDecision(null);
      setNote('');
      setSuccess(
        updated.reviewStatus === 'Approved'
          ? 'Đã duyệt hồ sơ. Người nộp nhận quyền Owner; hồ sơ nộp thay dùng lời mời qua email.'
          : 'Đã từ chối hồ sơ và lưu ghi chú xét duyệt.',
      );
    } catch (failure) {
      if (version.current === started) setReviewError(failure);
    } finally {
      if (version.current === started) setSaving(false);
    }
  }

  return {
    item,
    loading,
    error,
    decision,
    setDecision,
    note,
    setNote,
    saving,
    reviewError,
    setReviewError,
    success,
    submit,
    reload: () => setRevision((value) => value + 1),
  };
}
