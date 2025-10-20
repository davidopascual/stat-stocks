import React from 'react';
import { TrendingUp, TrendingDown, Eye, ShoppingCart, XCircle } from 'lucide-react';
import './PositionCard.css';

interface PositionCardProps {
  playerName: string;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  priceHistory?: number[];
  onView?: () => void;
  onBuyMore?: () => void;
  onSell?: () => void;
}

const PositionCard: React.FC<PositionCardProps> = ({
  playerName,
  shares,
  avgBuyPrice,
  currentPrice,
  priceHistory = [],
  onView,
  onBuyMore,
  onSell,
}) => {
  const currentValue = currentPrice * shares;
  const costBasis = avgBuyPrice * shares;
  const pnl = currentValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  const isPositive = pnl >= 0;

  // Generate SVG sparkline path
  const generateSparklinePath = (data: number[]) => {
    if (data.length < 2) return '';

    const width = 120;
    const height = 40;
    const padding = 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((value - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const sparklinePath = priceHistory.length > 0
    ? generateSparklinePath(priceHistory.slice(-20))
    : '';

  return (
    <div className="position-card">
      <div className="position-card-header">
        <div className="position-info">
          <h3 className="position-player-name">{playerName}</h3>
          <div className="position-meta">
            <span>{shares} shares</span>
            <span className="position-dot">•</span>
            <span className="position-avg">Avg ${avgBuyPrice.toFixed(2)}</span>
          </div>
        </div>
        <div className={`position-pnl ${isPositive ? 'positive' : 'negative'}`}>
          <div className="pnl-amount">
            {isPositive ? '+' : ''}${Math.abs(pnl).toFixed(2)}
          </div>
          <div className="pnl-percent">
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="position-card-body">
        <div className="position-prices">
          <div className="price-item">
            <div className="price-label">Current Price</div>
            <div className="price-value font-mono">${currentPrice.toFixed(2)}</div>
          </div>
          <div className="price-item">
            <div className="price-label">Total Value</div>
            <div className="price-value font-mono">${currentValue.toFixed(2)}</div>
          </div>
        </div>

        {sparklinePath && (
          <div className="position-sparkline">
            <svg width="120" height="40" viewBox="0 0 120 40">
              <path
                d={sparklinePath}
                fill="none"
                stroke={isPositive ? 'var(--color-positive)' : 'var(--color-negative)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="position-card-actions">
        <button className="position-action-btn view" onClick={onView} title="View Details">
          <Eye size={16} />
          <span>View</span>
        </button>
        <button className="position-action-btn buy" onClick={onBuyMore} title="Buy More">
          <ShoppingCart size={16} />
          <span>Buy</span>
        </button>
        <button className="position-action-btn sell" onClick={onSell} title="Sell">
          <XCircle size={16} />
          <span>Sell</span>
        </button>
      </div>
    </div>
  );
};

export default PositionCard;
