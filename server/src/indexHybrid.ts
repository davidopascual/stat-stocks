import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import {
  Player,
  Transaction,
  Portfolio,
  LimitOrder,
  OrderBook,
  Option,
  OptionPosition,
  ShortPosition,
  League,
  MarketStats
} from './types.js';
import { orderBookManager } from './orderBook.js';
import { optionsEngine } from './options.js';
import { shortSellingEngine } from './shortSelling.js';
import { leagueManager } from './leagues.js';
import { circuitBreakerSystem } from './circuitBreaker.js';
import { hybridPricingEngine } from './hybridPricingEngine.js';
import { liveGameEngine } from './liveGameIntegration.js';
import { fetchNBAStats } from './nbaAPI.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Helper function to generate initial price history
function generateInitialPriceHistory(startPrice: number, volatility: number, points: number = 20): { date: string; price: number }[] {
  const history: { date: string; price: number }[] = [];
  const now = Date.now();
  const interval = 30000; // 30 seconds between points

  let currentPrice = startPrice;

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * interval));
    const randomChange = (Math.random() - 0.5) * volatility * 0.1;
    currentPrice = currentPrice * (1 + randomChange);
    history.push({
      date: timestamp.toISOString(),
      price: parseFloat(currentPrice.toFixed(2))
    });
  }

  return history;
}

// Initial mock players
let players: Player[] = [
  {
    id: '1',
    name: 'LeBron James',
    team: 'LAL',
    position: 'SF',
    stats: { ppg: 25.7, rpg: 7.3, apg: 7.3, fgPct: 54.0, threePtPct: 41.0 },
    currentPrice: 127.50,
    bidPrice: 126.87,
    askPrice: 128.13,
    priceChange: 0,
    priceHistory: generateInitialPriceHistory(127.50, 0.18),
    volume: 45600,
    volatility: 0.18,
    availableShares: 100000
  },
  {
    id: '2',
    name: 'Stephen Curry',
    team: 'GSW',
    position: 'PG',
    stats: { ppg: 26.4, rpg: 4.5, apg: 5.1, fgPct: 45.0, threePtPct: 40.8 },
    currentPrice: 142.30,
    bidPrice: 141.59,
    askPrice: 143.01,
    priceChange: 0,
    priceHistory: generateInitialPriceHistory(142.30, 0.22),
    volume: 52300,
    volatility: 0.22,
    availableShares: 100000
  },
  {
    id: '3',
    name: 'Giannis Antetokounmpo',
    team: 'MIL',
    position: 'PF',
    stats: { ppg: 31.1, rpg: 11.8, apg: 5.7, fgPct: 55.3, threePtPct: 27.5 },
    currentPrice: 156.80,
    bidPrice: 156.02,
    askPrice: 157.58,
    priceChange: 0,
    priceHistory: generateInitialPriceHistory(156.80, 0.20),
    volume: 48900,
    volatility: 0.20,
    availableShares: 100000
  },
  {
    id: '4',
    name: 'Luka Doncic',
    team: 'DAL',
    position: 'PG',
    stats: { ppg: 33.9, rpg: 9.2, apg: 9.8, fgPct: 48.7, threePtPct: 38.2 },
    currentPrice: 168.25,
    bidPrice: 167.41,
    askPrice: 169.09,
    priceChange: 0,
    priceHistory: generateInitialPriceHistory(168.25, 0.25),
    volume: 61200,
    volatility: 0.25,
    availableShares: 100000
  },
  {
    id: '5',
    name: 'Kevin Durant',
    team: 'PHX',
    position: 'SF',
    stats: { ppg: 29.1, rpg: 6.7, apg: 5.0, fgPct: 56.0, threePtPct: 40.5 },
    currentPrice: 145.60,
    bidPrice: 144.87,
    askPrice: 146.33,
    priceChange: 0,
    priceHistory: generateInitialPriceHistory(145.60, 0.19),
    volume: 43700,
    volatility: 0.19,
    availableShares: 100000
  },
  {
    id: '6',
    name: 'Joel Embiid',
    team: 'PHI',
    position: 'C',
    stats: { ppg: 33.1, rpg: 10.2, apg: 4.2, fgPct: 54.8, threePtPct: 33.0 },
    currentPrice: 152.40,
    bidPrice: 151.64,
    askPrice: 153.16,
    priceChange: 0,
    priceHistory: generateInitialPriceHistory(152.40, 0.21),
    volume: 39800,
    volatility: 0.21,
    availableShares: 100000
  },
  {
    id: '7',
    name: 'Nikola Jokic',
    team: 'DEN',
    position: 'C',
    stats: { ppg: 24.5, rpg: 11.8, apg: 9.8, fgPct: 63.2, threePtPct: 38.3 },
    currentPrice: 159.90,
    bidPrice: 159.11,
    askPrice: 160.69,
    priceChange: 0,
    priceHistory: generateInitialPriceHistory(159.90, 0.17),
    volume: 44500,
    volatility: 0.17,
    availableShares: 100000
  },
  {
    id: '8',
    name: 'Jayson Tatum',
    team: 'BOS',
    position: 'SF',
    stats: { ppg: 30.1, rpg: 8.8, apg: 4.6, fgPct: 46.6, threePtPct: 35.0 },
    currentPrice: 138.70,
    bidPrice: 137.99,
    askPrice: 139.41,
    priceChange: 0,
    priceHistory: generateInitialPriceHistory(138.70, 0.23),
    volume: 41200,
    volatility: 0.23,
    availableShares: 100000
  }
];

