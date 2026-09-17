# Production Deployment & Infrastructure Guide

## 1. System Requirements & Architecture
The Shri Jorawar Dham platform is containerized using Docker and Docker Compose for predictable, reproducible deployment across on-premise Linux servers or cloud infrastructure (AWS EC2, DigitalOcean, Hetzner, etc.).

### Hardware Requirements
* **CPU**: 2+ vCPUs (4 vCPUs recommended for peak festival traffic)
* **RAM**: 4 GB minimum (8 GB recommended for PostgreSQL buffer pools)
* **Storage**: 40 GB+ NVMe SSD (with dedicated persistent volumes for DB and media uploads)
* **OS**: Ubuntu 22.04 LTS or 24.04 LTS / Debian 12

### Topology Stack
* **Reverse Proxy**: Nginx Alpine container (Ports 80/443, SSL termination, HTTP-to-HTTPS redirect, rate limiting).
* **Application**: Next.js 16 standalone multi-stage container running unprivileged as user `nextjs`.
* **Database**: PostgreSQL 16 Alpine container with persistent health checks and volume mounts.
* **Storage**: Persistent Docker volumes for `/app/storage/uploads` and `/var/lib/postgresql/data`.

---

## 2. Step-by-Step Deployment Instructions

### Step 1: Install Docker & Docker Compose
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Step 2: Clone Repository & Configure Environment
```bash
git clone https://github.com/jorawardham/platform.git /opt/jorawar-dham
cd /opt/jorawar-dham

# Copy production environment template
cp .env.production.example .env.production
```

Generate secure random secrets:
```bash
# Generate 64-character hex keys
openssl rand -hex 32 # For NEXTAUTH_SECRET
openssl rand -hex 32 # For ADMIN_SESSION_SECRET
openssl rand -hex 32 # For DEVOTEE_SESSION_SECRET
openssl rand -hex 32 # For TICKET_QR_HMAC_SECRET
openssl rand -hex 16 # For POSTGRES_PASSWORD
```
Edit `.env.production` using `nano` or `vim` and populate all generated secrets and live Razorpay credentials.

### Step 3: Configure SSL/TLS Certificates
Using Let's Encrypt Certbot on the host:
```bash
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d jorawardham.org -d www.jorawardham.org

# Link certificates to Nginx directory
mkdir -p ./nginx/ssl
sudo cp /etc/letsencrypt/live/jorawardham.org/fullchain.pem ./nginx/ssl/fullchain.pem
sudo cp /etc/letsencrypt/live/jorawardham.org/privkey.pem ./nginx/ssl/privkey.pem
sudo chmod 644 ./nginx/ssl/*
```

### Step 4: Build and Launch Production Stack
```bash
# Build and run containers in detached mode
docker compose --env-file .env.production up -d --build

# Verify container health
docker compose ps
```

### Step 5: Initialize Database Schema & Seed Data
```bash
# Run Prisma migrations inside the app container
docker compose exec app npx prisma migrate deploy

# Seed initial roles, permissions, causes, and super admin
docker compose exec app npx tsx prisma/seed.ts
```

---

## 3. Maintenance & Operational Commands

### Viewing Real-Time Logs
```bash
# Follow application logs
docker compose logs -f app

# Follow database logs
docker compose logs -f postgres

# Follow Nginx access & error logs
docker compose logs -f nginx
```

### Applying Zero-Downtime Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild app container
docker compose --env-file .env.production build app

# Recreate app container with zero downtime
docker compose --env-file .env.production up -d --no-deps app
```

### Container Health Checks
```bash
# Check PostgreSQL status
docker compose exec postgres pg_isready -U jorawar_admin -d jorawar_dham_db

# Check Next.js HTTP response
curl -I http://localhost:3000/api/public/settings
```
