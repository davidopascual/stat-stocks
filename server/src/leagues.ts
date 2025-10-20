import { League, LeagueSettings, LeagueLeaderboard, LeaderboardEntry, User, PortfolioRisk } from './types.js';

interface LeagueBroadcastCallback {
  (leagueId: string, event: string, data: unknown): void;
}

class LeagueManager {
  private leagues: Map<string, League> = new Map();
  private users: Map<string, User> = new Map();
  private leaderboards: Map<string, LeagueLeaderboard> = new Map();
  private broadcastCallback?: LeagueBroadcastCallback;

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

    // Add league to creator's leagues
    const creator = this.users.get(creatorId);
    if (creator) {
      creator.leagueIds.push(leagueId);
    }

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

    const user = this.users.get(userId);
    if (user) {
      user.leagueIds.push(league.id);
      // Reset user balance to league starting balance
      user.cash = league.startingBalance;
      user.startingBalance = league.startingBalance;
    }

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
    
    // Populate initial leaderboard with members
    this.updateLeaderboardForLeague(leagueId);
  }

  // Update leaderboard for a specific league
  updateLeaderboardForLeague(leagueId: string): void {
    const league = this.leagues.get(leagueId);
    if (!league) return;

    const entries: LeaderboardEntry[] = [];

    for (const memberId of league.memberIds) {
      const user = this.users.get(memberId);
      if (user) {
        const entry: LeaderboardEntry = {
          userId: user.id,
          username: user.username,
          rank: 0, // Will be set after sorting
          totalValue: user.totalValue,
          percentageReturn: user.percentageReturn,
          dayReturn: 0, // TODO: Calculate from historical data
          weekReturn: 0, // TODO: Calculate from historical data
          totalTrades: 0, // TODO: Get from portfolio system
          winRate: 0, // TODO: Calculate from trades
          sharpeRatio: 0, // TODO: Calculate from returns
          maxDrawdown: 0 // TODO: Calculate from returns
        };
        entries.push(entry);
      }
    }

    // Sort by total value (highest first)
    entries.sort((a, b) => b.totalValue - a.totalValue);

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
    const user = this.users.get(userId);
    if (!user) return [];

    return user.leagueIds
      .map(id => this.leagues.get(id))
      .filter((league): league is League => league !== undefined);
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
      leagueIds: []
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

  // Get all users in a specific league
  getLeagueMembers(leagueId: string): User[] {
    const league = this.leagues.get(leagueId);
    if (!league) return [];

    return league.memberIds
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  // Update all leaderboards (call this periodically)
  updateAllLeaderboards(): void {
    for (const leagueId of this.leagues.keys()) {
      this.updateLeaderboardForLeague(leagueId);
    }
  }

  // Set WebSocket broadcast callback
  setBroadcastCallback(callback: LeagueBroadcastCallback): void {
    this.broadcastCallback = callback;
  }

  // Broadcast league updates to connected clients
  private broadcastLeagueUpdate(leagueId: string, event: string, data: unknown): void {
    if (this.broadcastCallback) {
      this.broadcastCallback(leagueId, event, data);
    }
  }

  // Enhanced leaderboard with more analytics
  getEnhancedLeaderboard(leagueId: string): LeaderboardEntry[] {
    const leaderboard = this.leaderboards.get(leagueId);
    if (!leaderboard) return [];

    return leaderboard.entries.map(entry => ({
      ...entry,
      // Add more calculated metrics
      avgTradeSize: entry.totalValue / Math.max(entry.totalTrades, 1),
      riskAdjustedReturn: entry.sharpeRatio > 0 ? entry.percentageReturn / entry.sharpeRatio : 0,
      consistency: entry.maxDrawdown > 0 ? 1 - (entry.maxDrawdown / 100) : 1
    }));
  }

  // Activity tracking
  private activities: Map<string, Array<{
    type: string;
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
  }>> = new Map();

  // Add activity to league
  addActivity(leagueId: string, type: string, userId: string, message: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    const activity = {
      type,
      userId,
      username: user.username,
      message,
      timestamp: new Date()
    };

    if (!this.activities.has(leagueId)) {
      this.activities.set(leagueId, []);
    }

    const leagueActivities = this.activities.get(leagueId)!;
    leagueActivities.unshift(activity); // Add to beginning

    // Keep only last 100 activities
    if (leagueActivities.length > 100) {
      leagueActivities.splice(100);
    }

    // Broadcast activity update
    this.broadcastLeagueUpdate(leagueId, 'ACTIVITY_UPDATE', {
      activity,
      recentActivities: leagueActivities.slice(0, 10)
    });
  }

  // Get league activity feed
  getLeagueActivity(leagueId: string, limit: number = 20): Array<{
    type: string;
    userId: string;
    username: string;
    message: string;
    timestamp: Date;
  }> {
    const activities = this.activities.get(leagueId) || [];
    return activities.slice(0, limit);
  }

  // Calculate league-wide statistics
  getLeagueStats(leagueId: string): {
    totalTrades: number;
    totalVolume: number;
    avgReturn: number;
    topGainer: string;
    topLoser: string;
    mostActiveTrade: string;
  } | null {
    const leaderboard = this.leaderboards.get(leagueId);
    if (!leaderboard || leaderboard.entries.length === 0) return null;

    const entries = leaderboard.entries;
    const totalTrades = entries.reduce((sum, entry) => sum + entry.totalTrades, 0);
    const avgReturn = entries.reduce((sum, entry) => sum + entry.percentageReturn, 0) / entries.length;
    
    const topGainer = entries.reduce((max, entry) => 
      entry.percentageReturn > max.percentageReturn ? entry : max
    );
    
    const topLoser = entries.reduce((min, entry) => 
      entry.percentageReturn < min.percentageReturn ? entry : min
    );
    
    const mostActive = entries.reduce((max, entry) => 
      entry.totalTrades > max.totalTrades ? entry : max
    );

    return {
      totalTrades,
      totalVolume: entries.reduce((sum, entry) => sum + entry.totalValue, 0),
      avgReturn,
      topGainer: topGainer.username,
      topLoser: topLoser.username,
      mostActiveTrade: mostActive.username
    };
  }

  // Real-time leaderboard update with broadcast
  updateLeaderboardRealtime(leagueId: string): void {
    this.updateLeaderboardForLeague(leagueId);
    const leaderboard = this.getLeaderboard(leagueId);
    const stats = this.getLeagueStats(leagueId);
    
    this.broadcastLeagueUpdate(leagueId, 'LEADERBOARD_UPDATE', {
      leaderboard,
      stats,
      timestamp: new Date()
    });
  }

  // Batch update all leaderboards with broadcast
  updateAllLeaderboardsRealtime(): void {
    for (const leagueId of this.leagues.keys()) {
      this.updateLeaderboardRealtime(leagueId);
    }
  }

  // Validate if a trade is allowed in the user's leagues
  validateTradeForUser(userId: string, tradeType: 'options' | 'short' | 'margin', leverage?: number): {
    allowed: boolean;
    restrictingLeagues: string[];
    message?: string;
  } {
    const user = this.users.get(userId);
    if (!user || user.leagueIds.length === 0) {
      return { allowed: true, restrictingLeagues: [] };
    }

    const restrictingLeagues: string[] = [];
    
    for (const leagueId of user.leagueIds) {
      const league = this.leagues.get(leagueId);
      if (league && league.isActive) {
        const settings = league.settings;
        
        switch (tradeType) {
          case 'options':
            if (!settings.allowOptions) {
              restrictingLeagues.push(league.name);
            }
            break;
          case 'short':
            if (!settings.allowShortSelling) {
              restrictingLeagues.push(league.name);
            }
            break;
          case 'margin':
            if (!settings.allowMargin || (leverage && leverage > settings.maxLeverage)) {
              restrictingLeagues.push(league.name);
            }
            break;
        }
      }
    }

    if (restrictingLeagues.length > 0) {
      return {
        allowed: false,
        restrictingLeagues,
        message: `Trade not allowed in league(s): ${restrictingLeagues.join(', ')}`
      };
    }

    return { allowed: true, restrictingLeagues: [] };
  }

  // Calculate trading fees for a user based on their leagues
  calculateTradingFees(userId: string, tradeValue: number): number {
    const user = this.users.get(userId);
    if (!user || user.leagueIds.length === 0) {
      return 0;
    }

    let highestFeePercentage = 0;
    
    for (const leagueId of user.leagueIds) {
      const league = this.leagues.get(leagueId);
      if (league && league.isActive && league.settings.tradingFees) {
        highestFeePercentage = Math.max(highestFeePercentage, league.settings.feePercentage);
      }
    }

    return tradeValue * (highestFeePercentage / 100);
  }

  // Set user with specific ID (for demo purposes)
  setUserWithId(userId: string, user: User): void {
    user.id = userId;
    this.users.set(userId, user);
  }

}

export const leagueManager = new LeagueManager();