// Store user portfolios and transactions
const portfolios = new Map<string, Portfolio>();
const allTransactions: Transaction[] = [];

// Track recent trades for volume analysis
const recentTrades = new Map<string, number>(); // playerId -> recent trade count

// Connected WebSocket clients
const clients = new Set<WebSocket>();

// Initialize order books and options chains for all players
players.forEach(player => {
  orderBookManager.initializeOrderBook(player);
  optionsEngine.generateOptionsChain(player);
  recentTrades.set(player.id, 0);
});

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  clients.add(ws);

  // Send initial data
  ws.send(
    JSON.stringify({
      type: 'INITIAL_DATA',
      data: players
    })
  );

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast updates to all clients
function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// HYBRID PRICING UPDATE LOOP
setInterval(() => {
  try {
    players = players.map(player => {
      const previousPrice = player.currentPrice;

    // Check if trading is halted
    if (circuitBreakerSystem.isHalted(player.id)) {
      return player;
    }

    // Get order book
    const orderBook = orderBookManager.getOrderBook(player.id);
    if (!orderBook) return player;

    // Get recent trade volume
    const recentTradeVolume = recentTrades.get(player.id) || 0;

    // Determine pricing context (game time, off-season, etc.)
    const context = hybridPricingEngine.determinePricingContext(player);

    // Calculate new price using HYBRID model
    const priceComponents = hybridPricingEngine.calculatePrice(
      player,
      previousPrice,
      orderBook,
      recentTradeVolume,
      context
    );

    // Apply safety limits (max 15% change per update)
    const safePrice = hybridPricingEngine.applySafetyLimits(
      priceComponents.finalPrice,
      previousPrice,
      0.15
    );

    // Check circuit breaker BEFORE applying price
    const shouldHalt = circuitBreakerSystem.checkAndTrigger(
      { ...player, currentPrice: safePrice },
      previousPrice
    );

    if (shouldHalt) {
      console.log(`🚨 Circuit breaker triggered for ${player.name}`);
      broadcast({
        type: 'CIRCUIT_BREAKER',
        data: {
          playerId: player.id,
          playerName: player.name,
          previousPrice,
          attemptedPrice: safePrice,
          message: 'Trading halted due to volatility'
        }
      });
      return player; // Don't update price
    }

    // Calculate dynamic bid/ask spread
    const { bidPrice, askPrice } = hybridPricingEngine.calculateDynamicSpread(
      player,
      orderBook,
      context
    );

    // Update price history
    const priceHistory = [
      ...player.priceHistory.slice(-99), // Keep last 100 entries
      { date: new Date().toISOString(), price: safePrice }
    ];

    // Calculate price change percentage
    const priceChange = ((safePrice - previousPrice) / previousPrice) * 100;

    // Update volume (simulate with recent trades + decay)
    const volumeDecay = player.volume * 0.95;
    const newVolume = volumeDecay + (recentTradeVolume * safePrice);

    // Reset recent trades counter
    recentTrades.set(player.id, 0);

    // Log detailed price breakdown
    console.log(
      `💰 ${player.name} | ` +
      `Final: $${safePrice.toFixed(2)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%) | ` +
      `Fundamental: $${priceComponents.fundamentalValue.toFixed(2)} (${(priceComponents.weights.fundamental * 100).toFixed(0)}%) | ` +
      `Market: $${priceComponents.marketValue.toFixed(2)} (${(priceComponents.weights.market * 100).toFixed(0)}%) | ` +
      `Live: $${priceComponents.liveEventValue.toFixed(2)} (${(priceComponents.weights.liveEvents * 100).toFixed(0)}%) | ` +
      `Context: ${context.isGameTime ? '🏀 GAME' : context.marketOpen ? '📈 OPEN' : '🌙 CLOSED'}`
    );

    return {
      ...player,
      currentPrice: safePrice,
      bidPrice,
      askPrice,
      priceChange,
      priceHistory,
      volume: newVolume
    };
  });

    // Update options pricing with current player prices
    const playersMap = new Map(players.map(p => [p.id, p]));
    optionsEngine.updateOptionsPricing(playersMap);

    // Broadcast updated prices
    broadcast({
      type: 'PRICE_UPDATE',
      data: players
    });

    console.log(`📊 Hybrid price update broadcasted to ${clients.size} clients`);
  } catch (error) {
    console.error('❌ Error in price update loop:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
  }
}, 30000); // Update every 30 seconds

// LIVE GAME POLLING (faster during games)
setInterval(() => {
  const liveGames = liveGameEngine.getLiveGames();

  if (liveGames.length > 0) {
    console.log(`🏀 ${liveGames.length} live games in progress`);

    // Broadcast live game events
    broadcast({
      type: 'LIVE_GAMES',
      data: liveGames
    });
  }
}, 15000); // Check for live games every 15 seconds

// Fetch NBA stats daily
setInterval(() => {
  console.log('Fetching latest NBA stats...');
  fetchNBAStats().catch(err => {
    console.error('Failed to fetch NBA stats:', err);
  });
}, 24 * 60 * 60 * 1000); // Every 24 hours

// Initial stats fetch
fetchNBAStats().catch(err => {
  console.error('Failed to fetch initial NBA stats:', err);
});

// ==================== API ENDPOINTS ====================

// Get all players
app.get('/api/players', (req, res) => {
  res.json(players);
});

// Get single player
app.get('/api/players/:id', (req, res) => {
  const player = players.find(p => p.id === req.params.id);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  res.json(player);
});

// Place market order (instant execution at current price)
app.post('/api/trade', (req, res) => {
  const { userId, playerId, type, shares } = req.body;

  const player = players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  // Check circuit breaker
  if (circuitBreakerSystem.isHalted(playerId)) {
    return res.status(403).json({
      error: 'Trading halted',
      reason: 'Circuit breaker triggered due to volatility'
    });
  }

  const price = type === 'BUY' ? player.askPrice : player.bidPrice;
  const total = price * shares;

  // Get or create portfolio
  let portfolio = portfolios.get(userId);
  if (!portfolio) {
    portfolio = {
      userId,
      cash: 100000,
      holdings: [],
      totalValue: 100000,
      transactions: []
    };
    portfolios.set(userId, portfolio);
  }

  // Validate transaction
  if (type === 'BUY' && portfolio.cash < total) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  const holding = portfolio.holdings.find(h => h.playerId === playerId);
  if (type === 'SELL' && (!holding || holding.shares < shares)) {
    return res.status(400).json({ error: 'Insufficient shares' });
  }

  // Execute transaction
  const transaction: Transaction = {
    id: Date.now().toString(),
    userId,
    playerId,
    playerName: player.name,
    type,
    shares,
    price,
    total,
    timestamp: new Date()
  };

  if (type === 'BUY') {
    portfolio.cash -= total;
    if (holding) {
      holding.shares += shares;
      holding.avgPrice = (holding.avgPrice * holding.shares + total) / (holding.shares + shares);
    } else {
      portfolio.holdings.push({
        playerId,
        playerName: player.name,
        shares,
        avgPrice: price,
        currentPrice: price
      });
    }
  } else {
    portfolio.cash += total;
    if (holding) {
      holding.shares -= shares;
      if (holding.shares === 0) {
        portfolio.holdings = portfolio.holdings.filter(h => h.playerId !== playerId);
      }
    }
  }

  portfolio.transactions.push(transaction);
  allTransactions.push(transaction);

  // Track recent trades for market-driven pricing
  const currentTrades = recentTrades.get(playerId) || 0;
  recentTrades.set(playerId, currentTrades + shares);

  // Recalculate portfolio value
  portfolio.totalValue = portfolio.cash + portfolio.holdings.reduce((sum, h) => {
    const p = players.find(pl => pl.id === h.playerId);
    return sum + (p ? p.currentPrice * h.shares : 0);
  }, 0);

  res.json({
    success: true,
    transaction,
    portfolio
  });
});

// Place limit order
app.post('/api/orders/limit', (req, res) => {
  const { userId, playerId, type, shares, limitPrice } = req.body;

  const player = players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  if (circuitBreakerSystem.isHalted(playerId)) {
    return res.status(403).json({ error: 'Trading halted' });
  }

  const order: LimitOrder = {
    id: `order_${Date.now()}_${Math.random()}`,
    userId,
    username: userId, // Will be replaced with actual username in production
    playerId,
    playerName: player.name,
    type,
    orderType: 'LIMIT',
    price: limitPrice,
    shares,
    filledShares: 0,
    status: 'OPEN',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };

  const result = orderBookManager.placeLimitOrder(order);

  // If order was filled, update portfolio
  if (result.trades && result.trades.length > 0) {
    let portfolio = portfolios.get(userId);
    if (!portfolio) {
      portfolio = {
        userId,
        cash: 100000,
        holdings: [],
        totalValue: 100000,
        transactions: []
      };
      portfolios.set(userId, portfolio);
    }

    result.trades.forEach(trade => {
      portfolio!.transactions.push(trade);
      allTransactions.push(trade);

      // Track for market impact
      const currentTrades = recentTrades.get(playerId) || 0;
      recentTrades.set(playerId, currentTrades + trade.shares);

      if (trade.type === 'BUY') {
        portfolio!.cash -= trade.total;
        const holding = portfolio!.holdings.find(h => h.playerId === playerId);
        if (holding) {
          const totalShares = holding.shares + trade.shares;
          holding.avgPrice = (holding.avgPrice * holding.shares + trade.total) / totalShares;
          holding.shares = totalShares;
        } else {
          portfolio!.holdings.push({
            playerId,
            playerName: player.name,
            shares: trade.shares,
            avgPrice: trade.price,
            currentPrice: trade.price
          });
        }
      } else {
        portfolio!.cash += trade.total;
        const holding = portfolio!.holdings.find(h => h.playerId === playerId);
        if (holding) {
          holding.shares -= trade.shares;
          if (holding.shares === 0) {
            portfolio!.holdings = portfolio!.holdings.filter(h => h.playerId !== playerId);
          }
        }
      }
    });

    // Recalculate total value
    portfolio.totalValue = portfolio.cash + portfolio.holdings.reduce((sum, h) => {
      const p = players.find(pl => pl.id === h.playerId);
      return sum + (p ? p.currentPrice * h.shares : 0);
    }, 0);
  }

  res.json(result);
});

// Get order book
app.get('/api/orders/:playerId', (req, res) => {
  const orderBook = orderBookManager.getOrderBook(req.params.playerId);
  if (!orderBook) {
    return res.status(404).json({ error: 'Order book not found' });
  }
  res.json(orderBook);
});

// Cancel order
app.delete('/api/orders/:orderId', (req, res) => {
  const { userId } = req.body;
  const result = orderBookManager.cancelOrder(req.params.orderId, userId);
  res.json(result);
});

// Get user's open orders
app.get('/api/orders/user/:userId', (req, res) => {
  const userOrders = orderBookManager.getUserOrders(req.params.userId);
  res.json(userOrders);
});

// ==================== OPTIONS ENDPOINTS ====================

// Get options chain
app.get('/api/options/:playerId', (req, res) => {
  const player = players.find(p => p.id === req.params.playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const chain = optionsEngine.generateOptionsChain(player);
  res.json(chain);
});

// Buy option
app.post('/api/options/buy', (req, res) => {
  const { userId, optionId, contracts } = req.body;

  let portfolio = portfolios.get(userId);
  if (!portfolio) {
    portfolio = {
      userId,
      cash: 100000,
      holdings: [],
      totalValue: 100000,
      transactions: []
    };
    portfolios.set(userId, portfolio);
  }

  const result = optionsEngine.buyOption(userId, optionId, contracts, portfolio);

  if (result.success && result.position) {
    // Add to portfolio
    if (!portfolio.optionPositions) {
      portfolio.optionPositions = [];
    }
    portfolio.optionPositions.push(result.position);
  }

  res.json(result);
});

// Exercise option
app.post('/api/options/exercise', (req, res) => {
  const { userId, positionId } = req.body;

  const portfolio = portfolios.get(userId);
  if (!portfolio || !portfolio.optionPositions) {
    return res.status(404).json({ error: 'No options positions found' });
  }

  const result = optionsEngine.exerciseOption(userId, positionId, portfolio, players);

  if (result.success) {
    // Remove the exercised position from portfolio
    portfolio.optionPositions = portfolio.optionPositions.filter(p => p.id !== positionId);

    // Recalculate total value
    portfolio.totalValue = portfolio.cash + portfolio.holdings.reduce((sum, h) => {
      const player = players.find(p => p.id === h.playerId);
      return sum + (player ? player.currentPrice : h.currentPrice) * h.shares;
    }, 0);

    // Broadcast portfolio update
    broadcast({
      type: 'PORTFOLIO_UPDATE',
      data: {
        userId,
        portfolio: {
          ...portfolio,
          holdings: portfolio.holdings.map(h => {
            const player = players.find(p => p.id === h.playerId);
            return {
              ...h,
              currentPrice: player ? player.currentPrice : h.currentPrice
            };
          })
        }
      }
    });
  }

  res.json(result);
});

// Get user's option positions
app.get('/api/options/positions/:userId', (req, res) => {
  const portfolio = portfolios.get(req.params.userId);
  if (!portfolio || !portfolio.optionPositions) {
    return res.json([]);
  }

  res.json(portfolio.optionPositions);
});

// ==================== SHORT SELLING ENDPOINTS ====================

// Short sell
app.post('/api/short/sell', (req, res) => {
  const { userId, playerId, shares } = req.body;

  const player = players.find(p => p.id === playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  let portfolio = portfolios.get(userId);
  if (!portfolio) {
    portfolio = {
      userId,
      cash: 100000,
      holdings: [],
      totalValue: 100000,
      transactions: []
    };
    portfolios.set(userId, portfolio);
  }

  const result = shortSellingEngine.shortSell(userId, player, shares);

  if (result.success && result.position) {
    if (!portfolio.shortPositions) {
      portfolio.shortPositions = [];
    }
    portfolio.shortPositions.push(result.position);
    portfolio.cash += result.position.proceeds;
  }

  res.json(result);
});

// Cover short position
app.post('/api/short/cover', (req, res) => {
  const { userId, positionId, shares } = req.body;

  const portfolio = portfolios.get(userId);
  if (!portfolio || !portfolio.shortPositions) {
    return res.status(404).json({ error: 'No short positions found' });
  }

  const position = portfolio.shortPositions.find(p => p.id === positionId);
  if (!position) {
    return res.status(404).json({ error: 'Position not found' });
  }

  const player = players.find(p => p.id === position.playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const result = shortSellingEngine.coverShort(userId, positionId, shares, player);

  if (result.success) {
    portfolio.cash -= result.cost;
    if (position.shares === 0) {
      portfolio.shortPositions = portfolio.shortPositions.filter(p => p.id !== positionId);
    }
  }

  res.json(result);
});

// Get user's short positions
app.get('/api/short/positions/:userId', (req, res) => {
  const portfolio = portfolios.get(req.params.userId);
  if (!portfolio || !portfolio.shortPositions) {
    return res.json([]);
  }

  res.json(portfolio.shortPositions);
});

// Get available shares to short
app.get('/api/short/available/:playerId', (req, res) => {
  const available = shortSellingEngine.getAvailableShares(req.params.playerId);
  res.json({ available });
});

// ==================== LEAGUE ENDPOINTS ====================

// Create league
app.post('/api/leagues', (req, res) => {
  const { name, creatorId, settings } = req.body;
  const league = leagueManager.createLeague(name, creatorId, settings);
  res.json(league);
});

// Join league
app.post('/api/leagues/:leagueId/join', (req, res) => {
  const { userId, inviteCode } = req.body;
  const result = leagueManager.joinLeague(req.params.leagueId, userId, inviteCode);
  res.json(result);
});

// Get league
app.get('/api/leagues/:leagueId', (req, res) => {
  const league = leagueManager.getLeague(req.params.leagueId);
  if (!league) {
    return res.status(404).json({ error: 'League not found' });
  }
  res.json(league);
});

// Get leaderboard
app.get('/api/leagues/:leagueId/leaderboard', (req, res) => {
  const league = leagueManager.getLeague(req.params.leagueId);
  if (!league) {
    return res.status(404).json({ error: 'League not found' });
  }

  // Update leaderboard with current portfolios
  leagueManager.updateLeaderboard(req.params.leagueId, portfolios);

  res.json(league.leaderboard);
});

// Get user's leagues
app.get('/api/leagues/user/:userId', (req, res) => {
  const userLeagues = leagueManager.getUserLeagues(req.params.userId);
  res.json(userLeagues);
});

// Get portfolio
app.get('/api/portfolio/:userId', (req, res) => {
  const portfolio = portfolios.get(req.params.userId);
  if (!portfolio) {
    return res.json({
      userId: req.params.userId,
      cash: 100000,
      holdings: [],
      totalValue: 100000,
      transactions: []
    });
  }

  // Update current prices in holdings
  portfolio.holdings = portfolio.holdings.map(holding => {
    const player = players.find(p => p.id === holding.playerId);
    return {
      ...holding,
      currentPrice: player ? player.currentPrice : holding.currentPrice
    };
  });

  // Recalculate total value
  portfolio.totalValue = portfolio.cash + portfolio.holdings.reduce((sum, h) => {
    return sum + h.currentPrice * h.shares;
  }, 0);

  res.json(portfolio);
});

// Get market stats
app.get('/api/stats', (req, res) => {
  const totalVolume = players.reduce((sum, p) => sum + p.volume, 0);
  const avgChange = players.reduce((sum, p) => sum + p.priceChange, 0) / players.length;
  const activePlayers = players.length;
  const topGainer = players.reduce((max, p) => p.priceChange > max.priceChange ? p : max);
  const topLoser = players.reduce((min, p) => p.priceChange < min.priceChange ? p : min);

  const stats: MarketStats = {
    totalVolume,
    avgChange,
    activePlayers,
    topGainer: {
      id: topGainer.id,
      name: topGainer.name,
      change: topGainer.priceChange
    },
    topLoser: {
      id: topLoser.id,
      name: topLoser.name,
      change: topLoser.priceChange
    }
  };

  res.json(stats);
});

// Get live games
app.get('/api/live-games', (req, res) => {
  const liveGames = liveGameEngine.getLiveGames();
  res.json(liveGames);
});

// Seed demo portfolio with sample trades for screenshots
app.post('/api/seed-demo', (req, res) => {
  const userId = req.body.userId || 'demo-user';

  // Get or create portfolio
  let portfolio = portfolios.get(userId);
  if (!portfolio) {
    portfolio = {
      userId,
      cash: 100000,
      holdings: [],
      totalValue: 100000,
      transactions: []
    };
  }

  // Clear existing holdings
  portfolio.holdings = [];
  portfolio.transactions = [];

  // Find some popular players
  const lebron = players.find(p => p.name.includes('LeBron'));
  const curry = players.find(p => p.name.includes('Curry'));
  const durant = players.find(p => p.name.includes('Durant'));
  const giannis = players.find(p => p.name.includes('Giannis'));
  const jokic = players.find(p => p.name.includes('Jokic'));
  const embiid = players.find(p => p.name.includes('Embiid'));
  const tatum = players.find(p => p.name.includes('Tatum'));

  // Add positions with realistic avg buy prices (slightly different from current)
  const demoHoldings = [
    {
      playerId: lebron?.id || players[0].id,
      playerName: lebron?.name || players[0].name,
      shares: 25,
      avgBuyPrice: (lebron?.currentPrice || players[0].currentPrice) * 0.85, // 15% profit
      currentPrice: lebron?.currentPrice || players[0].currentPrice
    },
    {
      playerId: curry?.id || players[1].id,
      playerName: curry?.name || players[1].name,
      shares: 30,
      avgBuyPrice: (curry?.currentPrice || players[1].currentPrice) * 0.92, // 8% profit
      currentPrice: curry?.currentPrice || players[1].currentPrice
    },
    {
      playerId: durant?.id || players[2].id,
      playerName: durant?.name || players[2].name,
      shares: 20,
      avgBuyPrice: (durant?.currentPrice || players[2].currentPrice) * 1.05, // 5% loss
      currentPrice: durant?.currentPrice || players[2].currentPrice
    },
    {
      playerId: giannis?.id || players[3].id,
      playerName: giannis?.name || players[3].name,
      shares: 15,
      avgBuyPrice: (giannis?.currentPrice || players[3].currentPrice) * 0.88, // 12% profit
      currentPrice: giannis?.currentPrice || players[3].currentPrice
    },
    {
      playerId: jokic?.id || players[4].id,
      playerName: jokic?.name || players[4].name,
      shares: 18,
      avgBuyPrice: (jokic?.currentPrice || players[4].currentPrice) * 0.95, // 5% profit
      currentPrice: jokic?.currentPrice || players[4].currentPrice
    },
    {
      playerId: embiid?.id || players[5].id,
      playerName: embiid?.name || players[5].name,
      shares: 12,
      avgBuyPrice: (embiid?.currentPrice || players[5].currentPrice) * 1.08, // 8% loss
      currentPrice: embiid?.currentPrice || players[5].currentPrice
    },
    {
      playerId: tatum?.id || players[6].id,
      playerName: tatum?.name || players[6].name,
      shares: 22,
      avgBuyPrice: (tatum?.currentPrice || players[6].currentPrice) * 0.90, // 10% profit
      currentPrice: tatum?.currentPrice || players[6].currentPrice
    }
  ];

  portfolio.holdings = demoHoldings;

  // Calculate total value
  let holdingsValue = 0;
  portfolio.holdings.forEach(holding => {
    const player = players.find(p => p.id === holding.playerId);
    if (player) {
      holdingsValue += holding.shares * player.currentPrice;
    }
  });

  // Set realistic cash amount (spent about $53k on stocks)
  portfolio.cash = 47000;
  portfolio.totalValue = portfolio.cash + holdingsValue;

  // Add some transaction history
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const txs: Transaction[] = [
    {
      id: `tx-${Date.now()}-1`,
      userId,
      playerId: lebron?.id || players[0].id,
      playerName: lebron?.name || players[0].name,
      type: 'BUY' as const,
      shares: 25,
      price: (lebron?.currentPrice || players[0].currentPrice) * 0.85,
      total: 25 * (lebron?.currentPrice || players[0].currentPrice) * 0.85,
      timestamp: new Date(now - 7 * oneDayMs)
    },
    {
      id: `tx-${Date.now()}-2`,
      userId,
      playerId: curry?.id || players[1].id,
      playerName: curry?.name || players[1].name,
      type: 'BUY' as const,
      shares: 30,
      price: (curry?.currentPrice || players[1].currentPrice) * 0.92,
      total: 30 * (curry?.currentPrice || players[1].currentPrice) * 0.92,
      timestamp: new Date(now - 6 * oneDayMs)
    },
    {
      id: `tx-${Date.now()}-3`,
      userId,
      playerId: durant?.id || players[2].id,
      playerName: durant?.name || players[2].name,
      type: 'BUY' as const,
      shares: 20,
      price: (durant?.currentPrice || players[2].currentPrice) * 1.05,
      total: 20 * (durant?.currentPrice || players[2].currentPrice) * 1.05,
      timestamp: new Date(now - 5 * oneDayMs)
    },
    {
      id: `tx-${Date.now()}-4`,
      userId,
      playerId: giannis?.id || players[3].id,
      playerName: giannis?.name || players[3].name,
      type: 'BUY' as const,
      shares: 15,
      price: (giannis?.currentPrice || players[3].currentPrice) * 0.88,
      total: 15 * (giannis?.currentPrice || players[3].currentPrice) * 0.88,
      timestamp: new Date(now - 4 * oneDayMs)
    },
    {
      id: `tx-${Date.now()}-5`,
      userId,
      playerId: jokic?.id || players[4].id,
      playerName: jokic?.name || players[4].name,
      type: 'BUY' as const,
      shares: 18,
      price: (jokic?.currentPrice || players[4].currentPrice) * 0.95,
      total: 18 * (jokic?.currentPrice || players[4].currentPrice) * 0.95,
      timestamp: new Date(now - 3 * oneDayMs)
    },
    {
      id: `tx-${Date.now()}-6`,
      userId,
      playerId: embiid?.id || players[5].id,
      playerName: embiid?.name || players[5].name,
      type: 'BUY' as const,
      shares: 12,
      price: (embiid?.currentPrice || players[5].currentPrice) * 1.08,
      total: 12 * (embiid?.currentPrice || players[5].currentPrice) * 1.08,
      timestamp: new Date(now - 2 * oneDayMs)
    },
    {
      id: `tx-${Date.now()}-7`,
      userId,
      playerId: tatum?.id || players[6].id,
      playerName: tatum?.name || players[6].name,
      type: 'BUY' as const,
      shares: 22,
      price: (tatum?.currentPrice || players[6].currentPrice) * 0.90,
      total: 22 * (tatum?.currentPrice || players[6].currentPrice) * 0.90,
      timestamp: new Date(now - 1 * oneDayMs)
    }
  ];

  portfolio.transactions = txs;
  portfolios.set(userId, portfolio);
  allTransactions.push(...txs);

  console.log(`✅ Demo portfolio seeded for user: ${userId}`);
  console.log(`   Holdings: ${portfolio.holdings.length} positions`);
  console.log(`   Cash: $${portfolio.cash.toFixed(2)}`);
  console.log(`   Total Value: $${portfolio.totalValue.toFixed(2)}`);

  res.json({
    success: true,
    message: 'Demo portfolio seeded successfully',
    portfolio: {
      userId: portfolio.userId,
      cash: portfolio.cash,
      holdings: portfolio.holdings.length,
      totalValue: portfolio.totalValue,
      transactions: portfolio.transactions.length
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 NBA Stock Market Server running on port ${PORT}`);
  console.log(`📊 Using HYBRID pricing model (Fundamental + Market + Live Events)`);
  console.log(`🏀 Live game tracking enabled`);
  console.log(`⚡ WebSocket server ready for connections`);
});
