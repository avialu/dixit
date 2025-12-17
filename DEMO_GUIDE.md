# 🎨 Dixit Demo Page - Component Guide

## Overview

The demo page at `/demo` lets you preview all game screens and understand the component structure without playing. Use this guide to understand what components are used in each phase and how to modify them.

---

## 📂 Component Architecture Map

```
Game UI Structure:
├── GamePage.tsx (Player View - Main gameplay)
│   ├── GameBoard.tsx (Background - always visible)
│   │   ├── Game Status Bar (top)
│   │   ├── Score Track (winding path with tokens)
│   │   └── Player Legend (bottom)
│   │
│   └── Player Overlay (Foreground - phase-specific)
│       ├── HandView.tsx (player's cards)
│       ├── VotingView.tsx (revealed cards grid)
│       └── Phase-specific UI elements
│
└── BoardPage.tsx (TV/Projector View)
    ├── GameBoard.tsx (same as above)
    ├── BoardView.tsx (large card display)
    └── Phase indicators
```

---

## 🎮 Phase-by-Phase Component Breakdown

### Phase 1: WAITING_FOR_PLAYERS

**Location**: `JoinPage.tsx` (not shown in GamePage)

**Components Used**:

- Join form with name input
- Player connection logic

**To Modify**:

- Edit: `client/src/pages/JoinPage.tsx`
- Styles: Search for `.join-page` in `global.css`

---

### Phase 2: DECK_BUILDING (Lobby)

**Location**: `LobbyPage.tsx` (not shown in GamePage)

**Components Used**:

- `PlayerList.tsx` - Shows connected players
- `DeckUploader.tsx` - Image upload interface
- `QRCode.tsx` - QR code for joining
- Admin controls (Settings, Start Game)

**To Modify**:

- Edit: `client/src/pages/LobbyPage.tsx`
- Components: `client/src/components/PlayerList.tsx`, `DeckUploader.tsx`
- Styles: Search for `.lobby-page` in `global.css`

---

### Phase 3: STORYTELLER_CHOICE

**What You See in Demo**: Player overlay with hand and clue input

**Components Used**:

```
GamePage.tsx
  ├── GameBoard.tsx (background)
  │   └── Status: "🎭 [Name] is choosing a card..."
  │
  └── Overlay: .storyteller-section
      ├── Clue input (.clue-input)
      ├── HandView.tsx (shows player's 6 cards)
      └── Submit button
```

**Files to Edit**:

- Main logic: `client/src/pages/GamePage.tsx` (line ~85-119)
- Hand display: `client/src/components/HandView.tsx`
- Board: `client/src/components/GameBoard.tsx`
- Styles: `.storyteller-section`, `.clue-input` in `global.css`

**Common Modifications**:

- Change clue input placeholder: Line ~100 in `GamePage.tsx`
- Modify hand card size: Edit `.hand-view` in `global.css`
- Update status message: Edit `getGameStatus()` in `GameBoard.tsx`

---

### Phase 4: PLAYERS_CHOICE

**What You See in Demo**: Player overlay with hand for card selection

**Components Used**:

```
GamePage.tsx
  ├── GameBoard.tsx (background)
  │   ├── Status: "✍️ Players are choosing their cards..."
  │   └── Clue Display: Shows the clue prominently
  │
  └── Overlay: .player-choice-section
      ├── HandView.tsx (selectable cards)
      └── Submit button
```

**Files to Edit**:

- Main logic: `client/src/pages/GamePage.tsx` (line ~130-160)
- Hand display: `client/src/components/HandView.tsx`
- Clue display: `.clue-display-ingame` in `GameBoard.tsx`
- Styles: `.player-choice-section` in `global.css`

**Common Modifications**:

- Change "waiting" message after submit: Line ~152 in `GamePage.tsx`
- Modify clue display style: Edit `.clue-display-ingame` in `global.css`
- Update card hover effects: Edit `.hand-card` in `global.css`

---

### Phase 5: REVEAL

**What You See in Demo**: Cards displayed on board, waiting message

**Components Used**:

```
GamePage.tsx
  ├── GameBoard.tsx (background)
  │   ├── Status: "🎊 Cards revealed!"
  │   └── VotingView (in revealed-cards-area)
  │
  └── Overlay: .reveal-section
      └── Waiting message
```

**Files to Edit**:

- Main logic: `client/src/pages/GamePage.tsx` (line ~164-174)
- Card display: `client/src/components/VotingView.tsx`
- Board display: `client/src/components/BoardView.tsx` (for large format)
- Styles: `.reveal-section`, `.revealed-cards-area` in `global.css`

---

### Phase 6: VOTING

**What You See in Demo**: Revealed cards with voting interface

