#!/bin/bash

# Create a concat file with the captured realtime frames
cat > concat_realtime_manual.txt << EOF
file 'realtime_captioned_0.png'
duration 3
file 'realtime_captioned_1.png'
duration 4
file 'realtime_captioned_2.png'
duration 3.5
file 'realtime_captioned_3.png'
duration 4
file 'realtime_captioned_3.png'
EOF

# Create the video
ffmpeg -y -f concat -safe 0 -i concat_realtime_manual.txt \
  -vf "scale=800:880,fps=30" \
  -c:v libx264 -pix_fmt yuv420p \
  nospoilers_realtime_partial.mp4

echo "✅ Created nospoilers_realtime_partial.mp4"