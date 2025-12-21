# Code Cleanup - Dead SCORING Phase Reference

## Issue Fixed

### Dead Code - SCORING Phase Reference
**File**: `client/src/pages/UnifiedGamePage.tsx`

**Problem**: 
The `isInGame` array included `"SCORING"` phase on line 116, but this phase was removed in the REVEAL/SCORING merge. This is dead code that will never match.

**Root Cause**:
When the SCORING phase was merged into REVEAL phase (see `REVEAL_SCORING_MERGE.md`), this reference wasn't cleaned up.

**Fix**:
```typescript
// OLD CODE (line 116)
const isInGame =
  roomState &&
  [
    "STORYTELLER_CHOICE",
    "PLAYERS_CHOICE",
    "VOTING",
    "REVEAL",
    "SCORING",  // ❌ This phase no longer exists
    "GAME_END",
  ].includes(roomState.phase);

// NEW CODE
const isInGame =
  roomState &&
  [
    "STORYTELLER_CHOICE",
    "PLAYERS_CHOICE",
    "VOTING",
    "REVEAL",
    "GAME_END",
  ].includes(roomState.phase);
```

## Spectator Upload Permissions (No Change)

**Note**: After investigation, spectator upload behavior was left unchanged. Spectators can upload images when `allowPlayerUploads` is enabled, just like regular players. This allows spectators to contribute to the deck during the deck building phase.

**Current Logic**:
```typescript
const isAdmin = myPlayer?.isAdmin || false;
const canUpload = isAdmin || roomState.allowPlayerUploads;
```

- Admins can always upload
- Players can upload when `allowPlayerUploads` is enabled
- Spectators can upload when `allowPlayerUploads` is enabled (same as players)

This design choice allows spectators to participate in deck building, which can be useful for:
- Friends joining to help build the deck before becoming players
- Observers who want to contribute images
- Flexible game setup where spectators might become players later

## Testing

### Test Case: No SCORING Phase Errors
1. Play through a complete game round
2. Check browser console
3. ✅ **Expected**: No errors about unknown/invalid phase
4. ✅ **Expected**: All phases transition correctly (REVEAL → GAME_END or next round)

### Test Case: Spectator Upload Works (If Enabled)
1. Join game as a spectator
2. Admin enables "Allow Player Uploads"
3. ✅ **Expected**: Spectator sees upload buttons and can upload
4. Admin disables "Allow Player Uploads"
5. ✅ **Expected**: Spectator's upload buttons are disabled

### Test Case: Admin Can Always Upload
1. Join game as admin
2. Disable "Allow Player Uploads"
3. ✅ **Expected**: Admin can still upload
4. ✅ **Expected**: Other players and spectators cannot upload

## Impact

### Code Quality
- **Removed**: Dead code reference to non-existent SCORING phase
- **Maintained**: Spectator upload functionality (spectators can upload when allowed, same as players)

### User Experience
- **No Change**: Spectators can contribute to deck building when uploads are allowed
- **Fixed**: No console errors or issues from removed SCORING phase reference

## Files Modified

1. **`client/src/pages/UnifiedGamePage.tsx`**
   - Removed "SCORING" from `isInGame` phase array
   - Lines changed: 109-117

## Related Documentation

- `REVEAL_SCORING_MERGE.md` - Documentation of SCORING phase removal
- `SPECTATOR_JOIN_FLOW.md` - General spectator behavior documentation

## Verification Checklist

- [x] Code compiles without errors
- [x] No linter errors
- [x] Dead code reference removed
- [x] Spectators can upload when allowed (design decision)
- [ ] Manual test: No console errors about SCORING phase
- [ ] Manual test: All game phases transition correctly

