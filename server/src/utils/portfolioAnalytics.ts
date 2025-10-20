import { Portfolio, Transaction, Player } from '../types.js';

/**
 * PROFESSIONAL PORTFOLIO ANALYTICS
 *
 * Industry-standard financial metrics:
 * - Sharpe Ratio (risk-adjusted returns)
 * - Beta (market correlation)
 * - Value at Risk (VaR)
 * - Maximum Drawdown
 * - Win Rate
 * - Profit Factor
 * - Alpha (excess returns)
 */

export interface PortfolioMetrics {
  // Performance Metrics
  totalReturn: number;           // Absolute return
  totalReturnPercent: number;    // Percentage return
  dailyReturn: number;           // Today's return
  weeklyReturn: number;          // This week's return
  monthlyReturn: number;         // This month's return

  // Risk Metrics
  sharpeRatio: number;           // Risk-adjusted return (higher is better)
  beta: number;                  // Market correlation (1.0 = market)
  alpha: number;                 // Excess returns vs market
  valueAtRisk95: number;         // 95% confidence VaR
  maxDrawdown: number;           // Maximum peak-to-trough decline

  // Trading Metrics
  totalTrades: number;
  winRate: number;               // Percentage of profitable trades
  profitFactor: number;          // Gross profit / Gross loss
  avgWin: number;                // Average winning trade
  avgLoss: number;               // Average losing trade
  largestWin: number;
  largestLoss: number;

  // Position Metrics
  concentration: Array<{         // Largest positions
    playerId: string;
    playerName: string;
    percentage: number;
  }>;
  diversificationScore: number;  // Higher = more diversified (0-100)

  // Time-weighted Returns
  twrr: number;                  // Time-weighted rate of return
}

export class PortfolioAnalytics {
  /**
   * Calculate comprehensive portfolio metrics
   */
  static calculateMetrics(
    portfolio: Portfolio,
    players: Map<string, Player>,
    marketReturns: number[] = []
  ): PortfolioMetrics {
    const currentValue = this.calculateTotalValue(portfolio, players);
    const startingBalance = portfolio.totalValue || 100000;

    // Performance metrics
    const totalReturn = currentValue - startingBalance;
    const totalReturnPercent = (totalReturn / startingBalance) * 100;

    // Calculate time-based returns
    const returns = this.calculatePeriodicReturns(portfolio.transactions);
    const dailyReturn = returns.daily;
    const weeklyReturn = returns.weekly;
    const monthlyReturn = returns.monthly;

    // Risk metrics
    const sharpeRatio = this.calculateSharpeRatio(portfolio.transactions, startingBalance);
    const beta = this.calculateBeta(portfolio, players, marketReturns);
    const alpha = this.calculateAlpha(totalReturnPercent, beta, marketReturns);
    const valueAtRisk95 = this.calculateVaR(portfolio, players, 0.95);
    const maxDrawdown = this.calculateMaxDrawdown(portfolio.transactions, startingBalance);

    // Trading metrics
    const tradingMetrics = this.calculateTradingMetrics(portfolio.transactions);

    // Position metrics
    const concentration = this.calculateConcentration(portfolio, players);
    const diversificationScore = this.calculateDiversificationScore(portfolio);

    // Time-weighted return
    const twrr = this.calculateTWRR(portfolio.transactions, startingBalance);

    return {
      totalReturn,
      totalReturnPercent,
      dailyReturn,
      weeklyReturn,
      monthlyReturn,
      sharpeRatio,
      beta,
      alpha,
      valueAtRisk95,
      maxDrawdown,
      ...tradingMetrics,
      concentration,
      diversificationScore,
      twrr
    };
  }

  /**
   * SHARPE RATIO
   *
   * Measures risk-adjusted returns
   * Formula: (Return - RiskFreeRate) / StandardDeviation
   * Higher is better (>1.0 is good, >2.0 is excellent)
   */
  private static calculateSharpeRatio(transactions: Transaction[], startingBalance: number): number {
    if (transactions.length < 2) return 0;

    // Calculate daily returns
    const dailyReturns = this.getDailyReturns(transactions, startingBalance);
    if (dailyReturns.length < 2) return 0;

    // Calculate average return
    const avgReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;

    // Calculate standard deviation
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Risk-free rate (annual) = 4.5%, convert to daily
    const riskFreeRate = 0.045 / 252; // 252 trading days

    // Sharpe ratio (annualized)
    const sharpeRatio = ((avgReturn - riskFreeRate) / stdDev) * Math.sqrt(252);

    return parseFloat(sharpeRatio.toFixed(2));
  }

