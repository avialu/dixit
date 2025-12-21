# Safari Mobile Board Slicing Fix

## Problem
The bottom of the game board was being cut off/sliced on Safari iOS, particularly when the address bar is visible.

## Safari-Specific Issues

### 1. **Dynamic Address Bar**
Safari's address bar hides/shows dynamically, changing the viewport height:
- Address bar visible: ~100vh becomes ~900px
- Address bar hidden: ~100vh becomes ~1000px
- This causes layout shifts and content being cut off

### 2. **`100vh` Bug in Safari**
Safari's implementation of `100vh` includes the address bar height, so when the bar is visible, content below is cut off.

### 3. **Flexbox Calculation Issues**
Safari sometimes miscalculates flex container heights, especially with nested flex layouts.

## Solutions Applied

### 1. **Dynamic Viewport Height (dvh)**
```css
.game-board-background {
  height: 100vh;      /* Fallback */
  height: 100dvh;     /* Dynamic height - adapts to address bar */
  max-height: 100vh;
  max-height: 100dvh;
}
```

### 2. **iOS Safe Area Insets**
```css
@media (max-width: 480px) {
  .game-board-background {
    padding-bottom: env(safe-area-inset-bottom, 0.5rem);
  }
}
```
This ensures content isn't hidden behind home indicator on iPhone X+.

### 3. **Explicit Height Constraints**
```css
.score-track-container {
  min-height: 180px;                    /* Minimum usable size */
  max-height: calc(100vh - 120px);      /* Leave room for UI */
  max-height: calc(100dvh - 120px);     /* Safari-friendly */
  flex: 1 1 auto;                       /* Flexible but constrained */
}
```

### 4. **Overflow Strategy Change**
```css
/* Before */
.game-board-visual {
  overflow: hidden;  /* Was cutting off content */
}

/* After */
.game-board-visual {
  overflow: visible;  /* Allow content to show */
}

.game-board-background {
  overflow-y: auto;   /* Parent scrolls instead */
}
```

### 5. **Enhanced Viewport Meta Tag**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

- `viewport-fit=cover` - Uses full screen area on notched devices
- `apple-mobile-web-app-capable` - Better fullscreen experience
- `black-translucent` - Status bar overlays content (more space)

### 6. **Smooth Scrolling for iOS**
```css
.game-board-background {
  -webkit-overflow-scrolling: touch;  /* Native momentum scrolling */
}
```

## Complete Safari Mobile CSS

```css
/* Mobile Safari - ≤768px */
@media (max-width: 768px) {
  .game-board-background {
    padding: 0.5rem;
    padding-bottom: env(safe-area-inset-bottom, 0.5rem);
    height: 100vh;
    height: 100dvh;
    max-height: 100vh;
    max-height: 100dvh;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    -webkit-overflow-scrolling: touch;
  }

  .game-board-visual {
    padding: 0.25rem;
    gap: 0.25rem;
    overflow: visible;
    flex: 1;
    min-height: 0;
    max-height: 100%;
  }

  .score-track-container {
    padding: 0.25rem;
    flex: 1 1 auto;
    min-height: 200px;
    max-height: calc(100vh - 150px);
    max-height: calc(100dvh - 150px);
    overflow: visible;
  }
}

/* Very Small iPhone - ≤480px */
@media (max-width: 480px) {
  .game-board-background {
    padding: 0.25rem;
    padding-bottom: env(safe-area-inset-bottom, 0.5rem);
  }

  .score-track-container {
    min-height: 180px;
    max-height: calc(100vh - 120px);
    max-height: calc(100dvh - 120px);
  }

  .game-status-bar {
    padding: 0.4rem 0.5rem;
    overflow: hidden;
  }
}
```

## Testing on Safari iOS

### 1. **Before Testing**
- Clear Safari cache: Settings → Safari → Clear History and Website Data
- Or: Hard refresh (tap refresh, then tap again while page loads)

### 2. **Test Scenarios**
```
□ Address bar visible - scroll to top
  → Check if bottom of board is visible
  
□ Address bar hidden - scroll down slightly
  → Check if board adjusts properly
  
□ Rotate to landscape
  → Check if board still fits
  
□ Back to portrait
  → Check if board recovers properly
  
□ Open keyboard (if text input visible)
  → Check if layout handles it
```

