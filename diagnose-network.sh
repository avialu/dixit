#!/bin/bash

# Dixit Network Diagnostic Script
# Run this to diagnose network connectivity issues

echo "======================================"
echo "🎮 DIXIT NETWORK DIAGNOSTICS"
echo "======================================"
echo ""

# 1. Check your IP address
echo "1️⃣  Your Computer's IP Address:"
echo "--------------------------------------"
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
if [ -z "$IP" ]; then
    echo "❌ Could not detect IP automatically"
    echo "Run: ifconfig | grep 'inet '"
else
    echo "✅ Your LAN IP: $IP"
fi
echo ""

# 2. Check if server is running
echo "2️⃣  Server Status:"
echo "--------------------------------------"
if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Server is running on port 3000"
    netstat -an | grep 3000 | grep LISTEN
else
    echo "❌ No server running on port 3000"
    echo "Start with: npm run build && npm start"
fi
echo ""

# 3. Check firewall
echo "3️⃣  Firewall Status:"
echo "--------------------------------------"
FIREWALL=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null)
echo "$FIREWALL"
echo ""

# 4. Test localhost connection
echo "4️⃣  Testing localhost connection:"
echo "--------------------------------------"
if curl -s --max-time 2 http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Server responds on localhost"
else
    echo "❌ Server not responding on localhost"
fi
echo ""

# 5. Test LAN IP connection (if IP was detected)
if [ ! -z "$IP" ]; then
    echo "5️⃣  Testing LAN IP connection:"
    echo "--------------------------------------"
    if curl -s --max-time 2 http://$IP:3000 >/dev/null 2>&1; then
        echo "✅ Server accessible via LAN IP: http://$IP:3000"
    else
        echo "⚠️  Could not connect to LAN IP (might be normal if testing from same machine)"
    fi
    echo ""
fi

# Summary
echo "======================================"
echo "📱 WHAT TO DO NEXT"
echo "======================================"
echo ""
if [ ! -z "$IP" ]; then
    echo "✅ Your game server URL: http://$IP:3000"
    echo ""
    echo "To join from another device:"
    echo "1. Make sure the device is on the SAME WiFi network"
    echo "2. Open a browser on that device"
    echo "3. Go to: http://$IP:3000"
    echo ""
    echo "Or scan this QR code (it should show in the game):"
    echo "http://$IP:3000"
else
    echo "Run this command to find your IP:"
    echo "  ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    echo ""
    echo "Then visit http://YOUR_IP:3000 from other devices"
fi
echo ""
echo "======================================"

