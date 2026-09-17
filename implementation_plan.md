# Implementation Plan - Jorawar Dham Digital Platform (Phase 1)

Building the complete, production-grade technical foundation for **Jorawar Dham** — a revered pilgrimage and religious organization in Rajasthan, India. Phase 1 establishes the core architecture (Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, PostgreSQL, Prisma ORM, Argon2id authentication, RBAC, Hindi & English i18n, secure storage abstraction, Admin CMS, audit logging, security headers, and devotional design system) without implementing the incomplete booking/payment flow.

## User Review Required

> [!IMPORTANT]
> **Database Credentials & Local Setup**: A local PostgreSQL 18.4 instance is already running on `localhost:5432`. We have verified connectivity with user `postgres` and created a dedicated database `jorawar_dham_db`. The connection string `postgresql://postgres:Aditya123tya%40@localhost:5432/jorawar_dham_db?schema=public` will be placed in `.env` (gitignored), and `.env.example` will contain sanitized placeholders only.

> [!NOTE]
> **Initial Super Admin Seed**: The initial database seed will provision a `SUPER_ADMIN` account (`admin@jorawardham.org` / temporary secure initial password configured via environment variable) with full privileges, alongside default roles, permissions, site settings, and bilingual content for Jorawar Dham.

> [!NOTE]
> **No Git Commit Rule**: In accordance with user rules, no `git commit` operations will be run without explicit user permission.

## Proposed Architecture & Directory Structure

```
d:/Stashlar internship projects/Joravar Dham/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # Bilingual public layout (Navbar, Footer, Language Switcher, SEO)
│   │   ├── page.tsx                # Homepage (Hero, Live Notices, Darshan Timings, Seva, Events, Gallery, About)
│   │   ├── about/page.tsx          # About Jorawar Dham
│   │   ├── history/page.tsx        # Sacred History & Lineage
│   │   ├── dham/page.tsx           # Dham Information & Visitor Guide
│   │   ├── darshan/page.tsx        # Darshan Timings, Aarti, Rules & Guidelines
│   │   ├── seva/page.tsx           # Daily Sevas & Religious Offerings Overview
│   │   ├── events/page.tsx         # Upcoming Festivals & Special Poojas
│   │   ├── gallery/page.tsx        # Sacred Photo Gallery (filterable by category)
│   │   └── contact/page.tsx        # Contact, Map Directions & Inquiries
│   ├── admin/
│   │   ├── login/page.tsx          # Secure Admin Login with Argon2id verification & rate limit
│   │   ├── layout.tsx              # Admin layout with sidebar, navigation, role badge, logout
│   │   ├── dashboard/page.tsx      # Metrics summary, recent audit logs, quick links
│   │   ├── content/
│   │   │   ├── pages/page.tsx      # Edit dynamic page sections (Bilingual)
│   │   │   └── faqs/page.tsx       # FAQ management
│   │   ├── notices/page.tsx        # Notice board management (pinning, priority, bilingual)
│   │   ├── events/page.tsx         # Events & Festivals management
│   │   ├── gallery/page.tsx        # Photo gallery & media asset management
│   │   ├── settings/page.tsx       # Temple timings, contact details, social links
│   │   └── audit-logs/page.tsx     # Security audit trail viewer
│   ├── api/
│   │   ├── admin/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── content/route.ts
│   │   │   ├── notices/route.ts
│   │   │   ├── events/route.ts
│   │   │   ├── gallery/route.ts
│   │   │   ├── settings/route.ts
│   │   │   └── audit-logs/route.ts
│   │   ├── media/
│   │   │   ├── upload/route.ts     # Protected upload endpoint with strict file validation
│   │   │   └── [filename]/route.ts # Secure file delivery with MIME & traversal guards
│   │   └── public/
│   │       ├── content/route.ts
│   │       ├── notices/route.ts
│   │       └── events/route.ts
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Spiritual palette, Devanagari typography, custom utilities
├── components/
│   ├── ui/                         # Buttons, Cards, Modals, Inputs, Badges, Tabs, Alerts
│   ├── layout/                     # Navbar, MobileMenu, Footer, Breadcrumbs, LanguageSwitcher
│   ├── public/                     # Hero, DarshanTimings, NoticeTicker, EventCard, GalleryGrid
│   ├── admin/                      # AdminSidebar, AdminHeader, BilingualInput, DataTable, AuditViewer
│   └── forms/                      # NoticeForm, EventForm, PageSectionForm, GalleryUploadForm
├── lib/
│   ├── auth/                       # Argon2id hasher, session signer, cookies, RBAC guard
│   ├── db/                         # Prisma client singleton with connection caching
│   ├── storage/                    # StorageService abstraction & LocalStorageService
│   ├── validation/                 # Zod schemas for admin login, notices, events, pages, media
│   ├── security/                   # Rate limiter, sanitizers, CSRF/token utils, headers config
│   ├── utils/                      # Locale helpers, formatting, slugifiers, safe error parser
│   └── logger/                     # Structured logger with redaction of secrets/PII
├── messages/
│   ├── hi/common.json              # Hindi UI translations (Devanagari)
│   └── en/common.json              # English UI translations
├── prisma/
│   ├── schema.prisma               # Normalized schema with 18 entities, UUIDs, indexes
│   ├── seed.ts                     # Database seeder with initial admin, roles, settings, content
│   └── migrations/                 # Real Prisma migration SQL files
├── storage/
│   └── uploads/                    # Local storage directory outside web root
└── docs/
    ├── architecture.md             # System architecture & design choices
    ├── database.md                 # Entity relationship diagram & schema guide
    ├── security.md                 # Threat model, RBAC, password hashing, headers, audit
    ├── i18n.md                     # Bilingual routing & translation system
    ├── storage.md                  # StorageService abstraction & security rules
    └── admin.md                    # Admin CMS guide & role permissions
```

