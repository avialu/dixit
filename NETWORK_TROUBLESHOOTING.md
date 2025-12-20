# Network Troubleshooting Guide

## Quick Checklist

When you can only join from localhost but not from other devices on WiFi, follow these steps:

### 1. Verify Server is Running

```bash
npm run build
npm start
```

Look for the output showing your LAN IP:

```
Local: http://localhost:3000
LAN:   http://10.0.0.5:3000
```

### 2. Find Your Computer's IP Address

**macOS/Linux:**

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**

```cmd
ipconfig
```

Look for the IPv4 address on your WiFi adapter (usually starts with 192.168.x.x or 10.0.x.x)

### 3. Test Network Connectivity

From another device on the same WiFi network:

**Test basic connectivity (from your phone or another computer):**

- Visit `http://YOUR_IP:3000` in a browser
- You should see the Dixit game interface

**Check if port 3000 is accessible:**

```bash
# From another computer on the same network
curl http://YOUR_IP:3000
# Should return the HTML page
```

### 4. Check Firewall Settings

**macOS:**

1. System Preferences → Security & Privacy → Firewall
2. If firewall is on, click "Firewall Options"
3. Make sure Node.js is allowed, or temporarily disable firewall for testing

**Windows:**

1. Windows Defender Firewall → Allow an app
2. Make sure Node.js is allowed for both Private and Public networks

**Linux:**

```bash
# Check if firewall is blocking port 3000
sudo ufw status
sudo ufw allow 3000/tcp
```

### 5. Verify Both Devices Are on Same Network

- Computer running server: Check WiFi network name
- Phone/device joining: Make sure it's on the SAME WiFi network
- **Not** on cellular data or guest network

### 6. Common Issues

#### Issue: "Server listening on 0.0.0.0" not shown

**Fix:** Make sure you're running the latest version with the binding fix applied.

#### Issue: Can connect on localhost but not LAN IP

**Cause:** Firewall blocking incoming connections
**Fix:** Allow Node.js through firewall (see step 4)

#### Issue: Connection refused or timeout

**Causes:**

1. Server not running
2. Wrong IP address
3. Firewall blocking
4. Different WiFi networks

#### Issue: QR code shows localhost instead of LAN IP

**Cause:** Server couldn't detect LAN IP
**Fix:** Manually set SERVER_URL:

```bash
SERVER_URL=http://YOUR_IP:3000 npm start
```

### 7. Manual IP Override

If auto-detection fails:

```bash
# Set your server's LAN IP manually
SERVER_URL=http://10.0.0.5:3000 npm start
```

Replace `10.0.0.5` with your actual LAN IP.

### 8. Development Mode Notes

**For development (`npm run dev`):**

- Vite runs on port 5174
- Server runs on port 3000
- Vite proxies Socket.IO to localhost:3000
- **This only works on the development machine**
- Other devices cannot join in dev mode

**For LAN play (production):**

```bash
npm run build
npm start
```

- Everything runs on port 3000
- Server binds to 0.0.0.0
- Other devices can join via LAN IP

### 9. Test Socket.IO Connection

Open browser console on the client device and check for:

- ✅ "Connected to server: xxxxx" - Good!
- ❌ Connection errors - Check firewall/network

### 10. Advanced Diagnostics

**Check if server is listening on all interfaces:**

```bash
# macOS/Linux
netstat -an | grep 3000
# Should show: *.3000 or 0.0.0.0:3000

# Windows
netstat -an | findstr 3000
```

**Test with curl:**

```bash
# From another device on network
curl -v http://YOUR_IP:3000/socket.io/
# Should get a response (not connection refused)
```

## Quick Fix Script

Run this on macOS to quickly diagnose:

```bash
echo "=== Network Diagnostics ==="
echo ""
echo "Your IP addresses:"
ifconfig | grep "inet " | grep -v 127.0.0.1
echo ""
echo "Checking if port 3000 is open:"
lsof -i :3000 || echo "Nothing listening on port 3000"
echo ""
echo "If server is running, test from another device:"
echo "curl http://$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'):3000"
```

## Still Not Working?

1. Restart server with: `npm run build && npm start`
2. Restart your WiFi router
3. Try disabling firewall temporarily for testing
4. Make sure both devices are on 2.4GHz or 5GHz band (some routers isolate these)
5. Check if your network has client isolation enabled (common on guest networks)
