# Dixit Game Rules

A local multiplayer storytelling card game for 3+ players.

## Objective

Be the best storyteller! Give creative clues that some (but not all) players guess correctly, while also deducing which cards belong to the storyteller.

## Setup

### Player Requirements

- **Minimum Players**: 3
- **Maximum Players**: Unlimited (best with 4-6 players)
- **Roles**:
  - **Admin** (first player to join) - Controls game settings
  - **Storyteller** (rotates each round) - Gives clues
  - **Players** (all others) - Submit cards and vote

### Deck Requirements

- **Minimum Images**: 100 images required to start
- **Upload Limits**:
  - Max 200 images per player
  - Max 10MB per image before compression
  - Images auto-resized to 1024px maximum dimension

### Starting the Game

1. Admin sets win target (30/50/Unlimited points)
2. Players upload images until deck has 100+ images
3. Admin clicks "Start Game"
4. Each player receives 6 random cards

## Game Phases

The game follows these phases in order:

```
Lobby → Deck Building → Storytelling → Card Selection → 
Reveal → Voting → Scoring → [Next Round or Game End]
```

### Phase 1: Lobby (Deck Building)

- Players join the game
- Upload images to build the deck
- Admin configures settings
- **Minimum**: 3 players and 100 images
- **Start**: Admin clicks "Start Game"

### Phase 2: Storyteller's Turn

- One player is designated as the storyteller (marked with 📖)
- Storyteller:
  1. Selects one card from their hand (6 cards)
  2. Provides a creative clue (1-200 characters)
  3. Submits card and clue

**Tips for Storytelling:**
- Not too obvious (or everyone will guess)
- Not too obscure (or no one will guess)
- Be creative with words, sounds, or phrases

### Phase 3: Players Choose Cards

- All non-storytellers see the clue
- Each player selects one card from their hand that matches the clue
- Goal: Choose a card that might trick others into voting for it
- All players must submit before continuing

### Phase 4: Reveal

- All submitted cards are shuffled together
- Cards displayed in a random order
- Nobody knows which card belongs to whom
- **Duration**: 3 seconds (automatic transition)

### Phase 5: Voting

- Each non-storyteller votes for which card they think is the storyteller's
- **Cannot vote for your own card** (disabled automatically)
- Storyteller does not vote (just watches)
- All votes must be cast to continue

### Phase 6: Scoring

Results are revealed:
- Which card was the storyteller's
- Who voted for which card
- Points awarded to each player
- Updated scoreboard

**Click "Next Round"** to continue playing.

### Phase 7: Round End

- Players draw new cards back to 6 cards
- Storyteller role rotates to next player (clockwise)
- New round begins at Phase 2

## Scoring System

### Normal Case: Some Players Guessed Correctly

This is what you want as the storyteller!

- **Storyteller**: +3 points
- **Each Correct Guesser**: +3 points
- **Bonus**: +1 point per vote for your card (non-storytellers only)

### Too Obvious: All Players Guessed Correctly

Your clue was too easy!

- **Storyteller**: 0 points (penalty for being too obvious)
- **All Others**: +2 points each
- **Bonus**: +1 point per vote for your card

### Too Obscure: No Players Guessed Correctly

Your clue was too hard!

- **Storyteller**: 0 points (penalty for being too obscure)
- **All Others**: +2 points each
- **Bonus**: +1 point per vote for your card

### Bonus Points

**Always applied:**
- Each non-storyteller gets +1 point for every vote their card received
- Votes for the storyteller's card don't count for bonus

## Scoring Examples

### Example 1: Perfect Clue

**Setup:**
- Players: Alice (storyteller), Bob, Carol, Dave
- Bob and Carol guess correctly
- Dave guesses wrong, but his card gets 1 vote from Bob

**Scores:**
- Alice: +3 (some guessed correctly)
- Bob: +3 (guessed correctly)
- Carol: +3 (guessed correctly)
- Dave: +1 (bonus from Bob's vote)

### Example 2: Too Obvious

**Setup:**
- All 3 players vote for Alice's card

**Scores:**
- Alice: 0 (too obvious)
- Everyone else: +2 each (plus any bonus votes)

### Example 3: Too Obscure

**Setup:**
- No one votes for Alice's card
- Votes spread among other cards

**Scores:**
- Alice: 0 (too obscure)
- Everyone else: +2 each (plus bonus votes for their cards)

## Game End

### Win Conditions

**Primary:**
- Any player reaches the win target score (default: 30 points)

**Secondary:**
- Deck runs out of cards (can't refill hands to 6 cards)

### Win Target Settings

Admin can choose in lobby:
- **30 points** (default, ~15-20 minutes)
- **50 points** (longer game, ~30-40 minutes)
- **Unlimited** (play until deck runs out)

### After Game Ends

**Winner Declared:**
- Player with highest score wins
- If tied, player who reached target first wins

**Admin Options:**
- **Reset Game**: Keep same deck, reset scores to 0
- **New Deck**: Clear everything, upload new images
- **Back to Lobby**: Return to main menu

## Hand Management

### Your Hand

- Always 6 cards (when deck has enough)
- Only you can see your cards
- Cards are private (server enforces this)

### Using Cards

1. Submit a card during your turn
2. Card is removed from your hand
3. After scoring, draw back to 6 cards
4. Process repeats each round

## Admin Controls

The first player to join is automatically the admin (👑).

### Admin-Only Actions

**Before Game:**
- Set win target (30/50/Unlimited)
- Toggle who can upload images
- Lock deck (prevent uploads/deletes)
- Start game

**During Game:**
- None (gameplay is equal for all)

**After Game:**
- Reset game
- Start new deck
- Return to lobby

### Admin Transfer

- If admin leaves, role transfers to next player
- Admin privileges persist across reconnections

## Strategy Tips

### As Storyteller

- ✅ Be creative and ambiguous
- ✅ Think about what cards others might have
- ✅ Use abstract concepts, not literal descriptions
- ❌ Don't be too specific (too easy)
- ❌ Don't be too vague (too hard)

### As Player

- ✅ Choose cards that might look like storyteller's
- ✅ Pay attention to who the storyteller is
- ✅ Remember what cards have been played
- ❌ Don't always pick the "best" match
- ❌ Don't vote for your own card (disabled anyway)

### General Tips

- Creative clues win games
- Know your audience
- Sometimes being wrong scores more points
- Bonus points from votes add up!

## Special Rules

### Disconnection

- If a player disconnects, they stay in game as "disconnected"
- Can reconnect by refreshing and rejoining
- After 30 minutes offline, automatically removed

### Spectators

- Can watch the game without playing
- Cannot upload images or participate
- Join as spectator from join screen

### Image Requirements

- **Formats**: JPEG, PNG, WebP, GIF
- **Size**: Max 10MB before compression
- **Compression**: Automatically resized and compressed
- **Content**: Use appropriate images (it's a family game!)

## Quick Reference

| Phase | Who Acts | Action |
|-------|----------|--------|
| Lobby | Admin | Start game when ready |
| Storyteller's Turn | Storyteller | Choose card + give clue |
| Card Selection | All Players | Choose matching card |
| Reveal | Automatic | Cards shuffled and shown |
| Voting | All Players | Vote for storyteller's card |
| Scoring | Automatic | Points awarded |
| Next Round | Anyone | Click "Next Round" |

## More Information

- Setup instructions: [README.md](README.md)
- Technical details: [ARCHITECTURE.md](ARCHITECTURE.md)
- Development guide: [DEVELOPMENT.md](DEVELOPMENT.md)

