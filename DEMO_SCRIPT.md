# NoSpoilers Demo Script - Comprehensive Feature Showcase

This demo script showcases all core features of NoSpoilers through a realistic movie night scenario.

## Demo Overview
**Scenario**: A group of friends (Sarah, Mike, Emma, and Alex) are trying to decide what movie to watch tonight. They use NoSpoilers to make a fair, democratic decision.

**Duration**: ~3-4 minutes
**Number of Users**: 4
**Movies Featured**: Mix of popular and indie films

---

## Scene 1: The Problem (0:00-0:15)
**Visual**: Landing page with "What should we watch?" heading

**Narration**: "It's movie night, but picking a movie always takes forever. Everyone has different preferences, and someone always feels left out."

**Action**: 
- Show landing page
- Brief pause on the problem statement
- Click "Start Voting"

---

## Scene 2: Sarah Starts the Process (0:15-0:45)
**Visual**: Empty voting page

**Narration**: "Sarah opens NoSpoilers and starts adding movie suggestions."

**Actions**:
1. Search for "Inception" 
   - Show autocomplete working
   - Click to add (shows rich data: poster, rating, cast)
2. Search for "Everything Everywhere" 
   - Add to candidates
3. Manually add "My Cousin's Wedding Video" 
   - Demonstrate offline/manual entry
   - Show how it works without TMDB data

**Key Features Shown**:
- TMDB search with autocomplete
- Rich movie metadata
- Manual entry for any title
- Offline capability

---

## Scene 3: Mike Joins and Adds Movies (0:45-1:15)
**Visual**: Switch to Mike's device (different session)

**Narration**: "Mike gets the link and adds his suggestions."

**Actions**:
1. Show Mike seeing existing movies (real-time update)
2. Try to add "Inception" again
   - Show duplicate prevention ("This movie has already been added")
3. Add "The Matrix"
4. Add "Parasite"

**Key Features Shown**:
- Multi-user support
- Real-time updates
- Duplicate prevention
- Session management

---

## Scene 4: Emma Votes First (1:15-1:45)
**Visual**: Emma's mobile device

**Narration**: "Emma's ready to vote. She ranks her favorites."

**Actions**:
1. Click movies to add to ranking:
   - 1st: Everything Everywhere
   - 2nd: Parasite
   - 3rd: Inception
2. Show reordering with up/down buttons (mobile UI)
3. Submit vote
4. Show "Thanks for voting!" redirect to results

**Key Features Shown**:
- Mobile-first interface
- Intuitive ranking system
- One-click submission
- Post-vote experience

---

## Scene 5: Live Results Update (1:45-2:15)
**Visual**: Results page showing live updates

**Narration**: "Everyone can watch the results update in real-time as votes come in."

**Actions**:
1. Show Emma's vote reflected (1 vote total)
2. Mike votes (show count increase to 2)
3. Sarah votes (count increases to 3)
4. Show rankings changing as votes accumulate

**Key Features Shown**:
- Live results
- Real-time vote counting
- Dynamic ranking updates
- Transparent scoring

---

## Scene 6: Alex Joins Late (2:15-2:45)
**Visual**: Alex's device

**Narration**: "Alex joins late but can still participate."

**Actions**:
1. Alex adds one more movie: "Dune"
2. Creates ranking with all 6 movies
3. Submits vote
4. Try to vote again - show "Already voted" message

**Key Features Shown**:
- Late participation allowed
- Can rank all or subset of movies
- Vote prevention (one per person)

---

## Scene 7: Admin Closes Voting (2:45-3:15)
**Visual**: Admin panel

**Narration**: "With everyone voted, Sarah uses admin access to close voting and declare the winner."

**Actions**:
1. Access admin panel (?admin=password)
2. Show statistics:
   - 4 votes cast
   - 6 movies suggested
   - Vote distribution
3. Click "Close Voting"
4. System calculates winner using Instant Runoff Voting

**Key Features Shown**:
- Admin controls
- Voting statistics
- Session management
- IRV algorithm

---

## Scene 8: Winner Announcement (3:15-3:30)
**Visual**: Results page with winner

**Narration**: "NoSpoilers uses ranked choice voting to find the movie that makes the most people happy."

**Actions**:
1. Show "Winner: Everything Everywhere All at Once"
2. Display full movie details:
   - Poster, rating, cast, director
   - Link to streaming/more info
3. Show final rankings with IRV explanation
4. Show elimination rounds (if applicable)

**Key Features Shown**:
- Fair winner selection
- Detailed results
- Transparent algorithm
- Complete movie information

---

## Key Differentiators to Emphasize:
1. **No Sign-ups**: Start voting immediately
2. **Works Offline**: Manual entry always available
3. **Mobile-First**: Designed for phones
4. **Fair Algorithm**: Ranked choice ensures majority satisfaction
5. **Real-time**: See results as they happen
6. **One-Click Sharing**: Send link to friends

## Technical Features to Highlight (if time):
- WebSocket real-time updates
- PostgreSQL database
- TMDB API integration
- Responsive design
- Session-based voting
- Multi-environment support

## Edge Cases to Demonstrate:
- Duplicate movie prevention
- Already voted protection
- Manual movie entry
- Partial rankings
- Late joiners
- Mobile and desktop UI differences

This demo comprehensively shows how NoSpoilers solves the "what should we watch" problem through democratic, ranked-choice voting with a beautiful, intuitive interface.