**Components Used**:

```
GamePage.tsx
  ├── GameBoard.tsx (background)
  │   ├── Status: "🗳️ Players are voting..."
  │   └── VotingView (shows all cards)
  │
  └── Overlay: .voting-section
      ├── Instructions
      ├── VotingView.tsx (selectable cards)
      └── Vote button
```

**Files to Edit**:

- Main logic: `client/src/pages/GamePage.tsx` (line ~177-217)
- Voting grid: `client/src/components/VotingView.tsx`
- Styles: `.voting-section`, `.voting-view` in `global.css`

**Common Modifications**:

- Change voting instructions: Line ~182-183 in `GamePage.tsx`
- Modify card grid layout: Edit `.voting-view` in `global.css`
- Update "cannot vote for your own card" logic: `VotingView.tsx`

---

### Phase 7: SCORING

**What You See in Demo**: Score deltas displayed with color coding

**Components Used**:

```
GamePage.tsx
  ├── GameBoard.tsx (background)
  │   ├── Status: "🏆 Round complete!"
  │   ├── Updated player tokens on path
  │   └── VotingView (with vote counts)
  │
  └── Overlay: .scoring-section
      ├── VotingView (shows votes)
      ├── Score deltas display (.score-deltas-display)
      └── "Next Round" button
```

**Files to Edit**:

- Main logic: `client/src/pages/GamePage.tsx` (line ~220-248)
- Score deltas: Rendered inline in `GamePage.tsx` (line ~234-242)
- Token animation: `GameBoard.tsx` (player-token CSS)
- Styles: `.scoring-section`, `.score-delta-item` in `global.css`

**Common Modifications**:

- Change score delta colors: Edit `.positive`, `.negative` in `global.css`
- Modify "Next Round" button text: Line ~244 in `GamePage.tsx`
- Update token animation: Edit `.player-token` animation in `global.css`

---

### Phase 8: GAME_END

**What You See in Demo**: Winner celebration with final scores

**Components Used**:

```
GamePage.tsx
  ├── GameBoard.tsx (background)
  │   └── Status: "👑 [Winner] wins!"
  │
  └── Overlay: .game-end-section
      ├── Winner crown animation
      ├── Winner announcement
      ├── Final scores list
      └── Admin buttons (Reset/New Deck)
```

**Files to Edit**:

- Main logic: `client/src/pages/GamePage.tsx` (line ~251-295)
- Styles: `.game-end-section`, `.winner-crown` in `global.css`

**Common Modifications**:

- Change crown emoji/size: Edit `.winner-crown` in `global.css`
- Modify winner text: Line ~263-265 in `GamePage.tsx`
- Update final scores styling: Edit `.final-score-item` in `global.css`

---

## 🎨 Global Components Reference

### HandView.tsx

**Purpose**: Displays player's hand of cards  
**Location**: `client/src/components/HandView.tsx`  
**Used In**: STORYTELLER_CHOICE, PLAYERS_CHOICE phases

**Props**:

```typescript
{
  hand: Card[];              // Array of cards to display
  selectedCardId: string;    // Currently selected card ID
  onSelectCard: (id) => void; // Callback when card clicked
}
```

**Key Styles**: `.hand-view`, `.hand-card`, `.hand-card.selected`

---

### VotingView.tsx

**Purpose**: Displays grid of revealed cards  
**Location**: `client/src/components/VotingView.tsx`  
**Used In**: REVEAL, VOTING, SCORING phases

**Props**:

```typescript
{
  revealedCards: RevealedCard[];  // Cards to display
  selectedCardId?: string;        // Selected card (for voting)
  onSelectCard: (id) => void;     // Selection callback
  disabled?: boolean;             // Disable selection
  myCardId?: string;              // Player's own card (can't vote)
  votes?: Vote[];                 // Vote counts (for scoring)
}
```

**Key Styles**: `.voting-view`, `.voting-card`, `.vote-count`

---

### GameBoard.tsx

**Purpose**: Visual game board with winding path  
**Location**: `client/src/components/GameBoard.tsx`  
**Always Visible**: Background layer in GamePage

**Main Parts**:

- Game Status Bar (top) - Shows phase and context
- Score Track (SVG path with tokens)
- Player Legend (bottom) - Shows all players and scores

**Key Functions**:

- `getGameStatus()` - Returns status message for each phase
- `generatePathPositions()` - Creates winding path coordinates
- `getPlayerColor()` - Assigns colors to players
- `getPlayersAtPosition()` - Groups players at same score

**Key Styles**: `.game-board-visual`, `.score-track-container`, `.player-token`

---

### BoardView.tsx

