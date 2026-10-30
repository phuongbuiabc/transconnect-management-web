## Gói và kết quả

- Mã gói / mốc:
- Vấn đề và hành vi sau thay đổi:
- Ngoài phạm vi:
- Card tracker / câu hỏi quyết định (Q-...):

## Phụ thuộc và file

- Base SHA / nhánh đích:
- PR/commit liên quan ở repo khác; thứ tự tích hợp:
- Dependency A → B (API/schema/quyền/build), đã tích hợp hay đang chờ:
- WRITE / READ / VERIFY / GENERATED (đường dẫn file):
- Vùng dùng chung và nhánh khác bị ảnh hưởng:
- API tương thích, migration/DB đích, rollback và giới hạn dữ liệu:

## Kiểm chứng và bàn giao

- Lệnh/check đã chạy và kết quả thực tế:
- Test delta cho người dùng (ID trong current-test.md):
- Chưa kiểm chứng / blocker / lỗi hoãn:
- Bộ SHA BE và FE đã thử cùng nhau:

- [ ] Phạm vi và dependency đã cập nhật vào tracker.
- [ ] Không có secret/cache/build, không sửa migration đã apply.
- [ ] Check áp dụng đạt trên bản cần tích hợp; không nhầm local pass với CI/live pass.
- [ ] Contract, FE và quyền liên quan đã đối chiếu; phần chưa thử được ghi rõ.
