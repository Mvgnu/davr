## Next Iterations Plan (UI/UX, Dashboard, Messaging)

Date: 2025-10-23

### Overview
Focus the next sprint on polishing core user journeys (browse materials and centers, trust/credibility, simple contact) and consolidating admin operations into a coherent dashboard. Messaging is scoped as a pragmatic MVP with rate limiting and email notifications.

### Completed in this Session
- Fixed marketplace/new crash by wrapping `ListingForm` with shadcn `Form` provider; stabilized form state.
- Added `Topbar` with contact/trust signals; upgraded auth actions to avatar dropdown.
- Replaced broken hero/illustration image paths with existing assets; removed 404s.
- Standardized placeholders in cards to existing images (no missing assets).
- Switched recycling center detail page to query Prisma directly by slug, eliminating API 404s/timeouts.
- Completed materials page revamp: URL-synced sidebar (search, location, type UI), server-side search, proper pagination, and grid with images/placeholders. No image 404s.

### Outstanding from the Initial Brief (to implement next)
1) Admin dashboard expansion/fixing (modules + sidebar navigation not yet implemented along testing of admin features and pages)
2) Navbar polish (trust/auth microcopy and responsive checks)
3) Assets & accessibility cleanup (alt text, remove 404s)

---

## 1) Materials Listing Page Revamp
Goal: Move from a plain list to a modern, minimal grid with images and concise descriptions; add a left sidebar for query, location, and quick filters.

Planned UI
- Left sidebar (sticky on desktop):
  - Search input (material name)
  - Location input (PLZ/Ort) – future: drive center proximity queries
  - Material type selector (Metalle, Kunststoffe, Papier, Glas, Elektronik, Alle)
- Main content:
  - Card grid using `MaterialPreviewCard` (image, name, brief text)
  - Pagination at bottom

Files/Areas
- `app/materials/page.tsx` (sidebar wiring → URL params; pagination uses `PaginationControls`)
- `components/materials/MaterialPreviewCard.tsx` (ready)
- `components/ui` (inputs/select already exist)
- `components/materials/MaterialsSidebarFilters.tsx` (new)

Data/Logic
- Keep server-side Prisma pagination.
- Defer geolocation/proximity to centers; for now, location is a captured query param.

Acceptance Criteria
- Sidebar controls persist in URL; back/forward works.
- Card grid shows images or placeholder and brief descriptions.
- No image 404s; responsive at sm/md/lg.
Status: Completed 2025-10-23 (criteria met)

---

## 2) Recycling Center Detail Revamp
Goal: Present a trustworthy, scannable detail page with clear contact and materials. Add right-hand sidebar with actionable cards.

Planned UI
- Right sidebar cards:
  - Contact (phone, website, email if present)
  - Address/map mini-card (links to map section)
  - Verification status badge; Claim button if unmanaged
  - CTA: "Nachricht senden" (opens modal)
- Main column:
  - Title, description (if available)
  - Accepted materials (cards with price/unit/notes; link to material details)
  - Full map section
  - Reviews section

Files/Areas
- `app/recycling-centers/[slug]/ClientRecyclingCenterDetail.tsx` (layout + sidebar)
- New: `components/recycling-centers/ContactCenterModal.tsx` (messaging modal, guest + user)

Acceptance Criteria
- Page loads fast (direct Prisma fetch by slug).
- Sidebar contact and CTAs visible above-the-fold on desktop.
- Messaging modal triggers with basic validation and success feedback.
Status: Completed 2025-10-23

---

## 3) Admin Dashboard Expansion
Goal: Coherent admin panel with sidebar and modules for users, centers, materials, listings, reviews, claims, messages.

Planned Structure
- Layout: `app/admin/layout.tsx` already provides sidebar. Ensure entries:
  - Dashboard (stats)
  - Users, Listings, Centers, Materials, Reviews, Claims, Messages
- Pages/Modules:
  - Keep stats page (`app/admin/page.tsx`), add placeholders for missing modules

Files/Areas
- `app/admin/layout.tsx` (ensure links)
- `app/admin/*` pages and corresponding client components under `components/admin/`

Acceptance Criteria
- Sidebar navigation covers all modules; active states work.
- Each module page loads and shows at least a working list or a placeholder with clear next actions.
Progress
- Sidebar updated with Blog, Claims, Analytics, Messages, Settings
- Messages page added (lists latest 50 messages)

---

## 4) Messaging MVP (Guest-Friendly)
Goal: Enable contacting a center via on-platform form. If logged in, associate sender; if guest, collect name/email/phone.

Data Model (Prisma)
```prisma
model Message {
  id              String   @id @default(cuid())
  senderUserId    String?  // nullable for guest
  senderName      String?
  senderEmail     String?
  senderPhone     String?
  recipientUserId String?  // center owner, if known
  centerId        String?  // optional association
  subject         String
  content         String
  status          String   @default("new") // new|sent|failed|spam
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
}
```

API
- POST `app/api/messages/route.ts`
  - Validates input (zod)
  - Rate limit per IP (`lib/rate-limit.ts`)
  - If `recipientUserId` not resolvable (no `managedById`), route to support email
  - Sends email via `lib/email/sendEmail`
  - Returns success JSON; no inbox UI in v1

