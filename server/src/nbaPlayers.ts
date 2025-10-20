import { Player, PlayerStats } from './types.js';

// Comprehensive NBA Players Database (2024-2025 Season)
export const nbaPlayersData: Omit<Player, 'bidPrice' | 'askPrice' | 'priceChange' | 'priceHistory' | 'volume'>[] = [
  // LOS ANGELES LAKERS
  { id: '1', name: 'LeBron James', team: 'LAL', position: 'SF', stats: { ppg: 25.7, rpg: 7.3, apg: 8.3, fgPct: 54.0, threePtPct: 41.0 }, currentPrice: 127.50, volatility: 0.18, availableShares: 100000 },
  { id: '2', name: 'Anthony Davis', team: 'LAL', position: 'PF', stats: { ppg: 24.6, rpg: 12.6, apg: 3.5, fgPct: 56.3, threePtPct: 27.1 }, currentPrice: 125.80, volatility: 0.22, availableShares: 95000 },
  { id: '3', name: 'Austin Reaves', team: 'LAL', position: 'SG', stats: { ppg: 15.9, rpg: 4.4, apg: 5.5, fgPct: 48.6, threePtPct: 36.7 }, currentPrice: 72.30, volatility: 0.25, availableShares: 120000 },
  { id: '4', name: 'Rui Hachimura', team: 'LAL', position: 'PF', stats: { ppg: 13.6, rpg: 4.3, apg: 1.2, fgPct: 42.2, threePtPct: 42.2 }, currentPrice: 58.90, volatility: 0.28, availableShares: 130000 },

  // GOLDEN STATE WARRIORS
  { id: '5', name: 'Stephen Curry', team: 'GSW', position: 'PG', stats: { ppg: 26.4, rpg: 4.5, apg: 5.1, fgPct: 45.0, threePtPct: 40.8 }, currentPrice: 142.30, volatility: 0.22, availableShares: 100000 },
  { id: '6', name: 'Klay Thompson', team: 'GSW', position: 'SG', stats: { ppg: 17.9, rpg: 3.3, apg: 2.3, fgPct: 43.2, threePtPct: 38.7 }, currentPrice: 89.60, volatility: 0.24, availableShares: 110000 },
  { id: '7', name: 'Draymond Green', team: 'GSW', position: 'PF', stats: { ppg: 8.5, rpg: 7.2, apg: 6.0, fgPct: 49.7, threePtPct: 39.5 }, currentPrice: 68.40, volatility: 0.26, availableShares: 125000 },
  { id: '8', name: 'Andrew Wiggins', team: 'GSW', position: 'SF', stats: { ppg: 13.2, rpg: 4.5, apg: 2.3, fgPct: 45.3, threePtPct: 35.8 }, currentPrice: 65.70, volatility: 0.27, availableShares: 115000 },

  // MILWAUKEE BUCKS
  { id: '9', name: 'Giannis Antetokounmpo', team: 'MIL', position: 'PF', stats: { ppg: 31.1, rpg: 11.8, apg: 5.7, fgPct: 55.3, threePtPct: 27.5 }, currentPrice: 156.80, volatility: 0.20, availableShares: 100000 },
  { id: '10', name: 'Damian Lillard', team: 'MIL', position: 'PG', stats: { ppg: 24.3, rpg: 4.4, apg: 7.0, fgPct: 42.4, threePtPct: 35.4 }, currentPrice: 118.50, volatility: 0.21, availableShares: 105000 },
  { id: '11', name: 'Khris Middleton', team: 'MIL', position: 'SF', stats: { ppg: 15.1, rpg: 4.7, apg: 5.1, fgPct: 49.1, threePtPct: 38.1 }, currentPrice: 78.20, volatility: 0.23, availableShares: 118000 },
  { id: '12', name: 'Brook Lopez', team: 'MIL', position: 'C', stats: { ppg: 12.5, rpg: 5.2, apg: 2.4, fgPct: 48.5, threePtPct: 36.6 }, currentPrice: 62.80, volatility: 0.25, availableShares: 120000 },

  // DALLAS MAVERICKS
  { id: '13', name: 'Luka Doncic', team: 'DAL', position: 'PG', stats: { ppg: 33.9, rpg: 9.2, apg: 9.8, fgPct: 48.7, threePtPct: 38.2 }, currentPrice: 168.25, volatility: 0.25, availableShares: 100000 },
  { id: '14', name: 'Kyrie Irving', team: 'DAL', position: 'PG', stats: { ppg: 25.6, rpg: 5.0, apg: 5.2, fgPct: 49.7, threePtPct: 41.1 }, currentPrice: 115.70, volatility: 0.23, availableShares: 108000 },
  { id: '15', name: 'Kristaps Porzingis', team: 'DAL', position: 'C', stats: { ppg: 20.1, rpg: 7.2, apg: 2.0, fgPct: 45.1, threePtPct: 38.5 }, currentPrice: 92.40, volatility: 0.26, availableShares: 112000 },
  { id: '16', name: 'Tim Hardaway Jr.', team: 'DAL', position: 'SG', stats: { ppg: 14.4, rpg: 3.2, apg: 1.8, fgPct: 40.2, threePtPct: 35.3 }, currentPrice: 58.60, volatility: 0.28, availableShares: 125000 },

  // PHOENIX SUNS
  { id: '17', name: 'Kevin Durant', team: 'PHX', position: 'SF', stats: { ppg: 29.1, rpg: 6.7, apg: 5.0, fgPct: 56.0, threePtPct: 40.5 }, currentPrice: 145.60, volatility: 0.19, availableShares: 100000 },
  { id: '18', name: 'Devin Booker', team: 'PHX', position: 'SG', stats: { ppg: 27.1, rpg: 4.5, apg: 6.9, fgPct: 47.1, threePtPct: 36.4 }, currentPrice: 128.90, volatility: 0.21, availableShares: 102000 },
  { id: '19', name: 'Bradley Beal', team: 'PHX', position: 'SG', stats: { ppg: 18.2, rpg: 4.4, apg: 5.0, fgPct: 51.3, threePtPct: 43.0 }, currentPrice: 89.30, volatility: 0.24, availableShares: 115000 },
  { id: '20', name: 'Jusuf Nurkic', team: 'PHX', position: 'C', stats: { ppg: 11.0, rpg: 11.0, apg: 4.0, fgPct: 57.0, threePtPct: 36.8 }, currentPrice: 55.80, volatility: 0.27, availableShares: 128000 },

  // PHILADELPHIA 76ERS
  { id: '21', name: 'Joel Embiid', team: 'PHI', position: 'C', stats: { ppg: 33.1, rpg: 10.2, apg: 4.2, fgPct: 54.8, threePtPct: 33.0 }, currentPrice: 152.40, volatility: 0.21, availableShares: 100000 },
  { id: '22', name: 'Tyrese Maxey', team: 'PHI', position: 'PG', stats: { ppg: 20.3, rpg: 3.2, apg: 3.5, fgPct: 48.0, threePtPct: 43.4 }, currentPrice: 95.60, volatility: 0.23, availableShares: 110000 },
  { id: '23', name: 'Tobias Harris', team: 'PHI', position: 'PF', stats: { ppg: 17.2, rpg: 5.8, apg: 3.1, fgPct: 52.9, threePtPct: 38.9 }, currentPrice: 76.40, volatility: 0.25, availableShares: 118000 },
  { id: '24', name: 'Paul Reed', team: 'PHI', position: 'C', stats: { ppg: 7.2, rpg: 6.0, apg: 1.4, fgPct: 62.8, threePtPct: 30.0 }, currentPrice: 42.30, volatility: 0.30, availableShares: 135000 },

  // DENVER NUGGETS
  { id: '25', name: 'Nikola Jokic', team: 'DEN', position: 'C', stats: { ppg: 24.5, rpg: 11.8, apg: 9.8, fgPct: 63.2, threePtPct: 38.3 }, currentPrice: 159.90, volatility: 0.17, availableShares: 100000 },
  { id: '26', name: 'Jamal Murray', team: 'DEN', position: 'PG', stats: { ppg: 21.2, rpg: 4.0, apg: 6.5, fgPct: 45.6, threePtPct: 42.5 }, currentPrice: 98.70, volatility: 0.22, availableShares: 112000 },
  { id: '27', name: 'Michael Porter Jr.', team: 'DEN', position: 'SF', stats: { ppg: 16.7, rpg: 7.0, apg: 1.5, fgPct: 48.4, threePtPct: 41.4 }, currentPrice: 78.90, volatility: 0.24, availableShares: 116000 },
  { id: '28', name: 'Aaron Gordon', team: 'DEN', position: 'PF', stats: { ppg: 13.9, rpg: 6.5, apg: 3.5, fgPct: 55.6, threePtPct: 32.6 }, currentPrice: 68.20, volatility: 0.26, availableShares: 120000 },

  // BOSTON CELTICS
  { id: '29', name: 'Jayson Tatum', team: 'BOS', position: 'SF', stats: { ppg: 30.1, rpg: 8.8, apg: 4.6, fgPct: 46.6, threePtPct: 35.0 }, currentPrice: 138.70, volatility: 0.23, availableShares: 100000 },
  { id: '30', name: 'Jaylen Brown', team: 'BOS', position: 'SG', stats: { ppg: 27.0, rpg: 7.0, apg: 3.5, fgPct: 49.1, threePtPct: 33.3 }, currentPrice: 125.30, volatility: 0.22, availableShares: 105000 },
  { id: '31', name: 'Kristaps Porzingis', team: 'BOS', position: 'C', stats: { ppg: 20.1, rpg: 7.2, apg: 2.0, fgPct: 51.6, threePtPct: 38.5 }, currentPrice: 92.80, volatility: 0.24, availableShares: 115000 },
  { id: '32', name: 'Derrick White', team: 'BOS', position: 'PG', stats: { ppg: 15.2, rpg: 4.2, apg: 5.2, fgPct: 46.1, threePtPct: 39.6 }, currentPrice: 72.50, volatility: 0.25, availableShares: 122000 },

  // MIAMI HEAT
  { id: '33', name: 'Jimmy Butler', team: 'MIA', position: 'SF', stats: { ppg: 20.8, rpg: 5.3, apg: 5.0, fgPct: 49.9, threePtPct: 41.4 }, currentPrice: 108.60, volatility: 0.21, availableShares: 108000 },
  { id: '34', name: 'Bam Adebayo', team: 'MIA', position: 'C', stats: { ppg: 19.3, rpg: 10.4, apg: 3.2, fgPct: 52.1, threePtPct: 35.7 }, currentPrice: 95.40, volatility: 0.23, availableShares: 112000 },
  { id: '35', name: 'Tyler Herro', team: 'MIA', position: 'SG', stats: { ppg: 20.1, rpg: 5.4, apg: 4.5, fgPct: 43.9, threePtPct: 39.6 }, currentPrice: 86.70, volatility: 0.25, availableShares: 118000 },
  { id: '36', name: 'Terry Rozier', team: 'MIA', position: 'PG', stats: { ppg: 16.8, rpg: 4.2, apg: 4.8, fgPct: 45.2, threePtPct: 38.9 }, currentPrice: 71.20, volatility: 0.26, availableShares: 125000 },

  // NEW YORK KNICKS
  { id: '37', name: 'Julius Randle', team: 'NYK', position: 'PF', stats: { ppg: 24.0, rpg: 9.2, apg: 5.0, fgPct: 47.2, threePtPct: 31.1 }, currentPrice: 112.80, volatility: 0.22, availableShares: 108000 },
  { id: '38', name: 'RJ Barrett', team: 'NYK', position: 'SG', stats: { ppg: 19.6, rpg: 5.8, apg: 2.8, fgPct: 43.4, threePtPct: 31.0 }, currentPrice: 85.90, volatility: 0.24, availableShares: 115000 },
  { id: '39', name: 'Jalen Brunson', team: 'NYK', position: 'PG', stats: { ppg: 28.7, rpg: 3.6, apg: 6.7, fgPct: 47.9, threePtPct: 40.1 }, currentPrice: 118.40, volatility: 0.21, availableShares: 110000 },
  { id: '40', name: 'Mitchell Robinson', team: 'NYK', position: 'C', stats: { ppg: 8.5, rpg: 8.5, apg: 0.9, fgPct: 57.5, threePtPct: 0.0 }, currentPrice: 48.70, volatility: 0.28, availableShares: 130000 },

  // OKLAHOMA CITY THUNDER
  { id: '41', name: 'Shai Gilgeous-Alexander', team: 'OKC', position: 'PG', stats: { ppg: 30.1, rpg: 5.5, apg: 6.2, fgPct: 53.5, threePtPct: 35.0 }, currentPrice: 142.60, volatility: 0.20, availableShares: 102000 },
  { id: '42', name: 'Josh Giddey', team: 'OKC', position: 'PG', stats: { ppg: 12.3, rpg: 7.8, apg: 6.2, fgPct: 47.5, threePtPct: 33.7 }, currentPrice: 68.90, volatility: 0.25, availableShares: 120000 },
  { id: '43', name: 'Jalen Williams', team: 'OKC', position: 'SF', stats: { ppg: 14.1, rpg: 4.5, apg: 4.5, fgPct: 51.2, threePtPct: 42.7 }, currentPrice: 72.80, volatility: 0.24, availableShares: 118000 },
  { id: '44', name: 'Chet Holmgren', team: 'OKC', position: 'C', stats: { ppg: 16.5, rpg: 7.9, apg: 2.4, fgPct: 53.0, threePtPct: 37.0 }, currentPrice: 78.60, volatility: 0.26, availableShares: 115000 },

  // MINNESOTA TIMBERWOLVES
  { id: '45', name: 'Anthony Edwards', team: 'MIN', position: 'SG', stats: { ppg: 25.9, rpg: 5.4, apg: 5.1, fgPct: 46.1, threePtPct: 35.7 }, currentPrice: 128.70, volatility: 0.22, availableShares: 105000 },
  { id: '46', name: 'Karl-Anthony Towns', team: 'MIN', position: 'C', stats: { ppg: 21.8, rpg: 8.3, apg: 2.0, fgPct: 50.4, threePtPct: 41.6 }, currentPrice: 108.90, volatility: 0.23, availableShares: 108000 },
  { id: '47', name: 'Rudy Gobert', team: 'MIN', position: 'C', stats: { ppg: 13.7, rpg: 12.9, apg: 1.3, fgPct: 66.1, threePtPct: 0.0 }, currentPrice: 72.40, volatility: 0.24, availableShares: 118000 },
  { id: '48', name: 'Jaden McDaniels', team: 'MIN', position: 'SF', stats: { ppg: 10.9, rpg: 3.9, apg: 1.9, fgPct: 48.8, threePtPct: 31.4 }, currentPrice: 58.30, volatility: 0.27, availableShares: 125000 },

  // More teams and players...
  // CLEVELAND CAVALIERS
  { id: '49', name: 'Donovan Mitchell', team: 'CLE', position: 'SG', stats: { ppg: 28.3, rpg: 4.4, apg: 4.9, fgPct: 48.4, threePtPct: 38.4 }, currentPrice: 132.50, volatility: 0.21, availableShares: 104000 },
  { id: '50', name: 'Jarrett Allen', team: 'CLE', position: 'C', stats: { ppg: 16.5, rpg: 10.5, apg: 2.7, fgPct: 63.4, threePtPct: 0.0 }, currentPrice: 82.60, volatility: 0.23, availableShares: 115000 },

  // SACRAMENTO KINGS
  { id: '51', name: 'De\'Aaron Fox', team: 'SAC', position: 'PG', stats: { ppg: 26.6, rpg: 4.6, apg: 5.6, fgPct: 46.5, threePtPct: 32.3 }, currentPrice: 118.80, volatility: 0.22, availableShares: 108000 },
  { id: '52', name: 'Domantas Sabonis', team: 'SAC', position: 'C', stats: { ppg: 19.1, rpg: 13.7, apg: 8.2, fgPct: 61.1, threePtPct: 37.9 }, currentPrice: 98.40, volatility: 0.20, availableShares: 112000 },

  // INDIANA PACERS
  { id: '53', name: 'Tyrese Haliburton', team: 'IND', position: 'PG', stats: { ppg: 20.1, rpg: 3.9, apg: 10.9, fgPct: 47.7, threePtPct: 36.4 }, currentPrice: 102.30, volatility: 0.21, availableShares: 110000 },
  { id: '54', name: 'Pascal Siakam', team: 'IND', position: 'PF', stats: { ppg: 21.3, rpg: 7.8, apg: 3.7, fgPct: 47.8, threePtPct: 23.8 }, currentPrice: 96.70, volatility: 0.22, availableShares: 112000 },

  // ORLANDO MAGIC
  { id: '55', name: 'Paolo Banchero', team: 'ORL', position: 'PF', stats: { ppg: 22.6, rpg: 6.9, apg: 5.4, fgPct: 45.5, threePtPct: 33.9 }, currentPrice: 108.20, volatility: 0.24, availableShares: 110000 },
  { id: '56', name: 'Franz Wagner', team: 'ORL', position: 'SF', stats: { ppg: 19.7, rpg: 5.3, apg: 3.7, fgPct: 48.2, threePtPct: 28.1 }, currentPrice: 86.50, volatility: 0.25, availableShares: 115000 },

  // More players can be added from other teams...
  // MEMPHIS GRIZZLIES
  { id: '57', name: 'Ja Morant', team: 'MEM', position: 'PG', stats: { ppg: 25.1, rpg: 5.6, apg: 8.1, fgPct: 47.1, threePtPct: 32.7 }, currentPrice: 115.60, volatility: 0.26, availableShares: 108000 },
  { id: '58', name: 'Jaren Jackson Jr.', team: 'MEM', position: 'PF', stats: { ppg: 22.5, rpg: 5.5, apg: 2.3, fgPct: 44.1, threePtPct: 32.0 }, currentPrice: 98.80, volatility: 0.24, availableShares: 112000 },

  // NEW ORLEANS PELICANS
  { id: '59', name: 'Zion Williamson', team: 'NOP', position: 'PF', stats: { ppg: 22.9, rpg: 5.8, apg: 5.0, fgPct: 57.0, threePtPct: 33.3 }, currentPrice: 112.40, volatility: 0.28, availableShares: 108000 },
  { id: '60', name: 'Brandon Ingram', team: 'NOP', position: 'SF', stats: { ppg: 20.8, rpg: 5.7, apg: 5.8, fgPct: 49.2, threePtPct: 35.5 }, currentPrice: 92.70, volatility: 0.23, availableShares: 114000 },

  // Continue adding more players for comprehensive coverage...
];

