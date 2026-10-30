# TransConnect Management Web

Locations 27/10: Admin `/admin/locations`; Owner → tổ chức → Địa điểm. Includes shared point proposals/reviews, direct Admin publication, immutable history and Leaflet pin/manual confirmation. [Setup nationwide catalogue, source checkout/import and map provider](../../TransConnect-Backend/docs/reference/locations-setup.md); [API contract](../../TransConnect-Docs/05-api/endpoints/locations-endpoints.md). Run `npm ci` (or `npm.cmd ci` in PowerShell) using the committed lockfile; default OSM tiles need no API key. Live DB/tile acceptance remains separate.

Independent React + Vite + TypeScript + Tailwind application for TransConnect Admin and Partner. Vietnamese UI follows the crimson/gold product direction; screens use the local backend.

User-facing name: **VieGo Management**. TransConnect remains the technical repository/package/API identity. Product context is in [PRODUCT.md](PRODUCT.md); the shared visual reference and delivery criteria are in [the design system](../../TransConnect-Docs/06-ui/VIEGO_DESIGN_SYSTEM.md#frontend-quality-contract). Current work and evidence live in [FE-QUALITY-01](../../TransConnect-Docs/00-project/progress-tracker.md#fe-quality-01).

Updated 20/10: /login selects InternalAdmin or Operator; Operator registration/email verification and /partner support authenticated organization submission/resubmission, account/avatar settings, staff/invitations, driver collaborations and vehicle/profile demo documents. /admin/accounts provides paged list/detail/lock/unlock/audit; /admin/drivers provides review/history; organization review includes legacy resubmission/Owner reinvitation and Admin vehicle confirmation. Permissions are enforced by BE and checked by route guards.

Cloudinary credentials belong only in backend local configuration. Demo documents stay synthetic/NOT_VERIFIED and require Development ComplianceDemo/storage. Live SQL Server, SMTP, Cloudinary/storage and browser acceptance are not established by frontend build/tests. See [current test](../../TransConnect-Backend/docs/current-test.md) and [tracker](../../TransConnect-Docs/00-project/progress-tracker.md#closure-implementation-20-10).

## Local setup

Requires Node.js 22.14.0 or newer and npm. From this folder:

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

Open http://localhost:5173. Set `VITE_API_BASE_URL` in `.env` to the backend origin, with no `/api` suffix. The example uses http://localhost:5267. The backend may redirect HTTP to HTTPS at https://localhost:7218; trust its development certificate or configure the appropriate backend origin. Restart Vite after changing environment values. Never put secrets in VITE variables: they are public bundle configuration.

The backend is a separate .NET 10 + SQL Server service. Follow its README to configure its database and Development settings, apply migrations and start the Host. Permit the frontend origin through backend CORS. Use a provisioned InternalAdmin account with `organizations.manage` permission. This frontend provides no public Admin registration and embeds no credentials.

## Commands

- `npm run dev`: local development server.
- `npm run typecheck`: strict TypeScript validation.
- `npm run build`: typecheck and production bundle.
- `npm run preview`: inspect the built bundle locally.
- `npm test`: focused Node session/API regression tests.
- `npm run check:ui`: separate Chromium browser fixture checks against the existing production build (see below).

## Implemented scope

- `/login`: InternalAdmin/Operator authentication and Operator registration; context-specific copy, password visibility, busy state and linked validation feedback.
- `/partner`: email verification and organization application/workspaces according to current account/membership; account/profile and existing foundation features.
- `/admin/organizations`: authorized, server-paged organization list and search; details/review/history per current API.
- `/admin/accounts`, `/admin/drivers`, `/admin/locations`: permission-gated foundation and Locations workflows. See ARCHITECTURE and current-test for scope/remaining live verification.
- Approval uses the backend review endpoint, which queues the Owner invitation; the frontend does not send a second invitation.
- Legacy personal invitation/collaboration lists retain demo limits; do not treat loaded-subset counts as platform totals.
- Error, loading, empty, denied-access and expired-session states; responsive keyboard-accessible forms and navigation.

Trips, bookings and payments remain future increments. Existing profile/document workflows are demo scope; they do not establish real transport eligibility or production compliance. No invented statistics are included.

## Repeatable UI checks

Build and run the browser checks:

```powershell
npm run check
npm run check:ui
npm run check:ui -- --admin
```

The dependency-free fallback serves `dist` on an ephemeral loopback port, uses installed Chrome/Edge through CDP with an isolated profile, and closes both browser/server when finished. No separate preview process is required. `UI_BROWSER_PATH` selects a Chromium executable; optional `UI_BASE_URL` selects another **local** server instead. Production output avoids dev/HMR timing and profile-file reloads. Artifacts are ignored under `.ui-artifacts/after/`; `npm run check:ui -- --baseline` records pre-change captures under `before/` without asserting the revised behavior. Capture the baseline before changing UI.

The check covers login/Operator registration, native validation, password visibility, duplicate-submit prevention, busy/error states, keyboard recovery and horizontal overflow at 320/390/768/1440px. API fetches are replaced before app startup; no real credentials, sessions or DB mutations are used. Console exceptions fail the regression run. Screenshots/report retain synthetic fixture data only. Browser startup may require local process permissions in a restricted agent sandbox.

`--admin` additionally checks all four Admin destinations and their computed selected colour, parent selection on a detail route, browser Back, mobile navigation focus containment/Escape/return, responsive records, empty/error states, and the existing account-status/driver-review request contracts. `--admin --baseline` records the previous interface before a redesign and reports viewport measurements without enforcing the revised visual/mobile contract. All company/person records in this harness are synthetic; application code continues to use the existing BE APIs.

## Management interface

The current FE-EXPERIENCE-03 direction is a horizontal workspace: a full-width crimson brand/account header, white horizontal destination navigation, a warm light work area and wider list-to-detail surfaces. The previous charcoal desktop rail is replaced; mobile still uses the accessible drawer. Colours stay red/gold, with larger task headings and readable record typography. There is no fabricated overview dashboard. Theme order is `base.css` legacy primitives → `workspace.css` reusable Management controls → `experience.css` approved current composition/overrides. Feature DTOs/APIs/permission behavior remain; session persistence changed separately at the user's explicit request. Local `Icon` and record-layout primitives are presentation-only.

Inter Latin/Vietnamese 400/600/700 is self-hosted from `public/fonts` with its SIL OFL license. Files were copied from the existing locally installed `@fontsource/inter` asset package; no sibling repo or font CDN is needed to build or run this repo. Mobile lists reflow into record rows; the Admin drawer becomes inert when closed, traps focus when open, closes on Escape and returns focus. Form and profile review behavior still requires live acceptance separately.

This is a scoped smoke check, not full accessibility, successful live login/registration, iOS/native testing or deployed acceptance. Playwright tool/skill availability is still being clarified in Q&A; migrate valuable scenarios once connected rather than maintaining duplicate browser suites. Keep browser artifacts out of Git, Vite watch and ESLint. Scripts participate in formatting/lint checks.

## Demo deployment readiness

Hosting is not selected or deployed by this change. Before a Vercel or other static-host demo: use Node >=22.14 and the lockfile, run `npm run check`, publish `dist`, configure SPA deep-link fallback, and provide the reachable HTTPS backend origin at build time. `VITE_*` values are public. Coordinate allowed origins with BE rather than changing token/CORS behavior inside UI work. Verify nested-route refresh, asset loading, login/logout/session restoration and permission errors on the deployed URL; production preview alone does not establish these. Record the tested SHA and a rollback target in the tracker. Do not deploy private profiles, test browser profiles or `.env` files.

## Session and security behavior

Backend tokens arrive in JSON, not HttpOnly cookies. At the user's request, sessions now persist in `localStorage`, scoped to the configured API base URL, so closing and reopening a tab restores authentication while BE credentials remain valid. Existing tab storage is migrated once and its old value removed. If durable storage is blocked the client falls back to tab storage or memory; persistence cannot be promised when browser storage is disabled. Logout removes the saved session. JavaScript can read browser-stored tokens; a future HttpOnly cookie/BFF design requires a separate BE contract, which this change does not introduce.

The API client serializes refresh in one tab and uses the Web Locks API to coordinate shared refreshes across tabs where that browser capability is available. Storage events synchronize peer logout/account changes; read/response guards also check storage before an old action/result can reach another account. Persistent session identity distinguishes refresh rotation from a new login. A request retries 401 once, clears rejected credentials and preserves them during temporary refresh outages. Logout clears local protected state immediately, then attempts BE revocation; offline revocation may fail, with BE expiry/revocation remaining authoritative. This change does not extend server token lifetimes. Browsers lacking Web Locks retain per-tab single-flight but do not get the same cross-tab refresh mutex.

Run `npm run check:ui -- --admin --session` for fixture-based Admin checks plus actual browser-target close/reopen, expired-access refresh, peer logout and no session restoration after logout. The browser previously reproduced `/login` after closing a signed-in tab; the same scenario now expects the protected page. Node tests also cover migration, blocked storage, API-environment isolation, multiple clients, stale refresh/retry responses and account switches. These checks never use real credentials.

The browser flow also holds an old sign-in's `/auth/me` while a peer logs in a replacement account, then releases the old result. Both transport and provider hydration must preserve the new account; guards in the transport alone are insufficient if a provider catch clears every rejected request.

Both the InternalAdmin group and current `/auth/me` permission list gate access. Backend authorization remains authoritative. No sensitive data is cached outside component memory; protected components unmount on session clear.

## Source layout

See [ARCHITECTURE.md](ARCHITECTURE.md) and [AGENTS.md](AGENTS.md) for the feature boundaries and coding rules.

- `src/app`: routes, guards and layouts.
- `src/core`: configuration, transport/envelope, token/session lifecycle.
- `src/features/auth` and `src/features/organizations`: API/model/hooks/pages/components.
- `src/shared`: presentation components and styles.
- `npm run format`: format; `npm run check`: format check, ESLint, API tests, strict typecheck and production build.

Vite uses `--configLoader runner`; backend origin remains `http://localhost:5267`. No backend contract or feature was added during the foundation refactor.

## Deployment and acceptance

This is an independent repository boundary; no sibling source folder is required to build. Git initialization, remote creation, push and deployment are not performed. Configure SPA fallback to `index.html` for direct nested-route visits. Build with the target API origin and serve over HTTPS; configure that deployed origin in backend CORS.

Verify against an isolated running backend: Admin login, page reload restoration, list/detail, Pending approve and reject with notes, repeat-review conflict, forbidden permission, refresh expiry and logout. Do not test irreversible review decisions against production data. Live backend/database/email integration and browser visual checks must be recorded separately from static builds and focused session tests.

## Verification recorded (2026-10-14)

- Dependencies installed successfully; package-lock.json is included for reproducible installs (use npm ci on clean checkouts).
- npm run build passed strict TypeScript checks and the production Vite bundle.
- Focused API/session regression tests passed (8/8), including serialized refresh, logout during refresh, stale account mutations and validation errors.
- Live backend/database/email integration and browser visual acceptance remain pending.

## Foundation verification (18/10/2026)

`npm run check` passed: format, ESLint, 14 API/session tests, TypeScript and production build. No browser/live-backend acceptance was performed.
