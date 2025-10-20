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
import { LimitOrder } from './types.js';
import authRoutes from './authRoutes.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// ========== PLAYER ENDPOINTS ==========

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

// ========== ORDER BOOK ENDPOINTS ==========

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
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  };

  const result = orderBookManager.placeLimitOrder(order);
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

// ========== OPTIONS ENDPOINTS ==========

app.get('/api/options/chain/:playerId', (req, res) => {
  const chain = optionsEngine.getOptionsChain(req.params.playerId);
  res.json(chain);
});

app.post('/api/options/buy', (req, res) => {
  const { userId, optionId, contracts } = req.body;
  
  // Validate league restrictions
  const validation = leagueManager.validateTradeForUser(userId, 'options');
  if (!validation.allowed) {
    return res.status(403).json({
      success: false,
      error: validation.message,
      restrictingLeagues: validation.restrictingLeagues
    });
  }
  
  const result = optionsEngine.buyOption(userId, optionId, parseInt(contracts));
  res.json(result);
});

app.post('/api/options/sell', (req, res) => {
  const { userId, optionId, contracts } = req.body;
  
  // Validate league restrictions
  const validation = leagueManager.validateTradeForUser(userId, 'options');
  if (!validation.allowed) {
    return res.status(403).json({
      success: false,
      error: validation.message,
      restrictingLeagues: validation.restrictingLeagues
    });
  }
  
  const result = optionsEngine.sellOption(userId, optionId, parseInt(contracts));
  res.json(result);
});

app.post('/api/options/exercise', (req, res) => {
  const { userId, positionId } = req.body;
  const result = optionsEngine.exerciseOption(userId, positionId);
  res.json(result);
});

app.get('/api/options/positions/:userId', (req, res) => {
  const positions = optionsEngine.getUserPositions(req.params.userId);
  res.json(positions);
});

// ========== SHORT SELLING ENDPOINTS ==========

app.post('/api/short/sell', (req, res) => {
  const { userId, playerId, shares } = req.body;
  
  // Validate league restrictions
  const validation = leagueManager.validateTradeForUser(userId, 'short');
  if (!validation.allowed) {
    return res.status(403).json({
      success: false,
      error: validation.message,
      restrictingLeagues: validation.restrictingLeagues
    });
  }
  
  const player = getPlayer(playerId);
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }

  const result = shortSellingEngine.shortSell(userId, player, parseInt(shares));
  res.json(result);
});

app.post('/api/short/cover', (req, res) => {
  const { userId, playerId, shares, currentPrice } = req.body;
  const result = shortSellingEngine.coverShort(
    userId,
    playerId,
    parseInt(shares),
    parseFloat(currentPrice)
  );
  res.json(result);
});

app.get('/api/short/positions/:userId', (req, res) => {
  const positions = shortSellingEngine.getUserShortPositions(req.params.userId);
  res.json(positions);
});

app.get('/api/short/available/:playerId', (req, res) => {
  const available = shortSellingEngine.getAvailableShares(req.params.playerId);
  res.json({ playerId: req.params.playerId, availableShares: available });
});

// ========== LEAGUE ENDPOINTS ==========

app.post('/api/leagues/create', (req, res) => {
  const { creatorId, name, description, startingBalance, settings, isPrivate } = req.body;
  const result = leagueManager.createLeague(
    creatorId,
    name,
    description,
    parseFloat(startingBalance),
    settings,
    isPrivate
  );
  res.json(result);
});

app.post('/api/leagues/join', (req, res) => {
  const { userId, inviteCode } = req.body;
  const result = leagueManager.joinLeague(userId, inviteCode);
  
  // Add activity if join was successful
  if (result.success && result.league) {
    const user = leagueManager.getUser(userId);
    if (user) {
      leagueManager.addActivity(
        result.league.id,
        'MEMBER_JOINED',
        userId,
        `${user.username} joined the league`
      );
    }
  }
  
  res.json(result);
});

