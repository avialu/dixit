# Demo Page Interactive Features

## Summary

Made the demo page fully interactive! Now you can test the toggle settings, image uploads, and see changes in real-time across different player views.

## New Features

### 1. **Interactive Toggle** ✅
- Toggle "Allow players to upload" in admin view
- See the change immediately in player view
- Works exactly like the real game

### 2. **Working Image Upload** 📸
- Upload images as admin (always works)
- Upload images as player (only when toggle is ON)
- See image count increase in deck info
- Delete images you've uploaded

### 3. **Real-time State Sync** 🔄
- Change toggle → Player view updates instantly
- Upload image → Deck size updates instantly
- Lock/unlock deck → UI updates instantly
- Win target changes → Updates across views

### 4. **Multi-View Testing** 👥
- **Admin View (👑)** - See all controls, can toggle settings
- **Player View (🎮)** - See player perspective, respects toggle
- **Spectator View (📺)** - See board only
- Switch between views with toolbar buttons

---

## How to Use

### Testing the Toggle

1. **Start in Admin View:**
   ```
   - Click "👑" in top nav
   - Go to DECK_BUILDING phase (← / → arrows)
   - See toggle: "Allow players to upload images"
   ```

2. **Toggle OFF:**
   ```
   - Uncheck the toggle
   - Switch to Player View (🎮)
   - Upload buttons are disabled
   - Message: "Only host can upload images"
   ```

3. **Toggle ON:**
   ```
   - Switch back to Admin (👑)
   - Check the toggle
   - Switch to Player View (🎮)
   - Upload buttons are now enabled!
   ```

### Testing Image Upload

1. **As Admin:**
   ```
   - Click "👑" for admin view
   - Click "📁 Upload Images" or "📂 Upload Folder"
   - Select image(s)
   - See deck size increase
   - See image in "My images" list
   ```

2. **As Player (Toggle ON):**
   ```
   - Click "🎮" for player view
   - Click upload buttons
   - Upload works!
   - See your images in the list
   ```

3. **As Player (Toggle OFF):**
   ```
   - Admin toggles OFF
   - Switch to player view
   - Upload buttons are disabled
   - Can't upload (as expected)
   ```

### Testing Settings

**Win Target:**
- Change between 30, 50, or Unlimited
- Updates across all views

**Lock/Unlock Deck:**
- Lock prevents uploads and toggle changes
- Unlock re-enables everything

---

## Technical Implementation

### State Management

```typescript
// New demo state variables
const [allowPlayerUploads, setAllowPlayerUploads] = useState(true);
const [winTarget, setWinTarget] = useState<number | null>(30);
const [deckSize, setDeckSize] = useState(45);
const [deckLocked, setDeckLocked] = useState(false);
const [uploadedImages, setUploadedImages] = useState<Array<{
  id: string, 
  uploadedBy: string
}>>([]);
```

### Interactive Actions

```typescript
const mockActions = {
  // Toggle control
  setAllowPlayerUploads: (allow: boolean) => {
    setAllowPlayerUploads(allow);
  },
  
  // Image upload
  uploadImage: (imageData: string) => {
    const newImage = {
      id: `demo-img-${Date.now()}`,
      uploadedBy: currentPlayerId,
    };
    setUploadedImages(prev => [...prev, newImage]);
    setDeckSize(prev => prev + 1);
  },
  
  // Image delete
  deleteImage: (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    setDeckSize(prev => Math.max(0, prev - 1));
  },
  
  // Deck lock/unlock
  lockDeck: () => setDeckLocked(true),
  unlockDeck: () => setDeckLocked(false),
  
  // Win target
  setWinTarget: (target: number | null) => {
    setWinTarget(target);
  },
};
```

### State Injection

```typescript
// Inject interactive state into mock room state
if (mockRoomState) {
  mockRoomState.allowPlayerUploads = allowPlayerUploads;
  mockRoomState.winTarget = winTarget;
  mockRoomState.deckSize = deckSize;
  mockRoomState.deckLocked = deckLocked;
  mockRoomState.deckImages = uploadedImages;
}
```

---

## Testing Scenarios

### Scenario 1: Admin Uploads Only
```
1. Admin view → Toggle OFF
2. Player view → Upload disabled ✓
3. Admin view → Upload works ✓
4. Deck size increases ✓
```

### Scenario 2: Players Can Upload
```
1. Admin view → Toggle ON
2. Player view → Upload enabled ✓
3. Upload image → Deck size increases ✓
4. Switch to Admin → See total deck size ✓
```

### Scenario 3: Lock Prevents Changes
```
1. Admin view → Toggle ON
2. Lock deck
3. Toggle becomes disabled ✓
4. Upload buttons disabled ✓
5. Unlock deck
6. Everything re-enabled ✓
```

### Scenario 4: Multi-Player Upload
```
1. Admin (Player 1) uploads → Deck: 46
2. Switch to Player view (Player 2) uploads → Deck: 47
3. Both images tracked separately ✓
4. Delete own image works ✓
```

