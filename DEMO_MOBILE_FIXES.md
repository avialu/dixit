# Demo Flow Mobile Fixes

## Issues Fixed

### 1. Missing Image at Storyteller Choice
**Problem**: When the storyteller submits their card in the demo flow on mobile, the submitted card image was not visible. Only the hand view with the locked card was shown. This issue was particularly prominent in "Flow Test" mode where the phase immediately transitions from `STORYTELLER_CHOICE` to `PLAYERS_CHOICE`.

**Root Cause**: The condition to show the submitted card preview was checking only `localSubmittedCardId`, which gets cleared when the phase changes. In flow test mode, the storyteller's card info is stored in `playerState.mySubmittedCardId`, which wasn't being checked.

**Solution**: 
1. Added a prominent preview of the submitted card in both `STORYTELLER_CHOICE` and `PLAYERS_CHOICE` phases
2. Updated the condition to check both `localSubmittedCardId` (for real game mode) and `playerState.mySubmittedCardId` (for flow test mode)
3. The preview now shows in both phases where the storyteller is waiting

**Changes**:
- `client/src/pages/UnifiedGamePage.tsx`: 
  - Updated STORYTELLER_CHOICE modal to check both `localSubmittedCardId` and `playerState.mySubmittedCardId`
  - Added submitted card preview to PLAYERS_CHOICE phase for storyteller
  - Used fallback logic to get the clue from either `localSubmittedClue` or `roomState.currentClue`

### 2. Grid Randomization on Every Render
**Problem**: The voting cards grid was being shuffled randomly on every component re-render, causing cards to jump around and appear in different positions each time the state updated.

**Solution**: Replaced `Math.random()` shuffle with a deterministic shuffle based on card IDs.

**Changes**:
- `client/src/pages/DemoPage.tsx`: Implemented a deterministic hash-based shuffle function
- The shuffle is now consistent across re-renders for the same set of cards
- Uses card IDs as a seed to generate a stable hash for sorting

## Technical Details

### Submitted Card Display Logic

The storyteller card preview now works in both modes:

```typescript
// Check both local state (real game) and playerState (flow test)
{isStoryteller && (localSubmittedCardId || playerState?.mySubmittedCardId) && (
  <div className="modal-section storyteller-modal">
    {/* ... */}
    {(() => {
      const submittedCardId = localSubmittedCardId || playerState?.mySubmittedCardId;
      const submittedCard = playerState?.hand.find((c) => c.id === submittedCardId);
      return submittedCard ? <img src={submittedCard.imageData} ... /> : null;
    })()}
  </div>
)}
```

### Deterministic Shuffle Implementation
```typescript
// Create a deterministic seed from card IDs
const seed = allCards.map(c => c.cardId).sort().join('');
const deterministicRandom = (idx: number) => {
  // Simple hash function for deterministic "random" ordering
  let hash = 0;
  const str = seed + idx;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};
const shuffled = allCards.sort((a, b) => {
  const hashA = deterministicRandom(allCards.indexOf(a));
  const hashB = deterministicRandom(allCards.indexOf(b));
  return hashA - hashB;
});
```

### Submitted Card Preview Styling
Added CSS classes for both desktop and mobile:

**Desktop** (`global.css`):
```css
.submitted-card-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.5rem 0;
}

.submitted-card-preview img {
  max-width: 90%;
  max-height: 40vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  border: 3px solid #667eea;
}
```

**Mobile** (within `@media (max-width: 768px)`):
```css
.submitted-card-preview {
  padding: 0.5rem 0;
  max-height: 35vh;
}

.submitted-card-preview img {
  max-width: 95%;
  max-height: 35vh;
}
```

## Files Modified

1. `client/src/pages/UnifiedGamePage.tsx`
   - Updated STORYTELLER_CHOICE modal condition to check both local and playerState
   - Added submitted card image preview in storyteller modal (STORYTELLER_CHOICE)
   - Added submitted card image preview for storyteller during PLAYERS_CHOICE phase
   - Updated hand view to show locked card using either local or playerState ID

2. `client/src/pages/DemoPage.tsx`
   - Replaced random shuffle with deterministic shuffle (2 locations)

3. `client/src/styles/global.css`
   - Added `.submitted-card-preview` styles
   - Added mobile-specific styles for the preview

## Testing

To test these fixes:

1. Open the demo page on a mobile device or in mobile view
2. Switch to "Flow Test" mode
3. When you're the storyteller (Round 1), submit a card with a clue
4. **Expected**: You should now see the submitted card image prominently displayed above your hand during STORYTELLER_CHOICE
5. **Expected**: The phase transitions to PLAYERS_CHOICE and you still see your submitted card clearly
6. Continue through the flow to voting
7. **Expected**: The cards on the board should maintain their positions when the state updates (no random repositioning)

## Impact

- **Better UX**: Storytellers can now see their submitted card clearly on mobile in both phases
- **Consistency**: Works in both real game mode and flow test mode
- **Stability**: Cards no longer jump around randomly during voting phase
- **Visual Consistency**: The layout remains stable throughout the demo flow
- **Flow Test Reliability**: The flow test mode now properly displays the storyteller's card throughout their waiting period

