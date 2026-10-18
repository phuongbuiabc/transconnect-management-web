export function Loading({ text = 'Đang tải dữ liệu…' }: { text?: string }) {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      <p>{text}</p>
    </div>
  );
}
