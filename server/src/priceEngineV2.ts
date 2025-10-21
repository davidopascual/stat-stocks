import { Player, PlayerStats } from './types.js';
import { circuitBreakerSystem } from './circuitBreaker.js';

let players: Map<string, Player> = new Map();

// Initialize players with enhanced data
export function initializePlayers(): void {
  const playerData = [
    // Top Tier Stars
    { id: '1', name: 'LeBron James', team: 'LAL', position: 'SF', stats: { ppg: 25.7, rpg: 7.3, apg: 8.3, fgPct: 54.0, threePtPct: 41.0 }, basePrice: 142.50 },
    { id: '2', name: 'Stephen Curry', team: 'GSW', position: 'PG', stats: { ppg: 29.4, rpg: 6.1, apg: 6.3, fgPct: 48.2, threePtPct: 42.7 }, basePrice: 156.25 },
    { id: '3', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', stats: { ppg: 31.1, rpg: 11.8, apg: 5.7, fgPct: 55.3, threePtPct: 27.5 }, basePrice: 168.75 },
    { id: '4', name: 'Luka Doncic', team: 'DAL', position: 'PG', stats: { ppg: 28.4, rpg: 9.1, apg: 8.7, fgPct: 47.9, threePtPct: 37.5 }, basePrice: 159.50 },
    { id: '5', name: 'Kevin Durant', team: 'PHX', position: 'SF', stats: { ppg: 29.1, rpg: 6.7, apg: 5.0, fgPct: 56.0, threePtPct: 40.5 }, basePrice: 154.00 },
    { id: '6', name: 'Joel Embiid', team: 'PHI', position: 'C', stats: { ppg: 33.1, rpg: 10.2, apg: 4.2, fgPct: 54.8, threePtPct: 37.0 }, basePrice: 172.25 },
    { id: '7', name: 'Nikola Jokic', team: 'DEN', position: 'C', stats: { ppg: 24.5, rpg: 11.8, apg: 9.8, fgPct: 63.2, threePtPct: 35.9 }, basePrice: 165.80 },
    { id: '8', name: 'Jayson Tatum', team: 'BOS', position: 'SF', stats: { ppg: 30.1, rpg: 8.8, apg: 4.6, fgPct: 46.6, threePtPct: 35.3 }, basePrice: 148.90 },
    { id: '9', name: 'Damian Lillard', team: 'MIL', position: 'PG', stats: { ppg: 25.0, rpg: 4.2, apg: 7.0, fgPct: 42.1, threePtPct: 35.4 }, basePrice: 138.40 },
    { id: '10', name: 'Anthony Davis', team: 'LAL', position: 'PF', stats: { ppg: 25.9, rpg: 12.5, apg: 3.1, fgPct: 56.3, threePtPct: 25.7 }, basePrice: 151.60 },

    // All-Stars
    { id: '11', name: 'Devin Booker', team: 'PHX', position: 'SG', stats: { ppg: 27.1, rpg: 4.5, apg: 6.7, fgPct: 47.0, threePtPct: 36.4 }, basePrice: 144.30 },
    { id: '12', name: 'Kawhi Leonard', team: 'LAC', position: 'SF', stats: { ppg: 23.7, rpg: 6.1, apg: 3.9, fgPct: 51.2, threePtPct: 41.7 }, basePrice: 136.50 },
    { id: '13', name: 'Ja Morant', team: 'MEM', position: 'PG', stats: { ppg: 26.2, rpg: 5.9, apg: 8.1, fgPct: 46.6, threePtPct: 30.7 }, basePrice: 128.75 },
    { id: '14', name: 'Donovan Mitchell', team: 'CLE', position: 'SG', stats: { ppg: 28.3, rpg: 4.4, apg: 4.3, fgPct: 48.4, threePtPct: 38.6 }, basePrice: 132.20 },
    { id: '15', name: 'Jimmy Butler', team: 'MIA', position: 'SF', stats: { ppg: 22.9, rpg: 5.9, apg: 5.3, fgPct: 53.9, threePtPct: 35.0 }, basePrice: 125.80 },
    { id: '16', name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'PG', stats: { ppg: 30.1, rpg: 5.5, apg: 6.2, fgPct: 53.5, threePtPct: 35.3 }, basePrice: 158.90 },
    { id: '17', name: 'Jaylen Brown', team: 'BOS', position: 'SG', stats: { ppg: 23.0, rpg: 5.5, apg: 3.6, fgPct: 49.9, threePtPct: 35.4 }, basePrice: 135.20 },
    { id: '18', name: 'Tyrese Haliburton', team: 'IND', position: 'PG', stats: { ppg: 20.1, rpg: 3.9, apg: 10.9, fgPct: 47.7, threePtPct: 36.4 }, basePrice: 128.50 },
    { id: '19', name: 'Paul George', team: 'PHI', position: 'SF', stats: { ppg: 22.6, rpg: 5.2, apg: 3.5, fgPct: 47.1, threePtPct: 41.3 }, basePrice: 130.40 },
    { id: '20', name: 'Kyrie Irving', team: 'DAL', position: 'PG', stats: { ppg: 25.6, rpg: 5.0, apg: 5.2, fgPct: 49.7, threePtPct: 41.1 }, basePrice: 141.20 },

    // Rising Stars & Solid Starters
    { id: '21', name: 'Trae Young', team: 'ATL', position: 'PG', stats: { ppg: 25.7, rpg: 2.8, apg: 10.8, fgPct: 43.0, threePtPct: 37.3 }, basePrice: 134.60 },
    { id: '22', name: 'Karl-Anthony Towns', team: 'NYK', position: 'C', stats: { ppg: 21.8, rpg: 8.3, apg: 2.0, fgPct: 50.4, threePtPct: 41.6 }, basePrice: 126.30 },
    { id: '23', name: 'Bam Adebayo', team: 'MIA', position: 'C', stats: { ppg: 19.3, rpg: 10.4, apg: 3.9, fgPct: 55.1, threePtPct: 35.7 }, basePrice: 118.90 },
    { id: '24', name: 'De\'Aaron Fox', team: 'SAC', position: 'PG', stats: { ppg: 26.6, rpg: 4.6, apg: 5.6, fgPct: 46.5, threePtPct: 36.9 }, basePrice: 137.40 },
    { id: '25', name: 'Zion Williamson', team: 'NOP', position: 'PF', stats: { ppg: 22.9, rpg: 5.8, apg: 5.0, fgPct: 57.0, threePtPct: 33.3 }, basePrice: 129.80 },
    { id: '26', name: 'LaMelo Ball', team: 'CHA', position: 'PG', stats: { ppg: 23.9, rpg: 5.1, apg: 8.0, fgPct: 43.3, threePtPct: 35.2 }, basePrice: 127.50 },
    { id: '27', name: 'Domantas Sabonis', team: 'SAC', position: 'C', stats: { ppg: 19.4, rpg: 13.7, apg: 8.2, fgPct: 61.5, threePtPct: 37.9 }, basePrice: 122.70 },
    { id: '28', name: 'Paolo Banchero', team: 'ORL', position: 'PF', stats: { ppg: 22.6, rpg: 6.9, apg: 5.4, fgPct: 45.5, threePtPct: 33.9 }, basePrice: 124.90 },
    { id: '29', name: 'Franz Wagner', team: 'ORL', position: 'SF', stats: { ppg: 19.7, rpg: 5.3, apg: 3.7, fgPct: 48.2, threePtPct: 28.1 }, basePrice: 115.60 },
    { id: '30', name: 'Scottie Barnes', team: 'TOR', position: 'SF', stats: { ppg: 19.9, rpg: 8.2, apg: 6.1, fgPct: 47.2, threePtPct: 34.1 }, basePrice: 118.40 },

    // Quality Starters
    { id: '31', name: 'Jalen Brunson', team: 'NYK', position: 'PG', stats: { ppg: 28.7, rpg: 3.6, apg: 6.7, fgPct: 47.9, threePtPct: 40.1 }, basePrice: 142.30 },
    { id: '32', name: 'Jaren Jackson Jr.', team: 'MEM', position: 'PF', stats: { ppg: 22.5, rpg: 5.5, apg: 2.3, fgPct: 44.1, threePtPct: 31.6 }, basePrice: 121.80 },
    { id: '33', name: 'Jrue Holiday', team: 'BOS', position: 'PG', stats: { ppg: 12.5, rpg: 5.4, apg: 4.8, fgPct: 42.9, threePtPct: 42.9 }, basePrice: 108.90 },
    { id: '34', name: 'Kristaps Porzingis', team: 'BOS', position: 'C', stats: { ppg: 20.1, rpg: 7.2, apg: 1.9, fgPct: 51.6, threePtPct: 37.5 }, basePrice: 119.50 },
    { id: '35', name: 'DeMar DeRozan', team: 'SAC', position: 'SG', stats: { ppg: 24.0, rpg: 4.3, apg: 5.3, fgPct: 48.0, threePtPct: 33.3 }, basePrice: 128.60 },
    { id: '36', name: 'Bradley Beal', team: 'PHX', position: 'SG', stats: { ppg: 18.2, rpg: 4.4, apg: 5.0, fgPct: 51.3, threePtPct: 43.0 }, basePrice: 114.70 },
    { id: '37', name: 'Alperen Sengun', team: 'HOU', position: 'C', stats: { ppg: 21.1, rpg: 10.3, apg: 5.0, fgPct: 53.7, threePtPct: 29.7 }, basePrice: 120.40 },
    { id: '38', name: 'Chet Holmgren', team: 'OKC', position: 'C', stats: { ppg: 16.4, rpg: 7.9, apg: 2.3, fgPct: 53.0, threePtPct: 37.0 }, basePrice: 112.30 },
    { id: '39', name: 'Jalen Williams', team: 'OKC', position: 'SF', stats: { ppg: 19.1, rpg: 4.0, apg: 4.5, fgPct: 54.0, threePtPct: 42.7 }, basePrice: 116.80 },
    { id: '40', name: 'Evan Mobley', team: 'CLE', position: 'PF', stats: { ppg: 15.7, rpg: 9.4, apg: 3.2, fgPct: 58.0, threePtPct: 38.8 }, basePrice: 113.20 },

    // Solid Contributors
    { id: '41', name: 'Mikal Bridges', team: 'NYK', position: 'SF', stats: { ppg: 15.6, rpg: 3.6, apg: 3.1, fgPct: 47.9, threePtPct: 31.7 }, basePrice: 108.50 },
    { id: '42', name: 'Darius Garland', team: 'CLE', position: 'PG', stats: { ppg: 20.7, rpg: 2.7, apg: 6.5, fgPct: 48.0, threePtPct: 44.6 }, basePrice: 118.20 },
    { id: '43', name: 'Brandon Ingram', team: 'NOP', position: 'SF', stats: { ppg: 20.8, rpg: 5.1, apg: 5.7, fgPct: 46.9, threePtPct: 35.5 }, basePrice: 117.90 },
    { id: '44', name: 'Dejounte Murray', team: 'NOP', position: 'PG', stats: { ppg: 17.1, rpg: 6.4, apg: 6.9, fgPct: 45.9, threePtPct: 36.3 }, basePrice: 112.60 },
    { id: '45', name: 'Pascal Siakam', team: 'IND', position: 'PF', stats: { ppg: 18.4, rpg: 6.9, apg: 3.3, fgPct: 52.9, threePtPct: 38.6 }, basePrice: 114.30 },
    { id: '46', name: 'Lauri Markkanen', team: 'UTA', position: 'PF', stats: { ppg: 18.0, rpg: 6.5, apg: 1.9, fgPct: 48.0, threePtPct: 39.4 }, basePrice: 110.80 },
    { id: '47', name: 'OG Anunoby', team: 'NYK', position: 'SF', stats: { ppg: 14.7, rpg: 4.2, apg: 2.1, fgPct: 48.6, threePtPct: 38.2 }, basePrice: 106.90 },
    { id: '48', name: 'Desmond Bane', team: 'MEM', position: 'SG', stats: { ppg: 24.7, rpg: 5.5, apg: 5.0, fgPct: 46.0, threePtPct: 31.7 }, basePrice: 121.50 },
    { id: '49', name: 'Jalen Johnson', team: 'ATL', position: 'PF', stats: { ppg: 18.9, rpg: 10.0, apg: 5.1, fgPct: 51.1, threePtPct: 35.5 }, basePrice: 115.20 },
    { id: '50', name: 'Ivica Zubac', team: 'LAC', position: 'C', stats: { ppg: 12.3, rpg: 9.2, apg: 1.8, fgPct: 64.9, threePtPct: 0.0 }, basePrice: 98.40 },

    // Role Players & Emerging Talent
    { id: '51', name: 'Derrick White', team: 'BOS', position: 'SG', stats: { ppg: 15.2, rpg: 4.2, apg: 5.2, fgPct: 46.1, threePtPct: 39.6 }, basePrice: 107.30 },
    { id: '52', name: 'Cade Cunningham', team: 'DET', position: 'PG', stats: { ppg: 24.0, rpg: 6.5, apg: 9.0, fgPct: 45.0, threePtPct: 36.1 }, basePrice: 125.70 },
    { id: '53', name: 'Victor Wembanyama', team: 'SAS', position: 'C', stats: { ppg: 21.4, rpg: 10.6, apg: 3.9, fgPct: 46.5, threePtPct: 32.5 }, basePrice: 145.80 },
    { id: '54', name: 'Jarrett Allen', team: 'CLE', position: 'C', stats: { ppg: 14.9, rpg: 10.5, apg: 2.7, fgPct: 63.4, threePtPct: 0.0 }, basePrice: 109.60 },
    { id: '55', name: 'Anfernee Simons', team: 'POR', position: 'PG', stats: { ppg: 22.6, rpg: 3.6, apg: 5.5, fgPct: 43.0, threePtPct: 38.5 }, basePrice: 116.40 },
    { id: '56', name: 'Jamal Murray', team: 'DEN', position: 'PG', stats: { ppg: 18.0, rpg: 4.0, apg: 5.8, fgPct: 40.0, threePtPct: 35.4 }, basePrice: 112.90 },
    { id: '57', name: 'Tyler Herro', team: 'MIA', position: 'SG', stats: { ppg: 23.8, rpg: 5.3, apg: 4.8, fgPct: 44.1, threePtPct: 40.0 }, basePrice: 119.70 },
    { id: '58', name: 'Nikola Vucevic', team: 'CHI', position: 'C', stats: { ppg: 20.0, rpg: 10.5, apg: 3.3, fgPct: 55.7, threePtPct: 42.7 }, basePrice: 114.50 },
    { id: '59', name: 'Coby White', team: 'CHI', position: 'PG', stats: { ppg: 19.1, rpg: 4.5, apg: 5.1, fgPct: 45.0, threePtPct: 37.6 }, basePrice: 111.30 },
    { id: '60', name: 'Jordan Poole', team: 'WAS', position: 'SG', stats: { ppg: 17.4, rpg: 2.7, apg: 4.4, fgPct: 41.7, threePtPct: 32.6 }, basePrice: 105.20 },
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