UI
- `ContactCenterModal` used on center detail
  - Logged-in: subject, message
  - Guest: name, email (required), phone (optional), subject, message, consent checkbox

Security & Abuse
- Rate limit (e.g., 3/min per IP)
- Honeypot field; optional captcha stub
- Server-side HTML escape or plaintext emails

Acceptance Criteria
- Valid submissions persist `Message` row and send notification email.
- Guests can submit with required fields; clear confirmation displayed.

---

## 5) Navbar Polish (Trust & Auth)
Follow-ups
- Microcopy pass (DE): button labels, hover states
- Responsive checks for Topbar contact/trust chips
- Add link to privacy/imprint in Topbar dropdown (optional)
Status: Minor, deprioritized in favor of auth UX

---

## 6) Assets & Accessibility
- Eliminate any remaining image 404s; ensure alt text coverage.
- Prefer SVGs for large hero backgrounds to reduce payload.

---

## 7) QA & Rollout
- Lint + type checks after each module
- Smoke tests:
  - Materials list filtering + pagination
  - Center detail loads by slug; materials and map render
  - Messaging POST works (fake SMTP or MailHog)
  - Admin sidebar routes resolve
  - Login/Register flows render and form submit/validation work

---

## 8) Deep Refactor: Materials & Center Detail (UX-first)

### Goals (North Star)
- Materials: Fast “what is X?” comprehension and clear next steps (learn, find where to recycle, related). Low cognitive load, strong visual hierarchy.
- Center Detail: Trust-first profile with obvious primary CTAs (Nachricht senden, Anrufen, Route), verified status, clear accepted materials with terms/prices, and scannable info.

### Users’ Primary Jobs
- Materials: understand material, see images/icons, where to bring, related materials, safety/notes.
- Center: confirm legitimacy, contact quickly, see accepted materials + price/unit, opening hours, location, reviews.

### Information Architecture (IA)
- Materials page
  1) Hero: title + short explainer + search
  2) Quick categories (chips) + featured materials
  3) Grid (image, name, short blurb) + pagination
  4) “Where to bring” explainer + links to centers
  5) Related/Popular materials + FAQ
- Center detail
  1) Hero block: name, city, verification badge, rating count, primary CTAs (Nachricht senden, Anrufen)
  2) Right sticky sidebar: Contact, Address+Map link, Verification/Claim
  3) Main: About (short description), Accepted materials (cards: name, price/unit, notes), Full Map, Reviews

### Wireframe (high-level)
- Materials
  [Hero]
  [Chips]
  [Grid 3x]
  [Where to bring]
  [Related/FAQ]
- Center
  [Hero + CTAs]
  [Main 2/3] About → Materials → Map → Reviews | [Sidebar 1/3] Contact/Address/Verify

### New/Updated Components
- Shared: `TrustBadge`, `StatPill`, `InfoSection`, `InlineAlert`, `SectionHeader`.
- Materials: `MaterialsHero`, `MaterialCardV2`, `CategoryChips`, `WhereToBringPanel`.
- Center: `CenterHero`, `AcceptedMaterialCard`, `SidebarSticky`, `ContactCenterModal` (enhanced), `VerificationPanel`.

### Data & API
- Use existing Prisma models (Material, RecyclingCenter, Offers, Reviews, WorkingHours).
- Compute avg rating/count server-side; keep verification status; optional: surface `WorkingHours`.
- No schema changes for Phase 1.

### Trust & Content
- Verification badge, review count, claimed status, last updated.
- Clear microcopy for CTAs; privacy/consent text in contact modal.

### Accessibility & Performance
- Proper headings order, focus management for modal, visible focus states.
- Server Components for data; image optimization; skeletons for lists.

### Phases
- Phase 1 (Layout + Components + Copy):
  - Materials: hero + chips + new grid + where-to-bring section.
  - Center: hero + sticky sidebar + accepted materials cards + map anchor.
- Phase 2 (Enrichment):
  - Center: working hours, richer reviews UI; Materials: related/FAQ modules.
- Phase 3 (Polish & QA): visual refinements, micro-interactions, telemetry.

### Acceptance Criteria
- Materials: above-the-fold explains purpose; categories and grid feel consistent; clear next steps.
- Center: primary CTAs visible on desktop; verification status discoverable; materials list readable with price/unit; map reachable via anchor.

### Rollout
- Ship Phase 1 behind component flags if needed; incremental PRs per page; QA after each.

Status: Planning approved (2025-10-24). Proceed to Phase 1 implementation next.

## Milestones & Estimates (High-Level)
1) Materials page finalize: 0.5–1 day
2) Center detail sidebar + modal: 1–1.5 days
3) Messaging model + API + email: 1 day
4) Admin modules scaffolding: 1 day
5) Polish & QA: 0.5 day

---

## Risks & Notes
- Messaging requires a Prisma migration; coordinate DB access and backups.
- Email delivery depends on SMTP envs (`EMAIL_SERVER_*`, `EMAIL_FROM`). Provide fallbacks in dev.
- Future: real-time inbox and two-way threads; for now, keep scope to outbound notifications.


