# 🎨 Dixit - Local Multiplayer Card Game

A local-multiplayer implementation of the Dixit card game. Players join from their phones/laptops via browser on a home LAN network. No internet, no cloud, no accounts required.

## 🚀 Quick Setup for LAN Play

```bash
# 1. Install dependencies
npm install

# 2. Build and start the server
npm run build
npm start

# 3. The server will show your LAN URL (e.g., http://10.0.0.5:3000)
# 4. Players join from their devices using that URL

# Troubleshooting? Run:
./diagnose-network.sh
```

**Important:** For LAN play (multiple devices), use `npm run build && npm start`, NOT `npm run dev`!

## Features

- **Local Network Play**: One server, multiple devices on the same LAN
- **3+ Players**: Minimum 3 players required
- **Custom Deck**: Players upload their own images (100 minimum)
- **Real-time Gameplay**: Socket.IO for instant updates
- **Shared Display Support**: Optional board view for TVs/projectors
- **In-Memory Only**: All data stored in RAM, cleared on server restart

## Tech Stack

**Server:**

- Node.js + TypeScript
- Express
- Socket.IO
- Zod (validation)
- Vitest (tests)

**Client:**

- React + TypeScript
- Vite
- socket.io-client
- React Router
- QRCode generation

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies for both server and client workspaces.

### 2. Development Mode

```bash
npm run dev
```

This starts:

- Server on `http://localhost:3000`
- Client dev server with hot reload

**Note:** For development, the client runs on a separate port with proxy. For real LAN testing, use production mode.

### 3. Production Mode (LAN Play)

```bash
npm run build
npm start
```

The server will print:

```
=================================
🎮 DIXIT GAME SERVER RUNNING
=================================

Local: http://localhost:3000
LAN:   http://192.168.1.100:3000

📱 Players can join from their phones using the LAN URL

=================================
```

**Use the LAN URL** (not localhost) to join from other devices.

**Manual IP Configuration (if auto-detection fails):**

If the server can't detect your LAN IP automatically, you can set it manually:

```bash
# Find your IP first
# macOS/Linux:
ifconfig | grep "inet "
# Windows:
ipconfig

# Then start with the IP
SERVER_URL=http://YOUR_IP:3000 npm start
```

## How to Play

### Setup Phase

1. **Host starts server** on their computer
2. **Players join** by visiting the LAN URL on their phones/laptops
3. **First player** becomes admin (shows 👑)
4. **Upload images** (100 minimum, 20 max per player)
   - Images auto-resize to 1024px max dimension
   - Compressed to ~500KB
5. **Admin starts game** when ready

### Game Flow

**Each Round:**

1. **Storyteller Phase**

   - Storyteller (📖) chooses a card from their hand
   - Gives a text clue

2. **Players Choice**

   - Other players choose a card that matches the clue

3. **Reveal**

   - All submitted cards are shuffled and numbered

4. **Voting**

   - Players vote for which card they think is the storyteller's
   - Cannot vote for own card
   - Storyteller doesn't vote

5. **Scoring**

   - If all or none guess correctly: storyteller gets 0, others get +2
   - Otherwise: storyteller +3, correct guessers +3
   - Each player gets +1 per vote their card received

6. **Next Round**
   - Players draw back to 6 cards
   - Storyteller rotates clockwise

### Deck Modes

- **MIXED** (default): Host and players can upload
- **HOST_ONLY**: Only admin can upload images
- **PLAYERS_ONLY**: Only non-admin players can upload

### Admin Controls

- Set deck mode
- Lock deck (prevents further uploads/deletes)
- Start game
- Reset game (keeps deck, resets scores)
- New deck (clears everything)

## Optional: Shared Display (Board View)

Open `/board` on a TV or projector for a shared view showing:

- Current phase
- Clue
- Revealed cards
- Scoreboard
- Vote counts

Players still use their own devices for private actions (choosing cards, voting).

## Finding Your LAN IP Address

### macOS/Linux

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Windows

```cmd
ipconfig | findstr IPv4
```

### Or Let the Server Tell You

## 🔧 Troubleshooting Network Issues

### Can't Join from Other Devices?

**Run the diagnostic script:**

```bash
./diagnose-network.sh
```

This will check:

