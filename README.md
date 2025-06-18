# NoSpoilers - Movie Night Voting App

A simple web app for democratically choosing movies using ranked choice voting.

## Problem Statement

Movie night shouldn't start with a 45-minute argument about whether to watch "The Princess Bride" for the 47th time or finally give Sarah's obscure documentary about mushrooms a chance. NoSpoilers brings democracy to your couch by using ranked choice voting - so when "Die Hard" inevitably wins, at least everyone had their fair shot at pushing their weird indie film.

## Core Features (MVP)

### Movie Management
- **Add Movies**: Any user can add movie candidates to the voting pool
- **View Candidates**: See all proposed movies in a clear list

### Voting System
- **Ranked Choice Voting**: Users drag and drop movies to create their ranked preference list
- **Anonymous Voting**: Votes are counted without tracking who voted for what
- **One Vote Per Person**: System ensures each person can only vote once
- **Drag & Drop Interface**: 
  - Drag movies from candidate list to personal ranking
  - Reorder preferences by dragging within the ranking list

### Results & History
- **Close Voting**: Admin can end the voting period
- **View Results**: See the winning movie based on ranked choice algorithm
- **Watch History**: Movies that were actually watched are moved to a separate "Watched" list

### Access & Sharing
- **Easy Sharing**: Simple link to share with all participants
- **Multi-User Access**: Multiple people can access and use the app simultaneously
- **Admin Controls**: Single admin user for managing voting sessions

## Nice-to-Have Features (Future)

- **Movie Search**: Integration with movie databases to search and add films
- **Movie Details**: Display posters, ratings, and descriptions
- **Voting History**: Track past voting sessions and results
- **Themes/Genres**: Filter or categorize movies by genre
- **Discussion Thread**: Comments or chat for each movie candidate
- **Scheduling**: Set specific voting deadlines
- **Multiple Voting Sessions**: Run parallel votes for different movie nights

## User Flow

1. Admin shares the voting link with the group
2. Users add movies they'd like to watch
3. Once all movies are added, users drag movies into their ranked preference list
4. Admin closes voting when everyone has participated
5. System calculates the winner using ranked choice voting
6. Winning movie is announced and moved to "Watched" list after movie night

## Success Metrics

- All participants can easily add and vote for movies
- Voting process takes less than 5 minutes per person
- Clear winner is determined without manual counting
- No duplicate votes are counted