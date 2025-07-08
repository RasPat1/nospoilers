#!/bin/bash

# Extract frames from the 2x2 grid video
mkdir -p extracted-frames
ffmpeg -i nospoilers_2x2_grid_demo.mp4 -vf fps=2 extracted-frames/frame_%04d.png

# For each frame, split into 4 quadrants and recombine horizontally
mkdir -p horizontal-frames

for frame in extracted-frames/*.png; do
  filename=$(basename "$frame")
  
  # Extract each quadrant
  # Top-left (User 1)
  ffmpeg -i "$frame" -vf "crop=400:440:0:0" -y "horizontal-frames/user1_$filename"
  
  # Top-right (User 2)
  ffmpeg -i "$frame" -vf "crop=400:440:400:0" -y "horizontal-frames/user2_$filename"
  
  # Bottom-left (User 3)
  ffmpeg -i "$frame" -vf "crop=400:440:0:440" -y "horizontal-frames/user3_$filename"
  
  # Bottom-right (User 4)
  ffmpeg -i "$frame" -vf "crop=400:440:400:440" -y "horizontal-frames/user4_$filename"
  
  # Combine horizontally
  ffmpeg -i "horizontal-frames/user1_$filename" \
         -i "horizontal-frames/user2_$filename" \
         -i "horizontal-frames/user3_$filename" \
         -i "horizontal-frames/user4_$filename" \
         -filter_complex "[0:v][1:v][2:v][3:v]hstack=inputs=4" \
         -y "horizontal-frames/horizontal_$filename"
  
  # Clean up individual user frames
  rm "horizontal-frames/user1_$filename" \
     "horizontal-frames/user2_$filename" \
     "horizontal-frames/user3_$filename" \
     "horizontal-frames/user4_$filename"
done

# Create the final video
ffmpeg -r 2 -i horizontal-frames/horizontal_frame_%04d.png \
       -c:v libx264 -pix_fmt yuv420p \
       -vf "scale=1920:-2" \
       ../public/videos/horizontal_4user_demo.mp4

# Create 60s version
ffmpeg -i ../public/videos/horizontal_4user_demo.mp4 -t 60 -c copy ../public/videos/horizontal_4user_demo_60s.mp4

# Clean up
rm -rf extracted-frames horizontal-frames

echo "✅ Horizontal video created at public/videos/horizontal_4user_demo.mp4"