import { Player, PlayerStats, OrderBook } from './types.js';
import { orderBookManager } from './orderBook.js';
import { shortSellingEngine } from './shortSelling.js';

/**
 * Market-Driven Pricing Engine
 *
 * Follows Efficient Market Hypothesis principles:
 * - Prices reflect all available information
 * - Supply/demand from order book affects price
 * - Trade volume creates price impact
 * - Short interest affects price dynamics
 */

interface MarketPressure {
  orderBookPressure: number; // -1 to 1 (sell pressure to buy pressure)
  volumePressure: number; // Trade volume impact
  shortCoveringPressure: number; // Short squeeze potential
  totalPressure: number; // Combined effect
}

export class MarketDrivenPricing {
  // Weight factors for different components
  private readonly STATS_WEIGHT = 0.3; // 30% based on fundamentals (stats)
  private readonly MARKET_WEIGHT = 0.7; // 70% based on market activity

  // Sensitivity parameters
  private readonly ORDER_BOOK_SENSITIVITY = 0.01; // 1% max move from order book
  private readonly VOLUME_SENSITIVITY = 0.005; // 0.5% max move from volume
  private readonly SHORT_SQUEEZE_SENSITIVITY = 0.02; // 2% max move from short covering

  /**
   * Calculate new price based on market dynamics
   */
  calculateMarketPrice(
    player: Player,
    previousPrice: number,
    orderBook: OrderBook,
    recentTrades: number
  ): number {
    // 1. Calculate fundamental value from stats (30%)
    const fundamentalValue = this.calculateFundamentalValue(player.stats, previousPrice);

    // 2. Calculate market pressure (70%)
    const marketPressure = this.calculateMarketPressure(
      player,
      orderBook,
      recentTrades
    );

    // 3. Combine fundamental + market pressure
    const marketAdjustment = 1 + marketPressure.totalPressure;
    const marketDrivenPrice = previousPrice * marketAdjustment;

    // 4. Blend fundamental value with market price
    const blendedPrice =
      fundamentalValue * this.STATS_WEIGHT +
      marketDrivenPrice * this.MARKET_WEIGHT;

    // 5. Add some random noise (realistic market behavior)
    const noise = (Math.random() - 0.5) * 0.002 * previousPrice; // ±0.2%

    return Math.max(10, blendedPrice + noise);
  }

  /**
   * Calculate fundamental value based on player stats
   */
  private calculateFundamentalValue(
    stats: PlayerStats,
    basePrice: number
  ): number {
    const performanceScore =
      stats.ppg * 0.4 +
      stats.rpg * 0.2 +
      stats.apg * 0.2 +
      stats.fgPct * 0.1 +
      stats.threePtPct * 0.1;

    // Very small drift based on performance (not the main driver anymore)
    const drift = (Math.random() - 0.5) * 0.001; // ±0.1%

    return basePrice * (1 + drift);
  }

  /**
   * Calculate market pressure from order book, volume, and shorts
   */
  private calculateMarketPressure(
    player: Player,
    orderBook: OrderBook,
    recentTrades: number
  ): MarketPressure {
    // 1. Order Book Pressure
    const orderBookPressure = this.calculateOrderBookPressure(orderBook);

    // 2. Volume Pressure
    const volumePressure = this.calculateVolumePressure(
      recentTrades,
      player.volume
    );

    // 3. Short Covering Pressure
    const shortCoveringPressure = this.calculateShortPressure(player);

    // 4. Combine all pressures
    const totalPressure =
      orderBookPressure * this.ORDER_BOOK_SENSITIVITY +
      volumePressure * this.VOLUME_SENSITIVITY +
      shortCoveringPressure * this.SHORT_SQUEEZE_SENSITIVITY;

    return {
      orderBookPressure,
      volumePressure,
      shortCoveringPressure,
      totalPressure: Math.max(-0.05, Math.min(0.05, totalPressure)) // Cap at ±5%
    };
  }

