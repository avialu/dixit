# Card Locking Feature

## Overview
This feature implements card locking behavior after submission for storyteller choice, player choice, and voting phases. When a card is submitted or voted, the relevant UI shows the locked card with a visual indicator.

## Changes Made

### 1. UnifiedGamePage.tsx
- **Added local state tracking**:
  - `localSubmittedCardId`: Tracks the card that was submitted locally (for storyteller/player choice)
  - `localSubmittedClue`: Tracks the clue that was submitted (for storyteller)
  - `localVotedCardId`: Tracks the card that was voted for (for voting phase)

- **Updated submission handlers**:
  - `handleStorytellerSubmit`: Now stores the submitted card and clue locally, then closes the modal
  - `handlePlayerSubmit`: Now stores the submitted card locally, then closes the modal
  - `handleVote`: Now stores the voted card locally and **keeps the modal open** to show the locked vote

- **Added phase reset logic**:
  - Local submission state is cleared when moving away from `STORYTELLER_CHOICE` or `PLAYERS_CHOICE` phases
  - Local vote state is cleared when moving away from `VOTING` phase
  - This ensures the demo mode works correctly when navigating between phases

- **Updated UI sections**:
  - **STORYTELLER_CHOICE**: 
    - Before submission: Shows hand with card selection and clue input
    - After submission: Shows "✅ Card Submitted" with the chosen card locked and the clue displayed
  - **PLAYERS_CHOICE**: 
    - Before submission: Shows hand with card selection and clue reminder
    - After submission: Shows "✅ Card Submitted" with the chosen card locked and clue reminder
    - **Only uses `localSubmittedCardId`** (not server state) so the card only locks after the player's own submission
    - Added clue reminder to the card selection screen
    - **Storyteller can now view their cards** during this phase (with a HandView showing all their cards)
  - **VOTING**:
    - Before voting: Shows all revealed cards with vote button
    - After voting: **Modal stays open**, shows "✅ Waiting for Others to Vote", and the voted card is locked with green border and "Your Vote" indicator
    - **Only uses `localVotedCardId`** (not server state) so the vote only locks after the player's own vote

### 2. HandView.tsx
- **Added `lockedCardId` prop**: Optional prop to specify which card should be shown as locked
- **Updated card rendering**:
  - Cards matching `lockedCardId` get the `locked` CSS class
  - Locked cards cannot be clicked/selected
  - Added lock indicator overlay with 🔒 icon and "Submitted" text

### 3. VotingView.tsx
- **Added `lockedCardId` prop**: Optional prop to specify which card was voted for
- **Updated card rendering**:
  - Cards matching `lockedCardId` get the `locked` CSS class
  - Locked cards cannot be clicked/selected
  - Added lock indicator overlay with 🔒 icon and "Your Vote" text

