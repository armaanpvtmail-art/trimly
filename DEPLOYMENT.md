# Trimly VPS deployment guide

This guide covers deploying Trimly onto an Ubuntu 22.04+ VPS using Docker Compose and Nginx with Let's Encrypt TLS certificates.

## 1. Create a droplet / VPS
- Use Ubuntu 22.04 LTS or newer.
- Recommended: 2 vCPU, 4GB RAM, 40GB disk for small production.

## 2. Setup firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

## 3. Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install docker-compose (plugin)
sudo apt install -y docker-compose-plugin
```

## 4. Clone repo & copy env
```bash
git clone https://github.com/armaanpvtmail-art/trimly.git
cd trimly
cp docker/.env.production.example .env
# Edit .env with your secrets
```

## 5. Provision TLS certificates with Certbot
```bash
sudo apt update
sudo apt install -y certbot
# If not using the certbot nginx plugin, use the standalone method after stopping nginx
# Certificates location: /etc/letsencrypt/live/your-domain.com/
```

## 6. Start services
```bash
# Build and start containers
docker compose -f docker/docker-compose.yml up -d --build

# Check logs
docker compose -f docker/docker-compose.yml logs -f
```

## 7. Nginx & certificates
- Place the LetsEncrypt certs in `docker/certs` or mount `/etc/letsencrypt` into the nginx container.
- Update `docker/nginx/trimly.conf` with your domain and certificate paths.

## 8. Healthcheck & monitoring
- Health endpoint: `https://your-domain.com/health`
- Logs: `docker compose -f docker/docker-compose.yml logs -f app`

## 9. Upgrades
- Pull latest changes, rebuild image:
```bash
git pull origin main
docker compose -f docker/docker-compose.yml up -d --build
```

## 10. Backups
- PostgreSQL: use `pg_dump` and store backups off-site.
- Redis: configure `redis.conf` for RDB/AOF persistence and back up files.

## 11. Notes
- Ensure environment variables are secret and never committed.
- Use a secrets manager for production if available.
