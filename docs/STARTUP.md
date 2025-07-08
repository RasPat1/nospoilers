# NoSpoilers Startup Guide

## Quick Start

To run the NoSpoilers application, you need to start three services:

1. **PostgreSQL Database** (Docker via Colima)
2. **Next.js Application Server** (Port 8080)
3. **WebSocket Server** (Port 8081)

## Docker Setup Options

### Option 1: Using Colima (Recommended - Free & Lightweight)

Colima is a free, open-source Docker Desktop alternative that uses minimal resources.

#### First-time setup:
```bash
# Install Colima
brew install colima

# Start Colima (needed after each system restart)
colima start --cpu 4 --memory 4 --disk 20
```

#### Verify Colima is running:
```bash
colima status
docker ps  # Should work without errors
```

### Option 2: Using Docker Desktop

If you prefer Docker Desktop, ensure it's running before proceeding.

## Starting Services

### Using PM2 (Recommended)

Start all services with a single command:

```bash
# 1. Ensure Docker is available (Colima or Docker Desktop)
colima status || echo "Make sure Colima or Docker Desktop is running"

# 2. Start database
docker-compose up -d postgres-dev

# 3. Start both servers using PM2
./node_modules/.bin/pm2 start ecosystem.config.js
```

Check status:
```bash
./node_modules/.bin/pm2 status
```

Stop all services:
```bash
./node_modules/.bin/pm2 stop all
docker-compose down
```

### Manual Start (Alternative)

If PM2 isn't working, start services individually:

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres-dev

# 2. In terminal 1 - Start Next.js server
npm start
# or for development
npm run dev

# 3. In terminal 2 - Start WebSocket server
npm run start:ws
# or for development
npm run dev:ws
```

## Verifying Services

After starting, verify everything is running:

1. **Next.js App**: http://localhost:8080
2. **WebSocket**: Check PM2 logs or terminal for "WebSocket server running on port 8081"
3. **Database**: `docker ps` should show postgres container running

## Common Issues

### "Cannot connect to the Docker daemon"
- Colima isn't running: `colima start --cpu 4 --memory 4 --disk 20`
- Docker Desktop isn't running: Start Docker Desktop app

### "localhost refused to connect"
- Services aren't actually running
- Check PM2 status: `./node_modules/.bin/pm2 status`
- Check logs: `./node_modules/.bin/pm2 logs`

### "Could not find a production build"
- Run `npm run build` before `npm start`
- For development, use `npm run dev` instead

### PM2 command not found
- Use the local PM2: `./node_modules/.bin/pm2`
- Or install globally: `npm install -g pm2`

### Colima issues
- Check status: `colima status`
- View logs: `colima status -l`
- Restart if needed: `colima stop && colima start`

## Service Details

| Service | Port | Purpose |
|---------|------|---------|
| Next.js | 8080 | Main web application |
| WebSocket | 8081 | Real-time updates for voting |
| PostgreSQL | 5432 | Database |