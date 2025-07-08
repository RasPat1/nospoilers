#!/bin/bash

# Create a concat file with proper durations
cat > concat_4users_manual.txt << EOF
file 'composite_000_start.png'
duration 3
file 'composite_001_matrix_added.png'
duration 4
file 'composite_002_interstellar_added.png'
duration 3.5
file 'composite_003_sarah_voted.png'
duration 3.5
file 'composite_003_sarah_voted.png'
EOF

# Create the video
ffmpeg -y -f concat -safe 0 -i concat_4users_manual.txt \
  -vf "scale=1560:844,fps=30" \
  -c:v libx264 -pix_fmt yuv420p \
  nospoilers_4users_demo_final.mp4

echo "✅ Created nospoilers_4users_demo_final.mp4"