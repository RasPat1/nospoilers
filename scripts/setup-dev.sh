#!/bin/bash

# Setup script for local development environment

echo "🚀 Setting up NoSpoilers local development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Start only the development database
echo "🗄️ Starting development database..."
docker-compose up -d postgres-dev

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is accessible
until docker exec nospoilers-postgres-dev pg_isready -U postgres -d nospoilers_dev > /dev/null 2>&1; do
    echo "   Waiting for database connection..."
    sleep 2
done

echo "✅ Database is ready!"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Local Development Configuration

# Database Configuration
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nospoilers_dev
USE_LOCAL_DB=true

# Node Environment
NODE_ENV=development

# WebSocket Configuration
WS_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# TMDB API - Add your own keys here
TMDB_API_KEY=your_tmdb_api_key
TMDB_API_READ_ACCESS_TOKEN=your_tmdb_read_access_token
EOF
    echo "⚠️  Please update .env.local with your TMDB API credentials"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Local development environment is ready!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To view the database:"
echo "  docker exec -it nospoilers-postgres-dev psql -U postgres -d nospoilers_dev"
echo ""
echo "To stop the database:"
echo "  docker-compose down"