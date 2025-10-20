import { ShortPosition, Player, Transaction } from './types.js';

class ShortSellingEngine {
  private shortPositions: Map<string, ShortPosition[]> = new Map();
  private availableShares: Map<string, number> = new Map(); // shares available to borrow
  private dailyFeeRate = 0.001; // 0.1% per day borrowing fee

  constructor() {
    // Run daily fee collection
    setInterval(() => this.collectDailyFees(), 24 * 60 * 60 * 1000);
  }

  // Initialize shares available for shorting
  initializeAvailableShares(player: Player, shares: number): void {
    this.availableShares.set(player.id, shares);
  }

  // Short sell shares
  shortSell(
    userId: string,
    player: Player,
    shares: number
  ): { success: boolean; message: string; proceeds?: number; position?: ShortPosition } {
    const available = this.availableShares.get(player.id) || 0;

    if (shares > available) {
      return {
        success: false,
        message: `Only ${available} shares available to short`
      };
    }

    // Reduce available shares
    this.availableShares.set(player.id, available - shares);

    // Calculate proceeds (sell at current price)
    const proceeds = player.currentPrice * shares;

    // Create short position
    const position: ShortPosition = {
      userId,
      playerId: player.id,
      playerName: player.name,
      shares,
      avgBuyPrice: 0, // Not applicable for shorts
      currentPrice: player.currentPrice,
      type: 'SHORT',
      borrowPrice: player.currentPrice,
      borrowDate: new Date(),
      dailyFee: this.dailyFeeRate,
      sharesBorrowed: shares
    };

    const userShorts = this.shortPositions.get(userId) || [];
    userShorts.push(position);
    this.shortPositions.set(userId, userShorts);

    return {
      success: true,
      message: `Shorted ${shares} shares of ${player.name}`,
      proceeds,
      position
    };
  }

  // Cover (buy back) short position
  coverShort(
    userId: string,
    playerId: string,
    sharesToCover: number,
    currentPrice: number
  ): {
    success: boolean;
    message: string;
    cost?: number;
    profit?: number;
    fees?: number;
  } {
    const userShorts = this.shortPositions.get(userId) || [];
    const position = userShorts.find(p => p.playerId === playerId);

    if (!position) {
      return { success: false, message: 'No short position found' };
    }

    if (sharesToCover > position.sharesBorrowed) {
      return {
        success: false,
        message: `Only ${position.sharesBorrowed} shares are shorted`
      };
    }

    // Calculate cost to buy back
    const cost = currentPrice * sharesToCover;

    // Calculate profit/loss
    const proceeds = position.borrowPrice * sharesToCover;
    const profit = proceeds - cost;

    // Calculate accumulated fees
    const daysHeld = Math.floor(
      (Date.now() - position.borrowDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const fees = position.borrowPrice * sharesToCover * this.dailyFeeRate * daysHeld;

    // Update or remove position
    if (sharesToCover >= position.sharesBorrowed) {
      // Fully covered
      const updatedShorts = userShorts.filter(p => p.playerId !== playerId);
      this.shortPositions.set(userId, updatedShorts);
    } else {
      // Partially covered
      position.sharesBorrowed -= sharesToCover;
    }

    // Return shares to available pool
    const available = this.availableShares.get(playerId) || 0;
    this.availableShares.set(playerId, available + sharesToCover);

    return {
      success: true,
      message: `Covered ${sharesToCover} shares`,
      cost,
      profit: profit - fees,
      fees
    };
  }

  // Get user's short positions
  getUserShortPositions(userId: string): ShortPosition[] {
    return this.shortPositions.get(userId) || [];
  }

  // Calculate total short exposure
  getShortExposure(userId: string, currentPrices: Map<string, number>): number {
    const positions = this.getUserShortPositions(userId);
    let exposure = 0;

    for (const position of positions) {
      const currentPrice = currentPrices.get(position.playerId);
      if (!currentPrice) continue;

      // Exposure is current value of borrowed shares
      exposure += currentPrice * position.sharesBorrowed;
    }

    return exposure;
  }

  // Calculate unrealized P&L on short positions
  getShortPnL(userId: string, currentPrices: Map<string, number>): number {
    const positions = this.getUserShortPositions(userId);
    let totalPnL = 0;

    for (const position of positions) {
      const currentPrice = currentPrices.get(position.playerId);
      if (!currentPrice) continue;

      // Profit = (borrow price - current price) * shares
      const pnl =
        (position.borrowPrice - currentPrice) * position.sharesBorrowed;

      // Subtract fees
      const daysHeld = Math.floor(
        (Date.now() - position.borrowDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const fees =
        position.borrowPrice *
        position.sharesBorrowed *
        this.dailyFeeRate *
        daysHeld;

      totalPnL += pnl - fees;
    }

    return totalPnL;
  }

  // Collect daily borrowing fees
  private collectDailyFees(): void {
    console.log('Collecting daily short borrowing fees...');

    for (const [userId, positions] of this.shortPositions.entries()) {
      for (const position of positions) {
        const dailyFee =
          position.borrowPrice * position.sharesBorrowed * this.dailyFeeRate;
        console.log(`User ${userId} charged $${dailyFee.toFixed(2)} for shorting ${position.playerName}`);
      }
    }
  }

  // Check for margin calls (if price moved too much against short)
  checkMarginCalls(
    userId: string,
    currentPrices: Map<string, number>,
    userCash: number
  ): { marginCall: boolean; positions: ShortPosition[] } {
    const positions = this.getUserShortPositions(userId);
    const marginCallPositions: ShortPosition[] = [];

    for (const position of positions) {
      const currentPrice = currentPrices.get(position.playerId);
      if (!currentPrice) continue;

      // If current price is >50% above borrow price, margin call
      const priceIncrease = (currentPrice - position.borrowPrice) / position.borrowPrice;

      if (priceIncrease > 0.5) {
        marginCallPositions.push(position);
      }
    }

    return {
      marginCall: marginCallPositions.length > 0,
      positions: marginCallPositions
    };
  }

  // Force liquidate short positions (margin call)
  forceLiquidate(userId: string, playerId: string, currentPrice: number): void {
    console.log(`Force liquidating ${playerId} short position for user ${userId}`);
    this.coverShort(userId, playerId, 999999, currentPrice); // Cover all shares
  }

  getAvailableShares(playerId: string): number {
    return this.availableShares.get(playerId) || 0;
  }
}

export const shortSellingEngine = new ShortSellingEngine();