**Purpose**: Large card display for TV/projector  
**Location**: `client/src/components/BoardView.tsx`  
**Used In**: BoardPage only

**Key Styles**: `.board-cards`, `.board-card`

---

### Scoreboard.tsx

**Purpose**: List of players with scores  
**Location**: `client/src/components/Scoreboard.tsx`  
**Used In**: Various pages

**Key Styles**: `.scoreboard`, `.score-item`

---

## 🎯 Common Customization Scenarios

### 1. Change Phase Status Messages

**File**: `client/src/components/GameBoard.tsx`  
**Function**: `getGameStatus()`  
**Lines**: ~26-85

Example:

```typescript
case "STORYTELLER_CHOICE":
  return {
    icon: "🎭",
    text: `Your custom message here`,
    subtext: "Your custom subtext"
  };
```

---

### 2. Modify Card Sizes

**File**: `client/src/styles/global.css`

For hand cards:

```css
.hand-card {
  width: 120px; /* Change this */
  height: 168px; /* Change this */
}
```

For voting/revealed cards:

```css
.voting-card {
  width: 180px; /* Change this */
  height: 252px; /* Change this */
}
```

---

### 3. Change Color Scheme

**File**: `client/src/styles/global.css`

Primary colors:

```css
/* Blue accent */
#4a90e2 → Change throughout file

/* Gold/Warning */
#f39c12 → Change throughout file

/* Background */
#1a1a2e → Change throughout file
```

Player token colors:
**File**: `client/src/components/GameBoard.tsx`  
**Function**: `getPlayerColor()`  
**Line**: ~13

---

### 4. Update Button Styles

**File**: `client/src/styles/global.css`

Search for:

- `.btn-primary` - Main action buttons
- `.btn-secondary` - Secondary buttons
- `.btn-danger` - Delete/kick buttons
- `.btn-large` - Large prominent buttons

---

### 5. Modify Animations

**File**: `client/src/styles/global.css`

Key animations:

- `@keyframes pulse` - Waiting icons
- `@keyframes glow-pulse` - Win target space
- `@keyframes token-bounce` - Player tokens
- `@keyframes status-icon-bounce` - Status bar icon
- `@keyframes rotate` - Winner crown

---

## 🔧 Development Workflow

### Step 1: View in Demo

1. Navigate to `/demo`
2. Select the phase you want to modify
3. Toggle between Player View and Board View
4. Identify which components are being used

### Step 2: Find the Code

Use this guide to locate:

- Which file contains the component
- Which styles apply to it
- What props it receives

### Step 3: Make Changes

Edit the identified files:

- `.tsx` files for structure/logic
- `global.css` for styling

### Step 4: See Results

1. Save your changes
2. The dev server auto-reloads
3. Refresh `/demo` to see updates
4. Navigate through phases to test

### Step 5: Test in Real Game

1. Start a real game
2. Test the modified phase
3. Verify it works as expected

---

## 📋 File Quick Reference

| Component    | File Path                              | Primary Use          |
| ------------ | -------------------------------------- | -------------------- |
| Game Logic   | `client/src/pages/GamePage.tsx`        | All in-game phases   |
| Visual Board | `client/src/components/GameBoard.tsx`  | Background with path |
| Hand Display | `client/src/components/HandView.tsx`   | Player's cards       |
| Card Grid    | `client/src/components/VotingView.tsx` | Revealed cards       |
| TV Display   | `client/src/pages/BoardPage.tsx`       | Large format         |
| Lobby        | `client/src/pages/LobbyPage.tsx`       | Pre-game setup       |
| Join         | `client/src/pages/JoinPage.tsx`        | Name entry           |
| Styles       | `client/src/styles/global.css`         | All styling          |

---

## 💡 Tips for Modifications

1. **Always test in demo first** - Faster iteration
2. **Search for class names** - Use grep or IDE search
3. **Check both views** - Player and Board
4. **Maintain responsive design** - Test different screen sizes
5. **Follow existing patterns** - Keep consistency
6. **Comment your changes** - Future you will thank you

---

## 🐛 Troubleshooting

**Problem**: Changes don't appear  
**Solution**: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

**Problem**: Component not found in demo  
**Solution**: Check if phase is WAITING_FOR_PLAYERS or DECK_BUILDING (use lobby page)

**Problem**: Styling conflicts  
**Solution**: Check CSS specificity, more specific selectors win

**Problem**: Layout breaks  
**Solution**: Check flexbox/grid properties, ensure parent containers have proper sizing

---

## 🚀 Next Steps

Now that you can see and understand all components:

1. Navigate to `/demo`
2. Click through each phase
3. Identify what you want to change
4. Use this guide to find the right files
5. Make your modifications
6. Test and iterate!

Happy customizing! 🎨
