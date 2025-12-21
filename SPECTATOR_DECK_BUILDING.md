# Spectator Deck Building Feature

## Summary

Added the ability for spectators to view players and upload images during the deck building phase. Spectators have the same interface as players during the lobby, with a "👥 Players" button to access the lobby modal.

## What Changed

### Before
- Spectators in deck building phase: No buttons, just board view
- Only players could see the "👥 Players" button to access the lobby modal
- Spectators couldn't access the image uploader during deck building

### After
- Spectators automatically see the board when navigating to `/board` (no join screen)
- During deck building, spectators see the same "👥 Players" button as regular players
- Clicking opens the lobby modal with:
  - List of all players in the game
  - Deck image count
  - Image upload interface (if admin allows player uploads)
- Spectators can upload images to help build the deck
- Custom message: "👁️ Spectating - You can upload images to help build the deck!"

## Benefits

1. **Simple UX**: Spectators just go to `/board` and immediately see the game
2. **More Engagement**: Spectators can help prepare the game by uploading images
3. **Better Visibility**: Spectators can see who's playing before the game starts
4. **Consistent Interface**: Same "👥 Players" button and modal for both players and spectators
5. **Flexible**: Respects admin's "Allow player uploads" toggle

---

## Technical Changes

### Client Side

#### App.tsx

**Unified Route Configuration**
The `/board` route now uses the same `UnifiedGamePage` component with `playerId="spectator"`:

```typescript
<Route
  path="/board"
  element={
    <UnifiedGamePage
      roomState={roomState}
      playerState={null}
      playerId="spectator"
      clientId={clientId}
      socket={socket}
      onJoin={() => {}}
      onUploadImage={actions.uploadImage}
      onDeleteImage={actions.deleteImage}
      onSetAllowPlayerUploads={actions.setAllowPlayerUploads}
      onStartGame={() => {}}
      onChangeName={() => {}}
      onStorytellerSubmit={() => {}}
      onPlayerSubmitCard={() => {}}
      onPlayerVote={() => {}}
      onAdvanceRound={() => {}}
      onResetGame={() => {}}
      onNewDeck={() => {}}
    />
  }
/>
```

**Key Points:**
- Same component for both players (`/`) and spectators (`/board`)
- Only difference is `playerId="spectator"` vs `playerId={getClientId()}`
- Empty handler functions for actions spectators can't perform
- Real handlers for upload/delete/settings that spectators CAN use

**Removed:**
- `BoardPage.tsx` - No longer needed, using `UnifiedGamePage` for everything

#### UnifiedGamePage.tsx

**1. Updated isJoined Logic (lines ~108-111)**
Spectators are always considered "joined" (no join screen needed):

```typescript
const isSpectator = playerId === "spectator";
const isJoined =
  roomState &&
  (isSpectator || roomState.players.some((p) => p.id === playerId));
```

**2. Added Spectator Button During Deck Building (lines ~316-326)**
```typescript
{/* Floating Action Buttons - For Spectators (only in deck building) */}
{isJoined && isSpectator && !isInGame && (
  <button
    className={`floating-action-button cards-button ${
      showModal && modalType === "cards" ? "hidden" : ""
    }`}
    onClick={openCards}
  >
    👥 Players
  </button>
)}
```

**3. Updated Lobby Modal to Support Spectators (lines ~332-396)**
- Comment updated: "Before game starts, show player list (for both players and spectators)"
- Split hint text into two conditions:
  - Non-spectators: Shows admin/player-specific messages
  - Spectators: Shows "👁️ Spectating - You can upload images to help build the deck!"

**Key Changes:**
```typescript
{!isSpectator && (
  <p style={{ color: "#95a5a6", marginTop: "1rem" }}>
    {isAdmin
      ? "Upload images and start when ready!"
      : "⏳ Waiting for admin to start the game..."}
  </p>
)}
{isSpectator && (
  <p style={{ color: "#95a5a6", marginTop: "1rem" }}>
    👁️ Spectating - You can upload images to help build the deck!
  </p>
)}
```

### Server Side

**No changes required!** The server already supports spectator uploads:

1. **Socket Events** (`server/src/server.ts`):
   - `uploadImage` event checks if client is joined, but doesn't restrict spectators
   
2. **DeckManager** (`server/src/game/DeckManager.ts`):
   - `addImage()` checks permissions: `isAdmin || allowPlayerUploads`
   - Spectators with playerId "spectator" are treated like regular players
   - If admin enables "Allow player uploads", spectators can upload

3. **Image Tracking**:
   - Spectator images are tracked by `uploadedBy: "spectator"`
   - Spectators can delete their own images
   - Subject to same limits: 200 images per user

---

## User Flow

### As a Spectator:

**1. Navigate to `/board`**
- Immediately see the game board (no join screen)
- If game is in DECK_BUILDING phase, see "👥 Players" button

**2. During Deck Building Phase:**
- See "👥 Players" button in bottom-right (same as regular players)
- Click to open lobby modal
- View:
  - All players in the game with admin badges
  - Total deck size
  - Your uploaded images (if any)
- If admin allows player uploads:
  - Upload individual images or entire folders
  - See upload progress
  - Delete your own images

**3. During Game:**
- Button disappears
- Watch the game in passive board-viewing mode

### Permission Behavior:

| Admin Setting | Spectator Can Upload |
|--------------|---------------------|
| ✅ Allow player uploads: ON | Yes |
| ❌ Allow player uploads: OFF | No (shows "🔒 Only the host can upload images") |

---

## Testing Checklist

### Demo Mode Testing
In demo mode (`/demo`):
1. Click 📺 (Spectator) button in demo navigation
2. Navigate to DECK_BUILDING phase (use arrow keys or phase buttons)
3. "👥 Players" button should appear in bottom-right
4. Click button to test lobby modal and image upload

### Production Testing
- [x] Spectator navigates to `/board` and sees board immediately (no join screen)
- [x] Spectator sees "👥 Players" button during DECK_BUILDING phase
- [x] Button opens lobby modal with player list
- [x] Spectator sees deck uploader interface
- [x] Spectator can upload images (when allowed)
- [x] Spectator can delete their own images
- [x] Spectator sees appropriate message ("👁️ Spectating...")
- [x] Button disappears when game starts
- [x] Works in demo mode (spectator view mode)
- [x] No linter errors

---

## Notes

- Spectators are always "joined" - they don't see a join screen, just the board directly
- playerId remains "spectator" throughout
- Spectators don't count toward the 3 player minimum
- Spectators can't click "Start Game" (admin only)
- After game starts, spectators return to passive board-watching mode
- Same button behavior as players: only visible during DECK_BUILDING phase
