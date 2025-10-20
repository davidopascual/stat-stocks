// Shared types for frontend
export interface PlayerStats {
  ppg: number;
  rpg: number;
  apg: number;
  fgPct: number;
  threePtPct: number;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  stats: PlayerStats;
  currentPrice: number;
  bidPrice: number;
  askPrice: number;
  priceChange: number;
  priceHistory: { date: string; price: number }[];
  volume: number;
  volatility: number;
  availableShares: number;
}

export interface Option {
  id: string;
  playerId: string;
  playerName: string;
  type: 'CALL' | 'PUT';
  strikePrice: number;
  premium: number;
  expirationDate: string;
  contracts: number;
  currentPrice: number;
  inTheMoney: boolean;
  intrinsicValue: number;
  timeValue: number;
  impliedVolatility: number;
}

export interface OptionPosition {
  id: string;
  userId: string;
  optionId: string;
  contracts: number;
  purchasePrice: number;
  purchaseDate: string;
  position: 'LONG' | 'SHORT';
}

export interface LimitOrder {
  id: string;
  userId: string;
  username: string;
  playerId: string;
  playerName: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  price: number;
  shares: number;
  filledShares: number;
  status: 'OPEN' | 'FILLED' | 'PARTIAL' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string;
}

export interface OrderBook {
  playerId: string;
  playerName: string;
  buyOrders: LimitOrder[];
  sellOrders: LimitOrder[];
  lastTrade: number;
  spread: number;
  depth: {
    bids: { price: number; volume: number }[];
    asks: { price: number; volume: number }[];
  };
}

export interface ShortPosition {
  userId: string;
  playerId: string;
  playerName: string;
  shares: number;
  type: 'SHORT';
  borrowPrice: number;
  borrowDate: string;
  dailyFee: number;
  sharesBorrowed: number;
  currentPrice: number;
}

export interface League {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  startDate: string;
  endDate?: string;
  startingBalance: number;
  isActive: boolean;
  isPrivate: boolean;
  inviteCode: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: number;
  totalValue: number;
  percentageReturn: number;
  dayReturn: number;
  weekReturn: number;
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
}
