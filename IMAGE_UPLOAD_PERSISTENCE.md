# Image Upload & Persistence System

## Overview
This document describes how image uploads work for all users (players and spectators) and what happens to images when users disconnect or logout.

## Key Features

### 1. **Everyone Can Upload Images**
- ✅ Players can upload images
- ✅ Spectators can upload images
- ✅ Admin controls who can upload via toggle
- ✅ Admin can always upload (regardless of toggle)

### 2. **Images Persist on Disconnect**
- ✅ Images stay when user disconnects (network loss, browser crash, etc.)
- ✅ User can reconnect and their images are still there
- ❌ Images only removed on **manual logout**

### 3. **Warning Before Logout**
- ⚠️ Confirmation dialog shows when logging out with uploaded images
- 📊 Shows exact count of images that will be removed
- 🛡️ Prevents accidental image loss

## Upload System Details

### Who Can Upload?

```typescript
// Everyone can upload if admin allows
const canUpload = isAdmin || roomState.allowPlayerUploads;
```

| User Type | Admin Toggle ON | Admin Toggle OFF |
|-----------|----------------|------------------|
| Admin | ✅ Can upload | ✅ Can upload |
| Player | ✅ Can upload | ❌ Cannot upload |
| Spectator | ✅ Can upload | ❌ Cannot upload |

### Upload Limits

- **Per User**: 200 images maximum
- **File Size**: 5MB maximum per image
- **Total Deck**: No hard limit (but needs 100 minimum to start game)

### Who Can Delete Images?

```typescript
// Only owner or admin can delete
if (card.uploadedBy !== playerId && !isAdmin) {
  throw new Error('You can only delete your own images');
}
```

| User | Own Images | Other's Images |
|------|------------|----------------|
| Regular User | ✅ Can delete | ❌ Cannot delete |
| Admin | ✅ Can delete | ✅ Can delete |

## Image Persistence Logic

### Disconnect vs Logout

#### **Disconnect** (Connection Lost)
```
Network Error → Player.disconnect() → Images STAY
Browser Crash → Player.disconnect() → Images STAY
Tab Closed → Player.disconnect() → Images STAY
```

**Why**: User might reconnect, images are valuable content.

#### **Manual Logout** (Intentional Leave)
```
Click Logout → Warning Dialog → Confirm → Images REMOVED
```

**Why**: User intentionally leaving, confirmed they want to remove images.

### Image Removal Events

| Event | Images Removed? | Warning Shown? | Can Cancel? |
|-------|----------------|----------------|-------------|
| Network disconnect | ❌ No | ❌ No | N/A |
| Browser crash | ❌ No | ❌ No | N/A |
| Tab closed | ❌ No | ❌ No | N/A |
| Manual logout | ✅ Yes | ✅ Yes | ✅ Yes |
| Kicked by admin | ✅ Yes | ❌ No | ❌ No |

## Logout Warning System

### Dialog Text

When user has uploaded images:
```
⚠️ Warning: You have 5 uploaded images in the deck.

If you logout, these images will be permanently removed from the game.

Are you sure you want to logout?

[Cancel] [OK]
```

### Implementation

```typescript
const handleLogout = () => {
  const myImages = roomState?.deckImages.filter(img => img.uploadedBy === playerId) || [];
  const imageCount = myImages.length;
  
  if (imageCount > 0) {
    const confirmed = window.confirm(
      `⚠️ Warning: You have ${imageCount} uploaded image${imageCount !== 1 ? 's' : ''} in the deck.\n\n` +
      `If you logout, these images will be permanently removed from the game.\n\n` +
      `Are you sure you want to logout?`
    );
    
    if (!confirmed) {
      return; // User cancelled
    }
  }
  
  // Proceed with logout
  onLeave();
};
```

## Server-Side Logic

### Disconnect Handler
```typescript
removePlayer(clientId: string): void {
  const player = this.state.players.get(clientId);
  if (player) {
    player.disconnect(); // Just mark disconnected
    // Images STAY - do NOT call removePlayerImages()
  }
}
```