- ✅ Your LAN IP address
- ✅ Server is running and listening on all interfaces
- ✅ Firewall status
- ✅ Network connectivity

### Common Issues

**1. Wrong Mode**

- ❌ `npm run dev` - Only works on localhost
- ✅ `npm run build && npm start` - Required for LAN play

**2. Different WiFi Networks**

- Make sure all devices are on the SAME WiFi network
- Check you're not on guest network or cellular data

**3. Firewall Blocking**

- **macOS:** System Preferences → Security & Privacy → Firewall
  - Allow Node.js or disable firewall temporarily
- **Windows:** Windows Defender → Allow an app → Add Node.js
- **Linux:** `sudo ufw allow 3000/tcp`

**4. IP Address Wrong**

- Get your current IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Manual override: `SERVER_URL=http://YOUR_IP:3000 npm start`

**5. Router Client Isolation**

- Some routers block device-to-device communication
- Check router settings for "AP Isolation" or "Client Isolation"
- Disable this feature if enabled

See [NETWORK_TROUBLESHOOTING.md](./NETWORK_TROUBLESHOOTING.md) for detailed diagnostics.

### Or Let the Server Tell You

The server automatically detects and prints your LAN IP on startup.

## Game Rules Summary

- **Players:** 3+ required
- **Hand Size:** 6 cards per player
- **Deck:** 100 images minimum to start
- **Phases:** Storyteller → Players Choice → Reveal → Voting → Scoring
- **Win Condition:** Game ends when deck runs out (highest score wins)

## Architecture

```
/dixit/
├── package.json          # Workspace root
├── server/               # Node.js server
│   ├── src/
│   │   ├── game/        # Game logic (DeckManager, GameManager, ScoringEngine)
│   │   ├── utils/       # Network utils, validation
│   │   └── server.ts    # Express + Socket.IO setup
│   └── __tests__/       # Unit tests
└── client/              # React client
    ├── src/
    │   ├── pages/       # JoinPage, LobbyPage, GamePage, BoardPage
    │   ├── components/  # Reusable UI components
    │   ├── hooks/       # useSocket, useGameState
    │   └── utils/       # Image compression
    └── public/          # Built by Vite
```

## Testing

Run server unit tests:

```bash
npm test
```

Tests cover:

- Scoring logic (all edge cases)
- Deck management (modes, limits, uploads)
- Game state machine (phase transitions, validations)

## Known Limitations

### By Design

- **No persistence**: All data lost when server stops (intentional)
- **Single session**: One game room per server instance
- **No reconnection recovery**: Refresh works, but mid-game disconnects show as disconnected
- **No undo**: Actions are final

### Technical

- **Image storage**: All images in RAM (plan for ~100MB+ depending on deck size)
- **Concurrent games**: Not supported (single room only)
- **Browser compatibility**: Modern browsers only (tested on Chrome, Safari, Firefox)

## Troubleshooting

### Players Can't Join

1. **Check firewall**: Allow port 3000 (or custom PORT)
2. **Same network**: All devices must be on same WiFi/LAN
3. **Use LAN IP**: Don't use `localhost` from other devices
4. **Check IP**: Run `ifconfig` or `ipconfig` to verify IP address

### Server Won't Start

```bash
# Kill existing process on port 3000
lsof -ti:3000 | xargs kill
# Or use different port
PORT=3001 npm start
```

### Images Not Uploading

- Check file size (max 10MB before compression)
- Only image files accepted
- Max 20 images per player
- Deck must not be locked

### Game Stuck in Phase

- Admin can use "Reset Game" to restart
- Check browser console for errors
- Refresh page to reconnect

## Development

### Project Structure

- **Monorepo** with npm workspaces
- **Server**: `npm run dev -w server`
- **Client**: `npm run dev -w client`
- **Tests**: `npm test -w server`

### Adding Features

1. Server logic goes in `server/src/game/`
2. Add tests in `server/src/__tests__/`
3. Update socket events in `server/src/server.ts`
4. Add client UI in `client/src/`

### State Management

- **Server**: Authoritative game state in `GameManager`
- **Client**: Socket events update React state via hooks
- **Validation**: Zod schemas validate all socket payloads

## License

MIT

## Credits

Inspired by the board game Dixit by Jean-Louis Roubira.

---

**Built for local play with friends and family. Have fun! 🎨**
