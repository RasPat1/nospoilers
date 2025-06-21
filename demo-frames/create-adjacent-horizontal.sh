#!/bin/bash

# This script creates a horizontal video with 4 phones directly adjacent
# Uses the existing 4users demo as source

echo "🎬 Creating horizontal video with adjacent phones..."

# Create output directory
mkdir -p adjacent-frames

# Extract frames from the best 4-user demo
echo "📸 Extracting frames..."
ffmpeg -i nospoilers_4users_demo_final.mp4 -vf fps=2 adjacent-frames/frame_%04d.png -y

# Get frame dimensions
FRAME_INFO=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 adjacent-frames/frame_0001.png)
WIDTH=$(echo $FRAME_INFO | cut -d'x' -f1)
HEIGHT=$(echo $FRAME_INFO | cut -d'x' -f2)

echo "Frame dimensions: ${WIDTH}x${HEIGHT}"

# Calculate quadrant dimensions (assuming 2x2 layout in source)
QUAD_WIDTH=$((WIDTH / 2))
QUAD_HEIGHT=$((HEIGHT / 2))

echo "Quadrant dimensions: ${QUAD_WIDTH}x${QUAD_HEIGHT}"

# Process each frame to create horizontal layout
echo "🔧 Creating horizontal layout..."
for frame in adjacent-frames/frame_*.png; do
  filename=$(basename "$frame")
  
  # Extract each quadrant and add user labels
  # Top-left (Alex - Red)
  ffmpeg -i "$frame" -vf "crop=${QUAD_WIDTH}:${QUAD_HEIGHT}:0:0,drawtext=text='Alex':fontcolor=white:fontsize=24:box=1:boxcolor=red@0.8:boxborderw=10:x=(w-text_w)/2:y=h-50" -y "adjacent-frames/user1_$filename" 2>/dev/null
  
  # Top-right (Sam - Teal)  
  ffmpeg -i "$frame" -vf "crop=${QUAD_WIDTH}:${QUAD_HEIGHT}:${QUAD_WIDTH}:0,drawtext=text='Sam':fontcolor=white:fontsize=24:box=1:boxcolor=teal@0.8:boxborderw=10:x=(w-text_w)/2:y=h-50" -y "adjacent-frames/user2_$filename" 2>/dev/null
  
  # Bottom-left (Jordan - Blue)
  ffmpeg -i "$frame" -vf "crop=${QUAD_WIDTH}:${QUAD_HEIGHT}:0:${QUAD_HEIGHT},drawtext=text='Jordan':fontcolor=white:fontsize=24:box=1:boxcolor=blue@0.8:boxborderw=10:x=(w-text_w)/2:y=h-50" -y "adjacent-frames/user3_$filename" 2>/dev/null
  
  # Bottom-right (Casey - Green)
  ffmpeg -i "$frame" -vf "crop=${QUAD_WIDTH}:${QUAD_HEIGHT}:${QUAD_WIDTH}:${QUAD_HEIGHT},drawtext=text='Casey':fontcolor=white:fontsize=24:box=1:boxcolor=green@0.8:boxborderw=10:x=(w-text_w)/2:y=h-50" -y "adjacent-frames/user4_$filename" 2>/dev/null
  
  # Combine horizontally with no gaps
  ffmpeg -i "adjacent-frames/user1_$filename" \
         -i "adjacent-frames/user2_$filename" \
         -i "adjacent-frames/user3_$filename" \
         -i "adjacent-frames/user4_$filename" \
         -filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4:shortest=1" \
         -y "adjacent-frames/horizontal_$filename" 2>/dev/null
  
  # Clean up individual frames
  rm "adjacent-frames/user1_$filename" \
     "adjacent-frames/user2_$filename" \
     "adjacent-frames/user3_$filename" \
     "adjacent-frames/user4_$filename" 2>/dev/null
  
  echo -n "."
done

echo ""

# Create the final video with proper aspect ratio
echo "🎥 Creating final video..."
ffmpeg -r 2 -i adjacent-frames/horizontal_frame_%04d.png \
       -c:v libx264 -pix_fmt yuv420p \
       -vf "scale=1600:-2" \
       ../public/videos/horizontal_4user_demo.mp4 -y

# Create 60s version
ffmpeg -i ../public/videos/horizontal_4user_demo.mp4 -t 60 -c copy ../public/videos/horizontal_4user_demo_60s.mp4 -y

# Also save as perfect version
cp ../public/videos/horizontal_4user_demo.mp4 ../public/videos/perfect_horizontal_4user_demo.mp4

# Clean up
rm -rf adjacent-frames

echo "✅ Horizontal video created with adjacent phones and user labels!"
echo "📍 Location: public/videos/horizontal_4user_demo.mp4"