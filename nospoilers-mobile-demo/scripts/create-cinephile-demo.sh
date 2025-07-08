#!/bin/bash

# Create Cinephile Demo from existing video
# This script adds cinephile user labels to the existing 4-user demo

INPUT_VIDEO="../../public/videos/horizontal_4user_demo.mp4"
OUTPUT_DIR="../output"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "🎬 Creating Cinephile Demo Video..."

# Extract video info
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT_VIDEO")
echo "Video duration: ${DURATION}s"

# Create the labeled video with cinephile personas
ffmpeg -y -i "$INPUT_VIDEO" \
  -vf "
    drawtext=text='🎭 Art House':fontfile=/System/Library/Fonts/Avenir.ttc:fontsize=24:fontcolor=white:box=1:boxcolor=red@0.8:boxborderw=10:x=200-text_w/2:y=h-60,
    drawtext=text='💕 Rom-Com Fan':fontfile=/System/Library/Fonts/Avenir.ttc:fontsize=24:fontcolor=white:box=1:boxcolor=teal@0.8:boxborderw=10:x=600-text_w/2:y=h-60,
    drawtext=text='🚀 Sci-Fi Nerd':fontfile=/System/Library/Fonts/Avenir.ttc:fontsize=24:fontcolor=white:box=1:boxcolor=blue@0.8:boxborderw=10:x=1000-text_w/2:y=h-60,
    drawtext=text='🎬 Indie Buff':fontfile=/System/Library/Fonts/Avenir.ttc:fontsize=24:fontcolor=white:box=1:boxcolor=green@0.8:boxborderw=10:x=1400-text_w/2:y=h-60
  " \
  -c:v libx264 -crf 23 -preset medium \
  "$OUTPUT_DIR/mobile-4user-demo.mp4"

echo "✅ Main video created"

# Create 60-second version
ffmpeg -y -i "$OUTPUT_DIR/mobile-4user-demo.mp4" -t 60 -c copy "$OUTPUT_DIR/mobile-4user-demo-60s.mp4"
echo "✅ 60-second version created"

# Create 30-second version  
ffmpeg -y -i "$OUTPUT_DIR/mobile-4user-demo.mp4" -t 30 -c copy "$OUTPUT_DIR/mobile-4user-demo-30s.mp4"
echo "✅ 30-second version created"

# Extract thumbnail
ffmpeg -y -i "$OUTPUT_DIR/mobile-4user-demo.mp4" -vf "select=eq(n\\,120)" -vframes 1 "$OUTPUT_DIR/mobile-4user-demo-thumbnail.jpg"
echo "✅ Thumbnail created"

echo ""
echo "🎉 Cinephile demo complete!"
echo "Files created in $OUTPUT_DIR:"
ls -lh "$OUTPUT_DIR"/*.mp4 "$OUTPUT_DIR"/*.jpg