### 4. global.css
- **Added locked card styles for hand cards**:
  - `.card.locked`: Green border (#2ecc71), prevents hover transform
  - `.card-lock-indicator`: Overlay with semi-transparent green background
  - `.lock-icon`: Large lock emoji with drop shadow
  - `.lock-text`: "SUBMITTED" or "Your Vote" text in uppercase with text shadow
  
- **Added locked card styles for voting cards**:
  - `.voting-card.locked`: Green border, subtle hover effect

## User Experience

### Storyteller Flow:
1. Click "🎭 My Cards" button
2. Select a card and enter a clue
3. Click "Submit"
4. **Popup closes automatically**
5. Click "🎭 My Cards" again
6. **See the selected card with a lock icon and "SUBMITTED" label**
7. **The clue is shown above**: "Your clue: [clue text]"
8. During PLAYERS_CHOICE phase, storyteller can click the button to **view their hand** while waiting

### Player Flow:
1. Click "🃏 Choose Card" button
2. See the storyteller's clue
3. Select a matching card
4. Click "Submit Card"
5. **Popup closes automatically**
6. Click "🃏 Choose Card" again
7. **See the selected card with a lock icon and "SUBMITTED" label**
8. **The clue reminder is shown**: "The clue: [clue text]"
9. **Card only locks after YOUR submission** (not based on server state)

### Voting Flow:
1. Click "🗳️ Vote" button
2. See all revealed cards
3. Select a card to vote for
4. Click "Submit Vote"
5. **Popup stays open**
6. **See the voted card with a green border and "Your Vote" lock indicator**
7. **Header changes to "✅ Waiting for Others to Vote"**
8. Can still view all cards but cannot change vote
9. **Vote only locks after YOUR action** (not based on server state)

### Demo Mode:
- Works correctly when navigating between phases using arrow keys
- Local submission and vote states reset when leaving the relevant phase
- When returning to a previous phase, the states are cleared

## Visual Design

### Hand Cards (Storyteller/Player Choice)
The locked card features:
- **Green border** (#2ecc71) to indicate successful submission
- **Semi-transparent green overlay** (30% opacity)
- **Large lock emoji** (🔒) centered on the card
- **"SUBMITTED" text** in uppercase below the lock icon
- **Subtle hover effect** (slight lift, but less than selectable cards)
- **Not clickable** - cursor shows as default, not pointer

### Voting Cards
The locked card features:
- **Green border** (#2ecc71) to indicate your vote
- **Semi-transparent green overlay** (30% opacity)
- **Large lock emoji** (🔒) centered on the card
- **"YOUR VOTE" text** in uppercase below the lock icon
- **Very subtle hover effect**
- **Not clickable** - cursor shows as default, not pointer

## Technical Details

- All lock states are managed locally for immediate UI feedback
- In `PLAYERS_CHOICE`, the component **only checks `localSubmittedCardId`** (removed check for `playerState?.mySubmittedCardId`)
  - This ensures the card only locks after the player's own action, not from server state
- In `VOTING`, the component **only checks `localVotedCardId`** (removed check for `playerState?.myVote`)
  - This ensures the vote only locks after the player's own action, not from server state
- In `STORYTELLER_CHOICE`, only `localSubmittedCardId` is used since storytellers don't have separate server-side tracking
- The `useEffect` hook ensures proper cleanup when phases change
- **Storyteller can view their cards** during `PLAYERS_CHOICE` phase by clicking the cards button
- **Voting modal stays open** after voting to show the locked vote

## Key Improvements from Initial Implementation

1. **Player card locking is now local-only**: Removed dependency on `playerState?.mySubmittedCardId` to prevent premature locking from server state
2. **Vote locking is now local-only**: Removed dependency on `playerState?.myVote` to prevent premature locking from server state
3. **Storyteller can view cards during PLAYERS_CHOICE**: Added HandView for storyteller during waiting phase
4. **Voting modal stays open**: After voting, the modal remains open to show the locked vote
5. **Better UX**: Cards only lock after the user's explicit action, not from any external state updates

## Testing in Demo Mode

1. Navigate to demo mode
2. Go to "STORYTELLER_CHOICE" phase (admin view)
3. Submit a card with a clue
4. Verify popup closes
5. Click "My Cards" button again
6. Verify card shows as locked
7. Navigate to "PLAYERS_CHOICE" phase
8. **Stay as admin (storyteller) view**
9. Click "My Cards" button
10. **Verify storyteller can see their hand**
11. Switch to player view
12. Verify you can select a card (no lock yet)
13. Submit a card
14. Verify popup closes
15. Click "Choose Card" button again
16. **Verify only now the card shows as locked**
17. Navigate to "VOTING" phase
18. Switch to player view
19. Select a card and vote
20. **Verify popup STAYS open**
21. **Verify voted card shows with green border and "Your Vote" lock**
22. **Verify header shows "✅ Waiting for Others to Vote"**
23. Try clicking other cards - they should not be selectable
24. Navigate to next phase and back
25. Verify all lock states are reset

