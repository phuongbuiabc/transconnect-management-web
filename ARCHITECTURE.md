# Management web — cập nhật 18/10/2026

React + TypeScript strict + Vite, repo độc lập. Cập nhật 20/10 theo yêu cầu triển khai: Admin và Partner có route/guard riêng, dùng BE local. Quy tắc [Docs](../../TransConnect-Docs/AGENTS.md), [Design System](../../TransConnect-Docs/06-ui/VIEGO_DESIGN_SYSTEM.md), [API baseline](../../TransConnect-Docs/09-decisions/api-baseline.md) giữ nguyên.

features/accounts sở hữu API/hook/page list/detail/status/audit. features/foundation gom model/API/hook/component cho context, Driver review/history, workspace membership/driver/vehicle/giấy demo; organizations sở hữu application/list/review/resubmit và compose các public component foundation. Auth sở hữu Operator register/verify, account settings/avatar/change-password. Request hỗ trợ FormData và binary có xác thực, dùng cùng generation/refresh guard; API/hook không đưa token vào page hoặc URL. Kết quả check/test ở tracker.

```text
src/
  main.tsx
  app/                       # App routes, router/Protected, layouts/AdminLayout
  core/
    config/appConfig.ts      # BE origin, mặc định http://localhost:5267
    api/                     # transport, envelope/errors/paged contracts, composition client
    session/                 # token storage, generation, refresh serialization
  features/
    auth/                    # api, models, hooks/useAuth, pages/LoginPage
    organizations/           # api, models, hooks, pages, components
  shared/
    ui/                      # Brand, Loading, ErrorNotice
    styles/                  # base CSS và token
tests/
  api.test.mjs               # real source, mocked fetch/storage
  helpers/loadTypeScript.mjs # transpile modules bằng TypeScript cho Node test
```

## Quy tắc code

- `Page → Hook → feature API → core transport`. Page nhận state/action từ hook; module API chứa endpoint/DTO; component trình bày không gọi fetch hoặc đọc token. Không đặt nghiệp vụ Organization trong core/shared.
- `app` compose route/layout/provider. Core không import app/feature; shared không import app/feature. AuthProvider/useAuth là public contract auth cho guard/layout; feature khác không đọc token trực tiếp. Không import source repo khác.
- File component PascalCase.tsx; hook useX.ts; API/model camelCase.ts. Mỗi file một trách nhiệm, format bằng Prettier. TypeScript strict, không any để né lỗi contract; ESLint kiểm tra rules-of-hooks và exhaustive-deps.
- Session được tạo bằng factory để test độc lập; chỉ `core/api/client.ts` compose phiên browser. Giữ sessionStorage theo backend hiện tại; không tự chuyển sang cookie khi BE chưa hỗ trợ. Không đưa token vào URL/log.
- Gộp refresh theo generation, retry 401 một lần; không refresh 403, không retry mutation theo timeout/500. Refresh 5xx/mất mạng giữ phiên để thử lại. Logout/account switch không cho phản hồi cũ ghi đè. Không hứa server revoke thành công khi offline.
- Hook sở hữu state dữ liệu, component sở hữu state trình bày. Cleanup AbortController/generation khi đổi route/unmount; error khác empty; mutation chỉ hiện thành công khi BE xác nhận. Không lưu bản sao dữ liệu có thể derive.
- Model/type của feature nằm cùng feature; envelope/PagedResult/ApiError trong core. `data` list/null giữ nguyên. Lỗi fields giữ tên JSON để form mới hiển thị đúng ô nhập. API không có tiền tố `/api`.
- Token/style theo Docs. Organization list dùng /organizations/search và PagedResult từ BE, lọc/count theo tenant trước page; Driver/Admin account cũng dùng server paging. API array cũ giữ tương thích. Các list lời mời/cộng tác cá nhân còn giới hạn 200 của demo, không giả là paging đầy đủ.
- Partner /partner dùng Operator guard và UI theo membership; Admin /admin dùng InternalAdmin và permission tương ứng route. Backend quyết định quyền thật trên mỗi request; không suy từ role UI thành quyền giấy. Không tạo empty module/service/usecase hàng loạt.

## Chạy và kiểm tra

Node >=22.14.0, `npm ci`, `npm run dev` (5173). `.env.example` chứa VITE_API_BASE_URL=http://localhost:5267; biến VITE là public, không chứa secret. Vite dùng configLoader runner để nạp config trực tiếp và tránh bước bundle config không cần thiết.

`npm run check`: Prettier check → ESLint → Node API tests → TypeScript check + Vite production build. `npm run format` để format. Thêm test hành vi khi đổi transport/session hoặc thao tác nghiệp vụ; E2E/browser và BE live được ghi riêng trong tracker, không suy từ build/mock test.