  /**
   * BETA
   *
   * Measures correlation with market
   * 1.0 = moves with market
   * >1.0 = more volatile than market
   * <1.0 = less volatile than market
   */
  private static calculateBeta(
    portfolio: Portfolio,
    players: Map<string, Player>,
    marketReturns: number[]
  ): number {
    if (marketReturns.length < 2) return 1.0; // Default to market

    const portfolioReturns = this.getDailyReturns(portfolio.transactions, portfolio.totalValue || 100000);
    if (portfolioReturns.length < 2) return 1.0;

    // Calculate covariance and variance
    const minLength = Math.min(portfolioReturns.length, marketReturns.length);
    const alignedPortfolioReturns = portfolioReturns.slice(-minLength);
    const alignedMarketReturns = marketReturns.slice(-minLength);

    const avgPortfolioReturn = alignedPortfolioReturns.reduce((sum, r) => sum + r, 0) / minLength;
    const avgMarketReturn = alignedMarketReturns.reduce((sum, r) => sum + r, 0) / minLength;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < minLength; i++) {
      const portfolioDev = alignedPortfolioReturns[i] - avgPortfolioReturn;
      const marketDev = alignedMarketReturns[i] - avgMarketReturn;
      covariance += portfolioDev * marketDev;
      marketVariance += marketDev * marketDev;
    }

    covariance /= minLength;
    marketVariance /= minLength;

    if (marketVariance === 0) return 1.0;