---

## Visual Feedback

### Admin View
```
┌──────────────────────────────────────────┐
│ ⚙️ Game Settings                         │
│                                           │
│ [●──────] Allow players to upload images │
│ ✅ Players can upload (you can always    │
│    upload)                                │
│                                           │
│ Win Target: [▼ 30 Points]                │
│                                           │
│ 📦 Deck Size: 47 images                  │
│ My images: 3/20                           │
│                                           │
│ [📁 Upload Images] [📂 Upload Folder]    │
│ [Lock Deck]                               │
└──────────────────────────────────────────┘
```

### Player View (Toggle ON)
```
┌──────────────────────────────────────────┐
│ 📦 Deck Size: 47 images                  │
│ My images: 2/20                           │
│                                           │
│ [📁 Upload Images] [📂 Upload Folder]    │
│                                           │
│ ✅ You can upload images                 │
└──────────────────────────────────────────┘
```

### Player View (Toggle OFF)
```
┌──────────────────────────────────────────┐
│ 📦 Deck Size: 47 images                  │
│ My images: 2/20                           │
│                                           │
│ [📁 Upload Images] [📂 Upload Folder]    │
│ (buttons disabled)                        │
│                                           │
│ 🔒 Only host can upload images           │
└──────────────────────────────────────────┘
```

---

## Benefits

### For Development
- ✅ Test toggle behavior without server
- ✅ Test upload flow without real WebSocket
- ✅ Test multi-view scenarios instantly
- ✅ Rapid iteration and debugging

### For Presentation
- ✅ Show features to stakeholders
- ✅ Demo player/admin differences
- ✅ Interactive demonstrations
- ✅ No setup required

### For Testing
- ✅ Verify UI responds correctly
- ✅ Test permission logic
- ✅ Test state synchronization
- ✅ Test edge cases

---

## Keyboard Shortcuts

- **← / →** - Navigate phases
- **V** - Cycle through view modes (Player → Admin → Spectator)
- **Space** - Quick toggle (in applicable phases)

---

## Console Logs

All actions log to console for debugging:

```javascript
Demo: setAllowPlayerUploads true
Demo: uploadImage data:image/jpeg;base64,/9j/4AAQSkZ...
Demo: lockDeck
Demo: setWinTarget 50
Demo: deleteImage demo-img-1734720000000
```

---

## Future Enhancements

Possible improvements:
- [ ] Persist demo state in localStorage
- [ ] Add "Reset Demo" button
- [ ] Show image thumbnails in demo
- [ ] Add animation for state changes
- [ ] Multi-player simulation (split screen)

---

## Files Changed

- ✏️ `client/src/pages/DemoPage.tsx`
  - Added interactive state variables
  - Implemented working mock actions
  - Connected state to room state
  - Real image upload testing

---

## Quick Start Guide

1. **Navigate to demo:**
   ```
   http://localhost:5174/demo
   ```

2. **Go to DECK_BUILDING phase:**
   ```
   Press → arrow until you see the deck building screen
   ```

3. **Test as Admin:**
   ```
   - Click 👑 button
   - Toggle the upload setting
   - Upload an image
   - See deck size change
   ```

4. **Test as Player:**
   ```
   - Click 🎮 button
   - Try to upload (respects toggle)
   - Upload when enabled
   - See your images
   ```

5. **See Real-time Updates:**
   ```
   - Toggle in admin view
   - Switch to player view
   - See change immediately!
   ```

---

## Testing Checklist

✅ Toggle appears in admin view
✅ Toggle changes allowPlayerUploads state
✅ Player view respects toggle state
✅ Admin can always upload (regardless of toggle)
✅ Player can upload when toggle is ON
✅ Player cannot upload when toggle is OFF
✅ Upload increases deck size
✅ Delete decreases deck size
✅ Lock disables toggle and uploads
✅ Unlock re-enables everything
✅ Win target changes work
✅ State persists when switching views
✅ Console logs show actions
✅ No errors in console

---

## Demo Flow Example

```
1. Start: DECK_BUILDING phase, Admin view
   - Deck: 45 images
   - Toggle: ON
   - Images: []

2. Toggle OFF
   - allowPlayerUploads: false
   - Player view: uploads disabled ✓

3. Switch to Player view
   - Upload buttons grayed out
   - Message: "Only host can upload"

4. Back to Admin view
   - Upload 3 images
   - Deck: 48 images
   - My images: 3

5. Toggle ON
   - allowPlayerUploads: true

6. Switch to Player view
   - Upload buttons enabled!
   - Upload 2 images
   - Deck: 50 images
   - My images: 2

7. Back to Admin view
   - See total: 50 images
   - Admin: 3, Player: 2
   - Everything synced! ✓
```

---

Perfect for testing, demoing, and development! 🎉

*Last Updated: December 20, 2025*
*Version: 1.0.0*

