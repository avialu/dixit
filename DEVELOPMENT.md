# Development Guide

This guide covers everything you need to know for developing the Dixit game.

## Table of Contents

- [Setup for Development](#setup-for-development)
- [Running the Project](#running-the-project)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Code Quality Standards](#code-quality-standards)
- [Debugging Tips](#debugging-tips)
- [Network Testing](#network-testing)
- [Common Issues](#common-issues)

## Setup for Development

### Prerequisites

- Node.js 18+ (for native fetch, crypto)
- npm 8+
- Modern browser (Chrome, Firefox, Safari, Edge)

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd dixit

# Install all dependencies (server + client)
npm install

# Verify installation
npm run build
```

## Running the Project

### Development Mode

**For active development with hot reload:**

```bash
npm run dev
```

This starts:
- Server on `http://localhost:3000`
- Client dev server with hot reload on `http://localhost:5174`
- Automatic recompilation on file changes

**Note:** Dev mode only works on localhost. For LAN testing, use production mode.

### Production Mode

**For LAN play testing:**

```bash
npm run build
npm start
```

The server will display:
```
=================================
🎮 DIXIT GAME SERVER RUNNING
=================================

Local: http://localhost:3000
LAN:   http://192.168.1.100:3000
```

Use the LAN URL to join from other devices on the same network.

### Individual Workspace Commands

```bash
# Server only
cd server
npm run dev        # Development with auto-reload
npm run build      # Compile TypeScript
npm run start      # Run compiled server
npm test           # Run tests (exits after)
npm run test:watch # Run tests in watch mode

# Client only
cd client
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
```

## Testing

### Running Tests

```bash
# From project root
npm test

# From server directory
cd server
npm test           # Run once and exit
npm run test:watch # Watch mode for development
```

### Test Structure

```
server/src/__tests__/
├── DeckManager.test.ts           # Deck management unit tests
├── GameManager.test.ts           # Game logic unit tests
├── ScoringEngine.test.ts         # Scoring calculation tests
└── integration/
    └── game-flow.test.ts         # Full game flow integration tests
```

### Writing Tests

**Unit Tests:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../game/GameManager.js';

describe('GameManager', () => {
  let gameManager: GameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  it('should add first player as admin', () => {
    const player = gameManager.addPlayer('Alice', 'client-1');
    expect(player.isAdmin).toBe(true);
  });
});
```

**Integration Tests:**
- Test complete game flows (join → upload → play → score)
- Simulate multiple players
- Verify state transitions
- Check error handling

### Test Requirements

Before committing:
- ✅ All tests passing: `npm test`
- ✅ Client builds: `cd client && npm run build`
- ✅ No TypeScript errors
- ✅ No linter warnings

## Building for Production

### Full Build

```bash
# From project root
npm run build
```

This builds both server and client workspaces.

### What Gets Built

**Server (`server/dist/`):**
- TypeScript compiled to JavaScript
- Source maps for debugging
- All dependencies bundled

**Client (`server/public/`):**
- Optimized React bundle
- Minified CSS
- Compressed assets
- Client is served from server/public/

### Build Verification

```bash
# Build and test
npm run build
npm start

# Should see:
# - Server starts successfully
# - Can access http://localhost:3000
# - Game loads without errors
```

## Code Quality Standards

### Critical Workflow

**Before ANY code changes:**
1. Read and understand relevant code
2. Run tests to establish baseline
3. Check for linter errors
4. Verify imports resolve

**After ANY code changes:**
1. Run linter on modified files
2. Build client: `cd client && npm run build`
3. Test in browser if UI changes
4. Verify no regressions

**If build fails:**
- ❌ STOP - Do not proceed
- 🔍 Fix TypeScript/build errors immediately
- ✅ Verify fix with another build
- 📝 Document what broke and how you fixed it

### TypeScript Standards

```typescript
// ✅ GOOD - Explicit types
interface ButtonProps {
  variant: "primary" | "secondary";
  onClick: () => void;
  children: ReactNode;
}

// ❌ BAD - Any types
function doSomething(data: any) {}
```

### React Best Practices

```typescript
// ✅ GOOD - Memoize expensive calculations
const sortedList = useMemo(
  () => data.sort((a, b) => a.score - b.score),
  [data]
);

// ✅ GOOD - Stable callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// ❌ BAD - Hooks in conditions
if (condition) {
  useEffect(() => {}, []);
}
```

## Debugging Tips

### Server Debugging

**Check logs:**
```bash
# Server logs show structured data
[2025-12-23T21:45:21.152Z] INFO: Player joined as admin
  Context: {
  "name": "Alice",
  "clientId": "player1"
}
```

**Debug Socket.IO:**
```typescript
// server/src/server.ts
socket.on("someEvent", (data) => {
  console.log("Received:", data);
  // Process...
});
```

### Client Debugging

**Browser console:**
```javascript
// Check socket connection
console.log("Socket connected:", socket.id);

// Check state
console.log("Room state:", roomState);
console.log("Player state:", playerState);
```

**React DevTools:**
- Install React DevTools extension
- Inspect component props/state
- Profile performance

### Common Debug Scenarios

**State not updating:**
- Check if server is emitting events
- Verify socket listeners are set up
- Check React dependencies in useEffect

**Socket disconnects:**
- Check network connectivity
- Verify server is running
- Check for rate limiting

**Images not loading:**
- Check base64 format is valid
- Verify compression didn't corrupt data
- Check browser console for errors

## Network Testing

### Testing on Same Machine

```bash
# Verify server is running
curl http://localhost:3000

# Check server is listening on all interfaces
lsof -i :3000 -n -P | grep LISTEN
# Expected: *:3000 or 0.0.0.0:3000

# Get your IP address
ifconfig en0 | grep "inet " | grep -v 127
# On Windows: ipconfig
```

### Testing from Other Devices

**Important:** macOS may not allow connecting to its own LAN IP. This is normal! Test from a different device.

**From phone or another computer:**
1. Ensure device is on **same WiFi network**
2. Open browser
3. Navigate to `http://YOUR_IP:3000`
4. You should see the game interface

### Troubleshooting Network Issues

**Can't connect from other devices:**

1. **Check firewall:**
   - macOS: System Preferences → Security & Privacy → Firewall
   - Allow Node.js through firewall

2. **Verify both devices on same network:**
   - Not cellular data
   - Not guest network
   - Same WiFi SSID

3. **Check router settings:**
   - Disable "AP Isolation" or "Client Isolation"
   - Restart router if needed

4. **Try different port:**
   ```bash
   PORT=8080 npm run build && PORT=8080 npm start
   ```

5. **Test with mobile hotspot:**
   - Connect computer to phone's hotspot
   - Connect other device to same hotspot
   - If this works, it's a router issue

### Manual IP Configuration

If auto-detection fails:

```bash
# Set your LAN IP manually
SERVER_URL=http://10.0.0.5:3000 npm start
```

## Common Issues

### Build Errors

**"Cannot find module"**
- Run `npm install` in the workspace
- Check import paths use `.js` extension (required for ES modules)
- Verify file exists

**TypeScript errors**
- Check type imports: `import type { Foo } from '...'`
- Verify all required properties are provided
- Check for null/undefined handling

### Runtime Errors

**Socket.IO not connecting**
- Verify server is running
- Check CORS settings
- Ensure client URL matches server URL

**State not syncing**
- Check socket listeners are set up in useEffect
- Verify cleanup functions remove listeners
- Check for timing issues (race conditions)

**Images not uploading**
- Check file size < 10MB
- Verify format is JPEG, PNG, WebP, or GIF
- Check compression is working

### Performance Issues

**Slow image upload**
- Compression happens client-side (~100-500ms per image)
- Batch upload to show progress

**Lag during gameplay**
- Check network latency
- Verify no memory leaks (check browser DevTools)
- Profile React renders

## Environment Variables

Configure behavior with environment variables:

```bash
# Server Configuration
PORT=3000                           # Server port
SERVER_URL=http://10.0.0.5:3000   # Override auto-detection

# Game Configuration
MIN_PLAYERS=3                       # Minimum players to start
MAX_PLAYERS=10                      # Maximum players
MIN_DECK_SIZE=100                   # Minimum images required
MAX_DECK_SIZE=500                   # Maximum deck size
MAX_IMAGES_PER_PLAYER=200          # Per-player upload limit

# Image Configuration
MAX_IMAGE_SIZE=10485760            # 10MB in bytes
MAX_IMAGE_DIMENSION=1024           # Max width/height

# Rate Limiting
API_RATE_LIMIT=100                 # Max API requests per window
SOCKET_RATE_LIMIT=50               # Max socket events per window

# Feature Flags
ENABLE_DEFAULT_IMAGES=true         # Load default images if needed
ENABLE_PERIODIC_CLEANUP=true       # Clean up disconnected players
ENABLE_DETAILED_LOGS=false         # Verbose logging
```

## Project Structure

```
dixit/
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── game/          # Core game logic
│   │   │   ├── GameManager.ts
│   │   │   ├── DeckManager.ts
│   │   │   ├── ScoringEngine.ts
│   │   │   └── types.ts
│   │   ├── config/        # Configuration
│   │   │   └── index.ts
│   │   ├── utils/         # Utilities
│   │   │   ├── errors.ts
│   │   │   ├── logger.ts
│   │   │   └── validation.ts
│   │   ├── __tests__/     # Tests
│   │   ├── server.ts      # Socket.IO server
│   │   └── index.ts       # Entry point
│   ├── dist/              # Compiled output
│   └── public/            # Client build output
│
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # React components
│   │   │   └── ui/        # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Client utilities
│   │   └── styles/        # Global styles
│   └── dist/              # Build output
│
├── .cursorrules           # AI assistant guidelines
├── README.md              # User-facing documentation
├── DEVELOPMENT.md         # This file
├── GAME_RULES.md          # Gameplay documentation
├── ARCHITECTURE.md        # System design
└── CONTRIBUTING.md        # Contribution guidelines
```

## Getting Help

- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- See [GAME_RULES.md](GAME_RULES.md) for gameplay mechanics
- Review [.cursorrules](.cursorrules) for coding standards
- Read [CONTRIBUTING.md](CONTRIBUTING.md) for PR guidelines

