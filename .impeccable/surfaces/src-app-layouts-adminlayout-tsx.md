---
version: 1
slug: "src-app-layouts-adminlayout-tsx"
primary_target: "src/app/layouts/AdminLayout.tsx"
related_targets: ["src/features/organizations/pages/OrganizationListPage.tsx","src/features/auth/pages/LoginPage.tsx"]
---

# VieGo Management redesign

Mode: Operate. Scope: Admin shell, current lists/details, Partner entry and auth. Keep APIs, permission guards, functionality and red/gold brand.

THESIS: Make reviewing transport records a clear list-to-detail workflow. Reject a decorative KPI dashboard unsupported by backend data.

OWN-WORLD: VieGo's crimson now owns the full-width brand header. A white horizontal destination row sits over a neutral light work canvas; gold punctuates the brand. Local Vietnamese Inter, larger task headings and readable data columns give the work room. Standard SVG controls stay consistent.

STORY: The operator identifies the current workspace and destination, filters real records, reads identity/status and opens the correct detail or action. Empty/error/loading are distinct.

FIRST VIEWPORT: 76px minimum crimson brand/account header, 64px white horizontal destination row, quiet breadcrumbs, 28px task title and full-width records inside a 1440px work area. Primary task remains top right. Selection is a crimson tile synchronized with URL/back/detail. Under 900px the destination row becomes the accessible drawer; mobile records remain stacked. No invented metrics. Auth follows the user choice “Hai trang đăng nhập riêng”: /login/admin and /login/partner share a neutral context/form layout in the current VieGo brand; /login redirects to /login/admin. Admin uses a native Sysadmin select defaulting to admin@hotmail.com; Partner uses business email and offers account creation. Login restores the saved browser session and logout remains explicit.

FORM: User-pinned horizontal work area in FE-EXPERIENCE-03, confirmed verbatim in Q&A; retains list-centred workflow and red/gold from the prior world. Prior world reference seed:6a4e832589d162d0; no new roll claimed for this precisely chosen composition. Code-led Operate build, no approved image comp. The explicit horizontal choice supersedes the prior rail's composition.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Evidence: official Uber Fleet Hub and Uber Freight product guides; existing APIs and original/current screenshots. All browser demonstration records stay in test fixture code, never application state. Live BE success remains separate from fixture verification.

Auth extension evidence (2026-10-31): code-led extension of the existing red/gold Inter world; no new world, raster imagery or approved image comp. Source review found no material code defects. Fresh .ui-artifacts/after captures cover Admin desktop/mobile/small/tablet, Partner desktop/mobile, mobile registration/error and desktop login error. Loopback fixture browser capture passed using temporary local sandbox flags; the shipping script is unchanged. This evidence does not establish live backend acceptance. Final capture review and check results are recorded with the delivery evidence.

FE-TASTE-05 (31/10/2026): Scoped refinement using design-taste-frontend Accent ladder seed 819189164, retaining the user-pinned horizontal crimson shell and brand Inter/red/gold. App question: which transport record needs review, and how to open it? Signature: real organization identity, registration and status next to its record action. Type 28/26/24px task headings; 13–14px records; 11px brand captions; 44px controls. Phone filters and panel spacing condensed; tablet names gain room by hiding redundant initials. No feature/API/session changes. Browser fixture and taste evidence belong to the tracker; none establishes live backend acceptance.
