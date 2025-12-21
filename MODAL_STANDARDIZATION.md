# Modal Popup Standardization

## Overview
Standardized all modal popups to have consistent header, footer, and image container sizes throughout the application. This ensures a uniform user experience regardless of which game phase or modal type is displayed.

## Standardized Components

### 1. **Modal Header** (`h2`)
- **Fixed Height**: `2rem` (never shrinks)
- **Font Size**: `1.25rem`
- **Line Height**: `2rem`
- **Behavior**: `flex-shrink: 0` - Always maintains size

### 2. **Modal Text** (`p`)
- **Font Size**: `0.85rem`
- **Line Height**: `1.4`
- **Behavior**: `flex-shrink: 0` - Always maintains size

### 3. **Image Containers** (All types use same flexbox rules)

All image-displaying containers now use identical sizing:

#### `.modal-hand` (Card hand display)
- `flex: 1 1 auto` - Takes remaining space after header/text
- `min-height: 0` - Allows proper flexbox shrinking
- `overflow-y: auto` - Scrolls if content exceeds space

#### `.submitted-card-preview` (Storyteller's submitted card)
- `flex: 1 1 auto` - **Same as modal-hand**
- `min-height: 0` - **Same as modal-hand**
- Image fills 100% of available height

#### `.modal-voting-cards` (Voting phase cards)
- `flex: 1 1 auto` - **Same as modal-hand**
- `min-height: 0` - **Same as modal-hand**
- `overflow-y: auto` - Scrolls if content exceeds space

### 4. **Modal Section**
- **Gap**: `0.75rem` (reduced from `1rem` for tighter spacing)
- **Flex**: `flex: 1` - Fills entire modal content area
- **Direction**: `column` - Stacks header → text → images

## Layout Structure

```
┌─────────────────────────────────────┐
│  Modal Popup (85vh max)             │
│  ┌───────────────────────────────┐  │
│  │ Modal Content                 │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Modal Section (flex: 1) │  │  │
│  │  │                         │  │  │
│  │  │  H2 (2rem fixed)       │  │  │ ← Header (never shrinks)
│  │  │  P (auto, flex-shrink:0) │  │ ← Text (never shrinks)
│  │  │                         │  │  │
│  │  │  ┌───────────────────┐ │  │  │
│  │  │  │ Image Container   │ │  │  │
│  │  │  │ (flex: 1 1 auto)  │ │  │  │ ← Takes ALL remaining space
│  │  │  │                   │ │  │  │
│  │  │  │ [Images/Cards]    │ │  │  │
│  │  │  │                   │ │  │  │
│  │  │  └───────────────────┘ │  │  │
│  │  │                         │  │  │
│  │  │  Buttons (auto)        │  │  │ ← Footer (never shrinks)
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Benefits

### Consistency
- **Same popup size** across all game phases
- **Same header/footer space** in every modal
- **Same image area** for storyteller choice, player choice, voting, etc.

### Predictability
- Users know exactly where to look for information
- Image size is consistent → easier to compare cards
- No jarring size changes between phases

### Responsive Design
- Desktop: Modal uses 85% viewport height
- Mobile: Modal uses 100% viewport height
- Image container flexes to fill remaining space automatically

### Better UX
- **Maximum image visibility** - containers take all available space after header/text
- **No manual max-height** - flexbox calculates optimal size
- **Proper scrolling** - if content exceeds container, scrolling is enabled

## Modal Types Using This System

All modals now follow the standardized sizing:

1. **Lobby Modal** - Player list and settings
2. **Storyteller Choice Modal** - Card selection + clue input
3. **Storyteller Submitted Modal** - Preview of submitted card
4. **Player Choice Modal** - Card selection for players
5. **Waiting Modal** - Status messages
6. **Voting Modal** - Vote for cards
7. **Reveal Modal** - Show results and scores
8. **Game End Modal** - Winner and final scores

## Technical Implementation

### Desktop Sizing
```css
.modal-hand,
.submitted-card-preview,
.modal-voting-cards {
  flex: 1 1 auto;      /* Take remaining space */
  min-height: 0;        /* Allow flexbox to shrink */
  width: 100%;
  overflow-y: auto;     /* Scroll if needed */
}
```

### Mobile Sizing
```css
@media (max-width: 768px) {
  .modal-popup {
    height: 100vh;      /* Full screen */
    height: 100dvh;     /* Dynamic viewport height */
  }
  
  .modal-hand,
  .submitted-card-preview,
  .modal-voting-cards {
    flex: 1 1 auto;     /* Same as desktop */
    min-height: 0;      /* Same as desktop */
  }
}
```

## Testing Checklist

Verify consistent sizing across:
- [ ] Lobby phase
- [ ] Storyteller choice (before submission)
- [ ] Storyteller waiting (after submission) - **Image should be large**
- [ ] Player choice
- [ ] Player waiting
- [ ] Voting phase
- [ ] Reveal phase
- [ ] Game end

For each phase, check:
- [ ] Header is same height
- [ ] Text/buttons are same size
- [ ] Image container fills remaining space identically
- [ ] No content is cut off
- [ ] Scrolling works if needed

## Files Modified

1. **`client/src/styles/global.css`**
   - Standardized `.modal-section h2` with fixed height
   - Standardized `.modal-section p` with flex-shrink: 0
   - Unified `.modal-hand`, `.submitted-card-preview`, `.modal-voting-cards` sizing
   - Applied same rules to mobile breakpoint

## Result

✅ **All modals now have identical structure and sizing**
✅ **Images take maximum available space consistently**
✅ **Headers and text are predictable and uniform**
✅ **Better user experience with consistent layout**

---

**Last Updated**: December 21, 2025