---

## Technical Components & Detailed Plan

### 1. Multilingual Routing & Devanagari Typography
- **Locale handling**: Strict `hi` and `en` locales.
- **Routing**: `app/[locale]/...` where the layout detects locale, sets `<html lang="hi" dir="ltr">`, and injects appropriate Google Fonts:
  - Devanagari font: **Noto Sans Devanagari** / **Rozha One** / **Poppins** for crisp, elegant Devanagari ligatures and matras.
  - Latin font: **Outfit** / **Inter** for modern readability.
- **Language Switcher**:
  - Automatically translates current pathname between `/hi/...` and `/en/...` without loss of route context or query parameters.
  - Persists language preference in an `app_locale` cookie.
  - Renders appropriate `hreflang` alternate tags and canonical link tags for SEO.
- **Translation System**:
  - Static UI strings: `messages/hi/common.json` and `messages/en/common.json` with helper `getDictionary(locale)`.
  - Dynamic CMS content: Database stores bilingual columns (`titleHi`, `titleEn`, `descriptionHi`, `descriptionEn`, `bodyHi`, `bodyEn`, etc.), and helper `localize(item, locale, field)` automatically picks the appropriate language with graceful fallback.

### 2. Database Schema (PostgreSQL + Prisma)
The schema will be fully normalized and include:
- **`Admin`**: `id` (UUID), `username` (unique), `email` (unique), `passwordHash`, `firstName`, `lastName`, `status` (ACTIVE, SUSPENDED), `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, timestamps.
- **`Role`**: `id`, `name` (SUPER_ADMIN, CONTENT_ADMIN, BOOKING_ADMIN, FINANCE_ADMIN, EVENT_ADMIN, STAFF), `description`.
- **`Permission`**: `id`, `code` (e.g. `content:read`, `content:write`, `notices:publish`, `settings:manage`, `audit:read`, etc.), `module`.
- **`AdminRole`**: Composite join table `[adminId, roleId]`.
- **`RolePermission`**: Composite join table `[roleId, permissionId]`.
- **`AdminSession`**: `id` (UUID), `adminId`, `sessionTokenHash` (SHA-256), `expiresAt`, `ipAddress`, `userAgent`, `createdAt`.
- **`User`** (Devotee Foundation): `id` (UUID), `phone` (unique), `email`, `fullName`, `isPhoneVerified`, `status`, timestamps.
- **`OtpRequest`**: `id`, `identifier` (phone/email), `hashedOtp` (HMAC/salt), `purpose` (LOGIN, VERIFY), `attempts`, `expiresAt`, `verifiedAt`, `ipAddress`.
- **`Page`**: `id`, `slug` (unique), `isSystem`, `status`, timestamps.
- **`PageSection`**: `id`, `pageId`, `sectionKey`, `titleHi`, `titleEn`, `subtitleHi`, `subtitleEn`, `contentHi`, `contentEn`, `mediaUrl`, `sortOrder`, `metadata` (JSON).
- **`Service`** (Darshan / Pooja / Seva): `id`, `slug` (unique), `titleHi`, `titleEn`, `descriptionHi`, `descriptionEn`, `timingHi`, `timingEn`, `guidelinesHi`, `guidelinesEn`, `capacity`, `isActive`, `sortOrder`.
- **`Event`**: `id`, `slug` (unique), `titleHi`, `titleEn`, `descriptionHi`, `descriptionEn`, `startDate`, `endDate`, `locationHi`, `locationEn`, `bannerImage`, `isFeatured`, `status` (UPCOMING, ONGOING, COMPLETED).
- **`GalleryCategory`**: `id`, `slug` (unique), `nameHi`, `nameEn`, `sortOrder`.
- **`GalleryItem`**: `id`, `categoryId`, `titleHi`, `titleEn`, `fileUrl`, `mimeType`, `sizeBytes`, `width`, `height`, `isFeatured`, `sortOrder`.
- **`Notice`**: `id`, `titleHi`, `titleEn`, `bodyHi`, `bodyEn`, `priority` (LOW, NORMAL, URGENT), `isPinned`, `isActive`, `publishedAt`, `expiresAt`.
- **`Faq`**: `id`, `category`, `questionHi`, `questionEn`, `answerHi`, `answerEn`, `sortOrder`, `isActive`.
- **`SiteSetting`**: `id`, `key` (unique), `value` (text/json), `description`, `isPublic`.
- **`SeoMetadata`**: `id`, `path` (unique), `titleHi`, `titleEn`, `metaDescHi`, `metaDescEn`, `ogImage`, `canonicalUrl`.
- **`AuditLog`**: `id` (UUID), `actorType` (ADMIN, SYSTEM), `actorId`, `actorEmail`, `action` (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, SECURITY_ALERT), `entity`, `entityId`, `details` (JSON without secrets), `ipAddress`, `userAgent`, `createdAt`.

Prisma migrations will be generated using `npx prisma migrate dev --name init_jorawar_dham_schema`.

### 3. Authentication & RBAC Foundation
- **Password Hashing**: Argon2id (`@node-rs/argon2` or `argon2`) with memory cost = 65536, time cost = 3, parallelism = 4.
- **Session Management**:
  - Secure server-side sessions.
  - HttpOnly, Secure (in production), SameSite=Lax cookie containing an encrypted/signed session token.
  - Database stores SHA-256 hash of session token to prevent token theft in DB breaches.
  - Absolute session expiration (e.g. 12 hours) + idle expiration (e.g. 2 hours).
- **RBAC Server-side Authorization**:
  - `requireAdminAuth(req, requiredPermissions)` checks session cookie -> verifies session exists and is active -> fetches admin roles and permissions -> validates against requested permissions.
  - Role hierarchy and permissions mapped cleanly:
    - `SUPER_ADMIN`: All permissions.
    - `CONTENT_ADMIN`: Pages, notices, gallery, FAQs, SEO metadata.
    - `BOOKING_ADMIN`: Services, timings, darshan guidelines.
    - `FINANCE_ADMIN`: Settings view, future donation audits.
    - `EVENT_ADMIN`: Events, notices, gallery.
    - `STAFF`: Read-only access to schedules and notices.
- **Brute Force Protection**:
  - Failed login tracking in `Admin` record (locks for 15 minutes after 5 failed attempts).
  - Rate limiting on `/api/admin/auth/login`.

### 4. Storage Abstraction (`StorageService`)
- Interface:
  ```ts
  export interface StorageService {
    upload(file: Buffer, metadata: { originalFilename: string; mimeType: string }): Promise<UploadResult>;
    delete(fileKey: string): Promise<boolean>;
    getUrl(fileKey: string): string;
  }
  ```
- Local Implementation (`LocalStorageService`):
  - Target directory: `storage/uploads/` (outside public web directory).
  - Filename generation: `crypto.randomUUID() + safe_extension`.
  - Extension whitelist: `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`.
  - MIME check + Magic Bytes verification (checking initial file header bytes: JPEG `FF D8 FF`, PNG `89 50 4E 47`, WEBP `52 49 46 46`, PDF `25 50 44 46`).
  - Size check: Max 5MB for images, 10MB for documents.
  - Path traversal defense: `path.basename()` and verifying resolved path remains within upload directory.
  - Serving media: Safe API route `/api/media/[filename]` setting `Content-Type`, `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=31536000, immutable`, and rejecting anything not in the whitelist.

### 5. Application Security & Headers
- **Security Headers (Middleware)**:
  - `Content-Security-Policy`: Disallowing inline dangerous scripts, restricting `default-src 'self'`, fonts from `fonts.googleapis.com` and `fonts.gstatic.com`, images from `'self' data:`, frame-ancestors `'none'`.
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Input Validation**: Strict Zod schemas on every API endpoint and mutation.
- **Error Handling**: Centralized error sanitization helper (`sanitizeError()`) that logs details internally with stack traces to safe logger, but returns clean `{ error: "An unexpected error occurred", code: "INTERNAL_ERROR" }` to client.
- **Logging**: Redaction utility scrubbing `password`, `token`, `secret`, `otp`, `authorization` keys.

### 6. Devotional Design System (Rajasthani Pilgrim Aesthetic)
- **Palette**:
  - Sandstone Ochre: `#D97706` / `#B45309` (Rajasthan Jodhpur / Jaisalmer temple stone)
  - Deep Spiritual Saffron: `#EA580C` / `#C2410C`
  - Sacred Temple Maroon: `#881337` / `#701A75` (Ritual sindoor & temple velvet)
  - Golden Radiance: `#F59E0B` / `#D97706` (Dhwaja & brass temple lamps)
  - Marble White & Warm Cream: `#FFFBEB` / `#FEF3C7` / `#FAFAF9` (Makrana marble shrine look)
  - Sacred Charcoal: `#1C1917` (High-contrast, readable text)
