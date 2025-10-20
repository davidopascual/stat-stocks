import { useEffect, useRef, useState, useCallback } from 'react';
import { Player } from '../types';
import { mockPlayers as frontendMockPlayers } from '../data/mockPlayers';

// Convert frontend mock players to backend Player type
const convertToBackendPlayer = (frontendPlayer: typeof frontendMockPlayers[0]): Player => ({
  id: frontendPlayer.id,
  name: frontendPlayer.name,
  team: frontendPlayer.team,
  position: frontendPlayer.position,
  stats: frontendPlayer.stats,
  currentPrice: frontendPlayer.currentPrice,
  bidPrice: frontendPlayer.currentPrice * 0.995, // 0.5% below market
  askPrice: frontendPlayer.currentPrice * 1.005, // 0.5% above market
  priceChange: frontendPlayer.priceChange,
  priceHistory: frontendPlayer.priceHistory,
  volume: frontendPlayer.volume,
  volatility: 0.25, // Default volatility
  availableShares: 10000 // Default available shares
});

const mockPlayers: Player[] = frontendMockPlayers.map(convertToBackendPlayer);

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

interface WebSocketMessage {
  type: 'INITIAL_DATA' | 'PRICE_UPDATE' | 'CIRCUIT_BREAKER';
  data: Player[] | { playerId: string; playerName: string; previousPrice: number; attemptedPrice: number; message: string; };
}

export const useWebSocket = () => {
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnecting = useRef(false);
  const isCleanClose = useRef(false);

  const disconnect = useCallback(() => {
    isCleanClose.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    
    isConnecting.current = false;
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    // Prevent multiple connection attempts
    if (isConnecting.current || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('🔄 Connection already in progress, skipping...');
      return;
    }

    // Don't reconnect if we've exceeded max attempts
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Please refresh the page.');
      return;
    }

    isConnecting.current = true;
    isCleanClose.current = false;

    try {
      console.log(`🔌 Connecting to WebSocket ${WS_URL}... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
      
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error('❌ WebSocket connection timeout');
          ws.close();
          isConnecting.current = false;
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        isConnecting.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'INITIAL_DATA' || message.type === 'PRICE_UPDATE') {
            if (Array.isArray(message.data)) {
              console.log(`📊 Received ${message.type} with ${message.data.length} players`);
              setPlayers(message.data);
            }
          } else if (message.type === 'CIRCUIT_BREAKER') {
            console.warn('🚨 Circuit breaker triggered:', message.data);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
        isConnecting.current = false;
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`🔌 WebSocket disconnected - Code: ${event.code}, Reason: ${event.reason || 'No reason'}`);
        setIsConnected(false);
        isConnecting.current = false;
        wsRef.current = null;

        // Only reconnect if it wasn't a clean close and we haven't exceeded max attempts
        if (!isCleanClose.current && event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000); // Exponential backoff, max 10s
          reconnectAttempts.current++;
          
          console.log(`🔄 Scheduling reconnection in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isCleanClose.current) {
              connect();
            }
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached. Please refresh the page.');
        }
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setIsConnected(false);
      isConnecting.current = false;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { players, isConnected, disconnect, reconnect: connect };
};
