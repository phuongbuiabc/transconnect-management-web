# Management frontend

- Locations 27/10 đã được người dùng giao triển khai: Admin `/admin/locations`, Owner qua workspace tổ chức; feature riêng, Leaflet 1.9.4, nhập tay/xác nhận và lịch sử. Source/lockfile đã có; xem Backend/docs/reference/locations-setup.md và contract Docs/05-api/endpoints/locations-endpoints.md. Phạm vi địa giới toàn quốc; không coi code/build là nghiệm thu SQL Server/tiles thật, kết quả ở tracker.
- Đọc ARCHITECTURE.md và Docs/AGENTS.md trước thay đổi; giữ các quyết định nghiệp vụ, Design System và API baseline.
- app compose; feature có api/models/hooks/pages/components; core không phụ thuộc feature; shared chỉ UI/style tổng quát. Không gọi fetch hoặc đọc token trong page/component.
- Cập nhật 20/10: đã có /partner Operator onboarding/workspace và /admin accounts/Driver/Organization; features/foundation sở hữu context/profile/document API-hook-component, accounts sở hữu status/audit. Server paging dùng PagedResult; multipart/binary dùng cùng session guard. admins.manage chỉ quản target InternalAdmin khi actor còn có users.manage và thuộc InternalAdmin; Owner không tự xác nhận quyền khai thác xe. Chưa nghiệm thu live, xem tracker/current-test.
- React hooks đúng dependency, TypeScript strict, Prettier; chạy `npm run check` trước kết thúc. Test session phải kiểm tra account switch/refresh/logout, errors và list/null.
- Không thêm Partner/Trip/Booking/API giả khi chưa có yêu cầu; không thay CORS/token contract BE để tiện UI. Không commit .env thật/cache/dist.
- Cập nhật README/ARCHITECTURE khi cấu trúc/lệnh đổi; công việc và bằng chứng tập trung tại progress-tracker Docs.

## Quy trình theo nhánh — 21/10

Đọc [roadmap](../../TransConnect-Docs/00-project/roadmap.md) trước khi làm. Ghi đề xuất trong tracker: mã gói, nhánh/base/target, dependency A → B và WRITE/READ/VERIFY/GENERATED; câu hỏi theo Q-<GÓI>-<SỐ> trong Q&A, không tạo file hỏi riêng. Cập nhật phạm vi file trước khi sửa ngoài kế hoạch. PR dùng .github/pull_request_template.md; giữ test delta và bộ SHA liên repo. FND-00 đang thực hiện trên chore/fnd-00-delivery-workflow, không tự mở nhánh tương lai hoặc merge/push.
