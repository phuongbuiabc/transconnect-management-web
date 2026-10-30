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

FE-LOGIN-04 (31/10): `/login/admin` và `/login/partner` là hai trang đăng nhập riêng, compose `LoginPage` theo portal với key riêng để reset dữ liệu form khi chuyển trang. `/login` redirect tương thích về admin; `/partner` chưa đăng nhập redirect về trang doanh nghiệp. Admin chọn tên tài khoản trong danh sách hardcode ở LoginPage: Sysadmin mặc định map tới admin@hotmail.com (email không hiển thị trên form); Developer/Data engineer/Accountant chưa có email nên khóa password/submit và không gửi API. Đổi lựa chọn xóa mật khẩu/lỗi cũ; tên lựa chọn không cấp quyền, backend vẫn xác thực email/mật khẩu/quyền qua useAuth hiện có. CSS riêng `features/auth/pages/login.css` giới hạn bởi access-page, giữ nhận diện đỏ/vàng/Inter; không đổi session hoặc API.

FE-EXPERIENCE-03 tiếp nối: desktop dùng crimson header + horizontal primary navigation; mobile giữ drawer có focus/inert. `experience.css` nạp sau `workspace.css` là authority của composition/tokens được override hiện tại, thay rail desktop trước đây. Session persistence thay theo yêu cầu riêng của người dùng bên dưới; không suy từ refactor visual thành quyền đổi API/BE.

Cập nhật FE-REDESIGN-02 (31/10): `AdminLayout` giữ public entry, compose layout quản trị trong `ManagementLayout` với menu theo permission và NavLink theo URL; không đọc token trong layout. Active skin nhận từ `aria-current="page"`; mobile drawer inert/focus/Escape thuộc presentation. `shared/ui/Icon` và `RecordLayout` chỉ nhận props, không gọi API hoặc phụ thuộc feature. `workspace.css` là lớp theme Management sau `base.css` legacy primitives; không đổi API/DTO/session để redesign. Fonts và license được lưu trong `public/fonts`, không import source hoặc asset runtime từ sibling repo. Trang Accounts/Drivers/Organizations thay presentation nhưng giữ hooks/API và các guard/lý do mutation hiện hữu.

Cập nhật Locations 27/10: `features/locations` sở hữu API/model/hook, form và Leaflet picker. App nối `/admin/locations`; workspace Partner compose feature theo organizationId cho Owner. Core/session không đổi. Phương thức xác nhận và tọa độ do form quản; API/server kiểm tra lại quyền, địa giới, version và không cho Owner tự công bố. History của điểm ngừng dùng đọc từ API Admin riêng. Cấu hình tile/attribution là public env, không đặt provider secret trong frontend.

- `Page → Hook → feature API → core transport`. Page nhận state/action từ hook; module API chứa endpoint/DTO; component trình bày không gọi fetch hoặc đọc token. Không đặt nghiệp vụ Organization trong core/shared.
- `app` compose route/layout/provider. Core không import app/feature; shared không import app/feature. AuthProvider/useAuth là public contract auth cho guard/layout; feature khác không đọc token trực tiếp. Không import source repo khác.
- File component PascalCase.tsx; hook useX.ts; API/model camelCase.ts. Mỗi file một trách nhiệm, format bằng Prettier. TypeScript strict, không any để né lỗi contract; ESLint kiểm tra rules-of-hooks và exhaustive-deps.
- Session được tạo bằng factory để test độc lập; chỉ `core/api/client.ts` compose phiên browser. Theo yêu cầu FE-EXPERIENCE-03, `browserPersistence` lưu localStorage theo API base URL, migrate sessionStorage cũ một lần, fallback tab/memory nếu bị chặn. `createApiSession` giữ session identity và generation, đồng bộ storage ở request/response boundaries; browser storage events phục hồi tài khoản/đăng xuất qua AuthProvider, Web Locks phối hợp refresh đa tab khi hỗ trợ. Không tự chuyển cookie/đổi JWT contract BE hoặc đưa token vào URL/log. TTL/revocation server vẫn quyết định hiệu lực.
- Gộp refresh theo generation, retry 401 một lần; không refresh 403, không retry mutation theo timeout/500. Refresh 5xx/mất mạng giữ phiên để thử lại. Logout/account switch không cho phản hồi cũ ghi đè. Không hứa server revoke thành công khi offline.
- Hook sở hữu state dữ liệu, component sở hữu state trình bày. Cleanup AbortController/generation khi đổi route/unmount; error khác empty; mutation chỉ hiện thành công khi BE xác nhận. Không lưu bản sao dữ liệu có thể derive.
- Model/type của feature nằm cùng feature; envelope/PagedResult/ApiError trong core. `data` list/null giữ nguyên. Lỗi fields giữ tên JSON để form mới hiển thị đúng ô nhập. API không có tiền tố `/api`.
- Token/style theo Docs. Organization list dùng /organizations/search và PagedResult từ BE, lọc/count theo tenant trước page; Driver/Admin account cũng dùng server paging. API array cũ giữ tương thích. Các list lời mời/cộng tác cá nhân còn giới hạn 200 của demo, không giả là paging đầy đủ.
- Partner /partner dùng Operator guard và UI theo membership; Admin /admin dùng InternalAdmin và permission tương ứng route. Backend quyết định quyền thật trên mỗi request; không suy từ role UI thành quyền giấy. Không tạo empty module/service/usecase hàng loạt.

## Chạy và kiểm tra

Node >=22.14.0, `npm ci`, `npm run dev` (5173). `.env.example` chứa VITE_API_BASE_URL=http://localhost:5267; biến VITE là public, không chứa secret. Vite dùng configLoader runner để nạp config trực tiếp và tránh bước bundle config không cần thiết.

`npm run check`: Prettier check → ESLint → Node API tests → TypeScript check + Vite production build. `npm run format` để format. Thêm test hành vi khi đổi transport/session hoặc thao tác nghiệp vụ; E2E/browser và BE live được ghi riêng trong tracker, không suy từ build/mock test.
