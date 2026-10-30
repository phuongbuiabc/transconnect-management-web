---
name: "VieGo Management"
description: "Horizontal transport workspace with clear destinations and spacious records."
colors:
  primary: "#d3171e"
  primary-hover: "#ad1117"
  gold: "#ffc72c"
  canvas: "#f7f7f3"
  panel: "#fff"
  subtle: "#fafaf7"
  text-primary: "#242824"
  text-secondary: "#626963"
  line: "#e3e6de"
  rail: "#181c22"
  rail-text: "#bdc4ce"
  rail-hover: "#292f38"
  focus: "#a30f16"
  panel-line: "#e1e5dc"
  filter-bg: "#fdfefb"
  filter-line: "#d5dccd"
  table-heading-bg: "#f6f8f2"
  table-heading-text: "#637057"
  navigation-text: "#59634f"
  navigation-hover: "#f1f4e9"
  identity-bg: "#f3f5ee"
  identity-text: "#657154"
  input-line: "#cbd1d9"
  secondary-text: "#333d4a"
  secondary-line: "#dce0e6"
  secondary-hover: "#f0f2f5"
  pending-bg: "#fff8e7"
  pending-text: "#826014"
  pending-line: "#f5dfac"
  approved-bg: "#edf8f1"
  approved-text: "#247347"
  approved-line: "#c5e6d3"
  rejected-bg: "#fdefef"
  rejected-text: "#a72732"
  rejected-line: "#f2cdd0"
  danger-outline-text: "#b21218"
  danger-outline-line: "#efb8bb"
  danger-outline-hover: "#fff3f3"
  auth-canvas: "#f7f5f0"
  auth-line: "#e1ddd5"
  auth-divider: "#d9d4ca"
  auth-muted: "#625e58"
  auth-portal-text: "#4b4741"
  auth-portal-hover: "#efece5"
  auth-portal-current: "#f1e7df"
typography:
  display:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "38px"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 600
  control:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 600
  table-body:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
  status:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
  headline-tablet:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "31px"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.04em"
  headline-mobile:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.04em"
  detail-title:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "21px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  panel-title-mobile:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "17px"
    fontWeight: 600
    letterSpacing: "-0.025em"
  record-identity:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  metadata:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
  table-label:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.025em"
  brand:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "28px"
    fontWeight: 700
    letterSpacing: "-0.045em"
  brand-mobile:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 700
    letterSpacing: "-0.045em"
  brand-caption:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "8px"
    fontWeight: 600
    letterSpacing: "0.19em"
  supporting-small:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "10px"
    fontWeight: 400
  identity-letter:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 600
  location-title:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 600
  input-mobile:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 400
  auth-intro:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "clamp(30px, 3.2vw, 46px)"
    fontWeight: 600
    lineHeight: 1.22
    letterSpacing: "-0.035em"
  auth-title:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.03em"
  auth-field:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
  auth-label:
    fontFamily: "Inter, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  status: "5px"
  count: "6px"
  compact-control: "7px"
  control: "8px"
  identity: "9px"
  workspace: "10px"
  panel: "14px"
  auth-form: "16px"
spacing:
  inline: "8px"
  compact: "12px"
  control-gap: "14px"
  small: "16px"
  mobile-gutter: "18px"
  medium: "20px"
  panel: "24px"
  section: "28px"
  page: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.secondary-text}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-danger-outline:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.danger-outline-text}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  navigation-current:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.panel}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
  status-pending:
    backgroundColor: "{colors.pending-bg}"
    textColor: "{colors.pending-text}"
    typography: "{typography.status}"
    rounded: "{rounded.status}"
    padding: "5px 10px"
  status-approved:
    backgroundColor: "{colors.approved-bg}"
    textColor: "{colors.approved-text}"
    typography: "{typography.status}"
    rounded: "{rounded.status}"
    padding: "5px 10px"
  status-rejected:
    backgroundColor: "{colors.rejected-bg}"
    textColor: "{colors.rejected-text}"
    typography: "{typography.status}"
    rounded: "{rounded.status}"
    padding: "5px 10px"
  filter-input:
    backgroundColor: "{colors.filter-bg}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "46px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
  entity-initial:
    backgroundColor: "{colors.identity-bg}"
    size: "42px"
  auth-form:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.auth-form}"
    padding: "36px"
  auth-account-select:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-primary}"
    typography: "{typography.auth-field}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  auth-portal-current:
    backgroundColor: "{colors.auth-portal-current}"
    textColor: "{colors.primary-hover}"
    padding: "22px 12px"
