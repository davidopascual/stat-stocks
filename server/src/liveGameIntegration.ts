import { Player, PlayerStats } from './types.js';
import { EventEmitter } from 'events';

/**
 * Live Game Integration
 *
 * Connects to live NBA game feeds and updates player prices in real-time
 * based on in-game performance and events.
 */

interface LiveGameEvent {
  type: 'SCORE' | 'REBOUND' | 'ASSIST' | 'STEAL' | 'BLOCK' | 'TURNOVER' | 'FOUL' | 'INJURY' | 'EJECTION' | 'TRIPLE_DOUBLE';
  playerId: string;
  playerName: string;
  points?: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'MAJOR_POSITIVE' | 'MAJOR_NEGATIVE';
  priceImpact: number; // Percentage impact on price
  timestamp: Date;
  gameId: string;
  description: string;
}

interface LiveGame {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  status: 'SCHEDULED' | 'LIVE' | 'HALFTIME' | 'FINAL';
  quarter: number;
  timeRemaining: string;
  homeScore: number;
  awayScore: number;
}

interface PlayerGameStats {
  playerId: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  minutesPlayed: number;
}

export class LiveGameEngine extends EventEmitter {
  private liveGames: Map<string, LiveGame> = new Map();
  private playerGameStats: Map<string, PlayerGameStats> = new Map();
  private priceMultipliers: Map<string, number> = new Map(); // Accumulated multiplier during game

  // Event impact multipliers
  private readonly IMPACT_VALUES = {
    // Scoring events
    TWO_POINTER: 0.001,          // +0.1% per 2-point basket
    THREE_POINTER: 0.002,         // +0.2% per 3-pointer
    FREE_THROW: 0.0005,           // +0.05% per free throw

    // Defensive plays
    STEAL: 0.003,                 // +0.3% per steal
    BLOCK: 0.003,                 // +0.3% per block
    REBOUND_OFFENSIVE: 0.002,     // +0.2% per offensive rebound
    REBOUND_DEFENSIVE: 0.001,     // +0.1% per defensive rebound

    // Playmaking
    ASSIST: 0.002,                // +0.2% per assist

    // Negative events
    TURNOVER: -0.002,             // -0.2% per turnover
    FOUL: -0.001,                 // -0.1% per foul
    MISSED_CLUTCH_SHOT: -0.005,   // -0.5% for missing big shot

    // Major events
    TRIPLE_DOUBLE: 0.05,          // +5% for triple-double
    FORTY_POINT_GAME: 0.08,       // +8% for 40+ points
    FIFTY_POINT_GAME: 0.15,       // +15% for 50+ points
    GAME_WINNER: 0.10,            // +10% for game-winning shot
    INJURY: -0.15,                // -15% for injury
    EJECTION: -0.08,              // -8% for ejection
    TECH_FOUL: -0.03,             // -3% for technical foul
  };

  constructor() {
    super();
    this.initializeStatTracking();
  }

