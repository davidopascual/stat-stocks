import React, { useState } from 'react';
import { Player } from '../types';
import { useTradingContext } from '../context/TradingContext';
import toast, { Toaster } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import OptionsTrading from './OptionsTrading';
import OrderBookView from './OrderBookView';
import OrderConfirmationModal from './OrderConfirmationModal';
import CandlestickChart from './CandlestickChart';
import { generateMockCandlestickData } from '../utils/chartHelpers';

interface PlayerDetailProps {
  player: Player;
  onBack: () => void;
}

const PlayerDetailAdvanced: React.FC<PlayerDetailProps> = ({ player, onBack }) => {
  const { buyShares, sellShares, getPosition, balance } = useTradingContext();
  const [activeTab, setActiveTab] = useState<'trade' | 'options' | 'orderbook'>('trade');
  const [tradeMode, setTradeMode] = useState<'BUY' | 'SELL'>('BUY');
  const [shares, setShares] = useState<number>(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  const position = getPosition(player.id);
  const totalCost = player.currentPrice * shares;
  const canBuy = totalCost <= balance;
  const canSell = position && position.shares >= shares;

  // Generate candlestick data
  const candlestickData = generateMockCandlestickData(player.currentPrice, 30);

  const handleTradeClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmTrade = async () => {
    if (tradeMode === 'BUY') {
      const success = await buyShares(player, shares);
      if (success) {
        toast.success(
          `Successfully bought ${shares} ${shares === 1 ? 'share' : 'shares'} of ${player.name} for $${totalCost.toFixed(2)}`,
          {
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#e7e9ea',
              border: '1px solid #00ba7c',
            },
            iconTheme: {
              primary: '#00ba7c',
              secondary: '#1a1a2e',
            },
          }
        );
        setShares(1);
        setShowConfirmModal(false);
      } else {
        toast.error('Trade failed! Check console for details.', {
          style: {
            background: '#1a1a2e',
            color: '#e7e9ea',
            border: '1px solid #f4212e',
          },
        });
        setShowConfirmModal(false);
      }
    } else {
      const success = await sellShares(player.id, shares);
      if (success) {
        toast.success(
          `Successfully sold ${shares} ${shares === 1 ? 'share' : 'shares'} of ${player.name} for $${totalCost.toFixed(2)}`,
          {
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#e7e9ea',
              border: '1px solid #00ba7c',
            },
            iconTheme: {
              primary: '#00ba7c',
              secondary: '#1a1a2e',
            },
          }
        );
        setShares(1);
        setShowConfirmModal(false);
      } else {
        toast.error('Insufficient shares to sell!', {
          style: {
            background: '#1a1a2e',
            color: '#e7e9ea',
            border: '1px solid #f4212e',
          },
        });
        setShowConfirmModal(false);
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
          {/* Player Header */}
          <div className="detail-card">
            <div className="detail-header">
              <div className="detail-player-info">
                <h1>{player.name}</h1>
                <div className="detail-player-meta">
                  <span>{player.team}</span>
                  <span>•</span>
                  <span>{player.position}</span>
                  <span>•</span>
                  <span>Volatility: {(player.volatility * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="detail-price">
                <div className="price-breakdown">
                  <div className="bid-ask">
                    <span className="bid">Bid: ${player.bidPrice.toFixed(2)}</span>
                    <span className="mid">Mid: ${player.currentPrice.toFixed(2)}</span>
                    <span className="ask">Ask: ${player.askPrice.toFixed(2)}</span>
                  </div>
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

            <div className="chart-controls">
              <button
                className={`chart-btn ${chartType === 'candle' ? 'active' : ''}`}
                onClick={() => setChartType('candle')}
              >
                Candlestick
              </button>
              <button
                className={`chart-btn ${chartType === 'line' ? 'active' : ''}`}
                onClick={() => setChartType('line')}
              >
                Line
              </button>
            </div>

            {chartType === 'candle' ? (
              <CandlestickChart data={candlestickData} playerName={player.name} />
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
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
            )}
          </div>

          {/* Player Stats */}
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

          {/* Advanced Trading Tabs */}
          <div className="detail-card">
            <div className="trading-tabs">
              <button
                className={activeTab === 'trade' ? 'active' : ''}
                onClick={() => setActiveTab('trade')}
              >
                Market Trade
              </button>
              <button
                className={activeTab === 'orderbook' ? 'active' : ''}
                onClick={() => setActiveTab('orderbook')}
              >
                Order Book
              </button>
              <button
                className={activeTab === 'options' ? 'active' : ''}
                onClick={() => setActiveTab('options')}
              >
                Options
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'trade' && (
                <div className="market-trade">
                  <h3>Quick Trade (Market Order)</h3>
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

                  {position && (
                    <div className="position-info">
                      <div className="position-label">Your Position</div>
                      <div className="position-value">{position.shares} shares</div>
                      <div className="position-label" style={{ marginTop: '8px' }}>
                        Avg. Buy Price: ${position.avgBuyPrice.toFixed(2)}
                      </div>
                    </div>
                  )}

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
                        onClick={handleTradeClick}
                        disabled={!canBuy}
                      >
                        {canBuy ? `Review Order` : 'Insufficient Funds'}
                      </button>
                    ) : (
                      <button
                        className="trade-btn sell"
                        onClick={handleTradeClick}
                        disabled={!canSell}
                      >
                        {canSell ? `Review Order` : 'Insufficient Shares'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'orderbook' && (
                <OrderBookView player={player} userId="user123" />
              )}

              {activeTab === 'options' && (
                <OptionsTrading player={player} userId="user123" />
              )}
            </div>
          </div>
        </div>
      </div>

      <Toaster position="bottom-right" />

      <OrderConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmTrade}
        orderDetails={{
          type: tradeMode,
          playerName: player.name,
          shares,
          price: player.currentPrice,
          total: totalCost,
        }}
      />
    </div>
  );
};

export default PlayerDetailAdvanced;
