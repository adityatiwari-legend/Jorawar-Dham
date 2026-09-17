# Dependency Security Audit — Shri Jorawar Dham Platform

**Date:** September 18, 2026  
**Package Manager:** `npm` (Lockfile Version: 3)  
**Node.js Runtime:** v20.x LTS  
**Total Dependencies Audited:** 550 (93 Production, 406 Development, 106 Optional)  

---

## 1. Executive Summary

A software composition analysis (SCA) was conducted using `npm audit` and direct inspection of `package.json` and `package-lock.json`. 

- **Production Runtime Dependencies:** **0 Known Vulnerabilities**
- **Development Tooling Dependencies:** 3 High severity advisory items associated with `@prisma/config` / `deepmerge-ts` inside the Prisma CLI development package.
- **Production Impact Assessment:** **NO RISK TO RUNTIME USERS.** The flagged package (`deepmerge-ts` via `@prisma/config`) is strictly a development-time dependency used exclusively by the Prisma CLI during schema parsing. It is never included in the client bundle or Next.js server runtime.

---

## 2. Dependency Inventory & Core Security Packages

| Package Name | Version | Role in Architecture | Security Relevance |
| :--- | :--- | :--- | :--- |
| `next` | `16.3.5` | Web Application Framework | Core SSR, API routing, CSRF protection, security headers |
| `react` / `react-dom` | `19.0.0` | Frontend UI Rendering | Built-in XSS defense via JSX escaping |
| `@prisma/client` | `6.19.3` | Database ORM Client | Automated SQL injection prevention via parameterized queries |
| `argon2` | `^0.41.1` | Password Hashing | OWASP recommended password hashing (Argon2id algorithm) |
| `zod` | `^3.24.2` | Runtime Input Validation | Strong type-coercion & schema validation on all API inputs |
| `razorpay` | `^2.9.5` | Payment Gateway Integration | Official SDK for order generation and cryptographic verification |
| `qrcode` | `^1.5.4` | Digital Ticket Generation | Encodes opaque security verification tokens as Data URIs |
| `lucide-react` | `^0.475.0` | UI Icons | Client-side icon SVGs |
| `tailwind-merge` | `^3.0.1` | CSS Utility Optimization | Tailwind CSS class merging |

---

## 3. Vulnerability Findings Detail

### Advisory: GHSA-ggr8-5vv4-36mx / CWE-674
- **Package:** `deepmerge-ts` (transitive devDependency of `prisma` CLI via `@prisma/config`)
- **Severity:** High
- **Vulnerable Range:** `<8.0.0`
- **Installed Version:** `5.1.0` (inside `node_modules/@prisma/config/node_modules/deepmerge-ts`)
- **Title:** DeepmergeTS has stack exhaustion when merging recursive object graphs
- **Runtime Exposure Analysis:**
  - `deepmerge-ts` is an internal utility used by the Prisma CLI configuration loader (`@prisma/config`) when executing commands like `npx prisma migrate` or `npx prisma db seed`.
  - It is **not** imported or bundled into Next.js application code, API route handlers, or server actions.
  - The Next.js production build (`next build`) produces a standalone server artifact that excludes development-only CLI tools.
- **Remediation Recommendation:**
  - Prisma will bump `deepmerge-ts` to `>=8.0.0` in upcoming minor CLI releases.
  - No breaking dependency override should be forced into `package.json` until Prisma officially publishes compatibility.
- **Risk Acceptance Status:** **ACCEPTED DEVELOPMENT RISK (Zero Production Exposure)**

---

## 4. Production Hardening Guidelines for Dependencies

1. **Deterministic Builds:** Always deploy using `npm ci` rather than `npm install` to enforce exact checksums specified in `package-lock.json`.
2. **Minimal Docker Container:** The production `Dockerfile` uses a multi-stage build that only copies production dependencies (`npm prune --production`) into the final minimal `alpine` image, stripping all development CLI tools and their transitive dependencies.
3. **Automated Dependabot / Security Scanning:** Enable GitHub Dependabot to alert on new runtime advisories.
