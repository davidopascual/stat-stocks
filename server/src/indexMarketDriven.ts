import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';
import { updatePlayerPrices, getPlayers, getPlayersMap, getPlayer } from './priceEngineV2.js';
import { fetchNBAStats } from './nbaAPI.js';
import { orderBookManager } from './orderBook.js';
import { optionsEngine } from './options.js';
import { shortSellingEngine } from './shortSelling.js';
import { leagueManager } from './leagues.js';
import { circuitBreakerSystem } from './circuitBreaker.js';
import { marketDrivenPricing } from './marketDrivenPricing.js';
import { LimitOrder } from './types.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Track recent trades for volume analysis
const recentTrades = new Map<string, number>();

// ========== SAME API ENDPOINTS AS indexV2.ts ==========
// [All the same endpoints from indexV2.ts - players, orders, options, shorts, leagues, etc.]

app.get('/api/players', (req, res) => {
  res.json(getPlayers());
});

app.get('/api/players/:id', (req, res) => {
  const player = getPlayer(req.params.id);
  if (player) {
    res.json(player);
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});

app.post('/api/orders/limit', (req, res) => {
  const { userId, username, playerId, playerName, type, price, shares } = req.body;

  const order: LimitOrder = {
    id: `order_${Date.now()}_${Math.random()}`,
    userId,
    username,
    playerId,
    playerName,
    type,
    orderType: 'LIMIT',
    price: parseFloat(price),
    shares: parseInt(shares),
    filledShares: 0,
    status: 'OPEN',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };

  const result = orderBookManager.placeLimitOrder(order);

  // Track trade volume for market pressure
  if (result.trades && result.trades.length > 0) {
    const tradeVolume = result.trades.reduce((sum, t) => sum + (t.shares || 0), 0);
    recentTrades.set(playerId, (recentTrades.get(playerId) || 0) + tradeVolume);
  }

  res.json(result);
});

app.delete('/api/orders/:orderId', (req, res) => {
  const { userId } = req.body;
  const result = orderBookManager.cancelOrder(req.params.orderId, userId);
  res.json(result);
});

app.get('/api/orders/user/:userId', (req, res) => {
  const orders = orderBookManager.getUserOrders(req.params.userId);
  res.json(orders);
});

app.get('/api/orderbook/:playerId', (req, res) => {
  const orderBook = orderBookManager.getOrderBook(req.params.playerId);
  if (orderBook) {
    res.json(orderBook);
  } else {
    res.status(404).json({ error: 'Order book not found' });
  }
});

// [All other endpoints from indexV2.ts - options, shorts, leagues, etc.]
// ... (same as indexV2.ts)

// ========== WEBSOCKET HANDLING ==========

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.send(JSON.stringify({
    type: 'INITIAL_DATA',
    data: getPlayers()
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcast(message: any) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

// ========== MARKET-DRIVEN PRICE UPDATES ==========

// Initialize order books
getPlayers().forEach(player => {
  orderBookManager.initializeOrderBook(player);
  shortSellingEngine.initializeAvailableShares(player, 100000);
  recentTrades.set(player.id, 0);
});

// Generate options chains
const playersMap = getPlayersMap();
playersMap.forEach(player => {
  optionsEngine.generateOptionsChain(player);
});

/**
 * MARKET-DRIVEN PRICE UPDATE
 *
 * Prices now reflect:
 * - Order book pressure (buy/sell imbalance)
 * - Trading volume
 * - Short squeeze dynamics
 * - Player stats (fundamentals)
 */
setInterval(() => {
  const updatedPlayers = Array.from(getPlayersMap().values()).map(player => {
    const orderBook = orderBookManager.getOrderBook(player.id);
    if (!orderBook) return player;

    // Get recent trade volume for this player
    const volumeThisUpdate = recentTrades.get(player.id) || 0;

    // Calculate market-driven price
    const newPrice = marketDrivenPricing.calculateMarketPrice(
      player,
      player.currentPrice,
      orderBook,
      volumeThisUpdate
    );

    // Check circuit breaker
    const isHalted = circuitBreakerSystem.checkAndTrigger(player, player.currentPrice);

    if (isHalted) {
      return player; // Keep old price if halted
    }

    // Calculate dynamic bid/ask spread
    const { bidPrice, askPrice } = marketDrivenPricing.calculateDynamicSpread(
      player,
      orderBook
    );

    // Calculate price change
    const priceChange = ((newPrice - player.currentPrice) / player.currentPrice) * 100;

    // Update price history
    const newHistory = [
      ...player.priceHistory.slice(-29),
      {
        date: new Date().toISOString().split('T')[0],
        price: newPrice
      }
    ];

    // Reset recent trades counter
    recentTrades.set(player.id, 0);

    return {
      ...player,
      currentPrice: parseFloat(newPrice.toFixed(2)),
      bidPrice: parseFloat(bidPrice.toFixed(2)),
      askPrice: parseFloat(askPrice.toFixed(2)),
      priceChange: parseFloat(priceChange.toFixed(2)),
      priceHistory: newHistory
    };
  });

  // Update players map
  updatedPlayers.forEach(player => {
    playersMap.set(player.id, player);
  });

  // Update options pricing
  optionsEngine.updateOptionsPricing(playersMap);

  // Broadcast update
  broadcast({
    type: 'PRICE_UPDATE',
    data: updatedPlayers
  });

  console.log(`📊 Market-driven price update broadcasted to ${wss.clients.size} clients`);
}, 30000);

// Cleanup expired orders every minute
setInterval(() => {
  orderBookManager.cleanupExpiredOrders();
}, 60000);

// Fetch NBA stats every 5 minutes
setInterval(async () => {
  try {
    await fetchNBAStats();
    console.log('📡 NBA stats updated');
  } catch (error) {
    console.error('Error updating NBA stats:', error);
  }
}, 300000);

// Listen for order book updates
orderBookManager.on('orderbook_update', (orderBook) => {
  broadcast({
    type: 'ORDERBOOK_UPDATE',
    data: orderBook
  });
});

// Listen for trade executions
orderBookManager.on('trade', (tradeData) => {
  broadcast({
    type: 'TRADE_EXECUTED',
    data: tradeData
  });
});

// Listen for circuit breaker events
circuitBreakerSystem.on('halted', (breaker) => {
  broadcast({
    type: 'CIRCUIT_BREAKER_HALTED',
    data: breaker
  });
});

circuitBreakerSystem.on('resumed', (breaker) => {
  broadcast({
    type: 'CIRCUIT_BREAKER_RESUMED',
    data: breaker
  });
});

// ========== START SERVER ==========

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🏀 NBA Stock Market Server (MARKET-DRIVEN PRICING)`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📊 ${getPlayers().length} players initialized`);
  console.log(`⚡ Real-time updates every 30 seconds`);
  console.log(``);
  console.log(`🎯 MARKET-DRIVEN FEATURES:`);
  console.log(`   ✅ Prices reflect order book pressure`);
  console.log(`   ✅ Trade volume impacts prices`);
  console.log(`   ✅ Short squeezes affect dynamics`);
  console.log(`   ✅ Dynamic bid/ask spreads`);
  console.log(`   ✅ Price impact on large orders`);
  console.log(``);
  console.log(`   📈 30% Fundamentals (player stats)`);
  console.log(`   📊 70% Market Activity (trading)`);
  console.log(``);
  console.log(`🏆 This follows Efficient Market Hypothesis!`);
});
