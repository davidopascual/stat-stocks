import React, { useState, useMemo } from 'react';
import { Player, mockPlayers } from '../data/mockPlayers';

interface MarketViewProps {
  onSelectPlayer: (player: Player) => void;
}

const MarketView: React.FC<MarketViewProps> = ({ onSelectPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'change' | 'volume'>('change');

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = mockPlayers.filter(
      player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.currentPrice - a.currentPrice;
        case 'change':
          return Math.abs(b.priceChange) - Math.abs(a.priceChange);
        case 'volume':
          return b.volume - a.volume;
        default:
          return 0;
      }
    });

    return sorted;
  }, [searchTerm, sortBy]);

  const totalVolume = mockPlayers.reduce((sum, p) => sum + p.volume, 0);
  const avgChange =
    mockPlayers.reduce((sum, p) => sum + p.priceChange, 0) / mockPlayers.length;

  return (
    <div>
      <div className="market-header">
        <h1>NBA Player Market</h1>
        <div className="market-stats">
          <span>{mockPlayers.length} Players Trading</span>
          <span>•</span>
          <span>Total Volume: ${(totalVolume / 1000).toFixed(0)}K</span>
          <span>•</span>
          <span>
            Avg Change:{' '}
            <span style={{ color: avgChange >= 0 ? '#00ba7c' : '#f4212e' }}>
              {avgChange >= 0 ? '+' : ''}
              {avgChange.toFixed(2)}%
            </span>
          </span>
        </div>
      </div>

      <div className="market-controls">
        <input
          type="text"
          className="search-bar"
          placeholder="Search players, teams, or positions..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="sort-controls">
          <button
            className={`sort-btn ${sortBy === 'change' ? 'active' : ''}`}
            onClick={() => setSortBy('change')}
          >
            Top Movers
          </button>
          <button
            className={`sort-btn ${sortBy === 'price' ? 'active' : ''}`}
            onClick={() => setSortBy('price')}
          >
            Highest Price
          </button>
          <button
            className={`sort-btn ${sortBy === 'volume' ? 'active' : ''}`}
            onClick={() => setSortBy('volume')}
          >
            Most Active
          </button>
        </div>
      </div>

      <div className="players-grid">
        {filteredAndSortedPlayers.map(player => (
          <div
            key={player.id}
            className="player-card"
            onClick={() => onSelectPlayer(player)}
          >
            <div className="player-card-header">
              <div className="player-info">
                <h3>{player.name}</h3>
                <div className="player-meta">
                  <span>{player.team}</span>
                  <span>•</span>
                  <span>{player.position}</span>
                </div>
              </div>
              <div className="player-price">
                <div className="price-value">${player.currentPrice.toFixed(2)}</div>
                <div
                  className={`price-change ${
                    player.priceChange >= 0 ? 'positive' : 'negative'
                  }`}
                >
                  {player.priceChange >= 0 ? '+' : ''}
                  {player.priceChange.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="player-stats">
              <div className="stat-item">
                <div className="stat-label">PPG</div>
                <div className="stat-value">{player.stats.ppg}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">RPG</div>
                <div className="stat-value">{player.stats.rpg}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">APG</div>
                <div className="stat-value">{player.stats.apg}</div>
              </div>
            </div>

            <div className="player-volume">
              Volume: ${(player.volume / 1000).toFixed(0)}K
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketView;
