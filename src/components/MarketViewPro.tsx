import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { Search, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import './MarketViewPro.css';

interface MarketViewProProps {
  onSelectPlayer: (player: Player) => void;
  players: Player[];
}

const MarketViewPro: React.FC<MarketViewProProps> = ({ onSelectPlayer, players }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'change' | 'price' | 'volume'>('change');

  const filteredAndSortedPlayers = useMemo(() => {
    const filtered = players.filter(
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
  }, [searchTerm, sortBy, players]);

  // Market stats
  const totalVolume = players.reduce((sum, p) => sum + p.volume, 0);
  const avgChange = players.length > 0
    ? players.reduce((sum, p) => sum + p.priceChange, 0) / players.length
    : 0;
  const gainersCount = players.filter(p => p.priceChange > 0).length;
  const losersCount = players.filter(p => p.priceChange < 0).length;

  return (
    <div className="market-view-pro">
      {/* Market Overview Stats */}
      <div className="market-overview">
        <div className="overview-stat">
          <div className="stat-icon">
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Trading Volume</div>
            <div className="stat-value font-mono">
              ${(totalVolume / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>

        <div className="overview-stat">
          <div className="stat-icon">
            <TrendingUp size={20} className="positive" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Gainers</div>
            <div className="stat-value positive">{gainersCount}</div>
          </div>
        </div>

        <div className="overview-stat">
          <div className="stat-icon">
            <TrendingDown size={20} className="negative" />
          </div>
          <div className="stat-info">
            <div className="stat-label">Losers</div>
            <div className="stat-value negative">{losersCount}</div>
          </div>
        </div>

        <div className="overview-stat">
          <div className="stat-icon">
            <BarChart3 size={20} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Avg Change</div>
            <div className={`stat-value ${avgChange >= 0 ? 'positive' : 'negative'}`}>
              {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="market-controls-pro">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search players, teams, or positions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="market-actions">
          <div className="sort-buttons">
            <button
              className={`sort-btn-pro ${sortBy === 'change' ? 'active' : ''}`}
              onClick={() => setSortBy('change')}
            >
              Top Movers
            </button>
            <button
              className={`sort-btn-pro ${sortBy === 'price' ? 'active' : ''}`}
              onClick={() => setSortBy('price')}
            >
              Highest Price
            </button>
            <button
              className={`sort-btn-pro ${sortBy === 'volume' ? 'active' : ''}`}
              onClick={() => setSortBy('volume')}
            >
              Most Active
            </button>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className="players-grid-pro">
        {filteredAndSortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className="player-card-pro"
            onClick={() => onSelectPlayer(player)}
            style={{ animationDelay: `${index * 0.03}s` }}
          >
            <div className="card-header-pro">
              <div className="player-info-pro">
                <h3 className="player-name-pro">{player.name}</h3>
                <div className="player-meta-pro">
                  <span className="player-team">{player.team}</span>
                  <span className="meta-dot">•</span>
                  <span className="player-position">{player.position}</span>
                </div>
              </div>
              <div className={`price-badge ${player.priceChange >= 0 ? 'positive' : 'negative'}`}>
                {player.priceChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {player.priceChange >= 0 ? '+' : ''}{player.priceChange.toFixed(2)}%
              </div>
            </div>

            <div className="card-price-section">
              <div className="current-price-large font-mono">
                ${player.currentPrice.toFixed(2)}
              </div>
              <div className="bid-ask-spread">
                <span className="bid-price">Bid: ${player.bidPrice.toFixed(2)}</span>
                <span className="ask-price">Ask: ${player.askPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="card-stats-grid">
              <div className="stat-box">
                <div className="stat-box-label">PPG</div>
                <div className="stat-box-value">{player.stats.ppg}</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-label">RPG</div>
                <div className="stat-box-value">{player.stats.rpg}</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-label">APG</div>
                <div className="stat-box-value">{player.stats.apg}</div>
              </div>
              <div className="stat-box">
                <div className="stat-box-label">Volume</div>
                <div className="stat-box-value">${(player.volume / 1000).toFixed(0)}K</div>
              </div>
            </div>

            <div className="card-footer-pro">
              <button className="quick-action-btn buy">
                Buy
              </button>
              <button className="quick-action-btn view">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedPlayers.length === 0 && (
        <div className="no-results">
          <Search size={48} className="no-results-icon" />
          <h3>No players found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default MarketViewPro;
