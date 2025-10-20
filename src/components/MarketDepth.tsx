import React from 'react';
import './MarketDepth.css';

interface OrderLevel {
  price: number;
  size: number;
  total: number;
}

interface MarketDepthProps {
  bids: OrderLevel[];
  asks: OrderLevel[];
  currentPrice: number;
  spread: number;
}

const MarketDepth: React.FC<MarketDepthProps> = ({
  bids,
  asks,
  currentPrice,
  spread,
}) => {
  const maxSize = Math.max(
    ...bids.map(b => b.size),
    ...asks.map(a => a.size)
  );

  return (
    <div className="market-depth-container">
      <div className="market-depth-header">
        <h3 className="market-depth-title">Market Depth</h3>
        <div className="market-depth-spread">
          <span className="spread-label">Spread</span>
          <span className="spread-value font-mono">${spread.toFixed(2)}</span>
        </div>
      </div>

      <div className="market-depth-labels">
        <span>Price</span>
        <span>Size</span>
        <span>Total</span>
      </div>

      <div className="market-depth-book">
        {/* Ask orders (sells) */}
        <div className="depth-side asks">
          {asks.slice(0, 10).reverse().map((ask, index) => {
            const widthPercent = (ask.size / maxSize) * 100;
            return (
              <div key={`ask-${index}`} className="depth-row ask">
                <div
                  className="depth-bar"
                  style={{ width: `${widthPercent}%` }}
                />
                <span className="depth-price font-mono">${ask.price.toFixed(2)}</span>
                <span className="depth-size font-mono">{ask.size}</span>
                <span className="depth-total font-mono">{ask.total}</span>
              </div>
            );
          })}
        </div>

        {/* Current price indicator */}
        <div className="depth-current-price">
          <div className="current-price-line" />
          <span className="current-price-value font-mono">
            ${currentPrice.toFixed(2)}
          </span>
          <div className="current-price-line" />
        </div>

        {/* Bid orders (buys) */}
        <div className="depth-side bids">
          {bids.slice(0, 10).map((bid, index) => {
            const widthPercent = (bid.size / maxSize) * 100;
            return (
              <div key={`bid-${index}`} className="depth-row bid">
                <div
                  className="depth-bar"
                  style={{ width: `${widthPercent}%` }}
                />
                <span className="depth-price font-mono">${bid.price.toFixed(2)}</span>
                <span className="depth-size font-mono">{bid.size}</span>
                <span className="depth-total font-mono">{bid.total}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="market-depth-legend">
        <div className="legend-item">
          <div className="legend-color bid" />
          <span>Bids (Buy Orders)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color ask" />
          <span>Asks (Sell Orders)</span>
        </div>
      </div>
    </div>
  );
};

export default MarketDepth;
