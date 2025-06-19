#!/bin/bash

echo "Setting up Vercel environment variables for NoSpoilers"
echo "======================================================"
echo ""
echo "Please have the following ready:"
echo "1. Supabase project URL and anon key"
echo "2. TMDB API key"
echo "3. Admin username and password"
echo ""
echo "Press Enter to continue..."
read

# Set Supabase URL
echo "Enter your Supabase project URL (e.g., https://xxxxx.supabase.co):"
read SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production < <(echo "$SUPABASE_URL")

# Set Supabase Anon Key
echo "Enter your Supabase anon/public key:"
read SUPABASE_KEY
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production < <(echo "$SUPABASE_KEY")

# Set TMDB API Key
echo "Enter your TMDB API key (or press Enter to skip - movie search won't work):"
read TMDB_KEY
if [ ! -z "$TMDB_KEY" ]; then
  vercel env add TMDB_API_KEY production < <(echo "$TMDB_KEY")
fi

# Set Admin credentials
echo "Enter admin username (default: admin):"
read ADMIN_USER
if [ -z "$ADMIN_USER" ]; then
  ADMIN_USER="admin"
fi
vercel env add ADMIN_USERNAME production < <(echo "$ADMIN_USER")

echo "Enter admin password:"
read -s ADMIN_PASS
vercel env add ADMIN_PASSWORD production < <(echo "$ADMIN_PASS")

echo ""
echo "Environment variables set! You can now deploy with: vercel --prod"