---

# Design System: VieGo Management

## Overview

**Creative North Star: "Swiss transport wayfinding"**

Clear destinations, aligned records and restrained surfaces define this Management application. A full-width crimson brand header and white horizontal destination row introduce a warm, light workspace. Generous task headings and roomy records make identity, status and next actions easy to scan; gold provides brand punctuation.

This is the implemented Management system. It complements the shared [VieGo cross-platform design guidance](../../TransConnect-Docs/06-ui/VIEGO_DESIGN_SYSTEM.md), which retains brand and business authority. The user-selected horizontal composition supersedes the earlier desktop rail while preserving the established list-to-detail workflow.

**Key Characteristics:**

- Crimson brand header and white horizontal destinations on desktop.
- Warm white work surfaces, spacious records and a clear task hierarchy.
- Flat bordered panels, restrained corners and labeled semantic statuses.
- Local Vietnamese Inter typography and inline SVG control icons.
- Charcoal navigation retained only as the mobile drawer.

Evidence: `src/main.tsx` loads `base.css`, `workspace.css`, then `experience.css`; the last file owns the horizontal composition and current overrides. Location-specific rules also live in `src/features/locations/locations.css`. The approved composition is recorded in `.impeccable/surfaces/src-app-layouts-adminlayout-tsx.md` and PRODUCT.md. Final `.ui-artifacts/after` captures use synthetic fixtures; they do not establish live API, deployment, physical-device or complete security acceptance. This code-led build has no approved image composition and introduces no shipping raster imagery. The prior world seed remains provenance, not a new selection roll.

The auth extension follows the user's choice “Hai trang đăng nhập riêng” within this same brand. `LoginPage.tsx`, its local `login.css` and `App.tsx` establish separate Admin and Partner entry pages. Source review found no material code defects. Fresh `.ui-artifacts/after` captures cover desktop, mobile, small and tablet Admin entry, desktop/mobile Partner entry, mobile registration and registration error, and desktop login error. These captures use loopback fixture pages; temporary local browser sandbox flags enabled capture without changing the shipping script. They do not establish live backend acceptance. Final capture review and check results are recorded with the delivery evidence.

## Colors

The normative frontmatter pairs transport crimson and wayfinding gold with warm, low-chroma work surfaces.

### Primary

- **Transport crimson** owns the brand header, selected destination and primary actions. Its deeper hover state also supports links.
- **Focus crimson** provides the keyboard outline on light surfaces.

### Secondary

- **Wayfinding gold** punctuates the brand and supplies keyboard focus contrast on crimson and charcoal surfaces.

### Neutral

- **Canvas, panel and subtle** distinguish page, primary work surface and subordinate content.
- **Primary and secondary text** separate task identity from supporting information.
- **Panel line, filter line and table heading tones** create gentle structure within records.
- **Navigation text and hover** belong to the desktop white destination row.
- **Rail, rail text and rail hover** belong to the charcoal mobile drawer.
- **Identity background and text** distinguish reusable record initials.
- **Auth cream canvas, warm lines and muted text** belong to the public entry pages. Portal rows use a pale warm hover and selected fill with deeper crimson text; these auth roles do not replace the Management shell palette.

Pending amber, approved green and rejected red remain semantic status families, each with a label, dot, fill and border.

**The Destination Rule.** Exactly one route-driven current destination uses the solid crimson tile and white label, synchronized with aria-current; desktop destinations sit in the white horizontal row.

**The Brand Continuity Rule.** Retain the established crimson and gold roles when extending Management.

## Typography

**Display Font:** Inter, with Segoe UI and sans-serif fallbacks.
**Body Font:** The same family throughout.

Local Latin and Vietnamese files supply regular, semibold and bold weights under the SIL Open Font License in `public/fonts`. The frontmatter records role-specific sizes rather than a manufactured mathematical scale.

### Hierarchy

