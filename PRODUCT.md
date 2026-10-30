# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Quản trị viên nội bộ: xét duyệt và quản lý tài khoản, đơn vị vận tải, tài xế và địa điểm theo quyền.
- Tài khoản Operator: đăng ký/xác thực email, nộp hoặc nộp lại hồ sơ tổ chức; Owner/nhân viên dùng workspace theo membership và quyền do backend cấp.

## Product Purpose

VieGo Management là công cụ quản trị cho nền tảng kết nối vận tải. Giai đoạn hiện tại xây dựng phần base song song backend; chưa phải sản phẩm hoàn chỉnh về Trip/Booking/thanh toán. Thành công trước mắt là thao tác nền tảng rõ ràng, đúng quyền, có thể kiểm thử và mở rộng theo từng phần backend đã sẵn sàng.

## Operating Context

React 19, TypeScript, Vite, Tailwind; Admin và Partner dùng chung repo, layout/guard theo ngữ cảnh. Web hướng tới demo qua deployment (Vercel hoặc dịch vụ tương tự); chưa chốt host/domain, không có hạn demo theo trả lời ngày 30/10/2026. Chưa suy ra đã production-ready.

Chủ dự án chốt thứ tự: Management web trước, sau đó Customer/Driver, cuối cùng landing. Hai ứng dụng Flutter hướng Android/iOS; môi trường kiểm thử hiện có là máy ảo Android, chưa có bằng chứng thiết bị/iOS.

## Capabilities and Constraints

- Source chức năng hiện hữu: `src/app/App.tsx`, các feature và `ARCHITECTURE.md`; hợp đồng API/thuật ngữ và quyết định nghiệp vụ thuộc Docs, không suy từ bản DRAFT thành yêu cầu được phê duyệt.
- Page → hook → feature API → core transport. UI không trực tiếp gọi fetch/đọc token; backend là nguồn phân quyền cuối cùng.
- Giữ session/account-group và API contract hiện có. Không tự bổ sung Trip/Booking/dashboard số liệu giả.
- Lỗi tải khác dữ liệu trống; thông báo thành công chỉ sau backend xác nhận. Fixture browser không chứng minh SQL/email/storage/map tiles thật hoạt động.
- Target desktop/mobile web cụ thể và ưu tiên vai trò/luồng tiếp theo còn OPEN trong Q&A FE-QUALITY.

## Brand Commitments

FE-EXPERIENCE-03: người dùng thấy thiết kế rail trước chưa đủ mới, đã chọn nguyên văn “Chuyển sang bố cục ngang mới, giữ đỏ/vàng và các luồng BE hiện có”. Thành phần/navigation mới theo choice này; chỉ dùng drawer trên mobile. Người dùng yêu cầu giữ đăng nhập khi đóng/mở tab: lưu phiên trên trình duyệt theo môi trường API, chỉ phục hồi trong hiệu lực BE, logout xóa phiên; không suy ra đăng nhập vĩnh viễn hoặc tăng TTL server.

Chủ dự án xác nhận nguyên văn: “VieGo cho giao diện; TransConnect giữ làm tên kỹ thuật”. Không đổi repo/package/session keys để đổi tên hiển thị.

Màu đỏ/vàng theo `../../TransConnect-Docs/06-ui/VIEGO_DESIGN_SYSTEM.md` được giữ. Ngày 31/10 chủ dự án yêu cầu redesign Management, cho phép thay bố cục/typography/component, tham khảo Uber, giữ kết nối BE. FE-REDESIGN-02 từng chọn danh sách làm trung tâm với rail charcoal; FE-EXPERIENCE-03 ở trên thay rail desktop bằng header đỏ + navigation ngang, vẫn giữ list-to-detail và drawer mobile. Không tự tạo logo thương hiệu chính thức hoặc đổi phạm vi nghiệp vụ từ thay đổi visual.

## Evidence on Hand

- Quyết định/câu trả lời: `../../TransConnect-Docs/00-project/questions-and-answers.md#fe-quality-questions`.
- Phạm vi, tiến độ và bằng chứng: `../../TransConnect-Docs/00-project/progress-tracker.md#fe-quality-01`.
- Test thủ công duy nhất: `../../TransConnect-Backend/docs/current-test.md`.
- Token/CSS, component và API tests trong repo. Chưa có logo/brand kit chính thức được xác nhận trong đợt này.

## Product Principles

1. Ưu tiên hoàn thành tác vụ và phân quyền chính xác.
2. Giữ nhất quán nhưng tôn trọng khác biệt giữa quản trị web và tác nghiệp mobile.
3. Mỗi thay đổi có thể review và có bằng chứng đúng phạm vi; không coi build/fixture là nghiệm thu live.
4. Phát triển FE theo contract backend đã có, giữ các nghiệp vụ tương lai là backlog.
