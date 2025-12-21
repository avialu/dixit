# Mobile Responsive Testing Checklist

## Quick Visual Tests (Use Browser DevTools)

### 1. iPhone SE (320px × 568px) - Smallest Common Screen
```
□ No horizontal scrolling
□ Status bar visible and readable
□ Score track fills screen without overflow
□ Cards stack in single column
□ Modal popups fill screen
□ All text readable without zoom
□ Floating buttons accessible
```

### 2. iPhone 12/13 (390px × 844px) - Most Common
```
□ Cards display in 1-2 columns
□ Score track properly sized
□ Status bar compact but clear
□ QR code properly sized (~160px)
□ Modal content scrollable
□ Touch targets 44px+ minimum
□ Voting cards full width
```

### 3. iPad Portrait (768px × 1024px) - Tablet
```
□ Cards display in 2-3 columns
□ Score track uses full width
□ Status bar normal size
□ Modal popups centered
□ Proper spacing maintained
□ Board cards visible
□ Lobby in 2 columns
```

### 4. iPad Landscape (1024px × 768px) - Wide Tablet
```
□ Cards display in 3-4 columns
□ Score track optimized for wide aspect
□ Desktop layout begins
□ All features accessible
□ No wasted space
```

## Interactive Tests

### Touch Targets
```
□ Can tap cards without misclicks
□ Buttons are 44px × 44px minimum
□ Floating action buttons easy to reach
□ Modal close button accessible
□ Status bar elements not too small
```

### Scrolling
```
□ Modal content scrolls smoothly
□ Hand view scrolls if many cards
□ No horizontal scroll anywhere
□ Overflow handled properly
□ Momentum scrolling works (iOS)
```

### Text Readability
```
□ Status text: 0.8rem+ on mobile
□ Card numbers: 1.5rem+ minimum
□ Clue text: 1.5rem+ minimum
□ Player names: 0.9rem+ minimum
□ All text passes AA accessibility
```

## Chrome DevTools Quick Start

1. Open DevTools: `F12` or `Cmd+Opt+I` (Mac)
2. Toggle Device Toolbar: `Ctrl+Shift+M` or `Cmd+Shift+M` (Mac)
3. Select device or enter custom dimensions
4. Test in both portrait and landscape
5. Check Network throttling (3G/4G)

## Common Issues to Check

### Overflow Issues
```bash
# Look for these in console
- Elements wider than viewport
- Horizontal scrollbar appearance
- Content being cut off
- SVG not fitting container
```

### Layout Breaks
```bash
# Check these breakpoints
- 320px (iPhone SE)
- 375px (iPhone 8)
- 390px (iPhone 12/13)
- 414px (iPhone Plus)
- 768px (iPad Portrait)
```

### Performance
```bash
# Should be smooth
- Scroll performance
- Animation frame rate
- Touch responsiveness
- Modal open/close speed
```

## Browser Testing Matrix

### iOS (Safari)
```
□ iPhone SE (iOS 15+)
□ iPhone 12 (iOS 16+)
□ iPhone 14 (iOS 17+)
□ iPad 10th Gen (iPadOS 16+)
```

### Android (Chrome)
```
□ Samsung Galaxy S21 (Android 12+)
□ Pixel 6 (Android 13+)
□ OnePlus 9 (Android 11+)
□ Samsung Galaxy Tab (Android 12+)
```

## Automated Test Commands

### Visual Regression Testing
```bash
# Take screenshots at different viewports
# (requires playwright or similar)

npx playwright test --headed
```

### Accessibility Testing
```bash
# Check for accessibility issues
# (requires axe-core or similar)

npm run test:a11y
```

## Real Device Testing

### Best Practices
1. Test on at least 2 real devices
2. Include one iOS and one Android
3. Test in both portrait and landscape
4. Check with different browser apps
5. Test on slow network (3G)

### Recommended Devices
- iPhone 13 or newer (iOS)
- Samsung Galaxy S21+ (Android)
- iPad 10th Gen (Tablet)

## Quick Fix Reference

### If Content Overflows
```css
.your-element {
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}
```

### If Cards Too Small
```css
.cards-grid {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
```

### If Text Too Small
```css
@media (max-width: 768px) {
  .your-text {
    font-size: 0.9rem; /* Instead of 0.75rem */
  }
}
```

### If Modal Too Wide
```css
@media (max-width: 768px) {
  .modal-popup {
    width: 100%;
    max-width: 100%;
    padding: 1rem;
  }
}
```

## Sign-Off Checklist

Before marking as complete:
```
□ Tested on 3+ screen sizes
□ No console errors
□ No horizontal scrolling
□ All interactive elements work
□ Text is readable
□ Touch targets adequate
□ Performance is smooth
□ Works in Safari AND Chrome
□ Tested portrait and landscape
□ Documentation updated
```

## Emergency Rollback

If critical issues found:
```bash
cd /Users/avialurie/dixit
git checkout HEAD~1 client/src/styles/global.css
git commit -m "Rollback mobile responsive fixes"
```

---

**Quick Test URL**: Open game → Open DevTools → Toggle device mode → Test!

**Average Test Time**: 15-20 minutes for thorough check

**Last Updated**: December 21, 2025