- **Display:** Retained legacy display role; current login context uses the dedicated auth-intro role. Auth context is semibold, fluid on desktop, 32px at 900px and 28px at 700px; it remains visible on mobile.
- **Headline:** Semibold Management task headings; headline-tablet applies at 900px and headline-mobile at 760px. These large headings anchor the work area.
- **Title:** Panel toolbar titles; mobile toolbar titles use panel-title-mobile. Detail panels use detail-title. Auth form headings use auth-title, reducing to 24px at 700px.
- **Auth field and label:** Readable native inputs/selects use auth-field with semibold auth-label labels. Supporting form descriptions use 13px type and a 1.75 line height; portal descriptions and footer copy use 12px.
- **Body:** General content, descriptions and fields; mobile supporting page descriptions reduce to 13px.
- **Record identity and table body:** Semibold identity sits above regular secondary record data. Metadata describes registration codes and supporting information.
- **Label and table label:** Visible field labels and uppercase, lightly tracked table headings.
- **Control and status:** Semibold action and destination labels; small labeled semantic chips. Inline actions use 12px where space is constrained.
- **Brand and brand caption:** The wordmark and small uppercase MANAGEMENT caption are identity treatments, not task text. The header wordmark uses brand-mobile below 900px. Login and drawer retain their existing 27px wordmark and 9px caption.

Tables use tabular numerals. Inputs, selects and textareas use 16px at 760px and below, including filter fields. The supporting-small role is limited to account-role, footer and quiet context copy. Identity-letter and location-title describe record initials and local record headings; input-mobile preserves mobile text entry. Small status, account-role and brand-caption sizes are limited to these supporting roles; they do not replace readable task titles or form controls.

## Layout

Desktop uses a full-width crimson brand/account header (minimum 92px) followed by a white horizontal destination row (72px). The main region spans the viewport. Breadcrumb context sits in a transparent band (52px). Content is centered within a maximum width (1440px), using horizontal gutters from the page spacing token and bottom padding (52px). Main headings leave a clear gap (32px) before work panels.

List panels combine toolbar, wrapping filters, aligned records and footer. Desktop toolbar and filter horizontal padding is 28px; filters use 24px vertical padding and 18px gaps. Record cells use 22px vertical and 28px horizontal padding, with larger identity badges. These are spacious working records rather than compact dashboard tiles.

At 1100px and below, shell gutters reduce to 28px. At 900px and below, the header reduces to a minimum 74px, secondary account details hide, and horizontal destinations become a charcoal off-canvas drawer with a scrim and close control. The drawer width is the lesser of 300px and viewport width minus 48px. Breadcrumb/menu context uses a 56px band, content gutters reduce to 22px, and detail columns stack.

At 760px and below, content gutters use mobile-gutter, headings wrap, and filters fill the available width. Tables become stacked two-column record groups with identity and actions spanning the group; the semantic table header remains available to assistive technology. Record groups use 22px vertical and 18px horizontal padding. Wider history tables retain a scroll container. Preserve long-name and long-email wrapping.

Detail information and review panels align at the top in a proportional grid (1.1fr / 1fr) with 28px gaps and panel padding. Secondary history follows across the full width. Location forms place fields beside a map region and stack at 1000px; their local heading layout also adapts at 600px.

Auth pages pair cream context and portal navigation with a white bordered form in a proportional grid (1fr / 0.92fr), within a 1120px maximum content width at 90% of the viewport. A thin crimson top rule and shared VieGo brand maintain continuity. The context/form gap is fluid (40px to 104px); content has 56px vertical padding. At 900px the content width is 92%, gap is 32px and form padding is 28px. At 700px context and form stack with 20px side gutters, 28px gaps and 24px form padding; portal links become two adjacent compact segments. Header context, the secondary footer line and partner note hide, while the context heading remains. Session restoration copy remains concise supporting text; storage and transport behavior are not visual tokens.

## Elevation & Depth

Depth comes from tonal surfaces, fine borders and the contrast between the brand header, destination strip and workspace. Ordinary work panels and location panels remain shadowless. The mobile drawer establishes modal depth through its scrim and stacking order.

**The Flat Work Surface Rule.** Keep resting work panels shadowless; use borders and surface tones to group information.

## Shapes

