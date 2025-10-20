import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';
import { getPlayers, getPlayersMap, getPlayer } from './priceEngineV2.js';
import { orderBookManager } from './orderBook.js';
import { optionsEngine } from './options.js';
import { shortSellingEngine } from './shortSelling.js';
import { leagueManager } from './leagues.js';
import { circuitBreakerSystem } from './circuitBreaker.js';
import { liveGameEngine } from './liveGameIntegration.js';
import { LimitOrder } from './types.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// [All the same API endpoints as before - omitted for brevity]

app.get('/api/players', (req, res) => {
  res.json(getPlayers());
});

// New endpoint: Get live games
app.get('/api/live/games', (req, res) => {
  const liveGames = liveGameEngine.getLiveGames();
  res.json(liveGames);
});

// New endpoint: Simulate live game (for testing)
app.post('/api/live/simulate', (req, res) => {
  const players = getPlayers();
  const playerIds = players.map(p => p.id);
  const playerNames = players.map(p => p.name);

  liveGameEngine.simulateLiveGame(playerIds, playerNames);

  res.json({ success: true, message: 'Simulated game started!' });
});

// WebSocket handling
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

// Initialize
getPlayers().forEach(player => {
  orderBookManager.initializeOrderBook(player);
  shortSellingEngine.initializeAvailableShares(player, 100000);
});

const playersMap = getPlayersMap();
playersMap.forEach(player => {
  optionsEngine.generateOptionsChain(player);
});

/**
 * LIVE GAME PRICE UPDATES
 *
 * Prices update based on:
 * 1. Base algorithmic pricing (stats + volatility)
 * 2. Live game events (multiplier from in-game performance)
 */
setInterval(() => {
  const updatedPlayers = Array.from(playersMap.values()).map(player => {
    // Get base price from algorithm
    let newPrice = player.currentPrice;

    // Apply random walk (small)
    const baseChange = (Math.random() - 0.5) * 0.005; // ±0.5%
    newPrice = newPrice * (1 + baseChange);

    // Apply live game multiplier
    const liveMultiplier = liveGameEngine.getPriceMultiplier(player.id);
    newPrice = newPrice * liveMultiplier;

    // Reset multiplier after applying (events are instant, not cumulative)
    if (liveMultiplier !== 1.0) {
      liveGameEngine.getPriceMultiplier(player.id); // Resets to 1.0 after read
    }

    // Check circuit breaker
    const isHalted = circuitBreakerSystem.checkAndTrigger(player, player.currentPrice);
    if (isHalted) {
      return player;
    }

    const priceChange = ((newPrice - player.currentPrice) / player.currentPrice) * 100;

    const updatedPlayer = {
      ...player,
      currentPrice: parseFloat(newPrice.toFixed(2)),
      bidPrice: parseFloat((newPrice * 0.995).toFixed(2)),
      askPrice: parseFloat((newPrice * 1.005).toFixed(2)),
      priceChange: parseFloat(priceChange.toFixed(2))
    };

    playersMap.set(player.id, updatedPlayer);
    return updatedPlayer;
  });

  optionsEngine.updateOptionsPricing(playersMap);

  broadcast({
    type: 'PRICE_UPDATE',
    data: updatedPlayers
  });

  console.log(`📊 Price update (with live game data) → ${wss.clients.size} clients`);
}, 10000); // Update every 10 seconds during games (faster than usual)

/**
 * Poll live games every 15 seconds
 */
setInterval(async () => {
  try {
    await liveGameEngine.pollLiveGames();
  } catch (error) {
    console.error('Error polling live games:', error);
  }
}, 15000);

/**
 * Listen for live game events and broadcast to clients
 */
liveGameEngine.on('game_event', (event) => {
  broadcast({
    type: 'LIVE_GAME_EVENT',
    data: event
  });

  console.log(`🏀 LIVE EVENT: ${event.playerName} - ${event.description}`);
});

// Circuit breaker events
circuitBreakerSystem.on('halted', (breaker) => {
  broadcast({
    type: 'CIRCUIT_BREAKER_HALTED',
    data: breaker
  });
});

// Order book updates
orderBookManager.on('orderbook_update', (orderBook) => {
  broadcast({
    type: 'ORDERBOOK_UPDATE',
    data: orderBook
  });
});

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🏀 NBA Stock Market - LIVE GAME MODE`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📊 ${getPlayers().length} players initialized`);
  console.log(``);
  console.log(`⚡ LIVE GAME FEATURES:`);
  console.log(`   🏀 Real-time game event tracking`);
  console.log(`   📈 Instant price reactions to plays`);
  console.log(`   ⏱️  Updates every 10 seconds during games`);
  console.log(`   🎯 Event-based price multipliers`);
  console.log(``);
  console.log(`📋 Event Impact:`);
  console.log(`   2-pointer: +0.1%`);
  console.log(`   3-pointer: +0.2%`);
  console.log(`   Steal/Block: +0.3%`);
  console.log(`   Turnover: -0.2%`);
  console.log(`   Triple-double: +5%`);
  console.log(`   40-pt game: +8%`);
  console.log(`   50-pt game: +15%`);
  console.log(`   Injury: -15%`);
  console.log(``);
  console.log(`🧪 To test: POST /api/live/simulate`);
});
