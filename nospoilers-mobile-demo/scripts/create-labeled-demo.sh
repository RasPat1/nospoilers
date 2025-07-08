#!/bin/bash

# Create labeled demo with cinephile names
INPUT_VIDEO="../../public/videos/horizontal_4user_demo.mp4"
OUTPUT_DIR="../output"

mkdir -p "$OUTPUT_DIR"

echo "🎬 Creating Labeled Cinephile Demo..."

# Create video with user labels
ffmpeg -y -i "$INPUT_VIDEO" \
  -vf "
    drawbox=x=0:y=h-80:w=400:h=80:color=red@0.8:t=fill,
    drawbox=x=400:y=h-80:w=400:h=80:color=teal@0.8:t=fill,
    drawbox=x=800:y=h-80:w=400:h=80:color=blue@0.8:t=fill,
    drawbox=x=1200:y=h-80:w=400:h=80:color=green@0.8:t=fill,
    drawtext=text='Art House':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=white:x=200-text_w/2:y=h-50,
    drawtext=text='Rom-Com Fan':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=white:x=600-text_w/2:y=h-50,
    drawtext=text='Sci-Fi Nerd':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=white:x=1000-text_w/2:y=h-50,
    drawtext=text='Indie Buff':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=white:x=1400-text_w/2:y=h-50
  " \
  -c:v libx264 -crf 23 -preset medium \
  "$OUTPUT_DIR/mobile-4user-demo-labeled.mp4"

echo "✅ Labeled video created"

# Create thumbnail at a good moment (2 seconds in)
ffmpeg -y -i "$OUTPUT_DIR/mobile-4user-demo-labeled.mp4" -ss 2 -vframes 1 "$OUTPUT_DIR/mobile-4user-demo-thumbnail.jpg"

echo "✅ Thumbnail created"

# Copy as main demo
cp "$OUTPUT_DIR/mobile-4user-demo-labeled.mp4" "$OUTPUT_DIR/mobile-4user-demo.mp4"

echo ""
echo "🎉 Demo complete!"
echo "Output: $OUTPUT_DIR/mobile-4user-demo.mp4"