#!/bin/bash

echo "🎬 NoSpoilers IRV Demo Recorder"
echo "==============================="
echo ""

# Check if the app is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Error: NoSpoilers app is not running on http://localhost:3000"
    echo "Please start the app first with: npm run dev"
    exit 1
fi

echo "✅ App is running"
echo ""

# Run options
echo "Select demo mode:"
echo "1) Visible browser (default)"
echo "2) Headless mode"
echo -n "Choice [1]: "
read choice

if [ "$choice" = "2" ]; then
    export HEADLESS=true
    export SLOW_MO=0
    echo "Running in headless mode..."
else
    export HEADLESS=false
    export SLOW_MO=50
    echo "Running with visible browser..."
fi

echo ""
echo "Starting demo recording..."
echo ""

# Run the demo
node demo-irv-showcase.js

echo ""
echo "✅ Demo complete!"
echo ""
echo "Output files:"
echo "- Video: ./demo-frames/nospoilers_irv_demo.mp4"
echo "- 60-sec: ./demo-frames/nospoilers_irv_demo_60sec.mp4"
echo ""

# Ask if user wants to open the video
echo -n "Open the video? (y/n) [y]: "
read open_video

if [ "$open_video" != "n" ]; then
    if [ -f "./demo-frames/nospoilers_irv_demo.mp4" ]; then
        open "./demo-frames/nospoilers_irv_demo.mp4" 2>/dev/null || xdg-open "./demo-frames/nospoilers_irv_demo.mp4" 2>/dev/null || echo "Please open ./demo-frames/nospoilers_irv_demo.mp4 manually"
    fi
fi