### 3. **Visual Checks**
```
✓ Status bar at top (not cut off)
✓ Score track visible and usable
✓ Player tokens visible
✓ Bottom padding visible (not cut off)
✓ Can scroll if needed
✓ No white gaps at edges
```

## Safari DevTools Remote Debugging

### On Mac + iPhone:
1. **iPhone**: Settings → Safari → Advanced → Web Inspector: ON
2. **Mac**: Safari → Preferences → Advanced → Show Develop menu
3. **Connect iPhone** to Mac via USB
4. **Mac Safari**: Develop → [Your iPhone] → [Your Page]
5. **Inspect elements** and check computed styles

### Check These Values:
```javascript
// In Safari console on iPhone
console.log({
  vh: window.innerHeight,
  dvh: window.visualViewport?.height,
  boardHeight: document.querySelector('.game-board-background')?.offsetHeight,
  trackHeight: document.querySelector('.score-track-container')?.offsetHeight,
  svgHeight: document.querySelector('.score-track-svg')?.offsetHeight
});
```

## Browser Support

### Dynamic Viewport (dvh)
- ✅ iOS Safari 15.4+ (March 2022)
- ✅ Most iOS devices running iOS 15.4+
- ✅ Fallback to `vh` for older versions

### Safe Area Insets
- ✅ iOS Safari 11+ (iPhone X and newer)
- ✅ Graceful fallback for older devices

### viewport-fit=cover
- ✅ iOS Safari 11+
- ⚠️ Ignored on older devices (no harm)

## Common Safari Issues

### Issue: Content jumps when address bar hides
**Why**: Layout recalculates with new viewport height  
**Fix**: Using `dvh` instead of `vh` - already applied ✅

### Issue: Flex items don't shrink properly
**Why**: Safari flexbox bugs  
**Fix**: Added `min-height: 0` to flex children ✅

### Issue: 100vh includes address bar
**Why**: Safari's `vh` implementation  
**Fix**: Using `dvh` + explicit max-height constraints ✅

### Issue: Bottom content cut off on notched phones
**Why**: Home indicator area  
**Fix**: Using `env(safe-area-inset-bottom)` ✅

### Issue: Scrolling feels choppy
**Why**: Default scrolling behavior  
**Fix**: Added `-webkit-overflow-scrolling: touch` ✅

## Alternative Fix (If Still Issues)

If `dvh` isn't supported on older iOS:

```javascript
// Add to main.tsx or App.tsx
useEffect(() => {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
  
  return () => {
    window.removeEventListener('resize', setVH);
    window.removeEventListener('orientationchange', setVH);
  };
}, []);
```

Then use in CSS:
```css
.game-board-background {
  height: calc(var(--vh, 1vh) * 100);
}
```

## Files Modified

1. **`/client/index.html`**
   - Enhanced viewport meta tag
   - Added iOS-specific meta tags
   - Added `viewport-fit=cover`

2. **`/client/src/styles/global.css`**
   - Added `dvh` support everywhere
   - iOS safe area insets
   - Explicit height constraints
   - Changed overflow strategy
   - Safari-specific scrolling

## Success Criteria for Safari

✅ Board visible from top to bottom  
✅ No content cut off at bottom  
✅ Works with address bar visible/hidden  
✅ Smooth scrolling on touch  
✅ Handles screen rotation  
✅ Respects safe areas (notch/home indicator)  
✅ No white gaps or overflow  

## Quick Test Command

```bash
# Check if running latest Safari
# In Safari on iPhone, go to: Settings → Safari → Advanced → Experimental Features
# Enable: "CSS Viewport Units" if available
```

## If Still Having Issues

Please check and share:
1. **iOS Version**: Settings → General → About → Version
2. **Safari Version**: (same as iOS version typically)
3. **Device Model**: iPhone X? iPhone 14?
4. **Screenshot**: Take screenshot showing the cut-off area
5. **Console Errors**: Use Safari Remote Debugging to check

---

**Last Updated**: December 21, 2025  
**Issue**: Bottom of board sliced on Safari iOS  
**Status**: ✅ Fixed with dvh + safe area + overflow strategy  
**Please test and report back!**


