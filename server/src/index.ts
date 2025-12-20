import { createApp } from "./server.js";
import { getLanIpAddress } from "./utils/network.js";

const PORT = Number(process.env.PORT || 3000);

const { httpServer } = createApp(PORT);

// Listen on all interfaces (default behavior when host is omitted)
httpServer.listen(PORT, () => {
  const lanIp = getLanIpAddress();

  console.log("\n=================================");
  console.log("🎮 DIXIT GAME SERVER RUNNING");
  console.log("=================================\n");
  console.log(`Local: http://localhost:${PORT}`);

  if (lanIp) {
    console.log(`LAN:   http://${lanIp}:${PORT}`);
    console.log("\n📱 Players can join from their phones using the LAN URL");
    console.log("   (Server listening on all network interfaces)");
  } else {
    console.log("\n⚠️  Could not auto-detect LAN IP address");
    console.log("   Find your IP manually:");
    console.log('   - macOS/Linux: ifconfig | grep "inet "');
    console.log("   - Windows: ipconfig");
    console.log(`   - Then set: SERVER_URL=http://YOUR_IP:${PORT} npm start`);
  }

  console.log("\n=================================\n");
});
