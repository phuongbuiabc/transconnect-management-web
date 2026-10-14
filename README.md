# TransConnect Management Web

Independent React + Vite + TypeScript + Tailwind application for TransConnect administration. Vietnamese interface follows the crimson/gold product direction. This first sprint implements Internal Admin organization review, with no mock data.

## Local setup

Requires Node.js 24 or newer and npm. From this folder:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. Set `VITE_API_BASE_URL` in `.env` to the backend origin, with no `/api` suffix. The example uses http://localhost:5267. The backend may redirect HTTP to HTTPS at https://localhost:7218; trust its development certificate or configure the appropriate backend origin. Restart Vite after changing environment values. Never put secrets in VITE variables: they are public bundle configuration.

The backend is a separate .NET 10 + SQL Server service. Follow its README to configure its database and Development settings, apply migrations and start the Host. Permit the frontend origin through backend CORS. Use a provisioned InternalAdmin account with `organizations.manage` permission. This frontend provides no public Admin registration and embeds no credentials.

## Commands

- `npm run dev`: local development server.
- `npm run typecheck`: strict TypeScript validation.
- `npm run build`: typecheck and production bundle.
- `npm run preview`: inspect the built bundle locally.
- `npm test`: focused Node 24 session/API regression tests.

## Implemented scope

- `/login`: InternalAdmin email/password authentication only.
- `/admin/organizations`: authorized organization list, local search and status filter.
- `/admin/organizations/:id`: registration details and one-time Pending approval/rejection with required note (maximum 2000 characters).
- Approval uses the backend review endpoint, which queues the Owner invitation; the frontend does not send a second invitation.
- Arrays contain at most 200 organizations. Counts and filtering describe only the loaded subset, not platform totals or server-side pagination.
- Error, loading, empty, denied-access and expired-session states; responsive keyboard-accessible forms and navigation.

Partner, pending-driver review, RBAC editing, quotas, vehicle management and mobile clients are later increments. No trips, bookings, payments, document uploads, invented statistics or unsupported profile editing are included.

## Session and security behavior

Backend tokens currently arrive in JSON, not HttpOnly cookies. Access and refresh tokens are stored in `sessionStorage` for same-tab restoration; blocked storage falls back to memory. Closing the tab ends this browser persistence. JavaScript can read these tokens, so production must apply HTTPS, a restrictive CSP and trusted scripts; a future server cookie/BFF design requires a separate backend contract.

The API client serializes refresh rotation, retries an unauthorized request once, and clears the local session on refresh rejection. Session generations prevent late responses or refreshes from restoring a logged-out session or replaying a prior account's action after an account switch. Logout clears local protected state immediately, then attempts backend refresh-token revocation; backend revocation can fail when offline and tokens then remain subject to backend expiry/revocation rules. A failed protected bootstrap due to network errors can be retried without silently discarding an otherwise valid session.

Both the InternalAdmin group and current `/auth/me` permission list gate access. Backend authorization remains authoritative. No sensitive data is cached outside component memory; protected components unmount on session clear.

## Source layout

- `src/lib/api.ts`: typed API envelope, errors and token lifecycle.
- `src/auth.tsx`: current-user bootstrap and session provider.
- `src/App.tsx`: routes, login, permission guard and shell.
- `src/organizations.tsx`: organization list, detail and review.
- `src/ui.tsx` and `src/styles.css`: shared feedback and responsive design tokens.

## Deployment and acceptance

This is an independent repository boundary; no sibling source folder is required to build. Git initialization, remote creation, push and deployment are not performed. Configure SPA fallback to `index.html` for direct nested-route visits. Build with the target API origin and serve over HTTPS; configure that deployed origin in backend CORS.

Verify against an isolated running backend: Admin login, page reload restoration, list/detail, Pending approve and reject with notes, repeat-review conflict, forbidden permission, refresh expiry and logout. Do not test irreversible review decisions against production data. Live backend/database/email integration and browser visual checks must be recorded separately from static builds and focused session tests.

## Verification recorded (2026-10-14)

- Dependencies installed successfully; package-lock.json is included for reproducible installs (use npm ci on clean checkouts).
- npm run build passed strict TypeScript checks and the production Vite bundle.
- Focused API/session regression tests passed (8/8), including serialized refresh, logout during refresh, stale account mutations and validation errors.
- Live backend/database/email integration and browser visual acceptance remain pending.
