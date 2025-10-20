import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, PieChart } from 'lucide-react';
import './QuickStatsHeader.css';

interface QuickStatsHeaderProps {
  portfolioValue: number;
  dayChange: number;
  dayChangePercent: number;
  buyingPower: number;
  positionsCount: number;
}

const QuickStatsHeader: React.FC<QuickStatsHeaderProps> = ({
  portfolioValue,
  dayChange,
  dayChangePercent,
  buyingPower,
  positionsCount,
}) => {
  const [prevValue, setPrevValue] = useState(portfolioValue);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (portfolioValue !== prevValue) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 600);
      setPrevValue(portfolioValue);
      return () => clearTimeout(timer);
    }
  }, [portfolioValue, prevValue]);

  return (
    <div className="quick-stats-header">
      <div className="stat-card primary">
        <div className="stat-icon">
          <DollarSign size={20} />
        </div>
        <div className="stat-content">
          <div className="stat-label">Portfolio Value</div>
          <div className={`stat-value ${isFlashing ? 'flash' : ''}`}>
            ${portfolioValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className={`stat-icon ${dayChange >= 0 ? 'positive' : 'negative'}`}>
          {dayChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        </div>
        <div className="stat-content">
          <div className="stat-label">Day's Change</div>
          <div
            className={`stat-value ${dayChange >= 0 ? 'positive' : 'negative'}`}
          >
            {dayChange >= 0 ? '+' : ''}${dayChange.toFixed(2)}{' '}
            <span className="stat-percent">
              ({dayChange >= 0 ? '+' : ''}
              {dayChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">
          <Activity size={20} />
        </div>
        <div className="stat-content">
          <div className="stat-label">Buying Power</div>
          <div className="stat-value">
            ${buyingPower.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">
          <PieChart size={20} />
        </div>
        <div className="stat-content">
          <div className="stat-label">Positions</div>
          <div className="stat-value">{positionsCount}</div>
        </div>
      </div>
    </div>
  );
};

export default QuickStatsHeader;
