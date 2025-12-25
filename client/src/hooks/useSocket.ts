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

// Latency thresholds for connection quality indicator
export const LATENCY_THRESHOLDS = {
  GOOD: 100,     // < 100ms = good (green)
  MEDIUM: 300,   // 100-300ms = medium (yellow)
  // > 300ms = poor (red)
};

// Ping interval for latency measurement
const PING_INTERVAL = 5000; // 5 seconds

// Get or create clientId outside component to persist
let clientId = storage.clientId.get();
if (!clientId) {
  clientId = nanoid();
  storage.clientId.set(clientId);
}

export type ConnectionQuality = 'good' | 'medium' | 'poor' | 'unknown';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [needsManualReconnect, setNeedsManualReconnect] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFailures = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingStartTimeRef = useRef<number | null>(null);

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
      setIsReconnecting(false);
      setNeedsManualReconnect(false);
      reconnectAttempts.current = 0; // Reset attempts on successful connection
      consecutiveFailures.current = 0; // Reset failure count
      
      // Auto-reconnect: register this socket with existing clientId
      // Only attempt reconnect if the player has actually joined before
      if (clientId && storage.hasJoined.get()) {
        console.log('Auto-reconnecting with clientId:', clientId);
        newSocket.emit('reconnect', { clientId });
      }

      // Start latency measurement
      const measureLatency = () => {
        if (newSocket.connected) {
          pingStartTimeRef.current = Date.now();
          newSocket.volatile.emit('clientPing'); // volatile = drop if can't send
        }
      };

      // Clear any existing interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      // Measure immediately and then every PING_INTERVAL
      measureLatency();
      pingIntervalRef.current = setInterval(measureLatency, PING_INTERVAL);
    });

    // Listen for pong response to calculate latency
    newSocket.on('clientPong', () => {
      if (pingStartTimeRef.current) {
        const rtt = Date.now() - pingStartTimeRef.current;
        setLatency(rtt);
        pingStartTimeRef.current = null;
      }
    });

    newSocket.on('reconnectSuccess', (data: { playerId: string }) => {
      console.log('Reconnect successful for:', data.playerId);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setIsConnected(false);
      setIsReconnecting(true);
      
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
          setIsReconnecting(false);
          setNeedsManualReconnect(true);
        }
      }
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      consecutiveFailures.current++;
      
      // After 3 consecutive failures, require manual reconnect
      if (consecutiveFailures.current >= 3) {
        console.error('Multiple connection failures - manual reconnect required');
        setIsReconnecting(false);
        setNeedsManualReconnect(true);
        // Stop automatic reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }
    });

    setSocket(newSocket);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      newSocket.disconnect();
    };
  }, []);

  const manualReconnect = () => {
    if (socket) {
      console.log('Manual reconnect triggered');
      consecutiveFailures.current = 0;
      reconnectAttempts.current = 0;
      setNeedsManualReconnect(false);
      setIsReconnecting(true);
      socket.connect();
    }
  };

  // Calculate connection quality based on latency
  const getConnectionQuality = (): ConnectionQuality => {
    if (!isConnected || latency === null) return 'unknown';
    if (latency < LATENCY_THRESHOLDS.GOOD) return 'good';
    if (latency < LATENCY_THRESHOLDS.MEDIUM) return 'medium';
    return 'poor';
  };

  return {
    socket,
    clientId: clientId!,
    isConnected,
    isReconnecting,
    needsManualReconnect,
    manualReconnect,
    getClientId: () => clientId!,
    getSocket: () => socket,
    latency,
    connectionQuality: getConnectionQuality(),
  };
}

