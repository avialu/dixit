import { networkInterfaces } from 'os';

export function getLanIpAddress(): string | null {
  try {
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      const interfaces = nets[name];
      if (!interfaces) continue;
      
      for (const net of interfaces) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    
    return null;
  } catch (error) {
    // Handle sandbox or permission errors gracefully
    console.warn('Could not detect LAN IP address:', error);
    return null;
  }
}

