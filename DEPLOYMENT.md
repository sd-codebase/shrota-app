# Shrota Audiobook App - VPS Deployment Guide

## Prerequisites
- Fresh Linux VPS (Ubuntu 22.04 LTS recommended)
- Domain: shrota.in
- DNS A records configured (pointing to VPS IP)

## Subdomains Required

| Name | Points to |
|------|-----------|
| @ | VPS IP |
| www | VPS IP |
| api | VPS IP |
| audiolibrary | VPS IP |
| staging | VPS IP |
| api.staging | VPS IP |
| audiolibrary.staging | VPS IP |

---

## Step 1: Initial VPS Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git nano ufw
```

---

## Step 2: Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8080   # Staging nginx
sudo ufw allow 8443   # Staging nginx SSL
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
nano .env.production
```

Update values:
```env
DB_PASSWORD=your_strong_password_here
```

### Staging
```bash
cp .env.staging.example .env.staging
nano .env.staging
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

## Step 8: Start Production

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Verify:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

---

## Step 9: Start Staging

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
```

Verify:
```bash
docker compose -f docker-compose.staging.yml ps
docker compose -f docker-compose.staging.yml logs -f
```

---

## Step 10: Configure Host Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/shrota
```

Paste this configuration:

```nginx
# ===================
# PRODUCTION
# ===================

# UI - shrota.in
server {
    listen 80;
    server_name shrota.in www.shrota.in;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API - api.shrota.in
server {
    listen 80;
    server_name api.shrota.in;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Audio Library - audiolibrary.shrota.in
server {
    listen 80;
    server_name audiolibrary.shrota.in;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# ===================
# STAGING
# ===================

# UI - staging.shrota.in
server {
    listen 80;
    server_name staging.shrota.in;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API - api.staging.shrota.in
server {
    listen 80;
    server_name api.staging.shrota.in;
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Audio Library - audiolibrary.staging.shrota.in
server {
    listen 80;
    server_name audiolibrary.staging.shrota.in;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
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

# Get certificates for all domains
sudo certbot --nginx -d shrota.in -d www.shrota.in -d api.shrota.in -d audiolibrary.shrota.in -d staging.shrota.in -d api.staging.shrota.in -d audiolibrary.staging.shrota.in

# Auto-renewal is configured automatically
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
```

### Restart Services
```bash
# Production
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml restart backend

# Staging
docker compose -f docker-compose.staging.yml restart
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
docker compose -f docker-compose.prod.yml up -d --build

# Rebuild staging
docker compose -f docker-compose.staging.yml up -d --build
```

### Check Container Status
```bash
docker ps
```

### Access Container Shell
```bash
docker exec -it shrota-backend /bin/sh
docker exec -it shrota-postgres /bin/sh
```

---

## URLs

### Production
| Service | URL |
|---------|-----|
| UI | https://shrota.in |
| API | https://api.shrota.in |
| Audio | https://audiolibrary.shrota.in |

### Staging
| Service | URL |
|---------|-----|
| UI | https://staging.shrota.in |
| API | https://api.staging.shrota.in |
| Audio | https://audiolibrary.staging.shrota.in |

---

## Troubleshooting

### Check if ports are in use
```bash
sudo lsof -i :80
sudo lsof -i :8080
```

### Check Docker container logs
```bash
docker logs shrota-backend
docker logs shrota-nginx
```

### Check nginx error logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart everything
```bash
sudo systemctl restart nginx
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.staging.yml restart
```
