// Core Types for Advanced Trading System

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
  bidPrice: number; // 0.5% below market
  askPrice: number; // 0.5% above market
  priceChange: number;
  priceHistory: { date: string; price: number }[];
  volume: number;
  volatility: number; // for options pricing
  availableShares: number; // for short selling
}

export interface User {
  id: string;
  username: string;
  email: string;
  cash: number;
  portfolioValue: number;
  totalValue: number;
  percentageReturn: number;
  startingBalance: number;
  createdAt: Date;
  leagueIds: string[];
}

export interface Position {
  userId: string;
  playerId: string;
  playerName: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  type: 'LONG' | 'SHORT';
}

export interface Portfolio {
  userId: string;
  cash: number;
  holdings: {
    playerId: string;
    playerName: string;
    shares: number;
    avgBuyPrice: number;
    currentPrice?: number;
  }[];
  totalValue: number;
  transactions: Transaction[];
  optionPositions?: OptionPosition[];
  shortPositions?: ShortPosition[];
}

export interface ShortPosition extends Position {
  id: string;
  type: 'SHORT';
  borrowPrice: number;
  borrowDate: Date;
  dailyFee: number; // percentage per day
  sharesBorrowed: number;
  proceeds?: number;
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
  createdAt: Date;
  expiresAt: Date;
}

export interface Option {
  id: string;
  playerId: string;
  playerName: string;
  type: 'CALL' | 'PUT';
  strikePrice: number;
  premium: number;
  expirationDate: Date;
  contracts: number; // 1 contract = 100 shares
  currentPrice: number; // current option value
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
  purchaseDate: Date;
  position: 'LONG' | 'SHORT'; // bought or sold (wrote) the option
  playerSnapshot?: {
    id: string;
    name: string;
    team: string;
    position: string;
    priceAtPurchase: number;
  };
}

export interface MarginAccount {
  userId: string;
  cash: number;
  borrowedCash: number;
  leverage: number;
  equity: number; // cash + positions value - borrowed
  maintenanceMargin: number; // minimum equity %
  marginLevel: number; // current equity / required margin
  liquidationThreshold: number;
}

export interface League {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  startDate: Date;
  endDate?: Date;
  startingBalance: number;
  isActive: boolean;
  isPrivate: boolean;
  inviteCode: string;
  settings: LeagueSettings;
  leaderboard?: LeaderboardEntry[];
}

export interface LeagueSettings {
  allowShortSelling: boolean;
  allowOptions: boolean;
  allowMargin: boolean;
  maxLeverage: number;
  tradingFees: boolean;
  feePercentage: number;
}

export interface LeagueLeaderboard {
  leagueId: string;
  entries: LeaderboardEntry[];
  lastUpdated: Date;
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

export interface Transaction {
  id: string;
  userId: string;
  username?: string;
  type: 'BUY' | 'SELL' | 'SHORT' | 'COVER' | 'OPTION_BUY' | 'OPTION_SELL' | 'OPTION_EXERCISE';
  playerId?: string;
  playerName?: string;
  optionId?: string;
  shares?: number;
  contracts?: number;
  price: number;
  total: number;
  fee?: number;
  timestamp: Date;
  orderId?: string;
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

export interface MarketStats {
  totalVolume: number;
  totalTrades: number;
  avgVolatility: number;
  topGainers: { id?: string; playerId?: string; name?: string; change: number }[];
  topLosers: { id?: string; playerId?: string; name?: string; change: number }[];
  mostActive: { playerId: string; volume: number }[];
  marketCap: number;
  vixIndex: number; // volatility index
  avgChange?: number;
  activePlayers?: number;
  topGainer?: { id: string; name: string; change: number };
  topLoser?: { id: string; name: string; change: number };
}

export interface CircuitBreaker {
  playerId: string;
  triggered: boolean;
  reason: 'VOLATILITY' | 'VOLUME' | 'NEWS';
  haltedAt: Date;
  resumesAt: Date;
  priceAtHalt: number;
}

export interface PortfolioRisk {
  userId: string;
  totalValue: number;
  cash: number;
  longValue: number;
  shortValue: number;
  optionsValue: number;
  beta: number; // portfolio vs market
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk: number; // 95% confidence
  concentration: { playerId: string; percentage: number }[];
}
