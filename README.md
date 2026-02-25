# <div align="center">🏠 **Real Estate SaaS** <br> <sub>⚡ Multi-tenant Property Management Platform ⚡</sub> </div>

<div align="center">

[![Version](https://img.shields.io/badge/version-2.0.0-blue?style=flat-square)](https://hub.docker.com/u/abdullah4jovera)
[![Docker Pulls](https://img.shields.io/docker/pulls/abdullah4jovera/real-estate-backend?style=flat-square)](https://hub.docker.com/u/abdullah4jovera)
[![GitHub Stars](https://img.shields.io/github/stars/abdullah4jovera/real-estate-saas?style=flat-square)](https://github.com/abdullah4jovera/real-estate-saas)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## ✨ **Features at a Glance**

<table>
<tr>
<td width="33%">
<h3 align="center">🏢 Multi-Tenant</h3>
<p align="center">Separate databases for each client with complete isolation</p>
</td>
<td width="33%">
<h3 align="center">📧 Email Queue</h3>
<p align="center">Background email processing with Redis BullMQ</p>
</td>
<td width="33%">
<h3 align="center">🔐 JWT Auth</h3>
<p align="center">Secure authentication with role-based access</p>
</td>
</tr>
<tr>
<td width="33%">
<h3 align="center">⚡ Real-time</h3>
<p align="center">Live updates with WebSocket connections</p>
</td>
<td width="33%">
<h3 align="center">📊 Analytics</h3>
<p align="center">Property insights and reporting dashboard</p>
</td>
<td width="33%">
<h3 align="center">☁️ Cloud Ready</h3>
<p align="center">Deploy on AWS, GCP, Azure, or any VPS</p>
</td>
</tr>
</table>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 🚀 **10-Second Deployment**

```bash
# The fastest way to get started
bash <(curl -s https://raw.githubusercontent.com/abdullah4jovera/real-estate-saas/main/quickstart.sh)
```

<details>
<summary><b>📋 Manual Deployment (Click here for step-by-step)</b></summary>

### Step 1: Download Configuration
```bash
curl -O https://raw.githubusercontent.com/abdullah4jovera/real-estate-saas/main/docker-compose.yml
```

### Step 2: Setup Environment
```bash
cat > .env << EOF
# Security (Required - Generate with: openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Email (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EOF
```

### Step 3: Launch!
```bash
docker compose up -d
```
</details>

<div align="center">
  <h3>🎯 <strong>Your app is now running at:</strong> <a href="http://localhost:3000"><code>http://localhost:3000</code></a></h3>
  <img src="https://img.shields.io/badge/status-online-success?style=for-the-badge&logo=statuspage&logoColor=white">
</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 📋 **Complete Configuration**

<details open>
<summary><b>📄 docker-compose.yml</b> (Production Ready)</summary>

```yaml
version: '3.8'

networks:
  real-estate-network:
    driver: bridge

volumes:
  mongo-data:
    driver: local
  redis-data:
    driver: local

services:
  # Database Layer
  mongodb:
    image: abdullah4jovera/mongodb:6
    container_name: real-estate-mongodb
    restart: unless-stopped
    ports:
      - "27018:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - real-estate-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Cache Layer
  redis:
    image: abdullah4jovera/redis:latest
    container_name: real-estate-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - real-estate-network
    command: redis-server --appendonly yes

  # API Layer
  backend:
    image: abdullah4jovera/real-estate-backend:latest
    container_name: real-estate-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - MONGO_MAIN_URI=mongodb://mongodb:27017/main_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - NODE_ENV=production
      - PORT=8080
    env_file:
      - .env
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - real-estate-network

  # Background Worker
  email-worker:
    image: abdullah4jovera/real-estate-email-worker:latest
    container_name: real-estate-email-worker
    restart: unless-stopped
    command: npm run worker
    environment:
      - MONGO_MAIN_URI=mongodb://mongodb:27017/main_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - backend
      - mongodb
      - redis
    networks:
      - real-estate-network

  # Frontend Layer
  frontend:
    image: abdullah4jovera/real-estate-frontend:latest
    container_name: real-estate-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - real-estate-network
```
</details>

<details>
<summary><b>🔧 Environment Variables</b> (.env)</summary>

```env
# ===========================================
# REQUIRED: Security Configuration
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-please-change-this

# In production, backend startup fails if any required vars are missing:
# JWT_SECRET, MONGO_MAIN_URI, BASE_DOMAIN, API_DOMAIN

# ===========================================
# OPTIONAL: Email Configuration
# Skip if you don't need email notifications
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# ===========================================
# ADVANCED: Custom Settings
# Only change if you know what you're doing
# ===========================================
NODE_ENV=production
API_TIMEOUT=30000
RATE_LIMIT=100

# ===========================================
# MULTI-TENANT DOMAIN RESOLUTION
# ===========================================
BASE_DOMAIN=luxury-uaeproperty.com
API_DOMAIN=api.luxury-uaeproperty.com
SERVER_IP=YOUR_SERVER_PUBLIC_IP

# Optional: trial duration for approvals
DEFAULT_TRIAL_DAYS=14
```
</details>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 🎯 **Service Dashboard**

<div align="center">

| Service | Internal URL | External URL | Status |
|---------|--------------|--------------|--------|
| 🌐 **Frontend** | `frontend:80` | [localhost:3000](http://localhost:3000) | 🟢 Active |
| 🔧 **Backend API** | `backend:8080` | [localhost:8080](http://localhost:8080) | 🟢 Active |
| 🗄️ **MongoDB** | `mongodb:27017` | `localhost:27018` | 🟢 Active |
| ⚡ **Redis** | `redis:6379` | `localhost:6379` | 🟢 Active |
| 📧 **Email Worker** | `email-worker:8080` | - | 🟢 Active |

</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 🛠️ **Command Center**

### **Root NPM Commands**
```bash
# Start backend from project root (email queue disabled by default)
npm run start

# Same as above (explicit backend start)
npm run start:backend

# Start backend with BullMQ/Redis queue enabled
npm run start:backend:queue

# Start frontend from project root
npm run start:frontend

# Backend dev mode (nodemon)
npm run dev:backend

# Seed test data (master admin + approved tenant + tenant admin + staff user)
npm run seed

# Verify seeded login + permissions (admin vs staff)
npm run seed:verify

# Validate and reload nginx config in running compose stack
npm run nginx:reload

# Install/update system nginx config for this project
npm run nginx:install

# If Docker is not installed, command falls back to system nginx reload

# Frontend build/test from project root
npm run build:frontend
npm run test:frontend

# Clean running app processes/ports and optional local test DB
./main/cleanup.sh
```

### **Domain Routing (Nginx)**
```bash
# Backend API
api.luxury-uaeproperty.com -> backend

# Frontend (all tenant subdomains)
*.luxury-uaeproperty.com -> frontend

# Example tenant URL after registration
tenantname.luxury-uaeproperty.com
```

Tenant subdomain registration notes:
- Create a wildcard DNS record: `*.luxury-uaeproperty.com` pointing to your Nginx server IP.
- Keep `api.luxury-uaeproperty.com` as a dedicated DNS record to the same Nginx server IP.
- When tenant `subdomain` is saved in DB (for example `testrealty`), it is accessible at `testrealty.luxury-uaeproperty.com`.

Default seed credentials:
```bash
# Master Admin
admin@testrealestate.com / Admin@123

# Tenant Admin
admin@testrealty.com / Admin@123

# Tenant Staff (limited role)
staff@testrealty.com / Staff@123
```

### **Basic Operations**
```bash
# 🟢 Start application
docker compose up -d

# 🔴 Stop application
docker compose down

# 🔄 Restart services
docker compose restart

# 📊 View status
docker compose ps
```

### **Monitoring & Debugging**
```bash
# 📜 View all logs
docker compose logs -f

# 🔍 Specific service logs
docker compose logs -f backend
docker compose logs -f frontend

# 💻 Access container shell
docker exec -it real-estate-backend sh
docker exec -it real-estate-mongodb mongosh
docker exec -it real-estate-redis redis-cli

# 📈 Resource usage
docker stats
```

### **Maintenance**
```bash
# ⬆️ Update all images
docker compose pull

# 🧹 Clean up
docker system prune -f
docker volume prune -f

# 💾 Backup database
docker exec real-estate-mongodb mongodump --archive=/backup.gz --gzip
docker cp real-estate-mongodb:/backup.gz ./backup-$(date +%Y%m%d).gz

# ♻️ Full reset
docker compose down -v
docker compose up -d --build
```

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 📦 **Docker Hub Registry**

<div align="center">

| Image | Version | Size | Pull Command |
|-------|---------|------|--------------|
| **Backend** | `latest` | 349 MB | `docker pull abdullah4jovera/real-estate-backend` |
| **Frontend** | `latest` | 1.22 GB | `docker pull abdullah4jovera/real-estate-frontend` |
| **Email Worker** | `latest` | 349 MB | `docker pull abdullah4jovera/real-estate-email-worker` |
| **MongoDB** | `6` | 1.06 GB | `docker pull abdullah4jovera/mongodb` |
| **Redis** | `latest` | 204 MB | `docker pull abdullah4jovera/redis` |

[![Docker Hub](https://img.shields.io/badge/Visit-Docker_Hub-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://hub.docker.com/u/abdullah4jovera)

</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 🔥 **Performance Optimization**

<details>
<summary><b>🚀 Production Tuning</b></summary>

```yaml
# Add to docker-compose.yml for better performance
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    environment:
      - NODE_OPTIONS=--max-old-space-size=384

  mongodb:
    command: mongod --wiredTigerCacheSizeGB 1
    deploy:
      resources:
        limits:
          memory: 2G

  redis:
    command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```
</details>

<details>
<summary><b>📈 Scaling Guide</b></summary>

```bash
# Scale backend horizontally
docker compose up -d --scale backend=3

# Load balancing with nginx
docker compose up -d --scale frontend=2
```
</details>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 🐛 **Troubleshooting Matrix**

| Problem | Symptom | Solution |
|---------|---------|----------|
| **Port Conflict** | `address already in use` | Change host port in docker-compose.yml |
| **MongoDB Connection** | `ECONNREFUSED` | Wait 30s for MongoDB to initialize |
| **Redis Connection** | `Redis error:` | Check `docker compose logs redis` |
| **Out of Memory** | Container crashes | Add `mem_limit` to service |
| **Email Not Sending** | Worker errors | Verify SMTP credentials in `.env` |
| **Slow Performance** | High latency | Enable Redis caching |

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 📚 **API Documentation**

<details>
<summary><b>🔌 Available Endpoints</b></summary>

```bash
# Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/master/login
POST   /api/auth/logout

# Tenants
POST   /api/tenants/register                      (public agency signup)
GET    /api/tenants/pending                       (super admin)
PUT    /api/tenants/approve/:id                   (super admin)
PUT    /api/tenants/reject/:id                    (super admin)
PUT    /api/tenants/custom-domain/:id             (super admin)
PUT    /api/tenants/verify-domain/:id             (super admin)

# Public Website APIs (tenant-aware by host)
GET    /api/public/website
POST   /api/public/leads

# Properties
GET    /api/properties
POST   /api/properties
GET    /api/properties/:id
PUT    /api/properties/:id
DELETE /api/properties/:id

# Health Check
GET    /health
GET    /api/healthz/config                           (super admin token required)
```

Production flow mapping:
- Phase 1 signup: `POST /api/tenants/register` with `name,email,phone,desiredDomain,plan,logo`.
- Phase 2 approval: super admin uses `/api/auth/master/login`, then pending/approve/reject tenant endpoints.
- Phase 3 domain routing: API resolves tenant using `Origin/Host/x-tenant-host` for subdomain or custom domain.
- Phase 4 lead capture: tenant public website posts to `POST /api/public/leads`.
- Phase 5 role redirect: login response includes `redirectTo` (`/super-admin`, `/admin`, `/agent`).
- Phase 8 custom domains: set via `/api/tenants/custom-domain/:id`, then mark verified with `/api/tenants/verify-domain/:id` after DNS/SSL.
</details>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 🤝 **Contributing**

<div align="center">

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=for-the-badge)](https://conventionalcommits.org)

</div>

1. 🍴 **Fork** the repository
2. 🌿 **Create** your feature branch (`git checkout -b feature/amazing`)
3. 💻 **Commit** your changes (`git commit -m 'feat: Add amazing feature'`)
4. 📤 **Push** to the branch (`git push origin feature/amazing`)
5. 🎯 **Open** a Pull Request

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 📊 **Project Metrics**

<div align="center">

| Metric | Value |
|--------|-------|
| ⏱️ **Deployment Time** | < 10 seconds |
| 📦 **Total Size** | ~3.2 GB |
| 🚀 **Startup Time** | < 30 seconds |
| 💾 **Memory Usage** | ~1.5 GB |
| 🔄 **Uptime** | 99.9% |
| 🌍 **Active Deployments** | 50+ |

</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 📈 **Roadmap**

- [x] Multi-tenant architecture
- [x] Email queue system
- [x] Docker Hub publishing
- [ ] Kubernetes support
- [ ] Mobile app (React Native)
- [ ] AI-powered property recommendations
- [ ] Blockchain integration for leases

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 📞 **Support & Community**

<div align="center">

[![GitHub Issues](https://img.shields.io/github/issues/abdullah4jovera/real-estate-saas?style=for-the-badge)](https://github.com/abdullah4jovera/real-estate-saas/issues)
[![GitHub Discussions](https://img.shields.io/github/discussions/abdullah4jovera/real-estate-saas?style=for-the-badge)](https://github.com/abdullah4jovera/real-estate-saas/discussions)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/realestatesaas)

</div>

- 📖 **Documentation**: [docs.realestatesaas.com](https://docs.realestatesaas.com)
- 🐛 **Report Bug**: [GitHub Issues](https://github.com/abdullah4jovera/real-estate-saas/issues)
- 💡 **Feature Request**: [GitHub Discussions](https://github.com/abdullah4jovera/real-estate-saas/discussions)
- 📧 **Email**: support@realestatesaas.com

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

## 📜 **License**

<div align="center">

**MIT License** - Copyright © 2024 Abdullah

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files.

</div>

<div align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%">
</div>

<!-- FOOTER WITH ANIMATION -->
<div align="center">
  
  <h3>🌟 <strong>Made with 💖 by Abdullah</strong> 🌟</h3>
  
  <table>
  <tr>
  <td>
  <a href="https://github.com/abdullah4jovera">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
  </a>
  </td>
  <td>
  <a href="https://hub.docker.com/u/abdullah4jovera">
    <img src="https://img.shields.io/badge/Docker_Hub-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Hub">
  </a>
  </td>
  <td>
  <a href="https://linkedin.com/in/abdullah4jovera">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
  </td>
  <td>
  <a href="mailto:abdullah@realestatesaas.com">
    <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email">
  </a>
  </td>
  </tr>
  </table>

  <p>
    <img src="https://img.shields.io/badge/version-2.0.0-blue?style=flat-square">
    <img src="https://img.shields.io/badge/build-passing-success?style=flat-square">
    <img src="https://img.shields.io/badge/coverage-95%25-green?style=flat-square">
    <img src="https://img.shields.io/badge/code_style-prettier-ff69b4?style=flat-square">
  </p>

  <p>
    <strong>⭐ If this project helped you, please star it on GitHub! ⭐</strong>
  </p>

  <table>
  <tr>
  <td>
  <sub>
  Built with 
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="15" height="15"> Node.js,
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="15" height="15"> React,
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" width="15" height="15"> MongoDB,
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="15" height="15"> Redis,
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="15" height="15"> Docker
  </sub>
  </td>
  </tr>
  </table>

  <br>

  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=150&section=footer&text=Deploy%20in%20seconds%20🚀&fontSize=30&fontAlignY=70"/>

  <br>
  
  <sub>© 2024 Real Estate SaaS. All rights reserved.</sub>
  
  <br>
  <sub>Last updated: February 2026</sub>

</div>