#!/bin/bash

# Comprehensive 4-User WebSocket Demo Runner
# This creates a demo video showing:
# - 4 users side by side
# - WebSocket real-time synchronization
# - Multiple users adding movies
# - Voting at different speeds
# - Live results updates
# - IRV elimination rounds

echo "🎬 NoSpoilers Comprehensive 4-User WebSocket Demo"
echo "================================================"

# Check if the app is running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "❌ Error: NoSpoilers app is not running on port 8080"
    echo "Please start the app first with: npm run dev"
    exit 1
fi

# Check if WebSocket server is running
if ! curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "⚠️  Warning: WebSocket server may not be running on port 8081"
    echo "WebSocket features may not work properly"
    echo "Start it with: npm run websocket"
fi

# Install dependencies if needed
cd "$(dirname "$0")"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing demo dependencies..."
    npm install
fi

# Clear any existing votes/data
echo "🧹 Clearing existing data..."
curl -X DELETE http://localhost:8080/api/votes/clear -H "Content-Type: application/json" -d '{"sessionId": "demo-clear"}' > /dev/null 2>&1

# Run the comprehensive demo
echo "🎥 Starting comprehensive 4-user WebSocket demo..."
echo "This will take several minutes to complete..."
echo ""

node comprehensive-4-user-websocket-demo.js

echo ""
echo "✅ Demo complete!"
echo ""
echo "📹 Video outputs:"
echo "- Full demo: comprehensive_4user_websocket_demo.mp4"
echo "- 60-second version: comprehensive_4user_websocket_demo_60s.mp4"
echo "- Public folder: ../public/videos/comprehensive_4user_websocket_demo.mp4"
echo ""
echo "🎯 Features demonstrated:"
echo "- 4 users displayed side by side in 2x2 grid"
echo "- Real-time WebSocket synchronization"
echo "- Multiple users adding movies simultaneously"
echo "- Users voting at different speeds"
echo "- One user submitting before others"
echo "- Live results updating as votes come in"
echo "- IRV elimination rounds expansion"
echo "- Final winner determination"