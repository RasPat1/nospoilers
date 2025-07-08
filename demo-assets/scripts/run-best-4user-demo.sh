#!/bin/bash

# Run the best 4-user comprehensive demo
# This script runs the enhanced version with all features

echo "🎬 NoSpoilers - Best 4-User Demo"
echo "================================"
echo ""
echo "This demo showcases:"
echo "✅ 4 users displayed side-by-side in 2x2 grid"
echo "✅ Real-time WebSocket synchronization"
echo "✅ Multiple users adding movies"
echo "✅ Users voting at different speeds"
echo "✅ Live results updating as votes come in"
echo "✅ IRV elimination rounds with vote transfers"
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check if app is running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "❌ NoSpoilers app is not running!"
    echo ""
    echo "Please start it in another terminal:"
    echo "  cd /Users/ras/dev/nospoilers"
    echo "  npm run dev"
    echo ""
    exit 1
fi

# Check if WebSocket server is running
if ! curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "⚠️  WebSocket server may not be running!"
    echo ""
    echo "For best results, start it in another terminal:"
    echo "  cd /Users/ras/dev/nospoilers"
    echo "  npm run websocket"
    echo ""
    echo "Press Enter to continue anyway, or Ctrl+C to cancel..."
    read
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg is not installed!"
    echo ""
    echo "Please install it first:"
    echo "  brew install ffmpeg"
    echo ""
    exit 1
fi

echo "✅ All prerequisites met!"
echo ""

# Change to demo directory
cd "$(dirname "$0")"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clear existing data
echo "🧹 Clearing existing votes..."
curl -X DELETE http://localhost:8080/api/votes/clear \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "demo-clear-all"}' \
  > /dev/null 2>&1

echo ""
echo "🎥 Starting enhanced 4-user demo..."
echo "This will take 2-3 minutes to complete."
echo ""

# Run the enhanced demo (best visual quality and annotations)
node enhanced-4user-websocket-demo.js

# Check if video was created
if [ -f "enhanced_4user_websocket_demo.mp4" ]; then
    echo ""
    echo "✅ Demo video created successfully!"
    echo ""
    echo "📹 Video files:"
    echo "  Full demo: enhanced_4user_websocket_demo.mp4"
    echo "  60-sec version: enhanced_4user_websocket_demo_60s.mp4"
    echo ""
    echo "🌐 Also copied to: ../public/videos/enhanced_4user_websocket_demo.mp4"
    echo ""
    echo "📊 Video details:"
    ffmpeg -i enhanced_4user_websocket_demo.mp4 2>&1 | grep -E "Duration|Stream.*Video" | head -2
    echo ""
    echo "🎯 To play the video:"
    echo "  open enhanced_4user_websocket_demo.mp4"
    echo ""
else
    echo ""
    echo "❌ Video creation failed. Check the console output above for errors."
    echo ""
fi