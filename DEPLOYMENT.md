# Shrota Audiobook App - VPS Deployment Guide

## Prerequisites

- Fresh Linux VPS (Ubuntu 24.04 LTS recommended)
- Domain: shrota.in
- DNS A records configured (pointing to VPS IP)

## Subdomains Required

| Name                 | Points to |
| -------------------- | --------- |
| admin                | VPS IP    |
| api                  | VPS IP    |
| audiolibrary         | VPS IP    |
| admin.staging        | VPS IP    |
| api.staging          | VPS IP    |
| audiolibrary.staging | VPS IP    |

## Port Mapping

| Environment | Docker Nginx Port | Host Nginx Proxies To |
| ----------- | ----------------- | --------------------- |
| Production  | 8081              | 127.0.0.1:8081        |
| Staging     | 8080              | 127.0.0.1:8080        |

---

## Step 1: Initial VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git ufw
```

---

## Step 2: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 3: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Apply group changes (or logout and login)
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Step 4: Install Nginx (Host Level)

```bash
# Install nginx
sudo apt install -y nginx

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 5: Clone Repository

```bash
# Create app directory
mkdir -p ~/apps
cd ~/apps

# Clone repository
git clone https://github.com/sd-codebase/shrota-app.git
cd shrota-app
```

---

## Step 6: Configure Environment Files

### Production

```bash
cp .env.production.example .env.production
vi .env.production
```

Update values:

```env
DB_PASSWORD=your_strong_password_here
```

### Staging

```bash
cp .env.staging.example .env.staging
vi .env.staging
```

Update values:

```env
DB_PASSWORD=your_staging_password_here
```

---

## Step 7: Create Audio Library Directory

```bash
mkdir -p audio-library/shrota-audio-library
```

---

## Step 8: Start Staging

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
```

Verify:

```bash
docker compose -f docker-compose.staging.yml ps
docker compose -f docker-compose.staging.yml logs -f
```

---

## Step 9: Start Production

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Verify:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## Step 10: Configure Host Nginx (Reverse Proxy)

```bash
sudo vi /etc/nginx/sites-available/shrota
```

Paste this configuration:

```nginx
# PRODUCTION (port 8081)
server {
    listen 80;
    server_name admin.shrota.in api.shrota.in audiolibrary.shrota.in;
    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        proxy_request_buffering off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# STAGING (port 8080)
server {
    listen 80;
    server_name admin.staging.shrota.in api.staging.shrota.in audiolibrary.staging.shrota.in;
    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        proxy_request_buffering off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/shrota /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 11: Install SSL Certificates

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificates for staging
sudo certbot --nginx -d admin.staging.shrota.in -d api.staging.shrota.in -d audiolibrary.staging.shrota.in

# Get certificates for production
sudo certbot --nginx -d admin.shrota.in -d api.shrota.in -d audiolibrary.shrota.in

# Test renewal
sudo certbot renew --dry-run
```

---

## Useful Commands

### View Logs

```bash
# Production
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend

# Staging
docker compose -f docker-compose.staging.yml logs -f
docker compose -f docker-compose.staging.yml logs -f backend-staging
```

### Restart Services

```bash
# Production
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml restart backend

# Staging
docker compose -f docker-compose.staging.yml restart
docker compose -f docker-compose.staging.yml restart backend-staging
```

### Stop Services

```bash
# Production
docker compose -f docker-compose.prod.yml down

# Staging
docker compose -f docker-compose.staging.yml down
```

### Rebuild After Code Changes

```bash
cd ~/apps/shrota-app
git pull

# Rebuild production
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Rebuild staging
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
```

### Check Container Status

```bash
docker ps
```

### Access Container Shell

```bash
# Production
docker exec -it shrota-backend /bin/sh
docker exec -it shrota-postgres /bin/sh

# Staging
docker exec -it shrota-backend-staging /bin/sh
docker exec -it shrota-postgres-staging /bin/sh
```

---

## URLs

### Production

| Service  | URL                            |
| -------- | ------------------------------ |
| Admin UI | https://admin.shrota.in        |
| API      | https://api.shrota.in          |
| Audio    | https://audiolibrary.shrota.in |

### Staging

| Service  | URL                                    |
| -------- | -------------------------------------- |
| Admin UI | https://admin.staging.shrota.in        |
| API      | https://api.staging.shrota.in          |
| Audio    | https://audiolibrary.staging.shrota.in |

---

## Troubleshooting

### Check if ports are in use

```bash
sudo lsof -i :80
sudo lsof -i :8080
sudo lsof -i :8081
```

### Check Docker container logs

```bash
# Production
docker logs shrota-backend
docker logs shrota-nginx

# Staging
docker logs shrota-backend-staging
docker logs shrota-nginx-staging
```

### Check nginx error logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart everything

```bash
sudo systemctl restart nginx
docker compose -f docker-compose.prod.yml --env-file .env.production restart
docker compose -f docker-compose.staging.yml --env-file .env.staging restart
```

### Port conflict error

If you see "address already in use" error:

- Production Docker nginx uses port **8081** (not 80)
- Staging Docker nginx uses port **8080**
- Host nginx uses port 80/443 and proxies to Docker containers

---

## vi Quick Reference

- `i` - insert mode
- `Esc` - exit insert mode
- `:wq` - save and quit
- `:q!` - quit without saving
