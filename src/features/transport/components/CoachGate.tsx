import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Loading } from '../../../shared/ui';
import { useCoachAccess } from '../hooks/useTransport';

/** Tuyến / sơ đồ ghế / lịch chạy chỉ mở khi dịch vụ xe khách đã được duyệt (tạm ngưng: chỉ xem). */
export function CoachGate({
  organizationId,
  children,
}: {
  organizationId: string;
  children: (canOperate: boolean) => ReactNode;
}) {
  const access = useCoachAccess(organizationId);
  if (access.loading) return <Loading />;
  if (!access.canView)
    return (
      <div className="notice">
        <strong>Dịch vụ xe khách tuyến cố định chưa được duyệt.</strong>
        <p>
          Đăng ký dịch vụ ở mục <Link to="/partner/services">Dịch vụ</Link> và chờ quản trị viên
          duyệt trước khi tạo tuyến, sơ đồ ghế và lịch chạy.
        </p>
      </div>
    );
  return <>{children(access.canOperate)}</>;
}
