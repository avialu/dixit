# Image Upload Guide

## Overview

The Dixit game now supports **fast, efficient image uploads** with both individual file selection and **folder upload** capabilities. Players can contribute up to 20 images each to the game deck.

## Features

### 🚀 Performance Optimizations

1. **Parallel Processing**: Images are compressed in batches of 4 simultaneously
2. **Smart Compression**: 
   - Images resized to max 1024px on longest side
   - JPEG compression targeting ~500KB per image
   - Automatic quality adjustment to meet size targets
3. **Real-time Progress**: See exactly which image is being processed
4. **Error Handling**: Failed images don't stop the upload process

### 📁 Upload Methods

#### **Individual Files**
- Click "📁 Upload Images" button
- Select multiple images using Ctrl/Cmd + Click or Shift + Click
- Supports all common image formats (JPEG, PNG, GIF, WebP, etc.)

#### **Folder Upload**
- Click "📂 Upload Folder" button
- Select an entire folder of images
- All images in the folder will be processed
- Great for bulk uploads!

### 🎮 Deck Modes

The host can control who uploads images:

1. **Mixed (Host + Players)** - Default mode, everyone can upload
2. **Host Only** - Only the host can upload images
3. **Players Only** - Only non-host players can upload

### 📊 Upload Limits

- **Per Player**: 20 images maximum
- **File Size**: 10MB max per file (before compression)
- **Deck Minimum**: 100 images total required to start the game
- **After Compression**: Each image ~500KB (optimal for network transfer)

## Usage

### For Players

1. **Join the game** and wait in the lobby
2. Look for the **Deck Uploader** section
3. Choose your upload method:
   - **Individual files**: Pick specific images
   - **Folder**: Upload entire folder at once
4. Watch the progress bar as images are processed
5. Delete images if needed (before deck is locked)
6. Wait for the host to lock the deck and start the game

### For Hosts

1. **Set Deck Mode** to control who can upload:
   ```
   Mixed: Everyone contributes (recommended for parties)
   Host Only: You provide all images (good for curated experiences)
   Players Only: Players provide images (good for player creativity)
   ```

2. **Monitor deck size** in the deck info panel:
   ```
   Deck: 156 images
   My images: 15/20
   ```

3. **Lock the deck** when ready (prevents further changes)
4. **Start the game** when you have enough images

## Technical Details

### Compression Pipeline

```
Original Image (e.g., 5MB PNG)
  ↓
Resize to ≤1024px (maintains aspect ratio)
  ↓
Convert to JPEG
  ↓
Compress with quality=0.9
  ↓
Iteratively reduce quality if needed
  ↓
Final Image (~500KB)
```

### Upload Flow

```
1. User selects files/folder
   ↓
2. Validate files (type, size)
   ↓
3. Process in batches of 4
   ↓
4. Compress each image
   ↓
5. Send to server via WebSocket
   ↓
6. Server validates and stores
   ↓
7. Broadcast updated deck to all players
```

### Performance Metrics

**Expected upload times** (for 20 images):
- Small images (< 1MB): ~3-5 seconds
- Medium images (1-3MB): ~5-8 seconds  
- Large images (3-10MB): ~8-15 seconds

**Factors affecting speed**:
- Original image sizes
- Device CPU power (compression is CPU-intensive)
- Network speed (for actual upload)
- Concurrent users uploading

## Troubleshooting

### Upload is Slow
- **Cause**: Large original images or slow device
- **Solution**: Pre-compress images, or use smaller files

### Upload Fails
- **Cause**: Network issue or file too large
- **Solution**: Check network, try smaller files

### Can't Upload More Images
- **Cause**: Reached 20 image limit per player
- **Solution**: Delete some existing images first

### Deck Won't Lock
- **Cause**: Not enough images (need 100 minimum)
- **Solution**: Upload more images or wait for other players

### Browser Freezes During Upload
- **Cause**: Processing too many large images at once
- **Solution**: Upload in smaller batches (already handled automatically)

## Best Practices

### For Best Experience

1. **Use folder upload** for bulk uploads (faster than selecting files)
2. **Pre-size images** if you have many large photos (optional but helps)
3. **Upload in advance** before game starts to avoid delays
4. **Check deck size** to ensure minimum is met (100 images)
5. **Test upload** with 1-2 images first if unsure

### Image Selection Tips

- **Variety**: Choose diverse, interesting images
- **Ambiguity**: Images that can mean many things work best
- **Quality**: Clear images work better than blurry ones
- **Appropriateness**: Keep it fun and appropriate for your group

## Browser Compatibility

### Fully Supported
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Folder Upload
- ✅ Chrome/Edge (full support)
- ✅ Firefox 88+ (full support)
- ⚠️ Safari 14.1+ (limited - falls back to file picker)

*Note: On browsers without folder upload support, the folder button will work like the regular file picker.*

## API Reference

### Events (WebSocket)

```typescript
// Upload image
socket.emit('uploadImage', { 
  imageData: string // base64 encoded JPEG
})

// Delete image
socket.emit('deleteImage', { 
  imageId: string 
})

// Lock deck (admin only)
socket.emit('lockDeck')
```

### Server Responses

```typescript
// Room state update (broadcasted)
{
  deckSize: number,
  deckLocked: boolean,
  deckMode: 'MIXED' | 'HOST_ONLY' | 'PLAYERS_ONLY',
  deckImages: Array<{
    id: string,
    uploadedBy: string,
    imageData: string
  }>
}

// Error
{
  message: string
}
```

## Future Enhancements

Potential improvements for future versions:

- [ ] **Drag & drop** support for files/folders
- [ ] **Image preview** before upload
- [ ] **Thumbnail gallery** of uploaded images
- [ ] **Duplicate detection** to avoid same image twice
- [ ] **Bulk delete** for multiple images at once
- [ ] **Upload from URL** for web images
- [ ] **Server-side compression** as fallback for slow clients

## FAQ

**Q: Will uploading slow down game start?**  
A: No! Images are uploaded during lobby phase. Once deck is locked, game starts instantly.

**Q: Are images stored permanently?**  
A: No, images are stored in-memory only. They're deleted when the game ends or server restarts.

**Q: Can I see other players' images before the game?**  
A: No, you only see your own uploaded images. Images are revealed during gameplay.

**Q: What happens if someone uploads inappropriate images?**  
A: The host (admin) can delete any image before locking the deck.

**Q: Can I change deck mode after images are uploaded?**  
A: Yes, but only before locking the deck. Existing images aren't deleted when mode changes.

**Q: What if we don't have 100 images?**  
A: The game automatically loads default images to reach the minimum.

---

**Ready to play?** Start uploading images and have fun! 🎨✨

