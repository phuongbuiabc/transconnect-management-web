import type { Invitation, Membership } from '../../foundation/models/foundation';
import type { Organization } from '../../organizations/models/organization';

/**
 * Where an Operator account stands in the partner onboarding flow.
 * Derived only from server data; the server still decides every permission.
 */
export type PartnerStage =
  | 'verify-email'
  | 'driver-account'
  | 'no-application'
  | 'pending'
  | 'rejected'
  | 'approved-awaiting-owner'
  | 'member';

export function isOpenInvitation(item: Invitation, now = new Date()) {
  return !item.acceptedAt && !item.revokedAt && new Date(item.expiresAt) > now;
}

export function invitationState(item: Invitation, now = new Date()) {
  if (item.acceptedAt) return 'Đã nhận';
  if (item.revokedAt) return 'Đã thu hồi';
  if (new Date(item.expiresAt) <= now) return 'Hết hạn';
  return 'Chờ nhận';
}

export const roleLabels: Record<string, string> = {
  OrganizationOwner: 'Chủ tổ chức (Owner)',
  Manager: 'Quản lý',
  Dispatcher: 'Điều phối',
  Driver: 'Tài xế',
};

export function roleLabel(role: string) {
  return roleLabels[role] || role;
}

/** The most relevant application decides the stage: Pending > Rejected > Approved. */
export function latestApplication(applications: Organization[]) {
  return (
    applications.find((item) => item.reviewStatus === 'Pending') ||
    applications.find((item) => item.reviewStatus === 'Rejected') ||
    applications.find((item) => item.reviewStatus === 'Approved') ||
    null
  );
}

export function partnerStage(input: {
  emailVerified: boolean;
  membership: Membership | null;
  driverId: string | null;
  applications: Organization[];
}): PartnerStage {
  if (!input.emailVerified) return 'verify-email';
  if (input.membership) return 'member';
  if (input.driverId) return 'driver-account';
  const application = latestApplication(input.applications);
  if (!application) return 'no-application';
  if (application.reviewStatus === 'Pending') return 'pending';
  if (application.reviewStatus === 'Rejected') return 'rejected';
  return 'approved-awaiting-owner';
}
