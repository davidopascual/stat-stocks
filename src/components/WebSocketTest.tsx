import React, { useEffect, useState } from 'react';

const WebSocketTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testWebSocket = () => {
      setStatus('Connecting...');
      const ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => {
        setStatus('✅ Connected');
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const logMessage = `Received ${data.type} with ${Array.isArray(data.data) ? data.data.length : 'non-array'} items`;
          setMessages(prev => [...prev, logMessage].slice(-5)); // Keep last 5 messages
        } catch (e) {
          setMessages(prev => [...prev, `Parse error: ${e}`].slice(-5));
        }
      };

      ws.onerror = (event) => {
        setStatus('❌ Error');
        setError(`WebSocket error: ${event}`);
      };

      ws.onclose = (event) => {
        setStatus(`🔌 Closed (${event.code})`);
        if (event.code !== 1000) {
          setError(`Unexpected close: ${event.code} - ${event.reason}`);
        }
      };

      return () => {
        ws.close();
      };
    };

    const cleanup = testWebSocket();
    return cleanup;
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'white',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 1001,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div><strong>WebSocket Test</strong></div>
      <div>Status: {status}</div>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      <div><strong>Recent Messages:</strong></div>
      {messages.map((msg, i) => (
        <div key={i} style={{ fontSize: '10px', margin: '2px 0' }}>{msg}</div>
      ))}
    </div>
  );
};

export default WebSocketTest;