Horizontal work panels use the panel radius; fields, buttons and destination tiles use the control radius. Detail history retains its existing panel treatment. Status chips and counts have tighter corners. Thin solid borders define fields, panels and statuses. The brand symbol retains its asymmetric corner and gold route stroke. Compact header and review controls use the compact-control radius. Record initials use the identity radius as modestly rounded square badges; account avatars remain circular.

Auth forms use the dedicated auth-form radius. Desktop portal choices are flat divided rows with a circular selected indicator; mobile choices share a single control-radius outline.

## Components

### Buttons

Solid crimson primary and danger actions use white labels and a deeper hover. White secondary controls use a neutral border and pale hover; the page-heading refresh variant has a transparent resting fill and warmer border. Rejection can use the outlined danger variant. Standard controls have a minimum height (44px), filter and desktop heading controls 46px, inline record actions 38px, and pagination 40px. Disabled controls reduce opacity (0.48) and show an unavailable cursor.

Color changes use short transitions (0.16s, ease). Preserve reduced-motion behavior and visible keyboard focus.

### Chips

Status chips pair a text label and small dot with semantic fill, stroke and text color. In the horizontal workspace they use the status role and 5px / 10px padding. Counts use a warm neutral fill, border and 11px type. Status is never conveyed through color alone.

### Cards / Containers

Panels are white, flat and lightly bordered. Toolbars, roomy filters and fine record separators supply structure. Detail panels use 28px padding, reducing to 22px on mobile. Expanded content uses the subtle surface. Loading, empty, error and success states remain visually distinct.

### Inputs / Fields

Fields have visible labels, a fine stroke and the control radius. General fields remain white with the input-line stroke; horizontal list filters use the warmer filter background and stroke with a 46px minimum height. Hover darkens the border; focus turns it crimson. The shared outline is 3px with a 3px offset. Header and drawer focus use gold; the desktop white destination row uses deeper crimson. Auth fields and submit controls use a 50px minimum height; auth inputs/selects use 16px type at 700px and below, with the inherited mobile input rule also applying through 760px. Preserve invalid-state messages and disabled behavior.

### Auth entry

`/login/admin` presents a styled native account select labeled **Tài khoản**, with **Sysadmin** selected by default and a password field. The selector displays names only; Sysadmin maps internally to admin@hotmail.com. Developer, Data engineer and Accountant are selectable but unconfigured: an inline status explains why password entry and submission are disabled. Changing accounts clears the password and obsolete errors. The selector uses a subtle surface, semibold name, crimson person icon and neutral chevron, while retaining native keyboard behavior. `/login/partner` presents a business email and password with Partner-only account creation. `/login` redirects to `/login/admin` for compatibility. Both pages use the same cream context/form composition, route-specific headings and icons, route-driven portal selection and current VieGo red/gold identity. Busy state prevents duplicate submission and portal changes; errors focus the summary and link to invalid fields. Password visibility remains an explicit labeled control. The auth layout is an extension of the current world, with no raster imagery or image comp.

### Navigation

Desktop destinations are an inline row of SVG icons and concise semibold labels on white. The selected crimson tile has no trailing route marker on desktop. The mobile drawer keeps its charcoal surface, selected tile and trailing marker, with explicit close control and overlay. Breadcrumbs give quieter context below the main navigation.

### Records and details

Record identity pairs a 42px initial badge with a name and metadata. Status and actions stay aligned across the generous rows; on mobile they reflow into stacked record groups. Pagination communicates the current page. Detail views place information and review before history. Shared presentation components do not own data access or business permissions.

## Do's and Don'ts

### Do:

- **Do** retain the crimson header, white desktop destination row and gold brand punctuation.
- **Do** keep exactly one route-driven current destination.
- **Do** use local Inter assets and SVG control icons.
- **Do** preserve visible keyboard focus, labeled statuses and mobile record reflow.
- **Do** place detail information and review ahead of secondary history.

### Don't:

- **Don't** restore a permanent desktop rail within the approved horizontal shell.
- **Don't** add resting shadows to ordinary work panels.
- **Don't** replace status labels with color alone.
- **Don't** treat fixture screenshots as evidence of live backend acceptance.
- **Don't** promote legacy decorative labels into a reusable heading pattern.
