import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import http from 'http';
import { updatePlayerPrices, getPlayers } from './priceEngine.js';
import { fetchNBAStats } from './nbaAPI.js';
import { optionsEngine } from './options.js';
import { leagueManager } from './leagues.js';
import { Player } from './types.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Initialize options chains for all players
function initializeOptionsChains() {
  const players = getPlayers();
  players.forEach(player => {
    optionsEngine.generateOptionsChain(player);
  });
  console.log('Options chains initialized for all players');
}

// REST API endpoints
app.get('/api/players', (req, res) => {
  res.json(getPlayers());
});

app.get('/api/players/:id', (req, res) => {
  const players = getPlayers();
  const player = players.find(p => p.id === req.params.id);
  if (player) {
    res.json(player);
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});

// Options API endpoints
app.get('/api/options/chain/:playerId', (req, res) => {
  try {
    const playerId = req.params.playerId;
    const optionsChain = optionsEngine.getOptionsChain(playerId);
    res.json(optionsChain);
  } catch (error) {
    console.error('Error fetching options chain:', error);
    res.status(500).json({ error: 'Failed to fetch options chain' });
  }
});

app.get('/api/options/positions/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const positions = optionsEngine.getUserPositions(userId);
    res.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

app.post('/api/options/buy', (req, res) => {
  try {
    const { userId, optionId, contracts } = req.body;
    
    if (!userId || !optionId || !contracts || contracts <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request parameters' 
      });
    }

    const result = optionsEngine.buyOption(userId, optionId, contracts);
    res.json(result);
  } catch (error) {
    console.error('Error buying option:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to buy option' 
    });
  }
});

app.post('/api/options/exercise', (req, res) => {
  try {
    const { userId, positionId } = req.body;
    
    if (!userId || !positionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request parameters' 
      });
    }

    const result = optionsEngine.exerciseOption(userId, positionId);
    res.json(result);
  } catch (error) {
    console.error('Error exercising option:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to exercise option' 
    });
  }
});

app.get('/api/stats/update', async (req, res) => {
  try {
    await fetchNBAStats();
    res.json({ success: true, message: 'Stats updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

// ========== LEAGUES ENDPOINTS ==========

app.post('/api/leagues/create', (req, res) => {
  const { creatorId, name, description, startingBalance, settings, isPrivate } = req.body;
  const result = leagueManager.createLeague(
    creatorId,
    name,
    description || '',
    parseFloat(startingBalance) || 100000,
    settings,
    isPrivate !== false
  );
  res.json(result);
});

app.post('/api/leagues/join', (req, res) => {
  const { userId, inviteCode } = req.body;
  const result = leagueManager.joinLeague(userId, inviteCode);
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
  const leaderboard = leagueManager.getLeaderboard(req.params.leagueId);
  if (leaderboard) {
    res.json(leaderboard);
  } else {
    res.status(404).json({ error: 'League not found' });
  }
});

app.get('/api/leagues/user/:userId', (req, res) => {
  const leagues = leagueManager.getUserLeagues(req.params.userId);
  res.json(leagues);
});

app.get('/api/leagues/public', (req, res) => {
  const leagues = leagueManager.getPublicLeagues();
  res.json(leagues);
});

// Portfolio endpoint for trading context
app.get('/api/portfolio/:userId', (req, res) => {
  res.json({
    userId: req.params.userId,
    cash: 100000,
    holdings: {},
    totalValue: 100000,
    transactions: [],
    optionPositions: [],
    shortPositions: []
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send initial player data
  ws.send(JSON.stringify({
    type: 'INITIAL_DATA',
    data: getPlayers()
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Broadcast price updates to all connected clients
function broadcastPriceUpdate(players: Player[]) {
  const message = JSON.stringify({
    type: 'PRICE_UPDATE',
    data: players
  });

  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Update prices every 30 seconds
setInterval(() => {
  const updatedPlayers = updatePlayerPrices();
  
  // Update options pricing based on new player prices
  const playersMap = new Map(updatedPlayers.map(p => [p.id, p]));
  optionsEngine.updateOptionsPricing(playersMap);
  
  broadcastPriceUpdate(updatedPlayers);
  console.log('Price update broadcasted to', wss.clients.size, 'clients');
}, 30000);

// Fetch new NBA stats every 5 minutes
setInterval(async () => {
  try {
    await fetchNBAStats();
    console.log('NBA stats updated');
  } catch (error) {
    console.error('Error updating NBA stats:', error);
  }
}, 300000);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
  
  // Initialize options chains after server starts
  initializeOptionsChains();
});
