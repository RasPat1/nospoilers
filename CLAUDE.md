# Development Guidelines

## Starting the Application

**IMPORTANT: Always start services before working on the codebase**

### Prerequisites

#### Using Colima (Recommended - No Docker Desktop needed)
```bash
# Install Colima if not already installed
brew install colima

# Start Colima (only needed once per system restart)
colima start --cpu 4 --memory 4 --disk 20
```

### Quick Start
```bash
# 1. Start PostgreSQL database
docker-compose up -d postgres-dev

# 2. Start both servers using PM2
./node_modules/.bin/pm2 start ecosystem.config.js
```

The app will be available at http://localhost:8080

### Verify Services Are Running
```bash
# Check PM2 processes
./node_modules/.bin/pm2 status

# Check Docker containers
docker ps

# View logs if needed
./node_modules/.bin/pm2 logs
```

## Testing Guidelines
- Run tests after every change
- Add tests for new features and bugs
- Prefer single test runs over full suite
- Use robust, varied test data
- Stress test all interactive elements (buttons, inputs, videos, links)

## Code Standards
- Build small, reusable modules
- Typecheck after code changes
- Fix console errors immediately or add to todo
- Don't break existing functionality