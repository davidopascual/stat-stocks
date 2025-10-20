import { Player, PlayerStats, OrderBook } from './types.js';
import { orderBookManager } from './orderBook.js';
import { shortSellingEngine } from './shortSelling.js';
import { liveGameEngine } from './liveGameIntegration.js';

/**
 * HYBRID PRICING ENGINE
 *
 * Combines three pricing components with dynamic weighting:
 * 1. Fundamental Value (stats-based)
 * 2. Market Activity (order book, volume, shorts)
 * 3. Live Game Events (real-time plays)
 *
 * Weights adjust based on context (game time vs off-hours)
 */

interface PriceComponents {
  fundamentalValue: number;
  marketValue: number;
  liveEventValue: number;
  finalPrice: number;
  weights: {
    fundamental: number;
    market: number;
    liveEvents: number;
  };
}

interface PricingContext {
  isGameTime: boolean;
  isOffSeason: boolean;
  marketOpen: boolean; // Trading hours
  volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class HybridPricingEngine {
  // Configurable weight presets
  private readonly WEIGHT_PRESETS = {
    // During live games - live events dominate
    GAME_TIME: {
      fundamental: 0.30,
      market: 0.20,
      liveEvents: 0.50
    },

    // Normal trading hours - balanced
    NORMAL: {
      fundamental: 0.40,
      market: 0.30,
      liveEvents: 0.30
    },

    // Off-hours (no games, low volume)
    OFF_HOURS: {
      fundamental: 0.50,
      market: 0.50,
      liveEvents: 0.00
    },

    // Off-season
    OFF_SEASON: {
      fundamental: 0.70,
      market: 0.30,
      liveEvents: 0.00
    }
  };

  /**
   * Main pricing function - combines all components
   */
  calculatePrice(
    player: Player,
    previousPrice: number,
    orderBook: OrderBook,
    recentTrades: number,
    context: PricingContext
  ): PriceComponents {
    // 1. Calculate fundamental value from stats
    const fundamentalValue = this.calculateFundamentalValue(
      player,
      previousPrice
    );

    // 2. Calculate market-driven value
    const marketValue = this.calculateMarketValue(
      player,
      previousPrice,
      orderBook,
      recentTrades
    );

    // 3. Calculate live event impact
    const liveEventValue = this.calculateLiveEventValue(
      player,
      previousPrice
    );

    // 4. Determine appropriate weights based on context
    const weights = this.determineWeights(context);

    // 5. Combine all components with weights
    const finalPrice =
      fundamentalValue * weights.fundamental +
      marketValue * weights.market +
      liveEventValue * weights.liveEvents;

    return {
      fundamentalValue,
      marketValue,
      liveEventValue,
      finalPrice,
      weights
    };
  }

  /**
   * COMPONENT 1: FUNDAMENTAL VALUE
   *
   * Based on player stats and form
   */
  private calculateFundamentalValue(
    player: Player,
    basePrice: number
  ): number {
    const stats = player.stats;

    // Core performance score
    const performanceScore =
      stats.ppg * 0.35 +
      stats.rpg * 0.20 +
      stats.apg * 0.20 +
      stats.fgPct * 0.15 +
      stats.threePtPct * 0.10;

    // Historical value (mean reversion) - very weak pull
    // Players tend to revert to their "true" value over time
    const historicalAvg = this.calculateHistoricalAverage(player.priceHistory);
    const meanReversionFactor = (historicalAvg - basePrice) / basePrice * 0.01; // 1% pull toward mean (reduced from 5%)

    // Volatility drag removed - no longer penalizing volatile players
    // High volatility players are exciting, not inherently worse

    // Random walk based on player's volatility (natural price discovery)
    const randomWalk = (Math.random() - 0.5) * player.volatility * 0.5; // Scale with volatility

    const totalChange = meanReversionFactor + randomWalk;

    return basePrice * (1 + totalChange);
  }

  /**
   * COMPONENT 2: MARKET VALUE
   *
   * Based on trading activity, order book, shorts
   */
  private calculateMarketValue(
    player: Player,
    basePrice: number,
    orderBook: OrderBook,
    recentTrades: number
  ): number {
    // Order book imbalance
    const buyVolume = orderBook.depth.bids.reduce((sum, l) => sum + l.volume, 0);
    const sellVolume = orderBook.depth.asks.reduce((sum, l) => sum + l.volume, 0);
    const totalVolume = buyVolume + sellVolume;

    let orderBookPressure = 0;
    if (totalVolume > 0) {
      const imbalance = (buyVolume - sellVolume) / totalVolume;
      const depthFactor = Math.min(1, totalVolume / 1000);
      orderBookPressure = imbalance * depthFactor * 0.01; // Max ±1%
    }

    // Volume pressure (high volume amplifies moves)
    const avgVolume = player.volume / 100;
    const volumeRatio = recentTrades / Math.max(1, avgVolume);
    const volumePressure = (Math.log(1 + volumeRatio) - 1) * 0.005; // Max ~0.5%

    // Short squeeze pressure
    const availableShares = player.availableShares || 100000;
    const shortedShares = 100000 - availableShares;
    const shortRatio = shortedShares / 100000;

    let shortPressure = 0;
    if (shortRatio > 0.5) {
      shortPressure = shortRatio * 2 * 0.02; // High shorts = squeeze risk
    } else if (shortRatio > 0.3) {
      shortPressure = shortRatio * 0.02;
    }

    // Spread pressure (tight spread = bullish, wide spread = bearish)
    const spreadPct = (player.askPrice - player.bidPrice) / player.currentPrice;
    const spreadPressure = (0.01 - spreadPct) * 0.5; // Tighter than 1% = bullish

    // Add market noise (always present even with no activity)
    const marketNoise = (Math.random() - 0.5) * player.volatility * 0.3;

    // Combine all market pressures
    const totalMarketPressure =
      orderBookPressure +
      volumePressure +
      shortPressure +
      spreadPressure +
      marketNoise;

    return basePrice * (1 + totalMarketPressure);
  }

  /**
   * COMPONENT 3: LIVE EVENT VALUE
   *
   * Real-time game events
   */
  private calculateLiveEventValue(
    player: Player,
    basePrice: number
  ): number {
    const liveMultiplier = liveGameEngine.getPriceMultiplier(player.id);

    // If no live events, add some speculation noise
    if (liveMultiplier === 1.0) {
      const speculationNoise = (Math.random() - 0.5) * player.volatility * 0.2;
      return basePrice * (1 + speculationNoise);
    }

    // Live events create instant impact
    return basePrice * liveMultiplier;
  }

  /**
   * Determine weights based on current context
   */
  private determineWeights(context: PricingContext): {
    fundamental: number;
    market: number;
    liveEvents: number;
  } {
    // Off-season
    if (context.isOffSeason) {
      return this.WEIGHT_PRESETS.OFF_SEASON;
    }

    // Live game happening
    if (context.isGameTime) {
      return this.WEIGHT_PRESETS.GAME_TIME;
    }

    // Off-hours (late night, early morning)
    if (!context.marketOpen) {
      return this.WEIGHT_PRESETS.OFF_HOURS;
    }

    // Normal trading hours
    return this.WEIGHT_PRESETS.NORMAL;
  }

  /**
   * Determine current pricing context
   */
  determinePricingContext(player: Player): PricingContext {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth(); // 0-11

    // Check if game time (rough heuristic - real version would check actual schedule)
    const liveGames = liveGameEngine.getLiveGames();
    const isGameTime = liveGames.length > 0;

    // Off-season: June-September (months 5-8)
    const isOffSeason = month >= 5 && month <= 8;

    // Market open: 9am - 11pm EST (adjust for your needs)
    const marketOpen = hour >= 9 && hour <= 23;

    // Volatility level based on player's historical volatility
    let volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (player.volatility < 0.15) volatilityLevel = 'LOW';
    else if (player.volatility > 0.35) volatilityLevel = 'HIGH';

    return {
      isGameTime,
      isOffSeason,
      marketOpen,
      volatilityLevel
    };
  }

  /**
   * Calculate historical average price
   */
  private calculateHistoricalAverage(priceHistory: { date: string; price: number }[]): number {
    if (priceHistory.length === 0) return 0;

    const sum = priceHistory.reduce((total, p) => total + p.price, 0);
    return sum / priceHistory.length;
  }

  /**
   * Calculate dynamic bid/ask spread
   */
  calculateDynamicSpread(
    player: Player,
    orderBook: OrderBook,
    context: PricingContext
  ): { bidPrice: number; askPrice: number } {
    // Base spread
    let spread = 0.005; // 0.5%

    // Volatility adjustment
    spread += player.volatility * 0.01;

    // Liquidity adjustment
    const totalDepth =
      orderBook.depth.bids.reduce((sum, l) => sum + l.volume, 0) +
      orderBook.depth.asks.reduce((sum, l) => sum + l.volume, 0);
    spread += Math.max(0, (1000 - totalDepth) / 100000);

    // Game time = wider spread (more volatility)
    if (context.isGameTime) {
      spread *= 1.5;
    }

    // Off-hours = wider spread (less liquidity)
    if (!context.marketOpen) {
      spread *= 1.3;
    }

    // Cap spread at 2%
    spread = Math.min(0.02, spread);

    return {
      bidPrice: player.currentPrice * (1 - spread),
      askPrice: player.currentPrice * (1 + spread)
    };
  }

  /**
   * Apply circuit breakers and limits
   */
  applySafetyLimits(
    newPrice: number,
    oldPrice: number,
    maxChangePercent: number = 0.15
  ): number {
    const change = (newPrice - oldPrice) / oldPrice;

    if (Math.abs(change) > maxChangePercent) {
      // Cap at max change
      const cappedChange = Math.sign(change) * maxChangePercent;
      return oldPrice * (1 + cappedChange);
    }

    return newPrice;
  }
}

export const hybridPricingEngine = new HybridPricingEngine();
