# PostgreSQL Backup, Disaster Recovery & Restoration Guide

## 1. Backup Philosophy
> *"A backup that has never been restored is not a proven backup."*

The Shri Jorawar Dham digital platform maintains an automated, tiered backup strategy combining logical database dumps (`pg_dump`), point-in-time recovery (PITR) via Write-Ahead Logging (WAL), and file-level synchronization of uploaded media assets.

---

## 2. Backup Strategy & Frequency

| Backup Type | Target | Frequency | Retention Policy | Storage Location |
| :--- | :--- | :--- | :--- | :--- |
| **Hourly Incremental** | PostgreSQL WAL Archives | Every 60 minutes | 7 Days | Encrypted S3 / Remote NAS |
| **Daily Full Dump** | PostgreSQL Database (`pg_dump`) | Daily at 02:00 AM IST | 30 Days | Encrypted S3 / Remote NAS |
| **Weekly Snapshot** | Full OS & Docker Volume Snapshot | Sunday at 03:00 AM IST | 90 Days | Off-site Cold Storage |
| **Media Files** | `/app/storage/uploads` | Daily at 04:00 AM IST | Continuous (Sync) | Distributed Cloud Bucket |

---

## 3. Automated Daily Backup Script

Save as `/opt/scripts/backup-db.sh` on host:
```bash
#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="jorawar_dham_postgres"
DB_NAME="jorawar_dham_db"
DB_USER="jorawar_admin"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/jorawar_dham_${DATE}.sql.gz"

echo "[$(date)] Starting PostgreSQL full backup..."

# Execute pg_dump inside container and compress via gzip
docker exec -t ${CONTAINER_NAME} pg_dump -U ${DB_USER} -d ${DB_NAME} -F p --clean --if-exists | gzip > "${BACKUP_FILE}"

# Set secure permissions
chmod 600 "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Prune backups older than retention policy
find "${BACKUP_DIR}" -type f -name "jorawar_dham_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Pruned backups older than ${RETENTION_DAYS} days."
```

### Scheduling via Crontab
```bash
# Add to crontab (runs daily at 2:00 AM IST)
0 2 * * * /opt/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

---

## 4. Step-by-Step Disaster Recovery & Restore Procedure

In the event of hardware failure, catastrophic data corruption, or emergency migration, execute the following restoration drill:

### Step 1: Prepare Clean Target Database
```bash
# Verify postgres container is running
docker compose ps postgres

# Drop existing connections and recreate empty database
docker compose exec postgres psql -U jorawar_admin -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'jorawar_dham_db';"
docker compose exec postgres psql -U jorawar_admin -d postgres -c "DROP DATABASE IF EXISTS jorawar_dham_db;"
docker compose exec postgres psql -U jorawar_admin -d postgres -c "CREATE DATABASE jorawar_dham_db OWNER jorawar_admin;"
```

### Step 2: Restore from Compressed SQL Dump
```bash
# Decompress and stream SQL dump into database
gunzip -c /opt/backups/postgres/jorawar_dham_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T postgres psql -U jorawar_admin -d jorawar_dham_db
```

### Step 3: Run Post-Restore Verification Checks
Execute sanity queries to verify schema and data completeness:
```bash
# Check record counts
docker compose exec postgres psql -U jorawar_admin -d jorawar_dham_db -c "SELECT count(*) AS total_bookings FROM bookings;"
docker compose exec postgres psql -U jorawar_admin -d jorawar_dham_db -c "SELECT count(*) AS total_payments FROM payments;"
docker compose exec postgres psql -U jorawar_admin -d jorawar_dham_db -c "SELECT count(*) AS total_donations FROM donations;"
docker compose exec postgres psql -U jorawar_admin -d jorawar_dham_db -c "SELECT count(*) AS total_audit_logs FROM audit_logs;"
```

### Step 4: Restore Media Uploads
```bash
# Copy media files back to storage volume
rsync -avz /opt/backups/media/uploads/ /var/lib/docker/volumes/jorawar-dham_media_storage/_data/
```

### Step 5: Start Application Services & Verify Endpoints
```bash
docker compose up -d app nginx
curl -I https://jorawardham.org/api/public/settings
```

---

## 5. Routine Quarterly Disaster Recovery Drill
To ensure operational readiness:
1. Every 90 days, restore the latest automated backup to an isolated staging instance.
2. Run automated test suites (`npx tsx scripts/test-phase4-security.ts` and `scripts/test-phase3-flows.ts`) against the restored database.
3. Validate that audit trails, devotee booking passes, and financial ledger totals match the live production environment exactly.
4. Record the drill completion date and results in the administrative log.
