import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Player } from '../data/mockPlayers';

interface Position {
  playerId: string;
  playerName: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
}

interface Transaction {
  id: string;
  playerId: string;
  playerName: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  timestamp: Date;
}

interface TradingContextType {
  balance: number;
  positions: Position[];
  transactions: Transaction[];
  buyShares: (player: Player, shares: number) => Promise<boolean>;
  sellShares: (playerId: string, shares: number) => Promise<boolean>;
  getPosition: (playerId: string) => Position | undefined;
  getTotalValue: () => number;
  refreshPortfolio: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within TradingProvider');
  }
  return context;
};

interface TradingProviderProps {
  children: ReactNode;
}

const API_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

// Helper function to get userId from localStorage
const getUserId = (): string | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }
  return null;
};

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState(10000); // Starting with $10k
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const buyShares = async (player: Player, shares: number): Promise<boolean> => {
    const userId = getUserId();

    if (!userId) {
      console.error('No user logged in');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          playerId: player.id,
          type: 'BUY',
          shares
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Trade failed:', result.message);
        return false;
      }

      // Refresh portfolio from backend to get updated state
      await refreshPortfolio();
      return true;
    } catch (error) {
      console.error('Error executing buy trade:', error);
      return false;
    }
  };

  const sellShares = async (playerId: string, shares: number): Promise<boolean> => {
    const userId = getUserId();

    if (!userId) {
      console.error('No user logged in');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/api/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          playerId,
          type: 'SELL',
          shares
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Trade failed:', result.message);
        return false;
      }

      // Refresh portfolio from backend to get updated state
      await refreshPortfolio();
      return true;
    } catch (error) {
      console.error('Error executing sell trade:', error);
      return false;
    }
  };

  const getPosition = (playerId: string): Position | undefined => {
    return positions.find(p => p.playerId === playerId);
  };

  const getTotalValue = (): number => {
    const positionsValue = positions.reduce(
      (sum, pos) => sum + pos.currentPrice * pos.shares,
      0
    );
    return balance + positionsValue;
  };

  // Fetch portfolio from backend
  const refreshPortfolio = async () => {
    const userId = getUserId();

    if (!userId) {
      console.log('No user logged in - skipping portfolio refresh');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/portfolio/${userId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch portfolio:', response.status);
        return;
      }

      const portfolio = await response.json();

      if (!portfolio) {
        console.error('No portfolio data received');
        return;
      }

      setBalance(portfolio.cash || 10000);

      // Convert holdings to positions format
      const convertedPositions: Position[] = (portfolio.holdings || []).map((h: any) => ({
        playerId: h.playerId,
        playerName: h.playerName,
        shares: h.shares,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice: h.currentPrice || 0
      }));
      setPositions(convertedPositions);

      // Set transactions
      setTransactions(portfolio.transactions || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  // Load portfolio on mount
  useEffect(() => {
    const userId = getUserId();
    
    if (!userId) {
      console.log('No user logged in - skipping portfolio initialization');
      return;
    }

    // Fetch initial portfolio
    refreshPortfolio();

    // Setup WebSocket listener for portfolio updates
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for portfolio updates');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'PORTFOLIO_UPDATE') {
          const currentUserId = getUserId();

          // Only update if it's for this user
          if (currentUserId && message.data.userId === currentUserId) {
            const portfolio = message.data.portfolio;
            setBalance(portfolio.cash || 10000);

            const convertedPositions: Position[] = (portfolio.holdings || []).map((h: any) => ({
              playerId: h.playerId,
              playerName: h.playerName,
              shares: h.shares,
              avgBuyPrice: h.avgBuyPrice,
              currentPrice: h.currentPrice || 0
            }));
            setPositions(convertedPositions);

            if (portfolio.transactions) {
              setTransactions(portfolio.transactions);
            }
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array - runs once on mount

  return (
    <TradingContext.Provider
      value={{
        balance,
        positions,
        transactions,
        buyShares,
        sellShares,
        getPosition,
        getTotalValue,
        refreshPortfolio,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};
