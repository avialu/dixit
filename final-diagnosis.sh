#!/bin/bash

echo "========================================="
echo "🔍 FINAL NETWORK DIAGNOSIS"
echo "========================================="
echo ""

# Get IP
IP=$(ifconfig en0 2>/dev/null | grep "inet " | grep -v 127 | awk '{print $2}')

if [ -z "$IP" ]; then
    echo "❌ Could not find IP on en0"
    echo "Trying all interfaces..."
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
fi

echo "📍 Your LAN IP: $IP"
echo ""

# Check if server is running
echo "🖥️  Server Status:"
if lsof -i :3000 -n -P 2>/dev/null | grep -q LISTEN; then
    echo "   ✅ Server is running on port 3000"
    LISTEN=$(lsof -i :3000 -n -P 2>/dev/null | grep LISTEN | awk '{print $9}')
    echo "   ✅ Listening on: $LISTEN"
else
    echo "   ❌ Server is NOT running"
    echo "   Run: npm run build && npm start"
    exit 1
fi
echo ""

# Test localhost
echo "🔌 Connectivity Tests:"
if curl -s --max-time 2 http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ localhost:3000 - Working"
else
    echo "   ❌ localhost:3000 - Failed"
fi

if curl -s --max-time 2 http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo "   ✅ 127.0.0.1:3000 - Working"
else
    echo "   ❌ 127.0.0.1:3000 - Failed"
fi

# Test LAN IP (this will likely fail on macOS)
if curl -s --max-time 2 http://$IP:3000 > /dev/null 2>&1; then
    echo "   ✅ $IP:3000 - Working (Surprising!)"
else
    echo "   ⚠️  $IP:3000 - Timeout (EXPECTED on macOS)"
fi
echo ""

# Check routing
echo "🛣️  Routing Information:"
ROUTE=$(netstat -rn 2>/dev/null | grep "^$IP" | head -1)
if echo "$ROUTE" | grep -q "lo0"; then
    echo "   ⚠️  Your IP routes through loopback (lo0)"
    echo "   This is why you can't connect to your own LAN IP"
    echo "   THIS IS NORMAL - Other devices should still work!"
else
    echo "   ✅ Routing looks normal"
fi
echo ""

# Firewall
echo "🔥 Firewall Status:"
FW=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null)
echo "   $FW"

# Check if Node is allowed
NODE_PATH=$(which node)
if [ ! -z "$NODE_PATH" ]; then
    NODE_STATUS=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getappblocked "$NODE_PATH" 2>/dev/null)
    echo "   $NODE_STATUS"
fi
echo ""

echo "========================================="
echo "📱 TESTING FROM ANOTHER DEVICE"
echo "========================================="
echo ""
echo "⚠️  IMPORTANT: You CANNOT test from this Mac!"
echo ""
echo "macOS prevents connecting to your own external IP."
echo "This is NORMAL and does NOT mean other devices"
echo "can't connect."
echo ""
echo "To properly test:"
echo ""
echo "1. Grab your phone or another computer"
echo "2. Make sure it's on the SAME WiFi network"
echo "   WiFi name: $(/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I 2>/dev/null | grep ' SSID' | awk '{print $2}')"
echo "3. Open a web browser"
echo "4. Go to: http://$IP:3000"
echo ""
echo "If you see the Dixit game, it's working!"
echo ""
echo "If you get an error, possible issues:"
echo "  - Different WiFi network"
echo "  - Router has client isolation enabled"
echo "  - Port 3000 is blocked"
echo ""
echo "========================================="
echo ""
echo "📋 Quick Troubleshooting:"
echo ""
echo "Router client isolation:"
echo "  - Log into router (usually 10.0.0.1 or 192.168.1.1)"
echo "  - Find 'AP Isolation' or 'Client Isolation'"
echo "  - Disable it"
echo ""
echo "Try different port:"
echo "  PORT=8080 npm run build && PORT=8080 npm start"
echo "  Then try: http://$IP:8080"
echo ""
echo "========================================="

