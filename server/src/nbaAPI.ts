import fetch from 'node-fetch';
import { updatePlayerStats } from './priceEngine.js';

// Free NBA API (balldontlie.io) - no API key required
const NBA_API_BASE = 'https://www.balldontlie.io/api/v1';

interface NBAPlayerResponse {
  data: Array<{
    id: number;
    first_name: string;
    last_name: string;
    team: {
      abbreviation: string;
    };
  }>;
}

interface NBAStatsResponse {
  data: Array<{
    player_id: number;
    pts: number;
    reb: number;
    ast: number;
    fg_pct: number;
    fg3_pct: number;
  }>;
}

// Mapping of our player IDs to NBA API player IDs
const playerMapping: Record<string, number> = {
  '1': 237, // LeBron James
  '2': 115, // Stephen Curry
  '3': 15,  // Giannis Antetokounmpo
  '4': 132, // Luka Doncic
  '5': 140, // Kevin Durant
  '6': 145, // Joel Embiid
  '7': 246, // Nikola Jokic
  '8': 434, // Jayson Tatum
};

export async function fetchNBAStats(): Promise<void> {
  try {
    // Fetch stats for each player
    for (const [ourId, nbaId] of Object.entries(playerMapping)) {
      try {
        // Note: The free API has rate limits, so we add delays
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch(
          `${NBA_API_BASE}/season_averages?season=2024&player_ids[]=${nbaId}`
        );

        if (!response.ok) {
          console.error(`Failed to fetch stats for player ${nbaId}`);
          continue;
        }

        const data = await response.json() as NBAStatsResponse;

        if (data.data && data.data.length > 0) {
          const stats = data.data[0];

          updatePlayerStats(ourId, {
            ppg: stats.pts || 0,
            rpg: stats.reb || 0,
            apg: stats.ast || 0,
            fgPct: (stats.fg_pct || 0) * 100,
            threePtPct: (stats.fg3_pct || 0) * 100,
          });

          console.log(`Updated stats for player ${ourId}`);
        }
      } catch (error) {
        console.error(`Error fetching stats for player ${nbaId}:`, error);
      }
    }

    console.log('NBA stats update complete');
  } catch (error) {
    console.error('Error in fetchNBAStats:', error);
    throw error;
  }
}

// Alternative: Use ESPN API (also free, no key required)
export async function fetchESPNStats(): Promise<void> {
  try {
    // ESPN doesn't require authentication for basic stats
    // This is a backup method if balldontlie.io has issues
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');

    if (!response.ok) {
      throw new Error('Failed to fetch ESPN data');
    }

    const data = await response.json();
    console.log('ESPN data fetched successfully', data);

    // You would parse the ESPN data here and update player stats
    // ESPN's API structure is different, so you'd need to adapt the parsing
  } catch (error) {
    console.error('Error fetching ESPN stats:', error);
    throw error;
  }
}
