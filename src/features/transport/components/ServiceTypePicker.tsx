import { serviceTypeOptions } from '../models/transport';
import '../transport.css';

/** Chọn loại dịch vụ dự định khai thác; Backend bắt buộc ít nhất một loại khi nộp hồ sơ. */
export function ServiceTypePicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <fieldset className="service-type-picker">
      <legend>Loại dịch vụ dự định khai thác (chọn ít nhất một)</legend>
      {serviceTypeOptions.map((option) => (
        <label key={option.code} className="checkbox-row">
          <input
            type="checkbox"
            checked={value.includes(option.code)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...value, option.code]
                  : value.filter((code) => code !== option.code),
              )
            }
          />
          {option.label}
        </label>
      ))}
      <small>Mỗi loại dịch vụ được quản trị viên xét duyệt riêng sau khi tổ chức được duyệt.</small>
    </fieldset>
  );
}
