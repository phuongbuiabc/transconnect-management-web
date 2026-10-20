import { useAccountDetail } from '../hooks/useAccountDetail';
import { ErrorNotice, Loading } from '../../../shared/ui';
export function AccountDetail({ id }: { id: string }) {
  const state = useAccountDetail(id);
  if (state.error) return <ErrorNotice error={state.error} />;
  if (!state.data) return <Loading />;
  const { account, audit, totalPages } = state.data;
  return (
    <section className="panel">
      <h3>Chi tiết tài khoản</h3>
      <p>Số điện thoại: {account.phoneNumber || 'Chưa cung cấp'}</p>
      <p>{account.emailVerified ? 'Email đã xác thực' : 'Email chưa xác thực'}</p>
      <h3>Lịch sử khóa / mở</h3>
      {audit.length ? (
        audit.map((item) => (
          <p key={item.id}>
            {new Date(item.createdAt).toLocaleString('vi')} ·{' '}
            {item.isActive === null ? 'Không rõ trạng thái cũ' : item.isActive ? 'Mở khóa' : 'Khóa'}{' '}
            · {item.reason || 'Không có lý do được ghi nhận'}
          </p>
        ))
      ) : (
        <p>Chưa có thay đổi được ghi nhận.</p>
      )}
      <button disabled={state.page === 1} onClick={() => state.setPage(state.page - 1)}>
        Trước
      </button>{' '}
      Trang {state.page}
      <button disabled={state.page >= totalPages} onClick={() => state.setPage(state.page + 1)}>
        Sau
      </button>
    </section>
  );
}