  /**
   * Calculate pressure from order book imbalance
   *
   * More buyers than sellers → positive pressure (price up)
   * More sellers than buyers → negative pressure (price down)
   */
  private calculateOrderBookPressure(orderBook: OrderBook): number {
    const totalBuyVolume = orderBook.depth.bids.reduce(
      (sum, level) => sum + level.volume,
      0
    );

    const totalSellVolume = orderBook.depth.asks.reduce(
      (sum, level) => sum + level.volume,
      0
    );

    const totalVolume = totalBuyVolume + totalSellVolume;

    if (totalVolume === 0) return 0;

    // Imbalance: -1 (all sellers) to +1 (all buyers)
    const imbalance = (totalBuyVolume - totalSellVolume) / totalVolume;

    // Weight by how deep the order book is
    const depthFactor = Math.min(1, totalVolume / 1000); // Max effect at 1000 shares

    return imbalance * depthFactor;
  }

  /**
   * Calculate pressure from recent trading volume
   *
   * High volume = more price movement
   * Volume spikes indicate strong conviction
   */
  private calculateVolumePressure(
    recentTrades: number,
    avgVolume: number
  ): number {
    if (avgVolume === 0) return 0;

    // Volume spike: ratio of recent trades to average
    const volumeRatio = recentTrades / (avgVolume / 100); // Per-update volume

    // Higher volume = more pressure (direction determined by order book)
    // This amplifies the order book pressure
    return Math.log(1 + volumeRatio) - 1; // Logarithmic scaling
  }

  /**
   * Calculate pressure from short positions
   *
   * High short interest + price increase = short squeeze (upward pressure)
   * Low short interest = neutral
   */
  private calculateShortPressure(player: Player): number {
    const availableShares = player.availableShares;
    const totalShares = 100000; // Initial shares available
    const shortedShares = totalShares - availableShares;

    if (shortedShares === 0) return 0;

    // Short interest ratio
    const shortRatio = shortedShares / totalShares;

    // High short interest creates upward pressure (shorts need to cover)
    // This simulates short squeeze dynamics
    if (shortRatio > 0.5) {
      // Over 50% shorted = strong squeeze potential
      return shortRatio * 2; // Amplified pressure
    } else if (shortRatio > 0.3) {
      // 30-50% shorted = moderate pressure
      return shortRatio;
    }

    return 0; // Low short interest = no pressure
  }

  /**
   * Calculate price impact for a large market order
   *
   * Large orders move the price (slippage)
   */
  calculatePriceImpact(
    orderSize: number,
    currentPrice: number,
    orderBook: OrderBook,
    side: 'BUY' | 'SELL'
  ): number {
    const levels = side === 'BUY' ? orderBook.depth.asks : orderBook.depth.bids;

    let remainingSize = orderSize;
    let totalCost = 0;

    // Walk through order book levels
    for (const level of levels) {
      if (remainingSize <= 0) break;

      const fillSize = Math.min(remainingSize, level.volume);
      totalCost += fillSize * level.price;
      remainingSize -= fillSize;
    }

    // If we couldn't fill entire order, estimate impact
    if (remainingSize > 0) {
      const lastPrice = levels[levels.length - 1]?.price || currentPrice;
      const extraImpact = remainingSize * 0.01; // 1% per unfilled 100 shares
      totalCost += remainingSize * lastPrice * (1 + extraImpact);
    }

    const avgFillPrice = totalCost / orderSize;
    const impact = (avgFillPrice - currentPrice) / currentPrice;

    return side === 'BUY' ? impact : -impact;
  }

  /**
   * Adjust bid/ask spread based on market conditions
   *
   * High volatility or low liquidity → wider spread
   * Stable market with depth → tighter spread
   */
  calculateDynamicSpread(
    player: Player,
    orderBook: OrderBook
  ): { bidPrice: number; askPrice: number } {
    const baseSpread = 0.005; // 0.5% base spread

    // Volatility factor: higher volatility = wider spread
    const volatilitySpread = player.volatility * 0.01;

    // Liquidity factor: less depth = wider spread
    const totalDepth =
      orderBook.depth.bids.reduce((sum, l) => sum + l.volume, 0) +
      orderBook.depth.asks.reduce((sum, l) => sum + l.volume, 0);

    const liquiditySpread = Math.max(0, (1000 - totalDepth) / 100000);

    // Total spread
    const totalSpread = baseSpread + volatilitySpread + liquiditySpread;
    const cappedSpread = Math.min(0.02, totalSpread); // Max 2% spread

    return {
      bidPrice: player.currentPrice * (1 - cappedSpread),
      askPrice: player.currentPrice * (1 + cappedSpread)
    };
  }
}

export const marketDrivenPricing = new MarketDrivenPricing();
