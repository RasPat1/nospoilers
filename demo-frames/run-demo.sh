#!/bin/bash

echo "🎬 NoSpoilers Demo Recorder"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if FFmpeg is installed (warning only)
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  Warning: FFmpeg is not installed. Video generation will fail."
    echo "   Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)"
    echo ""
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if the app is running
echo "🔍 Checking if NoSpoilers is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ NoSpoilers is running on http://localhost:3000"
else
    echo "❌ NoSpoilers is not running!"
    echo "   Please start it with: npm run dev"
    exit 1
fi

echo ""
echo "🎬 Starting demo recording..."
echo "   This will take approximately 2-3 minutes"
echo ""

# Run the demo
node demo-recorder.js

echo ""
echo "✅ Demo recording complete!"
echo "   Check the output files:"
echo "   - Screenshots: ./demo-frames/*.png"
echo "   - Full video: ./movie_night_demo.mp4"
echo "   - 30-sec video: ./movie_night_demo_30sec.mp4"