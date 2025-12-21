# Spectator Join Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER NAVIGATES TO /board                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
                   (No join screen - goes directly to board)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BOARD VIEW - DECK BUILDING PHASE                         │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ GAME BOARD                                             │ │
│  │ Scoreboard visible at top                              │ │
│  │ (No players yet or showing current players)           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│                                     [👥 Players] ← Button!   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    User clicks "👥 Players"
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. LOBBY MODAL (DECK BUILDING)                              │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [✕]                                                    │ │
│  │                                                         │ │
│  │ 👥 Players (3)                                         │ │
│  │                                                         │ │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │ │ Alice 👑    │ │ Bob         │ │ Charlie     │      │ │
│  │ └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  │                                                         │ │
│  │ 🖼️ Deck Images                                        │ │
│  │                                                         │ │
│  │ Deck: 75 images                                        │ │
│  │ My images: 5/200                                       │ │
│  │                                                         │ │
│  │ ☑️ Allow players to upload images                     │ │
│  │ ✅ Players can upload images                           │ │
│  │                                                         │ │
│  │ [📁 Upload Images] [📂 Upload Folder]                 │ │
│  │                                                         │ │
│  │ [img-001] [×]  [img-002] [×]  ...                     │ │
│  │                                                         │ │
│  │ 👁️ Spectating - You can upload images to help        │ │
│  │    build the deck!                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    Admin starts the game
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. BOARD VIEW - GAME IN PROGRESS                            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ GAME BOARD                                             │ │
│  │ - Scoreboard with live scores                          │ │
│  │ - Revealed cards (during voting/reveal)                │ │
│  │ - Current clue displayed                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  [👥 Players] button is GONE                                │
│  (Spectator just watches)                                   │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. No Join Screen
- **Purpose**: Instant access to the game board
- **Behavior**: 
  - Spectators go directly to board view when visiting `/board`
  - No need to click "Enter" or any button
  - Automatically considered "joined"

### 2. Board View (Deck Building)
- **Purpose**: Allow spectators to help prepare the game
- **Features**:
  - "👥 Players" button (same as regular players)
  - Can view all players
  - Can upload images if admin allows
  - Can manage their own uploaded images

### 3. Board View (Game Active)
- **Purpose**: Passive observation
- **Features**:
  - No interactive buttons
  - Watch game board in real-time
  - See scores update
  - View revealed cards during voting/reveal phases

## Comparison: Player vs Spectator Join Flow

### Regular Player
```
/ (Home) → Enter Name → Join Game → Board + [👥 Players] button → Game
```

### Spectator
```
/board → Board View → [👥 Players] button (during deck building) → Game
```

**Key Difference**: Spectators skip the join screen entirely!

## Implementation Details

### Always "Joined" Logic
```typescript
const isSpectator = playerId === "spectator";
const isJoined =
  roomState &&
  (isSpectator || roomState.players.some((p) => p.id === playerId));
```

Spectators are always considered "joined" if `playerId === "spectator"`, so they bypass the join screen and go straight to the board view.

### Button Visibility
- **During DECK_BUILDING**: Button visible for both players and spectators
- **During game phases**: Button hidden for spectators (passive watching)
- **Same component**: Uses the exact same button and modal as players

## User Experience Benefits

✅ **Instant Access**: No unnecessary screens - spectators see the board immediately
✅ **Simple Flow**: Just navigate to `/board` and you're in
✅ **Same Interface**: Spectators and players see the same "👥 Players" button during setup
✅ **Clear Role**: Message in modal clarifies spectator status
✅ **Helpful During Setup**: Can contribute images to help build the deck
✅ **Passive During Game**: No distracting buttons once game starts

## Technical Notes

1. **State Management**: No special state needed - `isSpectator` check handles everything
2. **Routing**: Spectators stay on `/board` throughout
3. **Permission**: Spectators can upload if `allowPlayerUploads === true`
4. **UI Consistency**: Uses same modal/components as regular players
5. **Progressive Disclosure**: Button only shows during deck building, hidden during gameplay