### Logout Handler
```typescript
leavePlayer(clientId: string): void {
  const player = this.state.players.get(clientId);
  if (!player) return;
  
  // Remove images on manual logout
  const removedCount = this.deckManager.removePlayerImages(clientId);
  console.log(`Removed ${removedCount} images from ${player.name} who logged out`);
  
  this.state.players.delete(clientId);
}
```

### Kick Handler
```typescript
kickPlayer(adminId: string, targetPlayerId: string): void {
  // ... validation ...
  
  // Remove images when kicked
  const removedCount = this.deckManager.removePlayerImages(targetPlayerId);
  this.state.players.delete(targetPlayerId);
}
```

## DeckManager Methods

### Remove Player Images
```typescript
removePlayerImages(playerId: string): number {
  const initialCount = this.deck.length;
  this.deck = this.deck.filter(card => card.uploadedBy !== playerId);
  const removedCount = initialCount - this.deck.length;
  
  this.imageCountByPlayer.delete(playerId);
  
  return removedCount;
}
```

**Used in**:
- Manual logout (`leavePlayer`)
- Admin kick (`kickPlayer`)

**NOT used in**:
- Disconnect (`removePlayer`)

## Orphaned Images

### What are Orphaned Images?

Images uploaded by users who:
- Disconnected and never returned
- Lost connection permanently
- Crashed and didn't rejoin

### Current Behavior

**Orphaned images stay in the deck**

Pros:
- ✅ Valuable content not lost
- ✅ Deck stays populated
- ✅ User can reconnect and reclaim

Cons:
- ⚠️ No one owns the images anymore
- ⚠️ Admin cannot delete them (since uploader is gone)
- ⚠️ Takes up deck space

### Future Enhancement: Admin Claim Feature

**TODO**: Add ability for admin to claim orphaned images

```typescript
// Potential implementation
claimOrphanedImages(adminId: string): void {
  this.validateAdmin(adminId);
  
  // Find images from disconnected players
  const disconnectedPlayerIds = Array.from(this.state.players.entries())
    .filter(([_, player]) => !player.isConnected)
    .map(([id, _]) => id);
  
  // Transfer ownership to admin
  this.deck.forEach(card => {
    if (disconnectedPlayerIds.includes(card.uploadedBy)) {
      card.uploadedBy = adminId;
    }
  });
}
```

## User Experience

### For Regular Users

1. **Upload**: Click "Upload Images" or "Upload Folder"
2. **View**: See "My images: X/200" count
3. **Delete**: Click × on own images
4. **Disconnect**: Images preserved, can reconnect
5. **Logout**: Warning shown, must confirm

### For Spectators

1. **Join**: Click "Join as Spectator"
2. **Upload**: Same as players (if admin allows)
3. **View**: Same as players
4. **Delete**: Can delete own images
5. **Limitation**: Cannot play, only observe + contribute images

### For Admin

1. **Toggle**: Control who can upload
2. **Always Upload**: Can upload regardless of toggle
3. **Delete Any**: Can delete any user's images
4. **Kick**: Removes player AND their images
5. **Orphaned**: Currently cannot claim (future feature)

## Console Logs

### Helpful Debug Messages

```typescript
// On disconnect
"Player disconnected: clientId (PlayerName) - images preserved"

// On logout
"Removed 5 images from PlayerName who logged out"

// On kick
"Removed 3 images from KickedPlayer kicked by Admin"

// On image operations
"Added image for playerId (remaining: 5/200)"
"Deleted image cardId by playerId"
```

## Testing Scenarios

### Scenario 1: Disconnect & Reconnect
```
1. Player joins and uploads 10 images
2. Player loses network connection
3. Check: Images still in deck ✅
4. Player reconnects
5. Check: Player can see and delete their images ✅
```

### Scenario 2: Logout Warning
```
1. Player joins and uploads 5 images
2. Player clicks "Logout"
3. Check: Warning dialog appears ✅
4. Check: Shows "5 uploaded images" ✅
5. Player clicks "Cancel"
6. Check: Still logged in, images remain ✅
7. Player clicks "Logout" again
8. Player clicks "OK"
9. Check: Images removed, player logged out ✅
```

