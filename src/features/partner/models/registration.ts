import type { Organization } from '../../organizations/models/organization';
import { latestApplication, type PartnerStage } from './partnerStage';

/**
 * Wizard đăng ký đối tác (PARTNER-REG-01, Q-PARTNER-REG-D1 B/D2/D3).
 * Bước suy từ dữ liệu server; phần nhập liệu doanh nghiệp/dịch vụ chỉ là nháp phía trình duyệt.
 */
export type RegistrationStep =
  'account' | 'verify' | 'organization' | 'services' | 'review' | 'submitted' | 'leave';

export const registrationSteps = [
  'Tài khoản',
  'Xác thực email',
  'Doanh nghiệp',
  'Dịch vụ',
  'Xem lại & nộp',
] as const;

export const stepNumber: Record<RegistrationStep, number> = {
  account: 0,
  verify: 1,
  organization: 2,
  services: 3,
  review: 4,
  submitted: 5,
  leave: 5,
};

export const legalEntityOptions = [
  { value: 'Enterprise', label: 'Doanh nghiệp' },
  { value: 'Cooperative', label: 'Hợp tác xã' },
  { value: 'HouseholdBusiness', label: 'Hộ kinh doanh' },
] as const;

export function legalEntityLabel(value: string) {
  return legalEntityOptions.find((item) => item.value === value)?.label ?? value;
}

export interface RegistrationDraft {
  /** Id hồ sơ bị từ chối đang được nộp lại; null = hồ sơ mới. */
  resubmitId: string | null;
  name: string;
  registrationNumber: string;
  legalEntityType: string;
  registeredAddress: string;
  contactPhone: string;
  contactEmail: string;
  requestedServiceTypes: string[];
}

export const emptyDraft: RegistrationDraft = {
  resubmitId: null,
  name: '',
  registrationNumber: '',
  legalEntityType: '',
  registeredAddress: '',
  contactPhone: '',
  contactEmail: '',
  requestedServiceTypes: [],
};

export function draftFromOrganization(org: Organization): RegistrationDraft {
  return {
    resubmitId: org.id,
    name: org.name,
    registrationNumber: org.registrationNumber,
    legalEntityType: org.legalEntityType ?? '',
    registeredAddress: org.registeredAddress ?? '',
    contactPhone: org.contactPhone ?? '',
    contactEmail: org.contactEmail ?? '',
    requestedServiceTypes: org.requestedServiceTypes ?? [],
  };
}

/**
 * Bước phải hiển thị theo trạng thái server. `local` là bước người dùng đang đứng trong phần nhập liệu
 * (doanh nghiệp/dịch vụ/xem lại); server chỉ quyết định có được ở phần đó hay không.
 */
export function registrationStep(input: {
  signedIn: boolean;
  emailVerified: boolean;
  stage: PartnerStage | null;
  local: 'organization' | 'services' | 'review';
  justSubmitted: boolean;
}): RegistrationStep {
  if (!input.signedIn) return 'account';
  if (!input.emailVerified) return 'verify';
  if (input.justSubmitted || input.stage === 'pending') return 'submitted';
  if (input.stage === 'no-application' || input.stage === 'rejected') return input.local;
  // member, driver-account, approved-awaiting-owner hoặc chưa tải: không còn việc đăng ký ở đây.
  return input.stage === null ? 'organization' : 'leave';
}

export function rejectedApplication(applications: Organization[]) {
  const latest = latestApplication(applications);
  return latest?.reviewStatus === 'Rejected' ? latest : null;
}

export type FieldErrors = Partial<Record<keyof RegistrationDraft, string>>;

const phonePattern = /^[+0-9 ()-]{6,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Cùng quy tắc với Backend; trường hồ sơ bổ sung là tùy chọn nhưng nếu nhập phải hợp lệ. */
export function validateOrganization(draft: RegistrationDraft): FieldErrors {
  const errors: FieldErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Vui lòng nhập tên tổ chức.';
  else if (name.length > 200) errors.name = 'Tên tối đa 200 ký tự.';
  if (!/^(?:[0-9]{10}|[0-9]{13})$/.test(draft.registrationNumber.trim()))
    errors.registrationNumber = 'Mã số thuế phải gồm 10 hoặc 13 chữ số.';
  if (draft.registeredAddress.trim().length > 500)
    errors.registeredAddress = 'Địa chỉ tối đa 500 ký tự.';
  const phone = draft.contactPhone.trim();
  if (phone && !phonePattern.test(phone)) errors.contactPhone = 'Số liên hệ không hợp lệ.';
  const email = draft.contactEmail.trim();
  if (email && (email.length > 256 || !emailPattern.test(email)))
    errors.contactEmail = 'Email không hợp lệ.';
  return errors;
}

export function validateServices(draft: RegistrationDraft): FieldErrors {
  return draft.requestedServiceTypes.length
    ? {}
    : { requestedServiceTypes: 'Chọn ít nhất một loại dịch vụ.' };
}

const optional = (value: string) => value.trim() || null;

/** Body cho POST /organizations hoặc /organizations/{id}/resubmit; trường trống gửi null. */
export function submitPayload(draft: RegistrationDraft) {
  return {
    name: draft.name.trim(),
    registrationNumber: draft.registrationNumber.trim(),
    requestedServiceTypes: draft.requestedServiceTypes,
    legalEntityType: optional(draft.legalEntityType),
    registeredAddress: optional(draft.registeredAddress),
    contactPhone: optional(draft.contactPhone),
    contactEmail: optional(draft.contactEmail)?.toLowerCase() ?? null,
  };
}

/** Bản nháp không bao giờ chứa mật khẩu; chỉ giữ các trường đã biết khi đọc lại. */
export function parseDraft(raw: string | null): RegistrationDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<RegistrationDraft>;
    const text = (key: keyof RegistrationDraft) =>
      typeof value[key] === 'string' ? (value[key] as string) : '';
    return {
      resubmitId: typeof value.resubmitId === 'string' ? value.resubmitId : null,
      name: text('name'),
      registrationNumber: text('registrationNumber'),
      legalEntityType: text('legalEntityType'),
      registeredAddress: text('registeredAddress'),
      contactPhone: text('contactPhone'),
      contactEmail: text('contactEmail'),
      requestedServiceTypes: Array.isArray(value.requestedServiceTypes)
        ? value.requestedServiceTypes.filter((item): item is string => typeof item === 'string')
        : [],
    };
  } catch {
    return null;
  }
}