app.post('/api/leagues/:leagueId/leave', (req, res) => {
  const { userId } = req.body;
  const result = leagueManager.leaveLeague(userId, req.params.leagueId);
  res.json(result);
});

app.delete('/api/leagues/:leagueId', (req, res) => {
  const { userId } = req.body;
  const result = leagueManager.deleteLeague(userId, req.params.leagueId);
  res.json(result);
});

app.get('/api/leagues/:leagueId', (req, res) => {
  const league = leagueManager.getLeague(req.params.leagueId);
  if (league) {
    res.json(league);
  } else {
    res.status(404).json({ error: 'League not found' });
  }
});

app.get('/api/leagues/:leagueId/leaderboard', (req, res) => {
  // Update leaderboard before returning it
  leagueManager.updateLeaderboardForLeague(req.params.leagueId);
  
  const leaderboard = leagueManager.getLeaderboard(req.params.leagueId);
  if (leaderboard) {
    res.json(leaderboard);
  } else {
    res.status(404).json({ error: 'Leaderboard not found' });
  }
});

app.get('/api/leagues/:leagueId/members', (req, res) => {
  const members = leagueManager.getLeagueMembers(req.params.leagueId);
  res.json(members);
});

app.get('/api/leagues/user/:userId', (req, res) => {
  const leagues = leagueManager.getUserLeagues(req.params.userId);
  res.json(leagues);
});

app.get('/api/leagues/public', (req, res) => {
  const leagues = leagueManager.getPublicLeagues();
  res.json(leagues);
});

// Enhanced league endpoints
app.get('/api/leagues/:leagueId/stats', (req, res) => {
  const stats = leagueManager.getLeagueStats(req.params.leagueId);
  if (stats) {
    res.json(stats);
  } else {
    res.status(404).json({ error: 'League stats not found' });
  }
});

app.get('/api/leagues/:leagueId/activity', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const activity = leagueManager.getLeagueActivity(req.params.leagueId, limit);
  res.json(activity);
});

app.get('/api/leagues/:leagueId/leaderboard/enhanced', (req, res) => {
  const leaderboard = leagueManager.getEnhancedLeaderboard(req.params.leagueId);
  res.json(leaderboard);
});

app.post('/api/leagues/:leagueId/leaderboard/refresh', (req, res) => {
  try {
    leagueManager.updateLeaderboardRealtime(req.params.leagueId);
    res.json({ success: true, message: 'Leaderboard updated' });
  } catch (err) {
    console.error('Error updating leaderboard:', err);
    res.status(500).json({ error: 'Failed to update leaderboard' });
  }
});

// Testing endpoint for league features
app.get('/api/leagues/test-features/:userId', (req, res) => {
  const userId = req.params.userId;
  const testResults = {
    user: leagueManager.getUser(userId),
    userLeagues: leagueManager.getUserLeagues(userId),
    optionsValidation: leagueManager.validateTradeForUser(userId, 'options'),
    shortValidation: leagueManager.validateTradeForUser(userId, 'short'),
    marginValidation: leagueManager.validateTradeForUser(userId, 'margin', 2),
    tradingFees: leagueManager.calculateTradingFees(userId, 10000)
  };
  
  res.json(testResults);
});

// Demo user endpoint - creates or returns existing demo user
app.get('/api/users/demo', (req, res) => {
  const demoUserId = 'demo-user';
  let demoUser = leagueManager.getUser(demoUserId);
  
  if (!demoUser) {
    // Create demo user if it doesn't exist
    demoUser = leagueManager.registerUser('Demo User', 'demo@example.com', 100000);
    // Manually set the ID to 'demo-user' for consistency
    leagueManager.setUserWithId(demoUserId, demoUser);
  }
  
  res.json(demoUser);
});

// ========== AUTHENTICATION ENDPOINTS ==========

app.get('/api/auth/verify', (req, res) => {
  // Simple auth verification - return success for demo purposes
  res.json({ 
    success: true, 
    user: { 
      id: 'demo-user', 
      username: 'Demo User', 
      email: 'demo@example.com' 
    } 
  });
});