// Helper function to generate initial price history
function generateInitialPriceHistory(startPrice: number, volatility: number, points: number = 20): { date: string; price: number }[] {
  const history: { date: string; price: number }[] = [];
  const now = Date.now();
  const interval = 24 * 60 * 60 * 1000; // 1 day between points

  let currentPrice = startPrice;

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * interval));
    const randomChange = (Math.random() - 0.5) * volatility * 0.2;
    currentPrice = currentPrice * (1 + randomChange);
    history.push({
      date: timestamp.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2))
    });
  }

  return history;
}

// Convert to full Player objects with calculated bid/ask and price history
export function generateFullPlayersList(): Player[] {
  return nbaPlayersData.map(playerData => {
    const bidPrice = playerData.currentPrice * 0.995; // 0.5% below
    const askPrice = playerData.currentPrice * 1.005; // 0.5% above
    const priceHistory = generateInitialPriceHistory(playerData.currentPrice, playerData.volatility);
    const volume = Math.floor(Math.random() * 50000) + 30000; // Random volume between 30k-80k

    return {
      ...playerData,
      bidPrice: parseFloat(bidPrice.toFixed(2)),
      askPrice: parseFloat(askPrice.toFixed(2)),
      priceChange: 0,
      priceHistory,
      volume
    };
  });
}
