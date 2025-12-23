import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { nanoid } from 'nanoid';
import { storage } from '../utils/storage';

const SOCKET_URL = window.location.origin;

// Reconnection configuration
const RECONNECTION_CONFIG = {
  MAX_RETRIES: 5,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  BACKOFF_MULTIPLIER: 2,
};

// Get or create clientId outside component to persist
let clientId = storage.clientId.get();
if (!clientId) {
  clientId = nanoid();
  storage.clientId.set(clientId);
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Connect to socket with reconnection disabled (we'll handle it manually)
    const newSocket = io(SOCKET_URL, {
      reconnection: true, // Let Socket.IO handle basic reconnection
      reconnectionAttempts: RECONNECTION_CONFIG.MAX_RETRIES,
      reconnectionDelay: RECONNECTION_CONFIG.INITIAL_DELAY,
      reconnectionDelayMax: RECONNECTION_CONFIG.MAX_DELAY,
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset attempts on successful connection
      
      // Auto-reconnect: register this socket with existing clientId
      // Only attempt reconnect if the player has actually joined before
      if (clientId && storage.hasJoined.get()) {
        console.log('Auto-reconnecting with clientId:', clientId);
        newSocket.emit('reconnect', { clientId });
      }
    });

    newSocket.on('reconnectSuccess', (data: { playerId: string }) => {
      console.log('Reconnect successful for:', data.playerId);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
      
      // If server disconnected us or transport closed, try to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current <= RECONNECTION_CONFIG.MAX_RETRIES) {
          const delay = Math.min(
            RECONNECTION_CONFIG.INITIAL_DELAY * Math.pow(RECONNECTION_CONFIG.BACKOFF_MULTIPLIER, reconnectAttempts.current - 1),
            RECONNECTION_CONFIG.MAX_DELAY
          );
          
          console.log(`Attempting reconnection ${reconnectAttempts.current}/${RECONNECTION_CONFIG.MAX_RETRIES} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            newSocket.connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      }
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      newSocket.disconnect();
    };
  }, []);

  return {
    socket,
    clientId: clientId!,
    isConnected,
    getClientId: () => clientId!,
    getSocket: () => socket,
  };
}