// ========== PORTFOLIO ENDPOINTS ==========

app.get('/api/portfolio/:userId', (req, res) => {
  const userId = req.params.userId;
  const user = leagueManager.getUser(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Return basic portfolio structure
  res.json({
    cash: user.cash,
    positions: [], // Empty positions array for demo
    totalValue: user.totalValue,
    percentageReturn: user.percentageReturn
  });
});

// ========== USER ENDPOINTS ==========

app.post('/api/users/register', (req, res) => {
  const { username, email, startingBalance } = req.body;
  const user = leagueManager.registerUser(username, email, parseFloat(startingBalance));
  res.json(user);
});

app.get('/api/users/:userId', (req, res) => {
  const user = leagueManager.getUser(req.params.userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// ========== CIRCUIT BREAKER ENDPOINTS ==========

app.get('/api/circuit-breakers', (req, res) => {
  const breakers = circuitBreakerSystem.getAllActiveBreakers();
  res.json(breakers);
});

app.get('/api/circuit-breakers/:playerId', (req, res) => {
  const breaker = circuitBreakerSystem.getBreaker(req.params.playerId);
  if (breaker) {
    res.json(breaker);
  } else {
    res.json({ halted: false });
  }
});

// ========== STATS UPDATE ENDPOINT ==========

app.get('/api/stats/update', async (req, res) => {
  try {
    await fetchNBAStats();
    res.json({ success: true, message: 'Stats updated' });
  } catch (err) {
    console.error('Error updating NBA stats:', err);
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// ========== WEBSOCKET HANDLING ==========

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial data
  ws.send(JSON.stringify({
    type: 'INITIAL_DATA',
    data: getPlayers()
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast to all connected clients
function broadcast(message: unknown) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

// ========== BACKGROUND PROCESSES ==========

// Initialize order books for all players
getPlayers().forEach(player => {
  orderBookManager.initializeOrderBook(player);
  shortSellingEngine.initializeAvailableShares(player, 100000);
});

// Generate options chains
const playersMap = getPlayersMap();
playersMap.forEach(player => {
  optionsEngine.generateOptionsChain(player);
});

// Set up league WebSocket broadcast callback
leagueManager.setBroadcastCallback((leagueId: string, event: string, data: unknown) => {
  broadcast({
    type: 'LEAGUE_UPDATE',
    leagueId,
    event,
    data
  });
});

// Update prices every 30 seconds
setInterval(() => {
  const updatedPlayers = updatePlayerPrices();

  // Update options pricing
  optionsEngine.updateOptionsPricing(getPlayersMap());

  broadcast({
    type: 'PRICE_UPDATE',
    data: updatedPlayers
  });

  console.log(`📊 Price update broadcasted to ${wss.clients.size} clients`);
}, 30000);

// Cleanup expired orders every minute
setInterval(() => {
  orderBookManager.cleanupExpiredOrders();
}, 60000);

// Fetch new NBA stats every 5 minutes
setInterval(async () => {
  try {
    await fetchNBAStats();
    console.log('📡 NBA stats updated');
  } catch (error) {
    console.error('Error updating NBA stats:', error);
  }
}, 300000);

// Update league leaderboards every 2 minutes
setInterval(() => {
  try {
    leagueManager.updateAllLeaderboardsRealtime();
    console.log('🏆 League leaderboards updated');
  } catch (error) {
    console.error('Error updating league leaderboards:', error);
  }
}, 120000);

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
  console.log(`🏀 NBA Stock Market Server`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📊 ${getPlayers().length} players initialized`);
  console.log(`⚡ Real-time updates every 30 seconds`);
  console.log(`🎯 Features enabled:`);
  console.log(`   - Order Book & Limit Orders`);
  console.log(`   - Options Trading (Calls & Puts)`);
  console.log(`   - Short Selling`);
  console.log(`   - Leagues & Leaderboards`);
  console.log(`   - Circuit Breakers`);
  console.log(`   - Bid/Ask Spreads`);
});
