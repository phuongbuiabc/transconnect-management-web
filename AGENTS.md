# Management frontend

- Đọc ARCHITECTURE.md và Docs/AGENTS.md trước thay đổi; giữ các quyết định nghiệp vụ, Design System và API baseline.
- app compose; feature có api/models/hooks/pages/components; core không phụ thuộc feature; shared chỉ UI/style tổng quát. Không gọi fetch hoặc đọc token trong page/component.
- React hooks đúng dependency, TypeScript strict, Prettier; chạy `npm run check` trước kết thúc. Test session phải kiểm tra account switch/refresh/logout, errors và list/null.
- Không thêm Partner/Trip/Booking/API giả khi chưa có yêu cầu; không thay CORS/token contract BE để tiện UI. Không commit .env thật/cache/dist.
- Cập nhật README/ARCHITECTURE khi cấu trúc/lệnh đổi; công việc và bằng chứng tập trung tại progress-tracker Docs.
