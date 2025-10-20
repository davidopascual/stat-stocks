import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Player } from '../data/mockPlayers';

interface Position {
  playerId: string;
  playerName: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
}

interface OptionPosition {
  id: string;
  userId: string;
  optionId: string;
  contracts: number;
  purchasePrice: number;
  purchaseDate: Date;
  position: 'LONG' | 'SHORT';
  playerSnapshot?: {
    id: string;
    name: string;
    team: string;
    position: string;
    priceAtPurchase: number;
  };
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
  optionPositions: OptionPosition[];
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

export const TradingProvider: React.FC<TradingProviderProps> = ({ children }) => {
  const [balance, setBalance] = useState(100000); // Starting with $100k
  const [positions, setPositions] = useState<Position[]>([]);
  const [optionPositions, setOptionPositions] = useState<OptionPosition[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const buyShares = async (player: Player, shares: number): Promise<boolean> => {
    const userId = localStorage.getItem('userId') || 'user123';

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
    const userId = localStorage.getItem('userId') || 'user123';

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
    const userId = localStorage.getItem('userId') || 'user123'; // Default user ID
    try {
      const response = await fetch(`${API_URL}/api/portfolio/${userId}`);
      const portfolio = await response.json();

      setBalance(portfolio.cash);

      // Convert holdings to positions format
      const convertedPositions: Position[] = portfolio.holdings.map((h: { playerId: string; playerName: string; shares: number; avgBuyPrice: number; currentPrice?: number }) => ({
        playerId: h.playerId,
        playerName: h.playerName,
        shares: h.shares,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice: h.currentPrice || 0
      }));
      setPositions(convertedPositions);

      // Set option positions
      if (portfolio.optionPositions) {
        setOptionPositions(portfolio.optionPositions);
      }

      // Set transactions
      setTransactions(portfolio.transactions || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  // Load portfolio on mount
  useEffect(() => {
    // Set user ID if not already set
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', 'user123');
    }
    
    refreshPortfolio();

    // Setup WebSocket listener for portfolio updates
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'PORTFOLIO_UPDATE') {
          const userId = localStorage.getItem('userId') || 'user123';

          // Only update if it's for this user
          if (message.data.userId === userId) {
            const portfolio = message.data.portfolio;
            setBalance(portfolio.cash);

            const convertedPositions: Position[] = portfolio.holdings.map((h: { playerId: string; playerName: string; shares: number; avgBuyPrice: number; currentPrice?: number }) => ({
              playerId: h.playerId,
              playerName: h.playerName,
              shares: h.shares,
              avgBuyPrice: h.avgBuyPrice,
              currentPrice: h.currentPrice || 0
            }));
            setPositions(convertedPositions);

            // Update option positions
            if (portfolio.optionPositions) {
              setOptionPositions(portfolio.optionPositions);
            }

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
  }, []);

  return (
    <TradingContext.Provider
      value={{
        balance,
        positions,
        optionPositions,
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
