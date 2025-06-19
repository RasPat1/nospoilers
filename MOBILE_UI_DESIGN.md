# NoSpoilers Mobile-First UI Design

## Core Problems with Current Design
- Drag-and-drop conflicts with scroll gestures on mobile
- Touch targets too small
- No clear visual indicators for interactions
- Hover states don't work on touch devices

## New Mobile-First Design Principles

### 1. Button-Based Interactions
- Replace drag-and-drop with explicit action buttons
- Each movie card has clear "Add to Ranking" or "Remove" buttons
- Large touch targets (minimum 44x44px)

### 2. Single Column Layout
- One movie per row for easy scanning
- Full-width cards with ample padding
- Clear visual separation between sections

### 3. Fixed Headers
- "Available Movies" and "Your Ranking" sections with sticky headers
- Current count displayed in headers
- Clear visual distinction between sections

### 4. Ranking Management
- Numbered ranking positions (1, 2, 3, etc.)
- Up/Down arrow buttons to reorder within ranking
- "Remove" button to send back to available movies
- Visual feedback on button press

### 5. Visual Design
- High contrast for outdoor viewing
- Large, readable text (minimum 16px)
- Clear button states (normal, pressed, disabled)
- No reliance on hover effects
- Loading states for all actions

## UI Components

### Movie Card (Available)
```
┌─────────────────────────────────┐
│ [Poster] Movie Title            │
│          (Year) • Rating        │
│                                 │
│ [    Add to Ranking →    ]     │
└─────────────────────────────────┘
```

### Movie Card (Ranked)
```
┌─────────────────────────────────┐
│ 1  [Poster] Movie Title         │
│             (Year) • Rating     │
│                                 │
│ [↑] [↓]     [ ← Remove ]       │
└─────────────────────────────────┘
```

### Section Headers
```
┌─────────────────────────────────┐
│ Available Movies (12)           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Your Ranking (3)                │
└─────────────────────────────────┘
```

## Interaction Flows

### Adding a Movie
1. User taps "Add to Ranking" button
2. Movie animates out of available list
3. Movie appears at bottom of ranking list
4. Button states update immediately

### Reordering
1. User taps ↑ or ↓ button
2. Movie smoothly animates to new position
3. Other movies shift accordingly
4. Numbers update automatically

### Removing
1. User taps "Remove" button
2. Movie animates out of ranking
3. Movie returns to available list
4. Remaining ranked movies renumber

## Mobile-Specific Features

### Touch Optimization
- Minimum touch target: 48x48px
- Adequate spacing between interactive elements
- Swipe gestures reserved for browser navigation only

### Performance
- Virtualized lists for large movie sets
- Optimistic UI updates
- Minimal animations (respect reduced motion)

### Accessibility
- Clear focus indicators
- Screen reader friendly
- Keyboard navigation support
- High color contrast ratios

### Responsive Breakpoints
- Mobile: 320px - 768px (primary target)
- Tablet: 769px - 1024px (enhanced layout)
- Desktop: 1025px+ (multi-column option)