- **Motifs & Embellishments**:
  - Subtle Rajasthani jharokha / temple arch SVG motifs.
  - Temple bells, diya lamp, kalash icon accents.
  - Om / Swastik / Trishul / Lotus devotional accents subtly positioned.
- **Public Pages**:
  - **Hero**: Grand sanctuary visual header, daily darshan timings banner, live notice ticker, direct access to darshan rules and today's aarti schedule.
  - **Darshan & Aarti Timings**: Mangala, Shringar, Bhog, Sandhya, and Shayan Aarti with countdown / current state indicator.
  - **About & Sacred History**: The story of Jorawar Dham, divine lineage, spiritual significance in Rajasthan.
  - **Dham Facilities & Visitor Guide**: Reach Jorawar Dham (rail, road, air), dharamshala accommodation info, dress code, holy tank/kund guidelines.
  - **Daily Sevas & Poojas**: Descriptions, spiritual significance, timings.
  - **Upcoming Festivals & Events**: Navratri, Janmashtami, Annakut, Special Mahotsavs with countdowns and schedules.
  - **Sacred Photo Gallery**: High-res temple sanctum, deities, festival celebrations with category filtering.
  - **Live Notice Board**: Announcements, weather/visitor advisories, trust notices.
  - **Contact & Map**: Location in Rajasthan, trust office contact numbers, emergency helplines.

