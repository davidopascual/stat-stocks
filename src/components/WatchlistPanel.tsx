import React, { useState } from 'react';
import { Star, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { Player } from '../types';
import './WatchlistPanel.css';

interface WatchlistPanelProps {
  players: Player[];
  watchlist: string[];
  onAddToWatchlist: (playerId: string) => void;
  onRemoveFromWatchlist: (playerId: string) => void;
  onSelectPlayer: (player: Player) => void;
}

const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  players,
  watchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onSelectPlayer,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const watchlistPlayers = players.filter(p => watchlist.includes(p.id));

  const availablePlayers = players.filter(
    p => !watchlist.includes(p.id) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="watchlist-panel">
      <div className="watchlist-header">
        <div className="watchlist-title">
          <Star size={18} />
          <h3>Watchlist</h3>
        </div>
        <button
          className="watchlist-add-btn"
          onClick={() => setShowAddModal(true)}
          title="Add to Watchlist"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="watchlist-content">
        {watchlistPlayers.length > 0 ? (
          <div className="watchlist-items">
            {watchlistPlayers.map(player => (
              <div
                key={player.id}
                className="watchlist-item"
                onClick={() => onSelectPlayer(player)}
              >
                <div className="watchlist-item-main">
                  <div className="watchlist-item-info">
                    <div className="watchlist-player-name">{player.name}</div>
                    <div className="watchlist-player-team">{player.team}</div>
                  </div>
                  <button
                    className="watchlist-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromWatchlist(player.id);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="watchlist-item-price">
                  <div className="watchlist-price font-mono">
                    ${player.currentPrice.toFixed(2)}
                  </div>
                  <div
                    className={`watchlist-change ${
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="watchlist-empty">
            <Star size={32} className="empty-icon" />
            <p>No players in watchlist</p>
            <button
              className="watchlist-add-first-btn"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              Add Players
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="watchlist-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="watchlist-modal" onClick={(e) => e.stopPropagation()}>
            <div className="watchlist-modal-header">
              <h3>Add to Watchlist</h3>
              <button
                className="watchlist-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="watchlist-modal-search">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>

            <div className="watchlist-modal-list">
              {availablePlayers.map(player => (
                <div
                  key={player.id}
                  className="watchlist-modal-item"
                  onClick={() => {
                    onAddToWatchlist(player.id);
                    setSearchTerm('');
                  }}
                >
                  <div className="modal-item-info">
                    <div className="modal-item-name">{player.name}</div>
                    <div className="modal-item-meta">
                      {player.team} • {player.position}
                    </div>
                  </div>
                  <div className="modal-item-price font-mono">
                    ${player.currentPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistPanel;
