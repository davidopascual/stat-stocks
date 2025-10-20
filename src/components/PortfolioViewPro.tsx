import React, { useMemo, useState } from 'react';
import { useTradingContext } from '../context/TradingContext';
import { Player } from '../types';
import PositionCard from './PositionCard';
import PortfolioChart from './PortfolioChart';
import ActivityFeed from './ActivityFeed';
import QuickStatsHeader from './QuickStatsHeader';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './PortfolioViewPro.css';

interface PortfolioViewProProps {
  onSelectPlayer: (playerId: string) => void;
  players: Player[];
}

const PortfolioViewPro: React.FC<PortfolioViewProProps> = ({ onSelectPlayer, players }) => {
  const { balance, positions, optionPositions, transactions } = useTradingContext();
  const [selectedTab, setSelectedTab] = useState<'stocks' | 'options' | 'all'>('all');

  // Enrich positions with current prices from live players data
  const enrichedPositions = useMemo(() => {
    return positions.map(pos => {
      const livePlayer = players.find(p => p.id === pos.playerId);
      return {
        ...pos,
        currentPrice: livePlayer?.currentPrice || pos.currentPrice
      };
    });
  }, [positions, players]);

  // Calculate portfolio metrics using enriched positions
  const stockPositionsValue = enrichedPositions.reduce(
    (sum, pos) => sum + pos.currentPrice * pos.shares,
    0
  );

  const stockPnL = enrichedPositions.reduce((sum, pos) => {
    const currentValue = pos.currentPrice * pos.shares;
    const costBasis = pos.avgBuyPrice * pos.shares;
    return sum + (currentValue - costBasis);
  }, 0);

  // Calculate options value
  const optionsData = optionPositions?.map(optPos => {
    const optionParts = optPos.optionId.split('_');
    const playerId = optionParts[1];
    const optionType = optionParts[2]?.toUpperCase() as 'CALL' | 'PUT';
    const strikePrice = parseFloat(optionParts[3] || '0');

    const player = players.find((p: Player) => p.id === playerId);
    const currentPlayerPrice = player?.currentPrice || optPos.playerSnapshot?.priceAtPurchase || 0;

    let currentOptionPrice = 0;
    if (optionType === 'CALL') {
      currentOptionPrice = Math.max(0, currentPlayerPrice - strikePrice);
    } else {
      currentOptionPrice = Math.max(0, strikePrice - currentPlayerPrice);
    }

    const currentValue = currentOptionPrice * optPos.contracts * 100;
    const costBasis = optPos.purchasePrice * optPos.contracts * 100;
    const pnl = currentValue - costBasis;

    return {
      ...optPos,
      currentValue,
      costBasis,
      pnl,
    };
  }) || [];

  const optionsValue = optionsData.reduce((sum, opt) => sum + opt.currentValue, 0);
  const optionsPnL = optionsData.reduce((sum, opt) => sum + opt.pnl, 0);

  const positionsValue = stockPositionsValue + optionsValue;
  const totalPnL = stockPnL + optionsPnL;
  const totalValue = balance + positionsValue;

  // Calculate day change (simplified - using total P&L for demo)
  const dayChange = totalPnL;
  const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

  // Generate realistic portfolio history showing growth
  const portfolioHistory = useMemo(() => {
    const history = [];
    const now = new Date();
    const startingValue = 100000; // Starting portfolio value
    const currentValue = Math.max(totalValue, 0);

    // Always generate data even if totalValue is 0
    if (totalValue === 0) {
      // Show flat line at starting value when no portfolio
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        history.push({
          date: date.toISOString(), // Use ISO string for proper date parsing
          timestamp: date.getTime(),
          value: startingValue,
        });
      }
      console.log('📈 Portfolio History (empty portfolio):', history);
      return history;
    }

    const totalGrowth = currentValue - startingValue;
    const dailyGrowth = totalGrowth / 30;

    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Calculate progressive value with some variance
      const progressValue = startingValue + (dailyGrowth * (30 - i));
      const variance = (Math.random() - 0.5) * progressValue * 0.02; // 2% variance
      const dayValue = Math.max(0, progressValue + variance);

      history.push({
        date: date.toISOString(), // Use ISO string for proper date parsing
        timestamp: date.getTime(),
        value: dayValue,
      });
    }

    // Ensure last point is the current value
    if (history.length > 0) {
      history[history.length - 1].value = currentValue;
    }

    console.log('📈 Portfolio History:', {
      totalValue,
      startingValue,
      currentValue,
      historyLength: history.length,
      firstPoint: history[0],
      lastPoint: history[history.length - 1]
    });

    return history;
  }, [totalValue]);

  // Asset allocation data
  const allocationData = [
    { name: 'Cash', value: balance, color: '#3b82f6' },
    { name: 'Stocks', value: stockPositionsValue, color: '#10b981' },
    { name: 'Options', value: optionsValue, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Get price history for sparklines
  const getPlayerPriceHistory = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.priceHistory?.map(h => h.price) || [];
  };

  return (
    <div className="portfolio-view-pro">
      {/* Quick Stats */}
      <QuickStatsHeader
        portfolioValue={totalValue}
        dayChange={dayChange}
        dayChangePercent={dayChangePercent}
        buyingPower={balance}
        positionsCount={enrichedPositions.length + (optionPositions?.length || 0)}
      />

      {/* Portfolio Chart */}
      <div className="portfolio-chart-section">
        <PortfolioChart data={portfolioHistory} />
      </div>

      {/* Asset Allocation */}
      {allocationData.length > 0 && (
        <div className="asset-allocation-section">
          <div className="allocation-card">
            <h2 className="section-title">Asset Allocation</h2>
            <div className="allocation-content">
              <div className="allocation-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `$${value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      }
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-accent)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="allocation-legend">
                {allocationData.map((item, index) => (
                  <div key={index} className="legend-item-allocation">
                    <div
                      className="legend-color-box"
                      style={{ background: item.color }}
                    />
                    <div className="legend-info">
                      <div className="legend-label">{item.name}</div>
                      <div className="legend-value font-mono">
                        ${item.value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="legend-percent">
                        {((item.value / totalValue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Positions Section */}
      <div className="positions-section">
        <div className="section-header-pro">
          <h2 className="section-title">Your Positions</h2>
          <div className="position-tabs">
            <button
              className={`tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTab('all')}
            >
              All
            </button>
            <button
              className={`tab-btn ${selectedTab === 'stocks' ? 'active' : ''}`}
              onClick={() => setSelectedTab('stocks')}
            >
              Stocks ({enrichedPositions.length})
            </button>
            <button
              className={`tab-btn ${selectedTab === 'options' ? 'active' : ''}`}
              onClick={() => setSelectedTab('options')}
            >
              Options ({optionPositions?.length || 0})
            </button>
          </div>
        </div>

        {(selectedTab === 'all' || selectedTab === 'stocks') && enrichedPositions.length > 0 && (
          <div className="positions-grid">
            {enrichedPositions.map(pos => (
              <PositionCard
                key={pos.playerId}
                playerName={pos.playerName}
                shares={pos.shares}
                avgBuyPrice={pos.avgBuyPrice}
                currentPrice={pos.currentPrice}
                priceHistory={getPlayerPriceHistory(pos.playerId)}
                onView={() => onSelectPlayer(pos.playerId)}
                onBuyMore={() => onSelectPlayer(pos.playerId)}
                onSell={() => onSelectPlayer(pos.playerId)}
              />
            ))}
          </div>
        )}

        {enrichedPositions.length === 0 && selectedTab !== 'options' && (
          <div className="empty-positions">
            <div className="empty-icon">📊</div>
            <h3>No stock positions yet</h3>
            <p>Start trading to build your portfolio</p>
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="activity-section">
        <ActivityFeed
          transactions={transactions.map(tx => ({
            ...tx,
            timestamp: new Date(tx.timestamp),
          }))}
        />
      </div>
    </div>
  );
};

export default PortfolioViewPro;