    const beta = covariance / marketVariance;
    return parseFloat(beta.toFixed(2));
  }

  /**
   * ALPHA
   *
   * Measures excess returns vs market (adjusted for risk)
   * Positive alpha = outperforming
   * Formula: PortfolioReturn - (RiskFreeRate + Beta * (MarketReturn - RiskFreeRate))
   */
  private static calculateAlpha(
    portfolioReturn: number,
    beta: number,
    marketReturns: number[]
  ): number {
    if (marketReturns.length === 0) return 0;

    const riskFreeRate = 4.5; // 4.5% annual
    const marketReturn = marketReturns.reduce((sum, r) => sum + r, 0) / marketReturns.length * 252; // Annualized

    // CAPM: Expected Return = RiskFreeRate + Beta * (MarketReturn - RiskFreeRate)
    const expectedReturn = riskFreeRate + beta * (marketReturn - riskFreeRate);
    const alpha = portfolioReturn - expectedReturn;

    return parseFloat(alpha.toFixed(2));
  }

  /**
   * VALUE AT RISK (VaR)
   *
   * Maximum expected loss at 95% confidence over 1 day
   * Example: VaR of $1000 means 95% chance loss won't exceed $1000
   */
  private static calculateVaR(
    portfolio: Portfolio,
    players: Map<string, Player>,
    confidence: number = 0.95
  ): number {
    const dailyReturns = this.getDailyReturns(portfolio.transactions, portfolio.totalValue || 100000);
    if (dailyReturns.length < 2) return 0;

    // Sort returns
    const sortedReturns = [...dailyReturns].sort((a, b) => a - b);

    // Get value at confidence level
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const varReturn = sortedReturns[index] || 0;

    // Convert to dollar amount
    const currentValue = this.calculateTotalValue(portfolio, players);
    const var95 = Math.abs(varReturn * currentValue);

    return parseFloat(var95.toFixed(2));
  }

  /**
   * MAXIMUM DRAWDOWN
   *
   * Largest peak-to-trough decline
   * Measures worst loss from a peak
   */
  private static calculateMaxDrawdown(transactions: Transaction[], startingBalance: number): number {
    if (transactions.length === 0) return 0;

    let peak = startingBalance;
    let maxDrawdown = 0;
    let balance = startingBalance;

    // Sort transactions by date
    const sorted = [...transactions].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach(tx => {
      // Update balance
      if (tx.type === 'BUY' || tx.type === 'OPTION_BUY') {
        balance -= tx.total;
      } else if (tx.type === 'SELL' || tx.type === 'OPTION_SELL') {
        balance += tx.total;
      }

      // Update peak
      if (balance > peak) {
        peak = balance;
      }

      // Calculate drawdown
      const drawdown = (peak - balance) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return parseFloat((maxDrawdown * 100).toFixed(2));
  }

  /**
   * Calculate trading-specific metrics
   */
  private static calculateTradingMetrics(transactions: Transaction[]) {
    if (transactions.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0
      };
    }

    // Group transactions into trades (buy-sell pairs)
    const trades: Array<{ pnl: number }> = [];
    const positions = new Map<string, { shares: number; avgCost: number }>();

    transactions.forEach(tx => {
      const key = tx.playerId || tx.optionId || '';
      if (!key) return;

      if (tx.type === 'BUY' || tx.type === 'OPTION_BUY') {
        const pos = positions.get(key) || { shares: 0, avgCost: 0 };
        const totalShares = pos.shares + (tx.shares || tx.contracts || 0);
        const newAvgCost = (pos.avgCost * pos.shares + tx.total) / totalShares;
        positions.set(key, { shares: totalShares, avgCost: newAvgCost });
      } else if (tx.type === 'SELL' || tx.type === 'OPTION_SELL') {
        const pos = positions.get(key);
        if (pos) {
          const shares = tx.shares || tx.contracts || 0;
          const pnl = tx.total - (pos.avgCost * shares);
          trades.push({ pnl });

          pos.shares -= shares;
          if (pos.shares <= 0) {
            positions.delete(key);
          }
        }
      }
    });

    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0
      };
    }

    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);

    const totalWins = wins.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

    const winRate = (wins.length / trades.length) * 100;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
    const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0;
    const largestLoss = losses.length > 0 ? Math.abs(Math.min(...losses.map(t => t.pnl))) : 0;

    return {
      totalTrades: trades.length,
      winRate: parseFloat(winRate.toFixed(2)),
      profitFactor: parseFloat(profitFactor.toFixed(2)),
      avgWin: parseFloat(avgWin.toFixed(2)),
      avgLoss: parseFloat(avgLoss.toFixed(2)),
      largestWin: parseFloat(largestWin.toFixed(2)),
      largestLoss: parseFloat(largestLoss.toFixed(2))
    };
  }

  /**
   * Calculate portfolio concentration
   */
  private static calculateConcentration(
    portfolio: Portfolio,
    players: Map<string, Player>
  ): Array<{ playerId: string; playerName: string; percentage: number }> {
    const totalValue = this.calculateTotalValue(portfolio, players);
    if (totalValue === 0) return [];

    const positions = portfolio.holdings.map(h => {
      const player = players.get(h.playerId);
      const value = (player?.currentPrice || 0) * h.shares;
      return {
        playerId: h.playerId,
        playerName: h.playerName,
        percentage: (value / totalValue) * 100
      };
    });

    return positions
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5) // Top 5 positions
      .map(p => ({
        ...p,
        percentage: parseFloat(p.percentage.toFixed(2))
      }));
  }

  /**
   * Calculate diversification score (0-100)
   */
  private static calculateDiversificationScore(portfolio: Portfolio): number {
    if (portfolio.holdings.length === 0) return 0;
    if (portfolio.holdings.length === 1) return 0;

    // Use Herfindahl-Hirschman Index (HHI)
    // Lower HHI = more diversified
    const totalShares = portfolio.holdings.reduce((sum, h) => sum + h.shares, 0);
    const hhi = portfolio.holdings.reduce((sum, h) => {
      const share = h.shares / totalShares;
      return sum + share * share;
    }, 0);

    // Convert to score (0-100, higher is better)
    const maxHHI = 1.0; // Completely concentrated
    const minHHI = 1 / portfolio.holdings.length; // Perfectly diversified
    const normalizedHHI = (maxHHI - hhi) / (maxHHI - minHHI);
    const score = normalizedHHI * 100;

    return Math.min(100, Math.max(0, parseFloat(score.toFixed(2))));
  }

  /**
   * Time-Weighted Rate of Return (TWRR)
   */
  private static calculateTWRR(transactions: Transaction[], startingBalance: number): number {
    // Simplified TWRR calculation
    // Full implementation would segment by cash flows
    if (transactions.length === 0) return 0;

    const totalValue = transactions.reduce((val, tx) => {
      if (tx.type === 'BUY' || tx.type === 'OPTION_BUY') {
        return val - tx.total;
      } else {
        return val + tx.total;
      }
    }, startingBalance);

    const returnPct = ((totalValue - startingBalance) / startingBalance) * 100;
    return parseFloat(returnPct.toFixed(2));
  }

  // Helper methods
  private static calculateTotalValue(portfolio: Portfolio, players: Map<string, Player>): number {
    const holdingsValue = portfolio.holdings.reduce((sum, h) => {
      const player = players.get(h.playerId);
      return sum + (player?.currentPrice || 0) * h.shares;
    }, 0);

    return portfolio.cash + holdingsValue;
  }

  private static getDailyReturns(transactions: Transaction[], startingBalance: number): number[] {
    // Simplified: calculate returns based on transactions
    const returns: number[] = [];
    let previousValue = startingBalance;

    transactions.forEach(tx => {
      if (tx.type === 'BUY' || tx.type === 'OPTION_BUY') {
        previousValue -= tx.total;
      } else {
        const returnPct = (tx.total - previousValue) / previousValue;
        returns.push(returnPct);
        previousValue = tx.total;
      }
    });

    return returns;
  }

  private static calculatePeriodicReturns(transactions: Transaction[]) {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const calculateReturn = (since: Date) => {
      const recentTxs = transactions.filter(tx => new Date(tx.timestamp) > since);
      const pnl = recentTxs.reduce((sum, tx) => {
        if (tx.type === 'SELL' || tx.type === 'OPTION_SELL') {
          return sum + tx.total;
        } else {
          return sum - tx.total;
        }
      }, 0);
      return pnl;
    };

    return {
      daily: calculateReturn(oneDayAgo),
      weekly: calculateReturn(oneWeekAgo),
      monthly: calculateReturn(oneMonthAgo)
    };
  }
}
