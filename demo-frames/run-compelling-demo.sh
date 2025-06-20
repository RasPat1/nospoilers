#!/bin/bash

echo "🎬 NoSpoilers Compelling Demo Generator"
echo "======================================="

# Check if the server is running
if ! curl -s http://localhost:8080 > /dev/null; then
    echo "❌ Error: NoSpoilers server is not running on localhost:8080"
    echo "Please start the server with 'npm run dev' in another terminal"
    exit 1
fi

# Check if demo output directory exists
if [ ! -d "compelling-demo-frames" ]; then
    mkdir -p compelling-demo-frames
    echo "📁 Created output directory: compelling-demo-frames/"
fi

# Clean previous frames
echo "🧹 Cleaning previous frames..."
rm -f compelling-demo-frames/*.png

# Run the demo
echo "🎬 Starting demo recording..."
echo "This will take approximately 2-3 minutes"
echo ""

node compelling-demo.js

# Check if video was created successfully
if [ -f "nospoilers_compelling_demo.mp4" ]; then
    echo ""
    echo "✅ Demo video created successfully!"
    echo "📹 Main video: nospoilers_compelling_demo.mp4"
    
    if [ -f "nospoilers_compelling_demo_30s.mp4" ]; then
        echo "📹 30-second version: nospoilers_compelling_demo_30s.mp4"
    fi
    
    if [ -f "nospoilers_compelling_demo_60s.mp4" ]; then
        echo "📹 60-second version: nospoilers_compelling_demo_60s.mp4"
    fi
    
    echo ""
    echo "🚀 Next steps:"
    echo "1. Review the video(s)"
    echo "2. Move to public/videos/ for production use"
    echo "3. Generate thumbnail with: ffmpeg -i nospoilers_compelling_demo.mp4 -ss 00:00:10 -vframes 1 thumbnail.jpg"
else
    echo "❌ Error: Demo video was not created. Check the console output above for errors."
    exit 1
fi