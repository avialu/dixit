import { createApp } from './server.js';
import { getLanIpAddress } from './utils/network.js';

const PORT = Number(process.env.PORT || 3000);

const { httpServer } = createApp(PORT);

httpServer.listen(PORT, () => {
  const lanIp = getLanIpAddress();
  
  console.log('\n=================================');
  console.log('🎮 DIXIT GAME SERVER RUNNING');
  console.log('=================================\n');
  console.log(`Local: http://localhost:${PORT}`);
  
  if (lanIp) {
    console.log(`LAN:   http://${lanIp}:${PORT}`);
    console.log('\n📱 Players can join from their phones using the LAN URL');
  } else {
    console.log('\n⚠️  Could not detect LAN IP address');
    console.log('   Find your IP manually and share: http://YOUR_IP:' + PORT);
  }
  
  console.log('\n=================================\n');
});

