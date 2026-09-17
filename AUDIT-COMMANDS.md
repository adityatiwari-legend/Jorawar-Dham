# Audit Commands & Execution Log — Shri Jorawar Dham

**Date:** September 18, 2026  
**Auditor:** Senior Full-Stack, Security, QA & DevOps Engineering Auditor  
**Environment:** Windows Host / Node.js v20 / PostgreSQL 16 (Local Staging)  

---

## Command Log

| Command Executed | Purpose | Environment | Exit Code | Result Summary |
| :--- | :--- | :--- | :---: | :--- |
| `npx tsx scripts/test-fitcheck-redteam.ts` | Execute adversarial red-team test suite (CSV injection, cron auth, donation webhook idempotency, RBAC, amount tampering, QR verification) | Local Staging | `0` | **38 / 38 PASS** |
| `npx tsx scripts/test-phase4-security.ts` | Execute platform security and authorization audit suite (Argon2id, permissions, headers, upload magic bytes) | Local Staging | `0` | **33 / 33 PASS** |
| `npx tsx scripts/test-phase3-flows.ts` | Execute end-to-end devotee flow, payment verification, and IDOR suite | Local Staging | `0` | **36 / 36 PASS** |
| `npx tsx scripts/test-phase3-concurrency.ts` | Execute multi-threaded slot capacity race condition testing (15 concurrent requests competing for 1 seat) | Local Staging | `0` | **7 / 7 PASS (148ms resolution)** |
| `npx tsc --noEmit` | Strict static type checking across the entire TypeScript codebase | Node.js Runtime | `0` | **0 Type Errors** |
| `npm run build` | Next.js production compiler, page generator, and bundle optimizer | Node.js Runtime | `0` | **Compiled 88 static & dynamic pages cleanly** |
| `npm audit --json` | Software composition analysis and vulnerability scan of dependencies | Node.js Runtime | `1` | **0 Production Runtime Vulnerabilities (3 dev-only in Prisma CLI config)** |
| `docker compose ps` | Verify PostgreSQL container health and isolation | Docker Engine | `0` | **Container running healthy** |

---

## Detailed Command Output Records

### 1. Red-Team Test Suite Execution
```text
Command: npx tsx scripts/test-fitcheck-redteam.ts
Exit Code: 0
Output Summary:
==================================================
🔥 RUNNING ADVERSARIAL RED-TEAM FITCHECK SUITE
==================================================
[TEST 1] Testing CSV Formula Injection Sanitization... (9 PASS)
[TEST 2] Testing Cron Endpoint Security & Rejection... (3 PASS)
[TEST 3] Testing Payment Webhook Signature & Donation Idempotency... (5 PASS)
[TEST 4] Testing Seva Booking 80G Tax Exemption Clarification... (2 PASS)
[TEST 5] Testing Admin Check-in Role RBAC Checks... (6 PASS)
[TEST 6] Testing Payment Amount Calculation & Anti-Tampering... (2 PASS)
[TEST 7] Testing QR Replay & Cryptographic Tampering... (Verified)
[TEST 8] Testing File Upload Security & Forbidden Extensions... (10 PASS)
==================================================
🔥 RED-TEAM AUDIT COMPLETED: 38 PASSED, 0 FAILED
==================================================
```

### 2. Static Type Check Execution
```text
Command: npx tsc --noEmit
Exit Code: 0
Stdout: (Empty - clean)
Stderr: (Empty - clean)
```

### 3. Production Build Execution
```text
Command: npm run build
Exit Code: 0
Output Summary:
▲ Next.js 16.3.5 (Turbopack)
✓ Running next.config.ts took 100ms
✓ Compiled successfully in 2.7s
✓ Generating static pages using 23 workers (88/88) in 796ms
Finalizing page optimization ...
All routes generated cleanly.
```
