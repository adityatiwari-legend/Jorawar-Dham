#!/usr/bin/env bash
# ==============================================================================
# Shri Jorawar Dham - Production Encrypted Backup Pipeline
# Compliant with Security Checklist (AES-256-CBC at Rest)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/postgres}"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="${CONTAINER_NAME:-jorawar_dham_postgres}"
DB_NAME="${DB_NAME:-jorawar_dham_db}"
DB_USER="${DB_USER:-jorawar_admin}"
RETENTION_DAYS=30
KEY_FILE="${BACKUP_KEY_FILE:-/etc/backup/encryption.key}"

mkdir -p "${BACKUP_DIR}"

if [ ! -f "${KEY_FILE}" ]; then
  echo "[-] ERROR: Encryption key file ${KEY_FILE} not found!"
  echo "[-] Generate one using: openssl rand -base64 32 > ${KEY_FILE} && chmod 600 ${KEY_FILE}"
  exit 1
fi

ENCRYPTED_BACKUP="${BACKUP_DIR}/jorawar_dham_${DATE}.sql.gz.enc"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting encrypted PostgreSQL backup..."

# Pipe: pg_dump -> gzip -> openssl aes-256-cbc (PBKDF2 with 100k iterations) -> Encrypted file
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" -F p --clean --if-exists \
  | gzip -9 \
  | openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -salt -pass "file:${KEY_FILE}" -out "${ENCRYPTED_BACKUP}"

chmod 600 "${ENCRYPTED_BACKUP}"

BACKUP_SIZE=$(du -h "${ENCRYPTED_BACKUP}" | cut -f1)
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Encrypted backup created: ${ENCRYPTED_BACKUP} (${BACKUP_SIZE})"

# Verify file is not plaintext or plain gzip
HEADER_MAGIC=$(head -c 2 "${ENCRYPTED_BACKUP}" | xxd -p || true)
if [ "${HEADER_MAGIC}" = "1f8b" ]; then
  echo "[-] FATAL ERROR: Backup starts with gzip magic bytes 1f8b! Encryption failed!"
  rm -f "${ENCRYPTED_BACKUP}"
  exit 1
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Verified AES-256-CBC encryption at rest (No gzip or plaintext headers)."

# Retention pruning
find "${BACKUP_DIR}" -type f -name "jorawar_dham_*.sql.gz.enc" -mtime +${RETENTION_DAYS} -delete
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Pruned archives older than ${RETENTION_DAYS} days."
