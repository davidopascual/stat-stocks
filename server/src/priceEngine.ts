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
  priceChange: number;
  priceHistory: { date: string; price: number }[];
  volume: number;
}

let players: Player[] = [
  {
    id: '1',
    name: 'LeBron James',
    team: 'LAL',
    position: 'SF',
    stats: { ppg: 25.7, rpg: 7.3, apg: 8.3, fgPct: 54.0, threePtPct: 41.0 },
    currentPrice: 142.50,
    priceChange: 0,
    volume: 125000,
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
    priceChange: 0,
    volume: 98000,
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
    priceChange: 0,
    volume: 87500,
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
    priceChange: 0,
    volume: 112000,
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
    priceChange: 0,
    volume: 76000,
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
    priceChange: 0,
    volume: 94000,
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
    priceChange: 0,
    volume: 102000,
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
    priceChange: 0,
    volume: 88000,
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

  // Add some market volatility (random fluctuation)
  const volatility = (Math.random() - 0.5) * 0.02; // ±1%

  const newPrice = basePrice * (1 + volatility);
  return Math.max(10, newPrice); // Minimum price of $10
}

export function updatePlayerPrices(): Player[] {
  players = players.map(player => {
    const oldPrice = player.currentPrice;
    const newPrice = calculatePrice(player.stats, oldPrice);
    const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;

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
