import type { ReactNode } from 'react';
import { Icon } from './Icon';
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function EmptyRecords({
  title = 'Không có kết quả phù hợp',
  description = 'Thử thay đổi từ khóa hoặc bộ lọc.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="state">
      <Icon name="document" />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function Pagination({
  page,
  totalPages,
  total,
  loading,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="pagination" aria-label="Phân trang">
      <span>
        {total.toLocaleString('vi-VN')} kết quả · Trang {page} / {Math.max(1, totalPages)}
      </span>
      <div className="pagination-actions">
        <button
          type="button"
          className="button secondary"
          aria-label="Trang trước"
          disabled={loading || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <Icon name="left" />
          Trước
        </button>
        <span className="page-number" aria-current="page">
          {page}
        </span>
        <button
          type="button"
          className="button secondary"
          aria-label="Trang sau"
          disabled={loading || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Sau
          <Icon name="right" />
        </button>
      </div>
    </nav>
  );
}
export function EntityName({
  name,
  secondary,
  children,
}: {
  name: string;
  secondary?: string;
  children?: ReactNode;
}) {
  return (
    <div className="entity-cell">
      <span className="entity-initial" aria-hidden="true">
        {name.charAt(0).toLocaleUpperCase('vi')}
      </span>
      <div>
        {children || <strong>{name}</strong>}
        {secondary ? <small>{secondary}</small> : null}
      </div>
    </div>
  );
}