### Scenario 3: Spectator Upload
```
1. User joins as spectator
2. Admin enables "Allow players to upload"
3. Check: Spectator can see upload buttons ✅
4. Spectator uploads 3 images
5. Check: Images added to deck ✅
6. Check: Spectator can delete own images ✅
7. Check: Spectator cannot delete others' images ✅
```

### Scenario 4: Admin Controls
```
1. Admin uploads 5 images
2. Player uploads 3 images
3. Admin disables "Allow players to upload"
4. Check: Player cannot upload more ✅
5. Check: Admin can still upload ✅
6. Admin can delete player's images ✅
7. Admin can delete own images ✅
```

### Scenario 5: Kick Player
```
1. Player uploads 7 images
2. Admin kicks the player
3. Check: Player removed from game ✅
4. Check: Player's 7 images removed ✅
5. Check: Deck size decreased by 7 ✅
```

## Configuration

### Constants

```typescript
// DeckManager.ts
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES_PER_PLAYER = 200;
const MIN_IMAGES_TO_START = 100;
```

### Defaults

```typescript
// DeckManager constructor
this.allowPlayerUploads = true; // Players CAN upload by default
```

## Files Modified

### Client
1. `/client/src/pages/UnifiedGamePage.tsx`
   - Added logout warning dialog
   - Counts user's uploaded images
   - Shows confirmation before removing images

2. `/client/src/components/DeckUploader.tsx`
   - No changes needed (already allows everyone)

### Server
1. `/server/src/game/GameManager.ts`
   - `removePlayer()`: Does NOT remove images
   - `leavePlayer()`: Removes images on manual logout
   - `kickPlayer()`: Removes images when kicked

2. `/server/src/game/DeckManager.ts`
   - `removePlayerImages()`: Method to remove all player's images
   - `addImage()`: No spectator restriction
   - `deleteImage()`: Owner or admin can delete

## API Summary

### GameManager

```typescript
// Does NOT remove images
removePlayer(clientId: string): void

// Removes images
leavePlayer(clientId: string): void

// Removes images
kickPlayer(adminId: string, targetPlayerId: string): void

// Add/delete images
uploadImage(imageData: string, playerId: string): Card
deleteImage(cardId: string, playerId: string): boolean
```

### DeckManager

```typescript
// Anyone can upload (if allowed)
addImage(imageData: string, playerId: string): Card

// Owner or admin can delete
deleteImage(cardId: string, playerId: string): boolean

// Remove all images by a player
removePlayerImages(playerId: string): number
```

## Security Considerations

### Validation
- ✅ Image size validated (5MB limit)
- ✅ Upload permissions checked
- ✅ Delete permissions checked
- ✅ Admin validation for sensitive operations

### Abuse Prevention
- ✅ 200 image limit per user
- ✅ File size limits
- ✅ Admin can delete any image
- ✅ Admin can kick abusive users

### Data Integrity
- ✅ Images tied to user ID
- ✅ Image counts tracked accurately
- ✅ Deck state synchronized with clients

## Future Enhancements

### 1. Orphaned Image Management
- Admin UI to see orphaned images
- "Claim All Orphaned Images" button
- Auto-cleanup after X days

### 2. Image Transfer
- Transfer ownership of images
- "Give Images to Another Player"
- Bulk transfer operations

### 3. Enhanced Warnings
- Show image thumbnails in logout warning
- "Keep images and transfer to admin" option
- Undo logout within 30 seconds

### 4. Image Metadata
- Track upload timestamp
- Track last modified
- Track image usage in games

---

**Status**: ✅ Implemented & Tested  
**Version**: 2.0  
**Last Updated**: December 21, 2025

## Quick Reference

| Question | Answer |
|----------|--------|
| Can spectators upload? | ✅ Yes (if admin allows) |
| Images removed on disconnect? | ❌ No |
| Images removed on logout? | ✅ Yes (with warning) |
| Images removed when kicked? | ✅ Yes |
| Can user cancel logout? | ✅ Yes |
| Can admin delete any image? | ✅ Yes |
| Can admin claim orphaned images? | ❌ Not yet (future) |
| Warning before image removal? | ✅ Yes (on logout only) |


