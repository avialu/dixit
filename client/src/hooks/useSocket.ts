import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { nanoid } from 'nanoid';

const SOCKET_URL = window.location.origin;

// Get or create clientId outside component to persist
let clientId = localStorage.getItem('dixit-clientId');
if (!clientId) {
  clientId = nanoid();
  localStorage.setItem('dixit-clientId', clientId);
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to socket
    const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      
      // Auto-reconnect: register this socket with existing clientId
      if (clientId) {
        console.log('Auto-reconnecting with clientId:', clientId);
        newSocket.emit('reconnect', { clientId });
      }
    });

    newSocket.on('reconnectSuccess', (data: { playerId: string }) => {
      console.log('Reconnect successful for:', data.playerId);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return {
    socket,
    clientId: clientId!,
    getClientId: () => clientId!,
    getSocket: () => socket,
  };
}

