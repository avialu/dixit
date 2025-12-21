# 🎮 Flow Test Mode - Guide

## What is Flow Test Mode?

Flow Test Mode is an interactive demo where you can **play through the entire game** as if there are 3 players:
- **You (Alice)** - The human player you control
- **Bob (AI)** - Automated player
- **Charlie (AI)** - Automated player

You'll play through all phases of the game, and AI players will automatically respond to keep the game flowing!

---

## How to Access

1. Navigate to `/demo` in your browser
2. Click **"🎮 Flow Test (Play with AI)"** button at the top
3. Start playing!

---

## How It Works

### 🎭 When You're the Storyteller

1. **STORYTELLER_CHOICE Phase**:
   - Select a card from your hand
   - Type a clue in the text input
   - Click "Submit Card & Clue"
   - AI players will automatically submit their cards
   - Game advances to VOTING phase

### 👥 When You're a Player (Not Storyteller)

1. **PLAYERS_CHOICE Phase**:
   - Select a card from your hand that matches the clue
   - Click "Submit Card"
   - AI players will automatically submit their cards
   - Game advances to VOTING phase

### 🗳️ Voting Phase (All Players Except Storyteller)

1. **VOTING Phase**:
   - View all submitted cards (shuffled, anonymous)
   - Select which card you think the storyteller played
   - Click "Vote"
   - AI players will automatically vote
   - Game advances to SCORING phase

### 🏆 Scoring Phase

1. **SCORING Phase**:
   - See the results: who voted for which card
   - View score changes for each player
   - Click "Next Round" to continue
   - The storyteller rotates to the next player

---

## Features

### 📊 Info Bar
At the top of the screen, you'll see:
- **Round number**: Current round
- **Storyteller**: Who is the storyteller this round
- **Phase**: Current game phase
- **Scores**: Live scores for all 3 players

### 🔄 Storyteller Rotation
The storyteller role rotates each round:
- Round 1: You (Alice)
- Round 2: Bob (AI)
- Round 3: Charlie (AI)
- Round 4: You (Alice) again
- ...and so on

### 🤖 AI Behavior
- **Card Submission**: AI players submit random cards
- **Voting**: AI players vote intelligently (sometimes correctly guessing the storyteller's card, sometimes choosing other cards)
- **Automatic Delays**: AI actions happen after realistic delays (1-2 seconds)

### 🎯 Scoring Logic
The game uses real Dixit scoring rules:
- If **everyone** or **no one** guesses the storyteller's card: Storyteller gets 0, others get 2
- If **some** guess correctly: Storyteller and correct guessers get 3 points
- Players get 1 point for each vote on their card (except storyteller's card)

### 🏁 Game End
The game ends when any player reaches **30 points**, showing the final scores and winner.

---

## Controls

### Mode Switching
- Click **"📱 Component View"** to switch back to the original demo (manual phase navigation)
- Click **"🎮 Flow Test (Play with AI)"** to return to flow test mode

### Game Controls
- **Reset Game**: Available at game end, resets scores and starts from round 1
- **New Deck**: Available at game end, same as reset

---

## Example Flow

### Round 1 (You are Storyteller)
1. ✅ Select card #3 from your hand
2. ✅ Type clue: "A peaceful morning"
3. ✅ Click "Submit Card & Clue"
4. ⏳ Wait for AI players to submit (automatic)
5. ✅ Phase changes to VOTING
6. ⏳ You don't vote (you're the storyteller)
7. ⏳ AI players vote (automatic)
8. ✅ Phase changes to SCORING
9. ✅ View results and scores
10. ✅ Click "Next Round"

### Round 2 (Bob is Storyteller, You are Player)
1. ✅ See Bob's clue displayed
2. ✅ Select a card from your hand that matches
3. ✅ Click "Submit Card"
4. ⏳ Wait for Charlie to submit (automatic)
5. ✅ Phase changes to VOTING
6. ✅ Look at all cards and guess which one Bob played
7. ✅ Click on a card and "Vote"
8. ⏳ Charlie votes (automatic)
9. ✅ Phase changes to SCORING
10. ✅ View results and scores
11. ✅ Click "Next Round"

### Continue playing until someone reaches 30 points!

---

## Tips

1. **Pay attention to who the storyteller is** - The info bar always shows this
2. **Read the clue carefully** when you're a player choosing a card
3. **Try to be creative** with your clues when you're the storyteller
4. **Watch the AI behavior** - You can see how realistic voting works
5. **Test different scenarios** - Sometimes AI guesses correctly, sometimes not

---

## Differences from Real Game

1. **AI is simplified** - Real players are more strategic
2. **Only 3 players** - Real game supports 3-6 players
3. **Same hand cards** - Your hand doesn't change (for demo purposes)
4. **No deck exhaustion** - Game only ends by score limit

---

## Switching Back to Component View

If you want to see individual components without the flow logic:
1. Click **"📱 Component View"** at the top
2. Use arrow keys (← →) or navigation buttons to browse phases
3. Toggle between Player/Admin/Spectator views

---

## Troubleshooting

**Problem**: AI players aren't responding  
**Solution**: Wait a moment (1-2 seconds), they have realistic delays

**Problem**: Can't vote for a card  
**Solution**: Make sure you're not the storyteller and haven't voted yet

**Problem**: Game feels stuck  
**Solution**: Switch to Component View and back, or refresh the page

---

## Technical Notes

- All data is **simulated locally** - no server calls
- State is managed in React (in-memory)
- Refreshing the page resets everything
- This is for **testing UI/UX flow only** - real game logic is on the server

---

Enjoy testing the game flow! 🎉