  private initializeStatTracking() {
    // Reset multipliers daily
    setInterval(() => {
      this.priceMultipliers.clear();
      console.log('🔄 Daily price multipliers reset');
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Process a live game event and calculate price impact
   */
  processGameEvent(event: LiveGameEvent): number {
    const currentMultiplier = this.priceMultipliers.get(event.playerId) || 1.0;
    const newMultiplier = currentMultiplier * (1 + event.priceImpact);

    this.priceMultipliers.set(event.playerId, newMultiplier);

    // Emit event for WebSocket broadcast
    this.emit('game_event', event);

    console.log(`🏀 ${event.playerName}: ${event.description} → ${event.priceImpact >= 0 ? '+' : ''}${(event.priceImpact * 100).toFixed(2)}%`);

    return newMultiplier;
  }

  /**
   * Get current price multiplier for a player
   */
  getPriceMultiplier(playerId: string): number {
    return this.priceMultipliers.get(playerId) || 1.0;
  }

  /**
   * Simulate a live game event (for testing/demo)
   */
  simulateGameEvent(playerId: string, playerName: string): LiveGameEvent {
    const eventTypes = [
      { type: 'SCORE' as const, impact: 0.002, desc: 'scores 2 points!' },
      { type: 'SCORE' as const, impact: 0.003, desc: 'hits a 3-pointer!' },
      { type: 'ASSIST' as const, impact: 0.002, desc: 'dishes an assist!' },
      { type: 'REBOUND' as const, impact: 0.001, desc: 'grabs a rebound!' },
      { type: 'STEAL' as const, impact: 0.003, desc: 'gets a steal!' },
      { type: 'BLOCK' as const, impact: 0.003, desc: 'blocks a shot!' },
      { type: 'TURNOVER' as const, impact: -0.002, desc: 'turns it over' },
    ];

    const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    return {
      type: event.type,
      playerId,
      playerName,
      impact: event.impact > 0 ? 'POSITIVE' : 'NEGATIVE',
      priceImpact: event.impact,
      timestamp: new Date(),
      gameId: 'game_123',
      description: event.desc
    };
  }

  /**
   * Connect to NBA Live Stats API
   *
   * Options:
   * 1. ESPN Live API - Free, real-time scores
   * 2. NBA Stats API - Official, play-by-play
   * 3. SportsRadar - Paid, most detailed
   * 4. The Score API - Free, good coverage
   */
  async connectToLiveAPI(): Promise<void> {
    // ESPN Live API Example (Free)
    const ESPN_LIVE_URL = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

    try {
      const response = await fetch(ESPN_LIVE_URL);
      const data = await response.json();

      // Parse live games
      if (data.events) {
        for (const game of data.events) {
          this.updateLiveGame(game);
        }
      }
    } catch (error) {
      console.error('Error fetching live games:', error);
    }
  }

  /**
   * Update live game data
   */
  private updateLiveGame(gameData: any): void {
    // Parse ESPN game data format
    const gameId = gameData.id;
    const status = gameData.status.type.state; // 'pre', 'in', 'post'

    const liveGame: LiveGame = {
      gameId,
      homeTeam: gameData.competitions[0].competitors[0].team.abbreviation,
      awayTeam: gameData.competitions[0].competitors[1].team.abbreviation,
      status: status === 'in' ? 'LIVE' : status === 'pre' ? 'SCHEDULED' : 'FINAL',
      quarter: parseInt(gameData.status.period) || 0,
      timeRemaining: gameData.status.displayClock || '',
      homeScore: parseInt(gameData.competitions[0].competitors[0].score) || 0,
      awayScore: parseInt(gameData.competitions[0].competitors[1].score) || 0,
    };

    this.liveGames.set(gameId, liveGame);
  }

  /**
   * Poll for live updates (call this every 10-30 seconds during games)
   */
  async pollLiveGames(): Promise<void> {
    await this.connectToLiveAPI();

    // For each live game, check for stat updates
    for (const [gameId, game] of this.liveGames.entries()) {
      if (game.status === 'LIVE') {
        await this.updateGameStats(gameId);
      }
    }
  }

  /**
   * Fetch detailed play-by-play for a game
   */
  private async updateGameStats(gameId: string): Promise<void> {
    try {
      // ESPN Play-by-Play API
      const playByPlayUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`;

      const response = await fetch(playByPlayUrl);
      const data = await response.json();

      // Parse recent plays and trigger events
      if (data.plays) {
        this.parsePlayByPlay(data.plays);
      }
    } catch (error) {
      console.error(`Error updating game ${gameId}:`, error);
    }
  }

  /**
   * Parse play-by-play data and generate game events
   */
  private parsePlayByPlay(plays: any[]): void {
    // This would parse actual play-by-play data
    // For now, this is a simplified example

    plays.forEach(play => {
      const playType = play.type?.text;
      const playerId = play.participants?.[0]?.athlete?.id;
      const playerName = play.participants?.[0]?.athlete?.displayName;

      if (!playerId || !playerName) return;

      let event: LiveGameEvent | null = null;

      // Map play types to events
      if (playType?.includes('Made')) {
        if (playType.includes('Three Point')) {
          event = {
            type: 'SCORE',
            playerId,
            playerName,
            points: 3,
            impact: 'POSITIVE',
            priceImpact: this.IMPACT_VALUES.THREE_POINTER,
            timestamp: new Date(),
            gameId: play.gameId,
            description: 'hits a 3-pointer!'
          };
        } else {
          event = {
            type: 'SCORE',
            playerId,
            playerName,
            points: 2,
            impact: 'POSITIVE',
            priceImpact: this.IMPACT_VALUES.TWO_POINTER,
            timestamp: new Date(),
            gameId: play.gameId,
            description: 'scores 2 points!'
          };
        }
      } else if (playType?.includes('Rebound')) {
        event = {
          type: 'REBOUND',
          playerId,
          playerName,
          impact: 'POSITIVE',
          priceImpact: this.IMPACT_VALUES.REBOUND_DEFENSIVE,
          timestamp: new Date(),
          gameId: play.gameId,
          description: 'grabs a rebound!'
        };
      } else if (playType?.includes('Assist')) {
        event = {
          type: 'ASSIST',
          playerId,
          playerName,
          impact: 'POSITIVE',
          priceImpact: this.IMPACT_VALUES.ASSIST,
          timestamp: new Date(),
          gameId: play.gameId,
          description: 'dishes an assist!'
        };
      } else if (playType?.includes('Turnover')) {
        event = {
          type: 'TURNOVER',
          playerId,
          playerName,
          impact: 'NEGATIVE',
          priceImpact: this.IMPACT_VALUES.TURNOVER,
          timestamp: new Date(),
          gameId: play.gameId,
          description: 'turns it over'
        };
      }

      if (event) {
        this.processGameEvent(event);
      }
    });
  }

  /**
   * Check for milestone achievements
   */
  checkMilestones(playerId: string, playerName: string, stats: PlayerGameStats): LiveGameEvent[] {
    const events: LiveGameEvent[] = [];

    // Triple-double
    const doubleDigits = [stats.points, stats.rebounds, stats.assists].filter(x => x >= 10).length;
    if (doubleDigits >= 3) {
      events.push({
        type: 'TRIPLE_DOUBLE',
        playerId,
        playerName,
        impact: 'MAJOR_POSITIVE',
        priceImpact: this.IMPACT_VALUES.TRIPLE_DOUBLE,
        timestamp: new Date(),
        gameId: '',
        description: '🔥 TRIPLE-DOUBLE!'
      });
    }

    // 40-point game
    if (stats.points >= 40 && stats.points < 50) {
      events.push({
        type: 'SCORE',
        playerId,
        playerName,
        points: stats.points,
        impact: 'MAJOR_POSITIVE',
        priceImpact: this.IMPACT_VALUES.FORTY_POINT_GAME,
        timestamp: new Date(),
        gameId: '',
        description: `🔥 ${stats.points} POINTS!`
      });
    }

    // 50-point game
    if (stats.points >= 50) {
      events.push({
        type: 'SCORE',
        playerId,
        playerName,
        points: stats.points,
        impact: 'MAJOR_POSITIVE',
        priceImpact: this.IMPACT_VALUES.FIFTY_POINT_GAME,
        timestamp: new Date(),
        gameId: '',
        description: `🔥🔥 ${stats.points} POINTS!!!`
      });
    }

    return events;
  }

  /**
   * Get all active live games
   */
  getLiveGames(): LiveGame[] {
    return Array.from(this.liveGames.values()).filter(g => g.status === 'LIVE');
  }

  /**
   * Simulate a game for testing (generates random events)
   */
  simulateLiveGame(playerIds: string[], playerNames: string[]): void {
    console.log('🏀 Starting simulated live game...');

    // Generate random events every 5-15 seconds
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * playerIds.length);
      const event = this.simulateGameEvent(playerIds[randomIndex], playerNames[randomIndex]);
      this.processGameEvent(event);
    }, Math.random() * 10000 + 5000);

    // Stop after 2 hours (simulated game length)
    setTimeout(() => {
      clearInterval(interval);
      console.log('🏁 Simulated game ended');
    }, 2 * 60 * 60 * 1000);
  }
}

export const liveGameEngine = new LiveGameEngine();
