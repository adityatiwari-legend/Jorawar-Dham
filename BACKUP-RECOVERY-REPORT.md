# Backup & Disaster Recovery Assessment — Shri Jorawar Dham

**Date:** September 18, 2026  
**Auditor:** Senior Full-Stack, Security, QA & DevOps Engineering Auditor  
**Scope:** PostgreSQL Logical Backups, Media Storage Sync, and Cryptographic Pipeline  

---

## 1. Executive Summary

A comprehensive assessment of backup procedures was conducted. A critical vulnerability was resolved in this area: prior documentation specified `gzip` compression without encryption (`.sql.gz`), which would have left devotee phone numbers and donor PAN records unencrypted at rest.

The backup pipeline was upgraded to OpenSSL AES-256-CBC encryption (`.sql.gz.enc`) with PBKDF2 key derivation (100,000 iterations) and salt. A complete, runnable backup script (`scripts/backup-encrypted.sh`) was introduced, and restore drills were documented and validated.

---

## 2. Core Assessment Verification Table

| Metric | Verification Result | Implementation Details |
| :--- | :---: | :--- |
| **Backup Tested** | **YES** | Script verified syntax, execution pipeline, and file output. |
| **Restore Tested** | **YES** | Two-step pipe (OpenSSL Decrypt $\rightarrow$ gunzip $\rightarrow$ psql) validated against staging. |
| **Encryption Verified** | **YES** | AES-256-CBC PBKDF2 salted encryption confirmed; gzip magic bytes `1f8b` blocked. |
| **Production DB Modified** | **NO** | All testing conducted strictly on local/staging isolated database. |
| **File Permissions** | **600 (Strict)** | Archives created with `chmod 600` (read/write only by root/backup service). |
| **Retention Policy** | **30 Days** | Automated pruning via `find -mtime +30 -delete`. |

---

## 3. Cryptographic Pipeline Architecture

```text
PostgreSQL Container (docker exec pg_dump)
        │
        ▼ (Raw SQL stream)
gzip -9
        │
        ▼ (Compressed byte stream)
openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -pass file:/etc/backup/encryption.key
        │
        ▼
Encrypted Archive: /opt/backups/postgres/jorawar_dham_YYYYMMDD_HHMMSS.sql.gz.enc
        │
        ▼ (Verification Check)
Ensure header is NOT gzip (0x1F8B) or plaintext ("-- PostgreSQL database dump")
```

---

## 4. Disaster Recovery & Restoration Drill

### Verification Procedure:

#### 1. Decryption & Restoration Stream:
```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 \
  -pass file:/etc/backup/encryption.key \
  -in /opt/backups/postgres/jorawar_dham_YYYYMMDD_HHMMSS.sql.gz.enc \
  | gunzip -c \
  | docker compose exec -T postgres psql -U jorawar_admin -d jorawar_dham_db
```

#### 2. Integrity Sanity Queries:
```sql
SELECT count(*) AS total_services FROM services;
SELECT count(*) AS total_slots FROM service_slots;
SELECT count(*) AS total_bookings FROM bookings;
SELECT count(*) AS total_payments FROM payments;
SELECT count(*) AS total_donations FROM donations;
SELECT count(*) AS total_audit_logs FROM audit_logs;
```

---

## 5. Media Uploads Synchronization

Media files stored in `/app/storage/uploads` (or the Docker named volume `media_storage`) must be backed up concurrently:

```bash
# Continuous rsync to off-site secure storage bucket:
rsync -avz --delete /var/lib/docker/volumes/jorawar-dham_media_storage/_data/ /opt/backups/media/uploads/
```

---

## 6. Recommendations for Production Operations

1. **Key Separation:** The AES-256 encryption key (`/etc/backup/encryption.key`) must **never** be backed up into the same directory or repository as the encrypted archives. Store the key in a hardware security module (HSM) or secure secrets manager (AWS Secrets Manager / Vault).
2. **Off-site Replication:** Configure an automated cron job or S3 sync tool to replicate `.sql.gz.enc` files to an immutable S3 bucket with Object Lock enabled (WORM compliance).
3. **Monthly Restoration Drills:** Schedule a recurring automated or manual restoration drill on an isolated staging server on the 1st of every month to guarantee archive integrity.
