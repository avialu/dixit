# Reveal & Scoring Phase Merge - Implementation Summary

## Overview
Merged the REVEAL and SCORING phases into a single REVEAL phase where:
- Scoring is calculated immediately when entering the REVEAL phase (after all votes are in)
- Players see the reveal popup with results and score deltas
- When closing the popup, the board animation plays showing tokens moving to new positions
- Admin can continue directly to the next round (or game end) from REVEAL phase

## Changes Made

### Server-Side Changes

#### 1. **server/src/game/types.ts**
- Removed `SCORING` from `GamePhase` enum
- Now phases are: `DECK_BUILDING`, `STORYTELLER_CHOICE`, `PLAYERS_CHOICE`, `VOTING`, `REVEAL`, `GAME_END`

#### 2. **server/src/game/GameManager.ts**
- **Renamed method**: `transitionToReveal()` → split into:
  - `shuffleCardsForVoting()`: Called after player submissions to shuffle and enter VOTING phase
  - `transitionToReveal()`: Called after all votes to calculate scores and enter REVEAL phase
- **Updated `playerVote()`**: When all votes are in, calls `transitionToReveal()` which:
  - Calculates scores using ScoringEngine
  - Applies score deltas immediately
  - Sets phase to REVEAL
- **Removed `advanceToScoring()` method**
- **Updated `advanceToNextRound()`**: Now checks for REVEAL phase instead of SCORING
- **Updated `getRoomState()`**: 
  - Shows `revealedCards` during REVEAL and VOTING phases
  - Shows `votes` and `lastScoreDeltas` during REVEAL phase (not SCORING since it's removed)

#### 3. **server/src/server.ts**
- Removed `advanceToScoring` socket handler
- Updated `advanceRound` socket handler (remains the same but now called from REVEAL phase)

### Client-Side Changes

#### 4. **client/src/components/GameBoard.tsx**
- Added optional `triggerAnimation` prop to control when animation plays
- Updated animation trigger logic:
  - Animation now triggers on REVEAL phase (instead of SCORING)
  - Only animates when `triggerAnimation` prop is `true`
  - This allows animation to play when user closes the reveal modal

#### 5. **client/src/pages/UnifiedGamePage.tsx**
- Added `triggerBoardAnimation` state variable
- **Updated auto-open modal logic**: Removed SCORING from auto-close logic
- **Updated board display**: Changed revealed cards display condition from `["REVEAL", "VOTING", "SCORING"]` to `["REVEAL", "VOTING"]`
- **Updated floating button text**: Changed "📊 Scores" to "🎨 Results" for REVEAL phase
- **Updated REVEAL modal**:
  - Changed button text from "▶️ Continue to Scoring" to "▶️ Continue to Next Round"
  - Changed socket emit from `advanceToScoring` to `advanceRound`
  - Updated Close button to set `triggerBoardAnimation = true` when closing during REVEAL phase
- **Removed entire SCORING modal section** (lines ~687-750)
- Pass `triggerAnimation` prop to `GameBoard` component

#### 6. **client/src/pages/DemoPage.tsx**
- Removed `"SCORING"` from `allPhases` array
- **Updated `generateMockRoomState()`**:
  - Removed SCORING case entirely
  - Moved score delta generation to REVEAL case
  - REVEAL case now includes `lastScoreDeltas` in the mock state
- **Updated phase control logic**:
  - Changed animation testing from SCORING to REVEAL phase
  - Changed phase transitions to skip SCORING
- **Updated flow test mode**:
  - Removed `advanceToScoring()` method from `flowActions`
  - Updated `playerVote()` to calculate scores immediately when going to REVEAL
  - Updated AI voting to calculate scores when transitioning to REVEAL
  - Updated socket emit handler from `advanceToScoring` to `advanceRound`
  - Updated phase-specific data logic to remove SCORING references
  - Changed demo UI controls from SCORING to REVEAL phase
- Fixed variable naming conflicts (renamed duplicate `storytellerCard` variables)

## User Experience Flow

### Before (with SCORING phase):
1. Voting completes → REVEAL phase
2. Admin sees results popup with "Continue to Scoring" button
3. Admin clicks button → SCORING phase
4. Modal auto-closes, board animation plays
5. Admin clicks "Next Round" to continue

### After (merged phases):
1. Voting completes → REVEAL phase (scores calculated immediately)
2. Players see results popup with scores and deltas displayed
3. Player closes popup → board animation plays showing token movement
4. Admin clicks "Continue to Next Round" to proceed (or can continue while modal is open)

## Benefits
- **Simpler flow**: One fewer phase to manage
- **Better UX**: Animation happens when exiting reveal, making the connection clearer
- **More intuitive**: Scoring happens "inside" the reveal as requested
- **Cleaner code**: Less state management, fewer transitions

## Testing Checklist
- [x] Server compiles without errors
- [x] Client compiles without errors
- [x] No linter errors
- [x] Demo mode updated for all phases
- [x] Flow test mode updated
- [ ] Full game flow test (voting → reveal → next round)
- [ ] Board animation triggers correctly when closing reveal
- [ ] Score deltas display correctly in reveal popup
- [ ] Admin can advance to next round from reveal
- [ ] Game end condition works from reveal phase

