#!/bin/bash

# NoSpoilers Comprehensive Demo Runner
# This script helps run the full demo or individual scenes

echo "🎬 NoSpoilers Comprehensive Demo"
echo "================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  ./run-comprehensive-demo.sh          # Run complete demo"
    echo "  ./run-comprehensive-demo.sh scene N  # Run specific scene (1-8)"
    echo ""
    echo -e "${BLUE}Scenes:${NC}"
    echo "  1. The Problem - Landing page introduction"
    echo "  2. Sarah Adds Movies - TMDB search and manual entry"
    echo "  3. Mike Joins - Multi-user and duplicate prevention"
    echo "  4. Emma Votes - Mobile voting experience"
    echo "  5. Live Results - Real-time updates"
    echo "  6. Alex Joins Late - Late participation"
    echo "  7. Admin Closes - Admin panel and statistics"
    echo "  8. Winner Announcement - IRV results"
}

# Check if development server is running
check_server() {
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo -e "${YELLOW}⚠️  Development server not running!${NC}"
        echo "Starting servers..."
        
        # Start dev server in background
        npm run dev:all > /tmp/nospoilers-demo.log 2>&1 &
        DEV_PID=$!
        
        echo "Waiting for server to start..."
        sleep 5
        
        # Check again
        if ! curl -s http://localhost:3000 > /dev/null; then
            echo -e "${YELLOW}❌ Failed to start development server${NC}"
            echo "Please run 'npm run dev:all' in another terminal"
            exit 1
        fi
        
        echo -e "${GREEN}✓ Development server started${NC}"
        return $DEV_PID
    else
        echo -e "${GREEN}✓ Development server is running${NC}"
        return 0
    fi
}

# Clean up function
cleanup() {
    if [ ! -z "$DEV_PID" ]; then
        echo "Stopping development server..."
        kill $DEV_PID 2>/dev/null
    fi
}

# Set up cleanup on exit
trap cleanup EXIT

# Main execution
echo -e "${BLUE}Checking prerequisites...${NC}"
check_server
SERVER_PID=$?

# Parse arguments
if [ "$1" == "scene" ] && [ ! -z "$2" ]; then
    # Run specific scene
    SCENE_NUM=$2
    echo -e "${BLUE}Running Scene $SCENE_NUM...${NC}"
    
    case $SCENE_NUM in
        1) echo "🎬 Scene 1: The Problem" ;;
        2) echo "🎬 Scene 2: Sarah Adds Movies" ;;
        3) echo "🎬 Scene 3: Mike Joins" ;;
        4) echo "🎬 Scene 4: Emma Votes" ;;
        5) echo "🎬 Scene 5: Live Results" ;;
        6) echo "🎬 Scene 6: Alex Joins Late" ;;
        7) echo "🎬 Scene 7: Admin Closes Voting" ;;
        8) echo "🎬 Scene 8: Winner Announcement" ;;
        *) 
            echo -e "${YELLOW}❌ Invalid scene number. Must be 1-8.${NC}"
            show_usage
            exit 1
            ;;
    esac
    
    node demo-frames/comprehensive-demo.js scene $SCENE_NUM
    
elif [ "$1" == "help" ] || [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    show_usage
    exit 0
    
elif [ -z "$1" ]; then
    # Run complete demo
    echo -e "${BLUE}Running complete demo...${NC}"
    echo "This will create:"
    echo "  • 8 individual scene videos"
    echo "  • 1 combined full demo video"
    echo ""
    echo -e "${YELLOW}This will take approximately 5-7 minutes.${NC}"
    echo ""
    read -p "Continue? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node demo-frames/comprehensive-demo.js
    else
        echo "Demo cancelled."
        exit 0
    fi
    
else
    echo -e "${YELLOW}❌ Invalid command.${NC}"
    show_usage
    exit 1
fi

echo -e "${GREEN}✅ Demo complete!${NC}"
echo ""
echo -e "${BLUE}Output files:${NC}"
echo "  📁 demo-output/comprehensive/"
echo "     📹 scene1_problem.mp4"
echo "     📹 scene2_sarah.mp4"
echo "     📹 scene3_mike.mp4"
echo "     📹 scene4_emma.mp4"
echo "     📹 scene5_results.mp4"
echo "     📹 scene6_alex.mp4"
echo "     📹 scene7_admin.mp4"
echo "     📹 scene8_winner.mp4"
echo "     🎬 nospoilers_complete_demo.mp4"

# Ring the bell
echo -e "\a"