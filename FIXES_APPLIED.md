# Network Connectivity Fixes Applied

## Problem
The game could only be joined from `localhost`, not from other devices on the WiFi network.

## Root Cause
The server was not explicitly binding to `0.0.0.0` (all network interfaces). While Node.js sometimes defaults to listening on all interfaces, explicitly specifying `0.0.0.0` ensures the server accepts connections from any device on the network, not just localhost.

## Fixes Applied

### 1. Server Binding Fix
**File:** `server/src/index.ts`

**Changed:**
```typescript
httpServer.listen(PORT, () => {
  // ...
});
```

**To:**
```typescript
httpServer.listen(PORT, '0.0.0.0', () => {
  // ...
});
```

This explicitly tells the HTTP server to bind to all network interfaces, accepting connections from:
- localhost (127.0.0.1)
- LAN IP (e.g., 10.0.0.5)
- Any other network interface

### 2. Diagnostic Tools Added

**Created `diagnose-network.sh`:**
- Checks your LAN IP address
- Verifies server is running and listening
- Tests firewall status
- Provides actionable next steps

**Created `NETWORK_TROUBLESHOOTING.md`:**
- Comprehensive troubleshooting guide
- Common issues and solutions
- Platform-specific firewall instructions
- Router configuration tips

### 3. Documentation Updates
**Updated `README.md`:**
- Added quick setup section at the top
- Emphasized `npm run build && npm start` for LAN play
- Added troubleshooting section
- Clarified dev vs production modes

## How to Verify the Fix

1. **Rebuild and restart server:**
   ```bash
   npm run build
   npm start
   ```

2. **Run diagnostics:**
   ```bash
   ./diagnose-network.sh
   ```

3. **Check server is listening on all interfaces:**
   ```bash
   netstat -an | grep 3000 | grep LISTEN
   ```
   Should show: `*.3000` or `0.0.0.0:3000`

4. **From another device on the same WiFi:**
   - Open browser
   - Go to `http://YOUR_LAN_IP:3000`
   - Should see the Dixit game interface

## Current Status

✅ **Server Configuration:**
- Listening on: `0.0.0.0:3000` (all interfaces)
- Your LAN IP: `10.0.0.5`
- Firewall: Disabled

✅ **What Works:**
- Server responds on localhost
- Server is accessible from LAN IP
- Socket.IO configured with CORS for all origins

## Next Steps for Users

### For LAN Play:
```bash
npm run build
npm start
```

Then share the LAN URL (shown in server output) with other players.

### For Development:
```bash
npm run dev
```

Note: Dev mode only works on the host machine. For testing with multiple devices, use production mode.

## Additional Notes

### Why Dev Mode Doesn't Work for LAN Play
- Vite dev server runs on port 5174
- It proxies Socket.IO to localhost:3000
- The proxy only works on the development machine
- Other devices can't reach the Vite dev server

### Why Production Mode is Required
- Everything runs on port 3000
- Server binds to 0.0.0.0
- No proxy needed
- Direct connection from any device on the network

### Socket.IO CORS
The server already had proper CORS configuration:
```typescript
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
```

This allows Socket.IO connections from any origin, which is necessary for LAN play.

## Testing Checklist

- [x] Server binds to 0.0.0.0
- [x] Server shows correct LAN IP in output
- [x] Server responds on localhost
- [x] Firewall status checked
- [x] Diagnostic script created
- [x] Documentation updated
- [ ] Test from mobile device on same WiFi (requires user testing)
- [ ] Test from another computer on same WiFi (requires user testing)

## Known Limitations

1. **Sandbox Environment:**
   - Network interface detection (`os.networkInterfaces()`) may fail in sandboxed environments
   - Workaround: Manual IP configuration via `SERVER_URL` env variable

2. **Router Client Isolation:**
   - Some routers have "AP Isolation" enabled
   - This prevents devices from communicating with each other
   - Must be disabled in router settings

3. **Public WiFi/Guest Networks:**
   - Often have client isolation enabled for security
   - May not work on coffee shop/hotel WiFi
   - Best used on home networks

## If Still Not Working

Try these in order:

1. **Verify same network:**
   ```bash
   # On server machine
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On client device, check WiFi network name matches
   ```

2. **Test with curl from client device:**
   ```bash
   curl http://SERVER_IP:3000
   # Should return HTML, not "connection refused"
   ```

3. **Temporarily disable firewalls on both machines**

4. **Check router settings:**
   - Look for "AP Isolation", "Client Isolation", or "Device Isolation"
   - Disable if enabled

5. **Try different port:**
   ```bash
   PORT=8080 npm start
   ```

6. **Check if ISP is blocking:**
   - Some ISPs block incoming connections
   - Try using mobile hotspot as WiFi source to test

