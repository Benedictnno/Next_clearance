# EKSU Digital Clearance System - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the EKSU Digital Clearance System to various platforms and environments.

## Prerequisites

- Node.js 20+ 
- MongoDB 6.0+
- Git
- Domain name (for production)
- SSL certificate (for production)

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/Benedictnno/Next_clearance.git
cd Next_clearance
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

Copy the environment template:

```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/eksu_clearance
MONGODB_DB=eksu_clearance

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# External API Configuration
EXTERNAL_API_BASE_URL=https://coreeksu.vercel.app
EXTERNAL_API_KEY=your-external-api-key-here

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Security Configuration
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
```

## Local Development

### 1. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using MongoDB service
mongod --dbpath /path/to/your/db
```

### 2. Seed Database

```bash
npm run seed:mongo
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Production Deployment

### Option 1: Vercel (Recommended)

#### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### 2. Environment Variables

Add the following environment variables in Vercel dashboard:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eksu_clearance
SESSION_SECRET=your-production-session-secret
EXTERNAL_API_BASE_URL=https://coreeksu.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NODE_ENV=production
```

#### 3. Deploy

```bash
# Automatic deployment on push to main branch
git push origin main
```

### Option 2: Railway

#### 1. Connect Repository

1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project"
3. Connect your GitHub repository
4. Add MongoDB service

#### 2. Environment Variables

```env
MONGODB_URI=${{MONGODB_URL}}
SESSION_SECRET=your-production-session-secret
EXTERNAL_API_BASE_URL=https://coreeksu.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-app.railway.app
NODE_ENV=production
```

### Option 3: DigitalOcean App Platform

#### 1. Create App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository
4. Configure build settings

#### 2. Environment Variables

```env
MONGODB_URI=mongodb://username:password@host:port/database
SESSION_SECRET=your-production-session-secret
EXTERNAL_API_BASE_URL=https://coreeksu.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-app.ondigitalocean.app
NODE_ENV=production
```

### Option 4: AWS EC2

#### 1. Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance
# Instance type: t3.medium or larger
# Security groups: HTTP (80), HTTPS (443), SSH (22)
```

#### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install PM2
sudo npm install -g pm2
```

#### 3. Deploy Application

```bash
# Clone repository
git clone https://github.com/Benedictnno/Next_clearance.git
cd Next_clearance

# Install dependencies
npm install

# Build application
npm run build

# Start with PM2
pm2 start npm --name "eksu-clearance" -- start
pm2 save
pm2 startup
```

#### 4. Configure Nginx

```bash
# Install Nginx
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/eksu-clearance
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/eksu-clearance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

### Option 5: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/eksu_clearance
      - SESSION_SECRET=your-session-secret
      - NEXT_PUBLIC_BASE_URL=http://localhost:3000
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

#### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new cluster
   - Choose your preferred region

2. **Configure Access**
   - Create database user
   - Whitelist IP addresses
   - Get connection string

3. **Update Environment**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eksu_clearance
   ```

### Local MongoDB

```bash
# Start MongoDB
mongod --dbpath /path/to/your/db

# Create database
mongo
use eksu_clearance
```

## Database Seeding

### Production Seeding

```bash
# Set production environment
export NODE_ENV=production

# Run seed script
npm run seed:mongo
```

### Custom Seeding

```bash
# Create custom seed data
node scripts/custom-seed.js
```

## Monitoring and Logging

### Application Monitoring

#### 1. Health Check Endpoint

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "external_api": "available"
}
```

#### 2. Logging Configuration

```env
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

#### 3. PM2 Monitoring

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs eksu-clearance

# Restart application
pm2 restart eksu-clearance
```

### Database Monitoring

#### MongoDB Monitoring

```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Connect to MongoDB
mongo
```

## Security Configuration

### 1. Environment Security

```env
# Use strong session secrets
SESSION_SECRET=your-very-long-random-session-secret-here

# Enable HTTPS in production
NODE_ENV=production

# Configure rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
```

### 2. Database Security

```bash
# Enable MongoDB authentication
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "strong-password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})
```

### 3. Server Security

```bash
# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Update system
sudo apt update && sudo apt upgrade -y
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
mongodump --uri="mongodb://localhost:27017/eksu_clearance" --out=/backup/eksu_clearance

# Restore backup
mongorestore --uri="mongodb://localhost:27017/eksu_clearance" /backup/eksu_clearance
```

### File Backup

```bash
# Backup uploads
tar -czf uploads-backup.tar.gz public/uploads/

# Restore uploads
tar -xzf uploads-backup.tar.gz
```

## Performance Optimization

### 1. Database Indexing

```javascript
// Create indexes for better performance
db.clearance_progress.createIndex({ studentId: 1, stepId: 1 })
db.clearance_progress.createIndex({ status: 1 })
db.students.createIndex({ matricNumber: 1 })
db.notifications.createIndex({ userId: 1, createdAt: -1 })
```

### 2. Caching

```env
# Enable Redis caching (optional)
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

### 3. CDN Configuration

```env
# Configure CDN for static assets
CDN_URL=https://your-cdn.com
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI

# Test connection
mongo $MONGODB_URI
```

#### 2. Application Not Starting

```bash
# Check logs
pm2 logs eksu-clearance

# Check environment variables
pm2 env eksu-clearance

# Restart application
pm2 restart eksu-clearance
```

#### 3. File Upload Issues

```bash
# Check file permissions
ls -la public/uploads/

# Check disk space
df -h

# Check file size limits
grep -r "maxFileSize" .
```

### Debug Mode

```env
# Enable debug mode
DEBUG=*
LOG_LEVEL=debug
```

## Maintenance

### Regular Tasks

1. **Database Cleanup**
   ```bash
   # Clean old notifications
   node scripts/cleanup-notifications.js
   ```

2. **Log Rotation**
   ```bash
   # Configure logrotate
   sudo nano /etc/logrotate.d/eksu-clearance
   ```

3. **Security Updates**
   ```bash
   # Update dependencies
   npm audit
   npm update
   ```

### Monitoring Alerts

Set up monitoring for:
- Application uptime
- Database performance
- Disk space usage
- Memory usage
- Error rates

## Support

For deployment support:
- Check the troubleshooting guide
- Create an issue on GitHub
- Contact the development team

---

**Last Updated**: January 2024  
**Version**: 1.0.0
