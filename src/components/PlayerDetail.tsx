import React, { useState } from 'react';
import { Player } from '../data/mockPlayers';
import { useTradingContext } from '../context/TradingContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlayerDetailProps {
  player: Player;
  onBack: () => void;
}

const PlayerDetail: React.FC<PlayerDetailProps> = ({ player, onBack }) => {
  const { buyShares, sellShares, getPosition, balance } = useTradingContext();
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [shares, setShares] = useState<number>(1);

  const position = getPosition(player.id);
  const totalCost = player.currentPrice * shares;
  const canBuy = totalCost <= balance;
  const canSell = position && position.shares >= shares;

  const handleTrade = async () => {
    if (tradeMode === 'BUY') {
      const success = await buyShares(player, shares);
      if (success) {
        setShares(1);
        alert(`Successfully bought ${shares} shares of ${player.name}!`);
      } else {
        alert('Trade failed! Check console for details.');
      }
    } else {
      const success = await sellShares(player.id, shares);
      if (success) {
        setShares(1);
        alert(`Successfully sold ${shares} shares of ${player.name}!`);
      } else {
        alert('Trade failed! Check console for details.');
      }
    }
  };

  return (
    <div className="player-detail">
      <button className="back-btn" onClick={onBack}>
        ← Back to Market
      </button>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="detail-card">
            <div className="detail-header">
              <div className="detail-player-info">
                <h1>{player.name}</h1>
                <div className="detail-player-meta">
                  <span>{player.team}</span>
                  <span>•</span>
                  <span>{player.position}</span>
                </div>
              </div>
              <div className="detail-price">
                <div className="detail-price-value">
                  ${player.currentPrice.toFixed(2)}
                </div>
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

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={player.priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2f3336" />
                  <XAxis
                    dataKey="date"
                    stroke="#71767b"
                    tick={{ fill: '#71767b' }}
                  />
                  <YAxis
                    stroke="#71767b"
                    tick={{ fill: '#71767b' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#16181c',
                      border: '1px solid #2f3336',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#e7e9ea' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#1d9bf0"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="detail-card">
            <h2 style={{ marginBottom: '20px' }}>Player Stats</h2>
            <div className="stats-grid">
              <div className="detail-stat-item">
                <span className="detail-stat-label">Points Per Game</span>
                <span className="detail-stat-value">{player.stats.ppg}</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">Rebounds Per Game</span>
                <span className="detail-stat-value">{player.stats.rpg}</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">Assists Per Game</span>
                <span className="detail-stat-value">{player.stats.apg}</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">FG%</span>
                <span className="detail-stat-value">{player.stats.fgPct}%</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">3PT%</span>
                <span className="detail-stat-value">{player.stats.threePtPct}%</span>
              </div>
              <div className="detail-stat-item">
                <span className="detail-stat-label">Trading Volume</span>
                <span className="detail-stat-value">
                  ${(player.volume / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="trading-panel">
          <div className="trading-card">
            <h2>Trade {player.name}</h2>

            {position && (
              <div className="position-info">
                <div className="position-label">Your Position</div>
                <div className="position-value">{position.shares} shares</div>
                <div className="position-label" style={{ marginTop: '8px' }}>
                  Avg. Buy Price: ${position.avgBuyPrice.toFixed(2)}
                </div>
              </div>
            )}

            <div className="trade-tabs">
              <button
                className={`trade-tab ${tradeMode === 'BUY' ? 'active' : ''}`}
                onClick={() => setTradeMode('BUY')}
              >
                Buy
              </button>
              <button
                className={`trade-tab ${tradeMode === 'SELL' ? 'active' : ''}`}
                onClick={() => setTradeMode('SELL')}
              >
                Sell
              </button>
            </div>

            <div className="trade-form">
              <div className="form-group">
                <label>Number of Shares</label>
                <input
                  type="number"
                  min="1"
                  max={tradeMode === 'SELL' ? position?.shares || 0 : 1000}
                  value={shares}
                  onChange={e => setShares(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="trade-summary">
                <div className="summary-row">
                  <span>Price per share</span>
                  <span>${player.currentPrice.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shares</span>
                  <span>{shares}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>

              {tradeMode === 'BUY' ? (
                <button
                  className="trade-btn"
                  onClick={handleTrade}
                  disabled={!canBuy}
                >
                  {canBuy ? `Buy ${shares} Shares` : 'Insufficient Funds'}
                </button>
              ) : (
                <button
                  className="trade-btn sell"
                  onClick={handleTrade}
                  disabled={!canSell}
                >
                  {canSell ? `Sell ${shares} Shares` : 'Insufficient Shares'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail;
