import { Player, PlayerStats } from './types.js';

let players: Player[] = [
  {
    id: '1',
    name: 'LeBron James',
    team: 'LAL',
    position: 'SF',
    stats: { ppg: 25.7, rpg: 7.3, apg: 8.3, fgPct: 54.0, threePtPct: 41.0 },
    currentPrice: 142.50,
    bidPrice: 141.79,
    askPrice: 143.21,
    priceChange: 0,
    volume: 125000,
    volatility: 0.25,
    availableShares: 1000000,
    priceHistory: Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 140 + Math.random() * 10
    })),
  },
  {
    id: '2',
    name: 'Stephen Curry',
    team: 'GSW',
    position: 'PG',
    stats: { ppg: 29.4, rpg: 6.1, apg: 6.3, fgPct: 48.2, threePtPct: 42.7 },
    currentPrice: 156.25,
    bidPrice: 155.47,
    askPrice: 157.03,
    priceChange: 0,
    volume: 98000,
    volatility: 0.28,
    availableShares: 950000,
    priceHistory: Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 155 + Math.random() * 10
    })),
  },
  {
    id: '3',
    name: 'Giannis Antetokounmpo',
    team: 'MIL',
    position: 'PF',
    stats: { ppg: 31.1, rpg: 11.8, apg: 5.7, fgPct: 55.3, threePtPct: 27.5 },
    currentPrice: 168.75,
    bidPrice: 167.91,
    askPrice: 169.59,
    priceChange: 0,
    volume: 87500,
    volatility: 0.24,
    availableShares: 900000,
    priceHistory: Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 165 + Math.random() * 10
    })),
  },
  {
    id: '4',
    name: 'Luka Doncic',
    team: 'DAL',
    position: 'PG',
    stats: { ppg: 28.4, rpg: 9.1, apg: 8.7, fgPct: 47.9, threePtPct: 37.5 },
    currentPrice: 159.50,
    bidPrice: 158.70,
    askPrice: 160.30,
    priceChange: 0,
    volume: 112000,
    volatility: 0.26,
    availableShares: 1100000,
    priceHistory: Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 157 + Math.random() * 10
    })),
  },
  {
    id: '5',
    name: 'Kevin Durant',
    team: 'PHX',
    position: 'SF',
    stats: { ppg: 29.1, rpg: 6.7, apg: 5.0, fgPct: 56.0, threePtPct: 40.5 },
    currentPrice: 154.00,
    bidPrice: 153.23,
    askPrice: 154.77,
    priceChange: 0,
    volume: 76000,
    volatility: 0.22,
    availableShares: 800000,
    priceHistory: Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 152 + Math.random() * 10
    })),
  },
  {
    id: '6',
    name: 'Joel Embiid',
    team: 'PHI',
    position: 'C',
    stats: { ppg: 33.1, rpg: 10.2, apg: 4.2, fgPct: 54.8, threePtPct: 37.0 },
    currentPrice: 172.25,
    bidPrice: 171.39,
    askPrice: 173.11,
    priceChange: 0,
    volume: 94000,
    volatility: 0.27,
    availableShares: 850000,
    priceHistory: Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 170 + Math.random() * 10
    })),
  },
  {
    id: '7',
    name: 'Nikola Jokic',
    team: 'DEN',
    position: 'C',
    stats: { ppg: 24.5, rpg: 11.8, apg: 9.8, fgPct: 63.2, threePtPct: 35.9 },
    currentPrice: 165.80,
    bidPrice: 164.97,
    askPrice: 166.63,
    priceChange: 0,
    volume: 102000,
    volatility: 0.23,
    availableShares: 980000,
    priceHistory: Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 163 + Math.random() * 10
    })),
  },
  {
    id: '8',
    name: 'Jayson Tatum',
    team: 'BOS',
    position: 'SF',
    stats: { ppg: 30.1, rpg: 8.8, apg: 4.6, fgPct: 46.6, threePtPct: 35.3 },
    currentPrice: 148.90,
    bidPrice: 148.16,
    askPrice: 149.64,
    priceChange: 0,
    volume: 88000,
    volatility: 0.25,
    availableShares: 920000,
    priceHistory: Array(30).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 147 + Math.random() * 10
    })),
  },
];

// Calculate price based on player performance
function calculatePrice(stats: PlayerStats, basePrice: number): number {
  // Weighted formula based on stats
  const performanceScore =
    (stats.ppg * 0.4) +
    (stats.rpg * 0.2) +
    (stats.apg * 0.2) +
    (stats.fgPct * 0.1) +
    (stats.threePtPct * 0.1);

  // Performance factor (normalize around 1.0 for average performance)
  const avgPerformanceScore = 45; // Rough average based on player stats
  const performanceFactor = performanceScore / avgPerformanceScore;

  // Add some market volatility (random fluctuation but with slight upward bias)
  const marketTrend = 0.0002; // Slight upward bias (0.02% per update)
  const volatility = (Math.random() - 0.48) * 0.02; // Slightly positive bias (-0.48 instead of -0.5)
  
  const totalChange = marketTrend + volatility + (performanceFactor - 1) * 0.001;
  const newPrice = basePrice * (1 + totalChange);
  
  return Math.max(10, newPrice); // Minimum price of $10
}

export function updatePlayerPrices(): Player[] {
  players = players.map(player => {
    const oldPrice = player.currentPrice;
    const newPrice = calculatePrice(player.stats, oldPrice);
    const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;

    // Calculate bid/ask spread (0.5% each side)
    const bidPrice = newPrice * 0.995;
    const askPrice = newPrice * 1.005;

    // Update price history (keep last 30 days)
    const newHistory = [
      ...player.priceHistory.slice(-29),
      {
        date: new Date().toISOString().split('T')[0],
        price: newPrice
      }
    ];

    // Simulate volume changes
    const volumeChange = Math.floor((Math.random() - 0.5) * 10000);
    const newVolume = Math.max(50000, player.volume + volumeChange);

    return {
      ...player,
      currentPrice: parseFloat(newPrice.toFixed(2)),
      bidPrice: parseFloat(bidPrice.toFixed(2)),
      askPrice: parseFloat(askPrice.toFixed(2)),
      priceChange: parseFloat(priceChange.toFixed(2)),
      priceHistory: newHistory,
      volume: newVolume
    };
  });

  return players;
}

export function getPlayers(): Player[] {
  return players;
}

export function updatePlayerStats(playerId: string, newStats: Partial<PlayerStats>): void {
  players = players.map(player => {
    if (player.id === playerId) {
      return {
        ...player,
        stats: { ...player.stats, ...newStats }
      };
    }
    return player;
  });
}