### 7. Admin CMS Interface
- Clean, highly functional administrative dashboard.
- Pages:
  - `/admin/login`: Secure login with username/email and password, locked after failed attempts.
  - `/admin/dashboard`: Platform overview, quick counters (active notices, upcoming events, gallery count, audit log count), system status.
  - `/admin/notices`: Notice table, bilingual modal form (Hindi title/body, English title/body, priority, pin status), instant publish/archive.
  - `/admin/events`: Festival/Event creator with bilingual fields, dates, banner preview.
  - `/admin/content/pages`: Interactive editor for homepage hero, about section, history narrative, dham guide.
  - `/admin/gallery`: Upload sacred photos via secure upload API, assign to category, manage bilingual captions.
  - `/admin/content/faqs`: Devotee FAQs management with category sorting.
  - `/admin/settings`: Temple timings, contact telephone, email, physical address, visitor guidelines.
  - `/admin/audit-logs`: Immutable table of administrative actions with filter by actor, action, and date.

### 8. Verification & Acceptance Criteria
- Automated Prisma migration execution.
- Seeding of Super Admin, roles, sample notices, events, gallery items, page sections.
- TypeScript compiler verification (`npx tsc --noEmit`).
- Production build validation (`npm run build`).
- Security validation: verify headers, cookie attributes, route protection, file upload validation, audit logging.
- Generation of the required 6 documentation files in `docs/`.

---

## Verification Plan

### Automated Tests & Verification Commands
1. `npm run lint` / `npx tsc --noEmit` to verify type safety.
2. `npm run build` to verify the Next.js production build succeeds without static generation or runtime configuration errors.
3. Test script `node scripts/test-foundation.js` verifying:
   - Database connection and schema query.
   - Argon2id password hash generation and verification.
   - StorageService validation (accepts valid image, rejects fake executable, randomizes filename, rejects traversal).
   - Rate limiter logic under simulated load.
   - Audit logging insertion.
   - Safe error handling (no leaked database credentials or internal stack).

### Manual Verification
1. Start dev server `npm run dev` and navigate through:
   - `/hi` and `/en` homepage, verify Devanagari typography, notice ticker, and language switching.
   - `/hi/darshan` and `/en/darshan`, verify localized content.
   - `/hi/events`, `/hi/gallery`, `/hi/about`, `/hi/contact`.
   - `/admin/login` -> login with seeded credentials -> verify redirect to `/admin/dashboard`.
   - Test creating a notice in admin CMS and verify it reflects immediately on public `/hi` and `/en` pages.
   - Verify audit log is recorded for the notice creation.
