import { useState, type FormEvent, type ReactNode } from 'react';
import { ErrorNotice } from '../../../shared/ui';
import { ServiceTypePicker } from '../../transport/components/ServiceTypePicker';
import { serviceTypeLabel } from '../../transport/models/transport';
import {
  legalEntityLabel,
  legalEntityOptions,
  validateOrganization,
  validateServices,
  type FieldErrors,
  type RegistrationDraft,
} from '../models/registration';

type Update = (patch: Partial<RegistrationDraft>) => void;

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="reg-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <small id={id + '-hint'}>{hint}</small> : null}
      {error ? (
        <p className="reg-field-error" id={id + '-error'}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describe = (id: string, errors: FieldErrors, key: keyof RegistrationDraft, hint = false) =>
  ({
    id,
    'aria-invalid': errors[key] ? true : undefined,
    'aria-describedby':
      [errors[key] ? id + '-error' : '', hint ? id + '-hint' : ''].filter(Boolean).join(' ') ||
      undefined,
  }) as const;

/** Bước 3: tên pháp lý + MST bắt buộc; loại chủ thể/địa chỉ/liên hệ tùy chọn (D1 B). */
export function OrganizationStep({
  draft,
  update,
  rejectedNote,
  onNext,
}: {
  draft: RegistrationDraft;
  update: Update;
  rejectedNote: string | null;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateOrganization(draft);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) document.getElementById('reg-' + first)?.focus();
    else onNext();
  }
  return (
    <form className="reg-card" onSubmit={next} noValidate>
      <h2>{draft.resubmitId ? 'Sửa thông tin hồ sơ' : 'Thông tin doanh nghiệp'}</h2>
      {rejectedNote !== null ? (
        <div className="notice reg-rejected" role="note">
          <strong>Hồ sơ trước bị từ chối</strong>
          <p>{rejectedNote || 'Nền tảng chưa ghi lý do từ chối.'}</p>
        </div>
      ) : null}
      <p className="reg-lead">Thông tin theo giấy đăng ký kinh doanh của đơn vị vận tải.</p>
      <Field id="reg-name" label="Tên tổ chức theo giấy đăng ký" error={errors.name}>
        <input
          {...describe('reg-name', errors, 'name')}
          autoComplete="organization"
          maxLength={200}
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </Field>
      <Field
        id="reg-registrationNumber"
        label="Mã số thuế"
        hint="10 hoặc 13 chữ số, không có dấu cách."
        error={errors.registrationNumber}
      >
        <input
          {...describe('reg-registrationNumber', errors, 'registrationNumber', true)}
          inputMode="numeric"
          maxLength={13}
          value={draft.registrationNumber}
          onChange={(e) => update({ registrationNumber: e.target.value.replace(/\s/g, '') })}
        />
      </Field>

      <fieldset className="reg-optional">
        <legend>
          Hồ sơ liên hệ <span>Không bắt buộc</span>
        </legend>
        <p>
          Khai sớm giúp xét duyệt nhanh hơn. Bạn vẫn có thể bổ sung sau trong mục Thông tin tổ chức.
        </p>
        <Field id="reg-legalEntityType" label="Loại chủ thể" error={errors.legalEntityType}>
          <select
            {...describe('reg-legalEntityType', errors, 'legalEntityType')}
            value={draft.legalEntityType}
            onChange={(e) => update({ legalEntityType: e.target.value })}
          >
            <option value="">Chưa chọn</option>
            {legalEntityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id="reg-registeredAddress" label="Địa chỉ đăng ký" error={errors.registeredAddress}>
          <input
            {...describe('reg-registeredAddress', errors, 'registeredAddress')}
            autoComplete="street-address"
            maxLength={500}
            value={draft.registeredAddress}
            onChange={(e) => update({ registeredAddress: e.target.value })}
          />
        </Field>
        <div className="reg-grid">
          <Field id="reg-contactPhone" label="Số điện thoại liên hệ" error={errors.contactPhone}>
            <input
              {...describe('reg-contactPhone', errors, 'contactPhone')}
              type="tel"
              autoComplete="tel"
              maxLength={20}
              value={draft.contactPhone}
              onChange={(e) => update({ contactPhone: e.target.value })}
            />
          </Field>
          <Field id="reg-contactEmail" label="Email liên hệ" error={errors.contactEmail}>
            <input
              {...describe('reg-contactEmail', errors, 'contactEmail')}
              type="email"
              autoComplete="email"
              maxLength={256}
              value={draft.contactEmail}
              onChange={(e) => update({ contactEmail: e.target.value })}
            />
          </Field>
        </div>
      </fieldset>
      <div className="reg-actions">
        <button className="button primary">Tiếp tục</button>
      </div>
    </form>
  );
}

/** Bước 4: loại dịch vụ dự định khai thác, ít nhất một loại. */
export function ServicesStep({
  draft,
  update,
  onBack,
  onNext,
}: {
  draft: RegistrationDraft;
  update: Update;
  onBack: () => void;
  onNext: () => void;
}) {
  const [error, setError] = useState('');
  return (
    <form
      className="reg-card"
      onSubmit={(event) => {
        event.preventDefault();
        const found = validateServices(draft).requestedServiceTypes ?? '';
        setError(found);
        if (!found) onNext();
      }}
    >
      <h2>Dịch vụ dự định khai thác</h2>
      <p className="reg-lead">
        Sau khi tổ chức được duyệt, mỗi loại dịch vụ được nền tảng xét duyệt riêng trước khi bạn mở
        tuyến, lịch hoặc nhận chuyến.
      </p>
      <ServiceTypePicker
        value={draft.requestedServiceTypes}
        onChange={(requestedServiceTypes) => {
          setError('');
          update({ requestedServiceTypes });
        }}
      />
      {error ? (
        <p className="reg-field-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="reg-actions">
        <button className="button primary">Tiếp tục</button>
        <button type="button" className="button secondary" onClick={onBack}>
          Quay lại
        </button>
      </div>
    </form>
  );
}

/** Bước 5: xem lại toàn bộ rồi nộp; lỗi server giữ nguyên dữ liệu đã nhập. */
export function ReviewStep({
  draft,
  email,
  busy,
  error,
  onEdit,
  onSubmit,
}: {
  draft: RegistrationDraft;
  email: string;
  busy: boolean;
  error: unknown;
  onEdit: (step: 'organization' | 'services') => void;
  onSubmit: () => void;
}) {
  const value = (text: string) => text.trim() || <span className="reg-empty">Chưa khai</span>;
  return (
    <section className="reg-card" aria-labelledby="reg-review-title">
      <h2 id="reg-review-title">Xem lại và nộp hồ sơ</h2>
      <p className="reg-lead">
        Kiểm tra thông tin trước khi gửi. Hồ sơ đang chờ duyệt không sửa được; nếu bị từ chối bạn có
        thể sửa và nộp lại.
      </p>
      <div className="reg-summary">
        <div className="reg-summary-head">
          <h3>Doanh nghiệp</h3>
          <button type="button" className="text-link" onClick={() => onEdit('organization')}>
            Sửa
          </button>
        </div>
        <dl>
          <dt>Tên tổ chức</dt>
          <dd>{value(draft.name)}</dd>
          <dt>Mã số thuế</dt>
          <dd>{value(draft.registrationNumber)}</dd>
          <dt>Loại chủ thể</dt>
          <dd>{draft.legalEntityType ? legalEntityLabel(draft.legalEntityType) : value('')}</dd>
          <dt>Địa chỉ đăng ký</dt>
          <dd>{value(draft.registeredAddress)}</dd>
          <dt>Điện thoại</dt>
          <dd>{value(draft.contactPhone)}</dd>
          <dt>Email liên hệ</dt>
          <dd>{value(draft.contactEmail)}</dd>
        </dl>
      </div>
      <div className="reg-summary">
        <div className="reg-summary-head">
          <h3>Dịch vụ</h3>
          <button type="button" className="text-link" onClick={() => onEdit('services')}>
            Sửa
          </button>
        </div>
        <ul>
          {draft.requestedServiceTypes.map((code) => (
            <li key={code}>{serviceTypeLabel(code)}</li>
          ))}
        </ul>
      </div>
      <p className="reg-owner-note">
        Quyền Owner sẽ được gửi tới <strong>{email}</strong> sau khi hồ sơ được duyệt.
      </p>
      {error ? <ErrorNotice error={error} /> : null}
      <div className="reg-actions">
        <button type="button" className="button primary" disabled={busy} onClick={onSubmit}>
          {busy ? 'Đang nộp…' : draft.resubmitId ? 'Nộp lại hồ sơ' : 'Nộp hồ sơ'}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={busy}
          onClick={() => onEdit('services')}
        >
          Quay lại
        </button>
      </div>
    </section>
  );
}
