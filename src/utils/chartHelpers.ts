/**
 * Convert price history to candlestick format
 * Groups prices into time intervals and calculates OHLC
 */
export function convertToCandlestickData(
  priceHistory: { date: string; price: number }[],
  intervalMinutes: number = 5
): { time: string; open: number; high: number; low: number; close: number }[] {
  if (priceHistory.length === 0) return [];

  // Sort by date
  const sorted = [...priceHistory].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const candles: { time: string; open: number; high: number; low: number; close: number }[] = [];
  const intervalMs = intervalMinutes * 60 * 1000;

  type Candle = {
    startTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    prices: number[];
  };

  let currentCandle: Candle | null = null;

  sorted.forEach((point) => {
    const timestamp = new Date(point.date).getTime();
    const price = point.price;

    if (!currentCandle) {
      // Start first candle
      const startTime = Math.floor(timestamp / intervalMs) * intervalMs;
      currentCandle = {
        startTime,
        open: price,
        high: price,
        low: price,
        close: price,
        prices: [price],
      };
    } else {
      const candleStartTime = Math.floor(timestamp / intervalMs) * intervalMs;

      if (candleStartTime > currentCandle.startTime) {
        // Complete current candle and push
        candles.push({
          time: new Date(currentCandle.startTime).toISOString().split('T')[0],
          open: currentCandle.open,
          high: currentCandle.high,
          low: currentCandle.low,
          close: currentCandle.close,
        });

        // Start new candle
        currentCandle = {
          startTime: candleStartTime,
          open: price,
          high: price,
          low: price,
          close: price,
          prices: [price],
        };
      } else {
        // Update current candle
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
        currentCandle.prices.push(price);
      }
    }
  });

  // Push last candle
  if (currentCandle !== null) {
    const finalCandle: Candle = currentCandle;
    candles.push({
      time: new Date(finalCandle.startTime).toISOString().split('T')[0],
      open: finalCandle.open,
      high: finalCandle.high,
      low: finalCandle.low,
      close: finalCandle.close,
    });
  }

  return candles;
}

/**
 * Generate realistic candlestick data for demo/testing
 */
export function generateMockCandlestickData(
  basePrice: number,
  days: number = 30
): { time: string; open: number; high: number; low: number; close: number }[] {
  const data: { time: string; open: number; high: number; low: number; close: number }[] = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let price = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now - i * dayMs);
    const dateString = date.toISOString().split('T')[0];

    // Random daily movement
    const change = (Math.random() - 0.48) * basePrice * 0.05; // Slight upward bias
    const open = price;
    const close = price + change;

    // High and low with some variance
    const volatility = Math.abs(change) * 2;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;

    data.push({
      time: dateString,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    });

    price = close;
  }

  return data;
}
