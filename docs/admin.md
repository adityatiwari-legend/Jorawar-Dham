# Jorawar Dham - Admin CMS & Access Control Guide

## 1. Role-Based Access Control (RBAC) Matrix

The system provides 6 discrete administrative roles. Each role is assigned specific permission scopes:

| Role | Permissions & Responsibilities | Accessible Modules |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Full root administrative access. Manage staff, assign roles, inspect audit logs, modify system settings, manage all content. | All modules, Users, Settings, Audit Logs |
| **CONTENT_ADMIN** | Editorial control over public pages, history, dham guide, notices, and FAQs. | Pages, Notices, FAQs, Gallery |
| **BOOKING_ADMIN** | Management of darshan services, aarti timings, pooja guidelines, capacity thresholds. | Services, Darshan Timings, Guidelines |
| **EVENT_ADMIN** | Management of upcoming festivals, religious melas, and event banners. | Events, Notices |
| **FINANCE_ADMIN** | Read-only view of donations, audit records, and financial accounting reports. | Financial Logs, Audit Overview |
| **STAFF** | Read-only access to daily schedules, operational alerts, and notices. | Dashboard, Notices, Schedules |

---

## 2. Server-Side Enforcement Pattern

Access checks are executed inside API route handlers and server actions using `requireAdminAuth()`:

```ts
import { requireAdminAuth } from "@/lib/auth/guard";

export async function POST(req: NextRequest) {
  // Requires authenticated admin with 'notices:write' or SUPER_ADMIN role
  const admin = await requireAdminAuth(req, ["notices:write"]);
  
  // Perform validated mutation...
}
```

If authorization fails, a strict `401 Unauthorized` or `403 Forbidden` response is returned immediately.

---

## 3. CMS Feature Summary

1. **Notices & Announcements (`/admin/notices`)**:
   - Create, edit, toggle visibility, and pin high-priority temple notices.
   - Priority levels: `LOW`, `NORMAL`, `URGENT` (renders with amber/red alert styling on public pages).
   - Dual-language inputs for Hindi and English titles and bodies.
2. **Events & Festivals (`/admin/events`)**:
   - Manage upcoming spiritual gatherings with start/end date-times, venue details, and featured flags.
3. **Gallery Management (`/admin/gallery`)**:
   - Upload high-resolution photographs into categories (Sanctum, Festivals, Premises, Seva).
   - Integrated with `StorageService` security checks.
4. **Site Settings & Temple Timings (`/admin/settings`)**:
   - Update temple aarti schedules, contact telephone numbers, official email, and emergency helplines.
5. **Security Audit Log Viewer (`/admin/audit-logs`)**:
   - Immutable real-time inspection of administrative modifications, logins, and permission changes.
