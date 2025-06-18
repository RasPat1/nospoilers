# Local Development Setup

## Prerequisites
- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier is fine)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
Follow the instructions in `SUPABASE_SETUP.md` to:
- Create a Supabase project
- Run the database schema SQL
- Get your API keys

### 3. Configure Environment Variables
Copy `.env.local` and update with your actual values:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_SECRET=admin123  # Change this in production!
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Using the App

### As a Regular User:
1. Add movies to the candidate list
2. Drag movies from the left column to your ranking on the right
3. Reorder your ranking by dragging movies up/down
4. Click "Submit Vote" when ready

### As Admin:
1. Access admin features by adding `?admin=admin123` to the URL
2. Click "Close Voting" to end voting and calculate results
3. The winner will be displayed using ranked choice voting

## Testing the Ranked Choice Voting

To test with multiple users:
1. Open the app in multiple incognito/private browser windows
2. Each window will have its own session ID
3. Add movies and vote from each window
4. Close voting as admin to see results

## Troubleshooting

### "Failed to fetch" errors
- Check that your Supabase URL and API key are correct in `.env.local`
- Ensure you've run the database schema SQL in Supabase

### Can't see admin button
- Make sure you're accessing the page with `?admin=admin123` in the URL

### Votes not being recorded
- Check browser console for errors
- Verify the votes table was created in Supabase
- Ensure Row Level Security policies are set up correctly