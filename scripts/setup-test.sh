#!/bin/bash

# Setup script for test environment (demos and e2e tests)

echo "🧪 Setting up NoSpoilers test environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start only the test database
echo "🗄️ Starting test database..."
docker-compose up -d postgres-test

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is accessible
until docker exec nospoilers-postgres-test pg_isready -U postgres -d nospoilers_test > /dev/null 2>&1; do
    echo "   Waiting for database connection..."
    sleep 2
done

echo "✅ Test database is ready!"

# Clean the test database
echo "🧹 Cleaning test database..."
docker exec nospoilers-postgres-test psql -U postgres -d nospoilers_test -c "
TRUNCATE TABLE votes, user_sessions, voting_sessions, movies CASCADE;
"

echo ""
echo "🎉 Test environment is ready!"
echo ""
echo "To run tests with test database:"
echo "  NODE_ENV=test npm test"
echo ""
echo "To run demos with test database:"
echo "  NODE_ENV=test node demo-frames/your-demo.js"