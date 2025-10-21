import { League, LeagueSettings, LeagueLeaderboard, LeaderboardEntry, User, PortfolioRisk } from './types.js';

class LeagueManager {
  private leagues: Map<string, League> = new Map();
  private users: Map<string, User> = new Map();
  private leaderboards: Map<string, LeagueLeaderboard> = new Map();

  // Create a new league
  createLeague(
    creatorId: string,
    name: string,
    description: string,
    startingBalance: number,
    settings: Partial<LeagueSettings> = {},
    isPrivate: boolean = true
  ): { success: boolean; league?: League; inviteCode?: string } {
    const leagueId = `league_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inviteCode = this.generateInviteCode();

    const defaultSettings: LeagueSettings = {
      allowShortSelling: true,
      allowOptions: true,
      allowMargin: false,
      maxLeverage: 1,
      tradingFees: false,
      feePercentage: 0,
      ...settings
    };

    const league: League = {
      id: leagueId,
      name,
      description,
      creatorId,
      memberIds: [creatorId],
      startDate: new Date(),
      startingBalance,
      isActive: true,
      isPrivate,
      inviteCode,
      settings: defaultSettings
    };

    this.leagues.set(leagueId, league);

    // Note: User's league association is managed separately in the user service
    // No need to update user here since we're using hybrid storage

    // Initialize leaderboard
    this.initializeLeaderboard(leagueId);

    return { success: true, league, inviteCode };
  }

  // Join a league via invite code
  joinLeague(
    userId: string,
    inviteCode: string
  ): { success: boolean; message: string; league?: League } {
    const league = Array.from(this.leagues.values()).find(
      l => l.inviteCode === inviteCode
    );

    if (!league) {
      return { success: false, message: 'Invalid invite code' };
    }

    if (!league.isActive) {
      return { success: false, message: 'League is no longer active' };
    }

    if (league.memberIds.includes(userId)) {
      return { success: false, message: 'Already a member of this league' };
    }

    league.memberIds.push(userId);

    // Note: User's league association and balance reset is managed separately
    // in the user service using hybrid storage

    return { success: true, message: 'Successfully joined league', league };
  }

  // Leave a league
  leaveLeague(
    userId: string,
    leagueId: string
  ): { success: boolean; message: string } {
    const league = this.leagues.get(leagueId);

    if (!league) {
      return { success: false, message: 'League not found' };
    }

    if (league.creatorId === userId) {
      return {
        success: false,
        message: 'Creator cannot leave. Delete the league instead.'
      };
    }

    league.memberIds = league.memberIds.filter(id => id !== userId);

    const user = this.users.get(userId);
    if (user) {
      user.leagueIds = user.leagueIds.filter(id => id !== leagueId);
    }

    return { success: true, message: 'Left league successfully' };
  }

  // Delete a league (creator only)
  deleteLeague(
    userId: string,
    leagueId: string
  ): { success: boolean; message: string } {
    const league = this.leagues.get(leagueId);

    if (!league) {
      return { success: false, message: 'League not found' };
    }

    if (league.creatorId !== userId) {
      return { success: false, message: 'Only creator can delete league' };
    }

    // Remove league from all members
    for (const memberId of league.memberIds) {
      const user = this.users.get(memberId);
      if (user) {
        user.leagueIds = user.leagueIds.filter(id => id !== leagueId);
      }
    }

    this.leagues.delete(leagueId);
    this.leaderboards.delete(leagueId);

    return { success: true, message: 'League deleted successfully' };
  }

  // Initialize leaderboard for a league
  private initializeLeaderboard(leagueId: string): void {
    const leaderboard: LeagueLeaderboard = {
      leagueId,
      entries: [],
      lastUpdated: new Date()
    };

    this.leaderboards.set(leagueId, leaderboard);
  }

  // Update leaderboard with current standings
  updateLeaderboard(
    leagueId: string,
    userPortfolios: Map<string, { totalValue: number; trades: number; returns: number[] }>
  ): void {
    const league = this.leagues.get(leagueId);
    if (!league) return;

    const entries: LeaderboardEntry[] = [];

    for (const memberId of league.memberIds) {
      const user = this.users.get(memberId);
      const portfolio = userPortfolios.get(memberId);

      if (!user || !portfolio) continue;

      const percentageReturn =
        ((portfolio.totalValue - league.startingBalance) / league.startingBalance) * 100;

      const sharpeRatio = this.calculateSharpeRatio(portfolio.returns);
      const maxDrawdown = this.calculateMaxDrawdown(portfolio.returns);
      const winRate = this.calculateWinRate(portfolio.returns);

      const entry: LeaderboardEntry = {
        userId: memberId,
        username: user.username,
        rank: 0, // Will be set after sorting
        totalValue: portfolio.totalValue,
        percentageReturn,
        dayReturn: portfolio.returns[portfolio.returns.length - 1] || 0,
        weekReturn: this.calculateWeekReturn(portfolio.returns),
        totalTrades: portfolio.trades,
        winRate,
        sharpeRatio,
        maxDrawdown
      };

      entries.push(entry);
    }

    // Sort by percentage return (highest first)
    entries.sort((a, b) => b.percentageReturn - a.percentageReturn);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const leaderboard = this.leaderboards.get(leagueId);
    if (leaderboard) {
      leaderboard.entries = entries;
      leaderboard.lastUpdated = new Date();
    }
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Annualized Sharpe ratio (assuming daily returns)
    return (avgReturn / stdDev) * Math.sqrt(252);
  }

  private calculateMaxDrawdown(returns: number[]): number {
    if (returns.length === 0) return 0;

    let maxDrawdown = 0;
    let peak = -Infinity;
    let cumulative = 0;

    for (const ret of returns) {
      cumulative += ret;
      if (cumulative > peak) {
        peak = cumulative;
      }
      const drawdown = peak - cumulative;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateWinRate(returns: number[]): number {
    if (returns.length === 0) return 0;
    const wins = returns.filter(r => r > 0).length;
    return (wins / returns.length) * 100;
  }

  private calculateWeekReturn(returns: number[]): number {
    const weekReturns = returns.slice(-7);
    return weekReturns.reduce((a, b) => a + b, 0);
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  // Get league details
  getLeague(leagueId: string): League | undefined {
    return this.leagues.get(leagueId);
  }

  // Get leaderboard
  getLeaderboard(leagueId: string): LeagueLeaderboard | undefined {
    return this.leaderboards.get(leagueId);
  }

  // Get all leagues for a user
  getUserLeagues(userId: string): League[] {
    // Instead of relying on user.leagueIds (which is in hybrid storage),
    // search through all leagues for ones where the user is a member
    return Array.from(this.leagues.values()).filter(
      league => league.memberIds.includes(userId)
    );
  }

  // Get public leagues
  getPublicLeagues(): League[] {
    return Array.from(this.leagues.values()).filter(
      league => !league.isPrivate && league.isActive
    );
  }

  // Register a user
  registerUser(
    username: string,
    email: string,
    startingBalance: number = 100000
  ): User {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const user: User = {
      id: userId,
      username,
      email,
      cash: startingBalance,
      portfolioValue: 0,
      totalValue: startingBalance,
      percentageReturn: 0,
      startingBalance,
      createdAt: new Date(),
      leagueIds: [],
      positions: [],
      transactions: []
    };

    this.users.set(userId, user);
    return user;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  updateUser(userId: string, updates: Partial<User>): void {
    const user = this.users.get(userId);
    if (user) {
      Object.assign(user, updates);
    }
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}

export const leagueManager = new LeagueManager();
