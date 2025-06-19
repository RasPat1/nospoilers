#!/bin/bash

echo "🚀 Setting up local PostgreSQL for NoSpoilers..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start PostgreSQL
echo "📦 Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec nospoilers-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start. Check docker-compose logs."
        exit 1
    fi
    sleep 1
done

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Local PostgreSQL Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nospoilers
USE_LOCAL_DB=true

# Admin Configuration
ADMIN_SECRET=admin123
EOF
    echo "✅ Created .env.local with local database configuration"
else
    echo "⚠️  .env.local already exists. Please update it manually:"
    echo "   - Set USE_LOCAL_DB=true"
    echo "   - Set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nospoilers"
fi

echo ""
echo "✅ Local PostgreSQL setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' if you haven't already"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
echo "To stop the database: docker-compose down"
echo "To reset the database: docker-compose down -v"