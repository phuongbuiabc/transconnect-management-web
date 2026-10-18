export const statusLabels = { Pending: 'Chờ duyệt', Approved: 'Đã duyệt', Rejected: 'Từ chối' };
export function Status({ value }: { value: keyof typeof statusLabels }) {
  return (
    <span className={'status status-' + value.toLowerCase()}>
      <span aria-hidden="true" />
      {statusLabels[value] || value}
    </span>
  );
}
