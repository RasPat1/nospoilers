#!/bin/bash

# Script to prepare demo videos for deployment
# Videos will be copied to public/videos when approved

echo "🎬 Demo Video Preparation Script"
echo "================================"

# Create directories
mkdir -p public/videos
mkdir -p public/demo-thumbnails
mkdir -p demo-output/approved

# Check if comprehensive demo exists
if [ -f "demo-output/comprehensive/nospoilers_complete_demo.mp4" ]; then
    echo "✅ Found complete demo video"
    echo "   Size: $(du -h demo-output/comprehensive/nospoilers_complete_demo.mp4 | cut -f1)"
else
    echo "❌ Complete demo not found at demo-output/comprehensive/nospoilers_complete_demo.mp4"
fi

# Check for individual scene videos
echo ""
echo "Individual scene videos:"
for i in {1..8}; do
    if [ -f "demo-output/comprehensive/scene${i}_*.mp4" ]; then
        echo "✅ Scene $i found"
    else
        echo "❌ Scene $i not found"
    fi
done

echo ""
echo "To copy videos to public folder for deployment, run:"
echo "  ./scripts/prepare-demo-videos.sh deploy"

if [ "$1" = "deploy" ]; then
    echo ""
    echo "📦 Deploying videos to public folder..."
    
    # Copy main demo if it exists
    if [ -f "demo-output/comprehensive/nospoilers_complete_demo.mp4" ]; then
        cp demo-output/comprehensive/nospoilers_complete_demo.mp4 public/videos/
        echo "✅ Copied main demo to public/videos/"
    fi
    
    # Generate thumbnail from first frame
    if command -v ffmpeg &> /dev/null && [ -f "public/videos/nospoilers_complete_demo.mp4" ]; then
        ffmpeg -i public/videos/nospoilers_complete_demo.mp4 -vf "select=eq(n\,0)" -q:v 3 public/demo-thumbnails/main-demo.jpg -y > /dev/null 2>&1
        echo "✅ Generated video thumbnail"
    fi
    
    # Create a placeholder thumbnail if ffmpeg not available
    if [ ! -f "public/demo-thumbnails/main-demo.jpg" ]; then
        # Create a simple placeholder image using ImageMagick if available
        if command -v convert &> /dev/null; then
            convert -size 1920x1080 xc:'#1a1a1a' -gravity center -fill white -pointsize 60 -annotate +0+0 'NoSpoilers Demo' public/demo-thumbnails/main-demo.jpg
        fi
    fi
    
    echo ""
    echo "✅ Videos prepared for deployment!"
    echo "   Main video: public/videos/nospoilers_complete_demo.mp4"
    echo "   Thumbnail: public/demo-thumbnails/main-demo.jpg"
fi