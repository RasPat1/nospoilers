# NoSpoilers App - Todo List

## 🐛 Bugs to Fix

### 1. Vote Count Display Issue
- **Problem**: Results page shows "Total Votes: 3" when only one person has voted
- **Details**: The vote count appears to be aggregating across all environments or counting incorrectly
- **Priority**: High
- **Files to check**: 
  - `/app/results/page.tsx`
  - `/app/api/votes/route.ts`

### 2. Movie Points Display
- **Problem**: Movies show "0 points" on the results page despite having votes
- **Details**: The point calculation or display logic isn't working correctly
- **Priority**: High
- **Files to check**:
  - `/components/Results.tsx`
  - Point calculation logic in the voting system

### 3. Clear Vote Data Persistence
- **Problem**: When using "Clear Vote & Vote Again", previous votes are still recorded
- **Details**: The clear function may not be properly removing vote data from the database
- **Priority**: High
- **Files to check**:
  - `/app/api/votes/clear/route.ts`
  - Database cleanup logic

## ✨ Features to Implement

### 4. Real-time Results Updates
- **Feature**: Update results page in real-time as votes come in
- **Implementation Options**:
  - WebSockets for live updates
  - Server-Sent Events (SSE)
  - Polling with optimistic updates
- **Priority**: Medium
- **Considerations**: Supabase real-time subscriptions could be used

### 5. Animated Ranked Choice Voting
- **Feature**: Show ranked choice elimination rounds as an animation
- **Details**: 
  - After voting completes, show step-by-step elimination
  - Visualize vote redistribution
  - Make the process educational and engaging
- **Priority**: Medium
- **Implementation Ideas**:
  - Use Framer Motion or similar animation library
  - Show votes flowing from eliminated choices to next preferences

### 6. Movie List Deduplication
- **Feature**: Prevent duplicate movies in the voting list
- **Details**: 
  - Check for existing movies before adding
  - Consider fuzzy matching for similar titles
  - Handle different years/versions of same movie
- **Priority**: High
- **Files to check**:
  - `/app/api/movies/route.ts`
  - Movie addition logic

### 7. Improve UI Section Clarity
- **Feature**: Make different sections more visually distinct
- **Details**:
  - Add clear visual separation between voting, results, and admin sections
  - Use better headings, borders, or background colors
  - Improve section labels and descriptions
  - Consider adding icons or visual cues for each section
- **Priority**: Medium
- **Areas to improve**:
  - Vote page sections (available movies vs. your ranking)
  - Results page sections (current standings vs. elimination rounds)
  - Admin dashboard organization

## 📋 Additional Improvements to Consider

### 8. Environment Isolation
- **Ensure proper separation between development and production data**
- **Add environment indicators in the UI**

### 9. Vote Validation
- **Prevent users from voting multiple times**
- **Add vote modification window**

### 10. Results Page Enhancements
- **Show vote distribution clearly**
- **Add vote percentage displays**
- **Improve mobile responsiveness**

## 🚀 Next Steps

When starting work on these items:
1. Fix critical bugs first (items 1-3)
2. Implement deduplication (item 6)
3. Add real-time updates (item 4)
4. Enhance with animations (item 5)

---

*Last updated: 2025-06-19*