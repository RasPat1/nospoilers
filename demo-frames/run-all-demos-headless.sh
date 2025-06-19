#!/bin/bash

echo "🎬 NoSpoilers Demo Suite - Headless Mode"
echo "========================================"
echo ""
echo "This will generate both desktop and mobile demos in the background."
echo "You can continue using your computer normally."
echo ""

# Check if app is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ NoSpoilers is not running!"
    echo "   Please start it with: npm run dev"
    exit 1
fi

echo "✅ NoSpoilers is running"
echo ""

# Run desktop demo
echo "📍 Starting desktop demo (1920x1080)..."
HEADLESS=true node demo-recorder.js &
DESKTOP_PID=$!

# Run mobile demo
echo "📍 Starting mobile demo (390x844)..."
HEADLESS=true node mobile-demo-simple.js &
MOBILE_PID=$!

# Wait for both to complete
echo ""
echo "⏳ Recording in progress..."
echo "   This usually takes 2-3 minutes"
echo ""

# Show progress
while kill -0 $DESKTOP_PID 2>/dev/null || kill -0 $MOBILE_PID 2>/dev/null; do
    echo -n "."
    sleep 2
done

echo ""
echo ""
echo "✅ All demos complete!"
echo ""
echo "📁 Generated files:"
echo "   Desktop:"
echo "   - movie_night_demo.mp4"
echo "   - movie_night_demo_30sec.mp4"
echo "   Mobile:"
echo "   - nospoilers_mobile_demo.mp4"
echo "   - nospoilers_mobile_demo_30sec.mp4"
echo ""
echo "🎉 Done!"