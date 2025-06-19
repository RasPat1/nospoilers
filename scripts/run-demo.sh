#!/bin/bash

# Wrapper script to run demos in isolated test environment

if [ $# -eq 0 ]; then
    echo "Usage: ./scripts/run-demo.sh <demo-script>"
    echo "Example: ./scripts/run-demo.sh demo-frames/simple-demo.js"
    exit 1
fi

DEMO_SCRIPT=$1

echo "🎬 Running demo in test environment..."

# Ensure test database is running
./scripts/setup-test.sh

# Start WebSocket server for test environment
echo "🔌 Starting test WebSocket server..."
NODE_ENV=test WS_PORT=3002 node websocket-server.js > /tmp/test-ws-server.log 2>&1 &
TEST_WS_PID=$!

# Give WebSocket server time to start
sleep 2

# Run the demo with test environment
echo "🎬 Running demo script..."
NODE_ENV=test HEADLESS=true node $DEMO_SCRIPT

# Kill the test WebSocket server
echo "🛑 Stopping test WebSocket server..."
kill $TEST_WS_PID 2>/dev/null

echo "✅ Demo completed!"