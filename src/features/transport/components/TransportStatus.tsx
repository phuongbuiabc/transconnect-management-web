const tone: Record<string, string> = {
  Pending: 'pending',
  Draft: 'pending',
  Approved: 'approved',
  Active: 'approved',
  Published: 'approved',
  Locked: 'approved',
  Rejected: 'rejected',
  Suspended: 'rejected',
  Inactive: 'rejected',
  Paused: 'pending',
  Withdrawn: 'rejected',
  Ended: 'rejected',
  Archived: 'rejected',
  Retired: 'rejected',
};

const labels: Record<string, string> = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
  Suspended: 'Tạm ngưng',
  Withdrawn: 'Đã rút',
  Draft: 'Nháp',
  Active: 'Đang hoạt động',
  Inactive: 'Ngừng hoạt động',
  Published: 'Đã công bố',
  Retired: 'Bản cũ',
  Locked: 'Đã khóa',
  Archived: 'Lưu trữ',
  Paused: 'Tạm dừng',
  Ended: 'Đã kết thúc',
};

/** Nhãn trạng thái dùng chung cho đăng ký dịch vụ, tuyến, sơ đồ ghế và lịch chạy. */
export function TransportStatus({ value, label }: { value: string; label?: string }) {
  return (
    <span className={'status status-' + (tone[value] ?? 'pending')}>
      <span aria-hidden="true" />
      {label ?? labels[value] ?? value}
    </span>
  );
}
