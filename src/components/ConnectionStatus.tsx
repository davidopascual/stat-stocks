import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const ConnectionStatus: React.FC = () => {
  const { players, isConnected } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    if (players.length > 0) {
      setLastUpdate(new Date());
      setPlayerCount(players.length);
    }
  }, [players]);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: isConnected ? '#d4edda' : '#f8d7da',
      border: `1px solid ${isConnected ? '#c3e6cb' : '#f5c6cb'}`,
      color: isConnected ? '#155724' : '#721c24',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <div><strong>WebSocket Status:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
      <div><strong>Players:</strong> {playerCount}</div>
      {lastUpdate && (
        <div><strong>Last Update:</strong> {lastUpdate.toLocaleTimeString()}</div>
      )}
      <div><strong>Server:</strong> ws://localhost:3001</div>
      <div style={{ marginTop: '5px', fontSize: '10px', opacity: 0.7 }}>
        Check browser console for detailed logs
      </div>
    </div>
  );
};

export default ConnectionStatus;
