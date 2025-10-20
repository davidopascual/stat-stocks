import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './PriceTicker.css';

interface PriceTickerProps {
  players: Player[];
}

const PriceTicker: React.FC<PriceTickerProps> = ({ players }) => {
  const [animationKey, setAnimationKey] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Restart animation when prices change
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [players]);

  // Top movers for the ticker
  const topMovers = [...players]
    .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
    .slice(0, 15);

  // Duplicate for seamless loop
  const tickerData = [...topMovers, ...topMovers];

  return (
    <div className="price-ticker">
      <div className="ticker-label">
        <span>LIVE MARKET</span>
      </div>
      <div className="ticker-track" ref={tickerRef}>
        <div className="ticker-content" key={animationKey}>
          {tickerData.map((player, index) => (
            <div key={`${player.id}-${index}`} className="ticker-item">
              <span className="ticker-name">{player.name}</span>
              <span className="ticker-price font-mono">
                ${player.currentPrice.toFixed(2)}
              </span>
              <span
                className={`ticker-change ${
                  player.priceChange >= 0 ? 'positive' : 'negative'
                }`}
              >
                {player.priceChange >= 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {player.priceChange >= 0 ? '+' : ''}
                {player.priceChange.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriceTicker;
