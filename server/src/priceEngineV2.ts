import { Player, PlayerStats } from './types.js';
import { circuitBreakerSystem } from './circuitBreaker.js';

let players: Map<string, Player> = new Map();

// Initialize players with enhanced data
export function initializePlayers(): void {
  const playerData = [
    { id: '1', name: 'LeBron James', team: 'LAL', position: 'SF', stats: { ppg: 25.7, rpg: 7.3, apg: 8.3, fgPct: 54.0, threePtPct: 41.0 }, basePrice: 142.50 },
    { id: '2', name: 'Stephen Curry', team: 'GSW', position: 'PG', stats: { ppg: 29.4, rpg: 6.1, apg: 6.3, fgPct: 48.2, threePtPct: 42.7 }, basePrice: 156.25 },
    { id: '3', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', stats: { ppg: 31.1, rpg: 11.8, apg: 5.7, fgPct: 55.3, threePtPct: 27.5 }, basePrice: 168.75 },
    { id: '4', name: 'Luka Doncic', team: 'DAL', position: 'PG', stats: { ppg: 28.4, rpg: 9.1, apg: 8.7, fgPct: 47.9, threePtPct: 37.5 }, basePrice: 159.50 },
    { id: '5', name: 'Kevin Durant', team: 'PHX', position: 'SF', stats: { ppg: 29.1, rpg: 6.7, apg: 5.0, fgPct: 56.0, threePtPct: 40.5 }, basePrice: 154.00 },
    { id: '6', name: 'Joel Embiid', team: 'PHI', position: 'C', stats: { ppg: 33.1, rpg: 10.2, apg: 4.2, fgPct: 54.8, threePtPct: 37.0 }, basePrice: 172.25 },
    { id: '7', name: 'Nikola Jokic', team: 'DEN', position: 'C', stats: { ppg: 24.5, rpg: 11.8, apg: 9.8, fgPct: 63.2, threePtPct: 35.9 }, basePrice: 165.80 },
    { id: '8', name: 'Jayson Tatum', team: 'BOS', position: 'SF', stats: { ppg: 30.1, rpg: 8.8, apg: 4.6, fgPct: 46.6, threePtPct: 35.3 }, basePrice: 148.90 },
  ];

  playerData.forEach(data => {
    const priceHistory = Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: data.basePrice + (Math.random() - 0.5) * 10
    }));

    const volatility = calculateVolatility(priceHistory.map(p => p.price));

    const player: Player = {
      ...data,
      currentPrice: data.basePrice,
      bidPrice: data.basePrice * 0.995, // 0.5% below
      askPrice: data.basePrice * 1.005, // 0.5% above
      priceChange: 0,
      priceHistory,
      volume: Math.floor(50000 + Math.random() * 100000),
      volatility,
      availableShares: 100000 // For short selling
    };

    players.set(player.id, player);
  });
}

function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0.1;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize (assuming daily data)
  return stdDev * Math.sqrt(252);
}

export function updatePlayerPrices(): Player[] {
  const updatedPlayers: Player[] = [];

  for (const [id, player] of players.entries()) {
    const oldPrice = player.currentPrice;

    // Calculate new price
    const newPrice = calculatePrice(player.stats, oldPrice, player.volatility);

    // Check circuit breaker
    const isHalted = circuitBreakerSystem.checkAndTrigger(player, oldPrice);

    if (!isHalted) {
      const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;

      // Update bid/ask spread (0.5% around current price)
      const bidPrice = newPrice * 0.995;
      const askPrice = newPrice * 1.005;

      // Update price history
      const newHistory = [
        ...player.priceHistory.slice(-29),
        {
          date: new Date().toISOString().split('T')[0],
          price: newPrice
        }
      ];

      // Recalculate volatility
      const volatility = calculateVolatility(newHistory.map(p => p.price));

      // Simulate volume changes
      const volumeChange = Math.floor((Math.random() - 0.5) * 20000);
      const newVolume = Math.max(50000, player.volume + volumeChange);

      const updatedPlayer: Player = {
        ...player,
        currentPrice: parseFloat(newPrice.toFixed(2)),
        bidPrice: parseFloat(bidPrice.toFixed(2)),
        askPrice: parseFloat(askPrice.toFixed(2)),
        priceChange: parseFloat(priceChange.toFixed(2)),
        priceHistory: newHistory,
        volume: newVolume,
        volatility: parseFloat(volatility.toFixed(4))
      };

      players.set(id, updatedPlayer);
      updatedPlayers.push(updatedPlayer);
    } else {
      updatedPlayers.push(player); // Keep old price if halted
    }
  }

  return updatedPlayers;
}

function calculatePrice(stats: PlayerStats, basePrice: number, volatility: number): number {
  // Performance score
  const performanceScore =
    (stats.ppg * 0.4) +
    (stats.rpg * 0.2) +
    (stats.apg * 0.2) +
    (stats.fgPct * 0.1) +
    (stats.threePtPct * 0.1);

  // Market volatility
  const marketVolatility = (Math.random() - 0.5) * 0.02 * (1 + volatility);

  // Trend momentum (make prices slightly trend)
  const momentum = (Math.random() - 0.48) * 0.005; // Slight upward bias

  const newPrice = basePrice * (1 + marketVolatility + momentum);

  return Math.max(10, newPrice); // Minimum $10
}

export function getPlayers(): Player[] {
  return Array.from(players.values());
}

export function getPlayersMap(): Map<string, Player> {
  return players;
}

export function getPlayer(id: string): Player | undefined {
  return players.get(id);
}

export function updatePlayerStats(playerId: string, newStats: Partial<PlayerStats>): void {
  const player = players.get(playerId);
  if (player) {
    player.stats = { ...player.stats, ...newStats };
  }
}

// Initialize on module load
initializePlayers();
