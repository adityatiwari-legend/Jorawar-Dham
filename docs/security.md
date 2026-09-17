# Production Security & Threat Hardening Guide

## 1. Security Architecture Principles
Security in the Shri Jorawar Dham digital platform is designed defense-in-depth with zero tolerance for financial manipulation, unauthorized data disclosure, or service interruption:
* **Zero Trust Server-Side Authorization**: Every administrative API route independently verifies the authenticated session and required permissions. No privileged action is permitted solely based on client-side state.
* **Least Privilege Access (RBAC)**: Fine-grained roles ensure that temple staff, priests, and content editors have no access to financial ledgers, card tokens, or administrative credential management.
* **Zero Storage of Payment Cards/CVV**: All cardholder data is handled directly by PCI-DSS Level 1 compliant gateway (Razorpay). Neither raw PAN, expiration dates, nor CVVs touch application servers.
* **Integer Arithmetic for Money**: All financial values are stored and calculated strictly in integer paise ($₹1.00 = 100\text{ paise}$) to eradicate IEEE 754 floating-point rounding vulnerabilities.

---

## 2. OWASP Top 10 Mitigation Matrix

| OWASP Vulnerability | Threat Description | Shri Jorawar Dham Platform Mitigation | Verification Status |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | Horizontal/vertical privilege escalation; IDOR access to others' tickets or financial data. | 1. Mandatory `getAuthenticatedAdmin()` RBAC checks on every `/api/admin/*` endpoint.<br>2. IDOR checks on devotee routes verify `booking.userId === devotee.id`.<br>3. Dashboard financial privacy redaction for non-finance roles. | **VERIFIED (Pass)** |
| **A02: Cryptographic Failures** | Plaintext credentials, weak password hashes, exposed secrets. | 1. Admin passwords hashed using Argon2id (64MB memory cost, 3 iterations).<br>2. Devotee OTPs stored as SHA-256 salted hashes, never in plaintext.<br>3. Ticket QR codes contain opaque HMAC-SHA256 digests.<br>4. Webhook signatures validated with cryptographic HMAC secrets. | **VERIFIED (Pass)** |
| **A03: Injection** | SQL injection, cross-site scripting (XSS), command injection. | 1. Prisma ORM strictly parameterizes all SQL queries.<br>2. Zod schemas enforce type boundaries and validate input strings.<br>3. React automatically escapes HTML context, preventing reflected and DOM XSS. | **VERIFIED (Pass)** |
| **A04: Insecure Design** | Ticket scalping, overbooking race conditions, client-side price tampering. | 1. Concurrency-safe booking using PostgreSQL `SELECT ... FOR UPDATE` row-level locks.<br>2. Booking and donation amounts strictly calculated server-side.<br>3. 10-minute hold window for pending payments with automated expiry sweeper. | **VERIFIED (Pass)** |
| **A05: Security Misconfiguration** | Unnecessary HTTP methods, default accounts, missing security headers. | 1. Custom HTTP security headers: Strict CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS.<br>2. Disabled `X-Powered-By` header in Next.js. | **VERIFIED (Pass)** |
| **A06: Vulnerable Components** | Outdated or vulnerable third-party dependencies. | 1. Automated dependency audits (`npm audit`).<br>2. Pinned dependency versions in `package-lock.json`.<br>3. Alpine-based minimal container images. | **VERIFIED (Pass)** |
| **A07: Identification & Auth Failures** | Session hijacking, brute-force OTP attacks, credential stuffing. | 1. Sliding-window IP and identifier rate limiting for OTP generation and verification.<br>2. Single-use OTP enforcement (deleted immediately upon verification).<br>3. HTTPOnly, SameSite=Lax, Secure session cookies. | **VERIFIED (Pass)** |
| **A08: Software & Data Integrity** | Deserialization attacks, forged payment confirmations, duplicate webhooks. | 1. Razorpay webhook HMAC-SHA256 signature verification.<br>2. Idempotent webhook processing (duplicate transaction IDs safely ignored).<br>3. No payments or donations marked successful without cryptographically verified signatures. | **VERIFIED (Pass)** |
| **A09: Security Logging & Monitoring** | Undetected unauthorized activity or tamper attempts. | 1. Tamper-resistant `AuditLog` records for all logins, cancellations, refunds, manual bookings, and exports.<br>2. Zero sensitive credentials, passwords, or raw OTPs logged.<br>3. Structured Winston logging with severity levels (INFO, WARN, ERROR). | **VERIFIED (Pass)** |
| **A10: Server-Side Request Forgery (SSRF)** | Arbitrary outbound server requests to internal services or metadata endpoints. | 1. Media uploads restricted to local filesystem or trusted CDNs.<br>2. Outbound HTTP requests restricted strictly to configured payment gateways and notification providers.<br>3. No user-supplied URLs fetched on backend. | **VERIFIED (Pass)** |

---

## 3. Dedicated Security Subsystems

### 3.1 File Upload & Media Storage Security
* **Allowed MIME Types Whitelist**: Only `image/jpeg`, `image/png`, `image/webp`, and `application/pdf` are accepted.
* **Explicit Prohibition of Executables & SVGs**: File extensions including `.exe`, `.sh`, `.php`, `.bat`, `.py`, `.html`, and `.svg` are rejected outright. SVG is blocked to eliminate stored SVG XSS attacks via `<script>` or `<foreignObject>` payloads.
* **Magic Byte Validation**: Binary file headers (signatures) are verified against the declared MIME type before storage to prevent file extension spoofing.
* **Path Traversal Protection**: Uploaded files are assigned non-sequential random UUID filenames (`crypto.randomUUID()`). Directory traversal tokens (`../`) are stripped, and absolute paths are validated to ensure they reside strictly within the designated storage directory.

### 3.2 Gate Check-in & Single-Use QR Ticket Security
* **Opaque Security Token**: QR codes contain a unique booking reference and a cryptographically generated opaque token.
* **Single-Use Entry Enforcement**: When scanned at the temple entrance, the record is atomically transitioned to `CHECKED_IN` with timestamp and inspecting staff ID. Any subsequent scan attempt is flagged as `ALREADY_CHECKED_IN` and denied entrance.
* **Offline Replay Defense**: Tickets cannot be duplicated or reused across different days or different slot timeframes.
