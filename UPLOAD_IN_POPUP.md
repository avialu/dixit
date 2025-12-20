# Image Upload in Lobby Popup

## Summary

Added the DeckUploader component to the settings modal (⚙️ button) so both admin and players can upload images directly from the popup.

## What Changed

### Before
- No way to upload images from the popup
- Had to use external UI (which didn't exist in UnifiedGamePage)
- Confusing UX

### After
- **DeckUploader** now visible in settings modal
- Both admin and players can access it
- Upload buttons respect the toggle setting
- Clean, accessible UI

---

## Where to Find It

### 1. **Open Settings Modal**
```
Click the ⚙️ button (top-right when in lobby)
OR
When in DECK_BUILDING phase, click "⚙️ Settings"
```

### 2. **Upload Section**
```
📦 Deck Images section appears above admin controls
- Shows deck size
- Upload buttons (📁 Upload Images, 📂 Upload Folder)
- My images list
- Lock/Unlock button (admin only)
```

---

## Features

### For Admin
```
⚙️ Settings Modal:
├─ 👥 Players list
├─ 🖼️ Deck Images ⭐ NEW!
│  ├─ Deck info (size, my images)
│  ├─ Upload controls toggle
│  ├─ Upload buttons (always enabled)
│  ├─ My uploaded images
│  └─ Lock/Unlock deck button
└─ ⚙️ Game Settings
   ├─ Toggle: Allow players to upload
   ├─ Win Target
   └─ Start Game button
```

### For Players
```
⚙️ Settings Modal:
├─ 👥 Players list
└─ 🖼️ Deck Images ⭐ NEW!
   ├─ Deck info (size, my images)
   ├─ Upload buttons (enabled when toggle ON)
   └─ My uploaded images
```

---

## How It Works

### 1. **Upload Permission Logic**
```typescript
// Admin can always upload
if (isAdmin) {
  uploadEnabled = true;
}

// Players can only upload when toggle is ON
if (!isAdmin && !allowPlayerUploads) {
  uploadEnabled = false;
  showMessage = "Only host can upload images";
}
```

### 2. **Component Structure**
```tsx
<DeckUploader
  roomState={roomState}
  playerId={playerId}
  onUpload={_onUploadImage}          // Upload handler
  onDelete={_onDeleteImage}          // Delete handler
  onSetAllowPlayerUploads={...}      // Toggle handler (admin only)
  onLock={onLockDeck}                // Lock handler (admin only)
/>
```

### 3. **Visibility**
- **Settings modal** → Always shows DeckUploader
- **Admin view** → Shows toggle control within DeckUploader
- **Player view** → Shows upload buttons (respects toggle)

---

## User Experience

### Admin Workflow
```
1. Click ⚙️ Settings
2. Scroll to "🖼️ Deck Images"
3. Toggle "Allow players to upload" ON/OFF
4. Click "📁 Upload Images" or "📂 Upload Folder"
5. Select images
6. See deck size increase
7. See images in "My images: X/20"
8. Lock deck when ready
9. Close modal
10. Click "Start Game"
```

### Player Workflow
```
1. Click ⚙️ Settings
2. Scroll to "🖼️ Deck Images"
3. Check if upload is allowed:
   - ✅ "Players can upload" → Buttons enabled
   - 🔒 "Only host can upload" → Buttons disabled
4. If enabled: Upload images
5. See your images in list
6. Wait for admin to start
```

---

## Visual Layout

```
┌──────────────────────────────────────────┐
│ ⚙️ Settings                      ✕       │
├──────────────────────────────────────────┤
│ 👥 Players (4)                           │
│ [Player cards grid...]                   │
│                                           │
│ 🖼️ Deck Images                           │
│ ┌──────────────────────────────────────┐ │
│ │ Deck: 47 images                      │ │
│ │ My images: 3/20                      │ │
│ │                                       │ │
│ │ [Toggle: Allow players to upload]    │ │ (Admin only)
│ │ ✅ Players can upload (you can...    │ │
│ │                                       │ │
│ │ [📁 Upload Images] [📂 Folder]       │ │
│ │ [Lock Deck]                          │ │ (Admin only)
│ │                                       │ │
│ │ My Images:                            │ │
│ │ [img-001] [×]                        │ │
│ │ [img-002] [×]                        │ │
│ │ [img-003] [×]                        │ │
│ └──────────────────────────────────────┘ │
│                                           │
│ ⚙️ Game Settings                         │ (Admin only)
│ Win Target: [▼ 30 Points]               │
│ 📦 Deck Size: 47 images                  │
│ [🚀 Start Game] [Lock Deck]             │
└──────────────────────────────────────────┘
```

---

## Technical Details

### Import Added
```typescript
import { DeckUploader } from "../components/DeckUploader";
```

### Integration Point
```typescript
{/* Image Upload Section - Available to everyone */}
<div style={{ marginTop: "2rem" }}>
  <h2>🖼️ Deck Images</h2>
  <DeckUploader
    roomState={roomState}
    playerId={playerId}
    onUpload={_onUploadImage}
    onDelete={_onDeleteImage}
    onSetAllowPlayerUploads={onSetAllowPlayerUploads}
    onLock={onLockDeck}
  />
</div>
```

### Props Connected
- `_onUploadImage` → Socket event `uploadImage`
- `_onDeleteImage` → Socket event `deleteImage`
- `onSetAllowPlayerUploads` → Socket event `adminSetAllowPlayerUploads`
- `onLockDeck` → Socket event `lockDeck`

---

## Benefits

### User Experience
✅ **Accessible** - Upload from popup, no need to navigate
✅ **Visible** - Clear deck status and upload controls
✅ **Intuitive** - Toggle shows permission state
✅ **Efficient** - Upload and configure in one place

### Developer Experience
✅ **Reusable** - Same DeckUploader component everywhere
✅ **Consistent** - Same behavior in demo and real game
✅ **Maintainable** - Single source of truth
✅ **Type-safe** - All props properly typed

---

## Testing

### Test as Admin
1. Open settings (⚙️)
2. See DeckUploader section
3. Toggle ON/OFF → See hint text change
4. Upload images → Deck size increases
5. Lock deck → Upload buttons disable
6. Unlock → Re-enables

### Test as Player
1. Open settings (⚙️)
2. See DeckUploader section
3. When toggle OFF → Buttons disabled
4. When toggle ON → Buttons enabled
5. Upload images → Works!
6. See "My images" update

### Test Permissions
1. Admin toggles OFF
2. Player opens settings
3. Upload buttons grayed out
4. Message shows: "Only host can upload"
5. Admin toggles ON
6. Player refreshes view
7. Buttons now enabled!

---

## Files Changed

- ✏️ `client/src/pages/UnifiedGamePage.tsx`
  - Added DeckUploader import
  - Added DeckUploader to settings modal
  - Positioned before admin controls
  - Visible to both admin and players

---

## Known Behavior

### Upload Limits
- Max 20 images per player
- Max 10MB per image before compression
- Images compressed to ~500KB each
- Deck needs 100+ images to start

### Lock Behavior
- Locked deck disables:
  - Upload buttons
  - Delete buttons
  - Toggle changes (admin)
- Unlock re-enables everything

### Toggle Behavior
- ON: Players can upload
- OFF: Only admin can upload
- Always visible in DeckUploader for admin
- Toggle changes take effect immediately

---

## Future Improvements

Possible enhancements:
- [ ] Show image thumbnails in popup
- [ ] Drag & drop upload area
- [ ] Upload progress for multiple images
- [ ] Image preview before upload
- [ ] Duplicate detection

---

## Quick Reference

**Location:** ⚙️ Settings button → 🖼️ Deck Images section

**Admin Actions:**
- Toggle player uploads
- Upload images (always)
- Lock/unlock deck
- Delete any image

**Player Actions:**
- Upload images (when allowed)
- Delete own images
- View deck status

**Everyone Can:**
- See deck size
- See their uploaded images count
- See permission status

---

Perfect! Now image uploads are accessible from the popup for everyone! 🎉

*Last Updated: December 20, 2025*
*Version: 1.0.0*

