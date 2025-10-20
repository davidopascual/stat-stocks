import React from 'react';
import { useTradingContext } from '../context/TradingContext';
import { Player } from '../types';

interface PortfolioViewProps {
  onSelectPlayer: (playerId: string) => void;
  players: Player[];
}

const PortfolioView: React.FC<PortfolioViewProps> = ({ onSelectPlayer, players }) => {
  const { balance, positions, transactions, getTotalValue } = useTradingContext();

  // Calculate stock positions value and P&L
  const stockPositionsValue = positions.reduce(
    (sum, pos) => sum + pos.currentPrice * pos.shares,
    0
  );
  const stockPnL = positions.reduce((sum, pos) => {
    const currentValue = pos.currentPrice * pos.shares;
    const costBasis = pos.avgBuyPrice * pos.shares;
    return sum + (currentValue - costBasis);
  }, 0);

  // Calculate options value and P&L
  const optionsData = optionPositions?.map(optPos => {
    const optionParts = optPos.optionId.split('_');
    const playerId = optionParts[1];
    const optionType = optionParts[2]?.toUpperCase() as 'CALL' | 'PUT';
    const strikePrice = parseFloat(optionParts[3] || '0');

    // Use cached player snapshot if available, otherwise try to find current player
    const player = players.find((p: Player) => p.id === playerId);
    const currentPlayerPrice = player?.currentPrice || optPos.playerSnapshot?.priceAtPurchase || 0;
    const playerName = player?.name || optPos.playerSnapshot?.name || `Player ${playerId}`;

    // Calculate current option value (intrinsic value only for simplicity)
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
      currentOptionPrice,
      optionType,
      strikePrice,
      playerName,
      currentPlayerPrice,
      hasActivePlayer: !!player
    };
  }) || [];

  const optionsValue = optionsData.reduce((sum, opt) => sum + opt.currentValue, 0);
  const optionsPnL = optionsData.reduce((sum, opt) => sum + opt.pnl, 0);

  // Total values including options
  const positionsValue = stockPositionsValue + optionsValue;
  const totalPnL = stockPnL + optionsPnL;
  const totalValue = balance + positionsValue;

  // Debug logging
  console.log('📊 Portfolio Debug:', {
    balance,
    stockPositionsValue,
    optionsValue,
    positionsValue,
    stockPnL,
    optionsPnL,
    totalPnL,
    totalValue,
    optionsData: optionsData.map(opt => ({
      name: opt.playerName,
      type: opt.optionType,
      strike: opt.strikePrice,
      currentPlayerPrice: opt.currentPlayerPrice,
      currentOptionPrice: opt.currentOptionPrice,
      contracts: opt.contracts,
      currentValue: opt.currentValue,
      costBasis: opt.costBasis,
      pnl: opt.pnl
    }))
  });

  return (
    <div>
      <div className="portfolio-header">
        <div className="portfolio-total">Total Portfolio Value</div>
        <div className="portfolio-value-large">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div className="portfolio-breakdown">
          <div className="breakdown-item">
            <div className="breakdown-label">Cash Balance</div>
            <div className="breakdown-value">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">Positions Value</div>
            <div className="breakdown-value">${positionsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="breakdown-item">
            <div className="breakdown-label">Total P&L</div>
            <div
              className="breakdown-value"
              style={{ color: totalPnL >= 0 ? '#00ba7c' : '#f4212e' }}
            >
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="positions-list">
        <div className="positions-header">
          <h2>Your Positions</h2>
        </div>
        {positions.length > 0 ? (
          positions.map(pos => {
            const currentValue = pos.currentPrice * pos.shares;
            const costBasis = pos.avgBuyPrice * pos.shares;
            const pnl = currentValue - costBasis;
            const pnlPercent = ((pnl / costBasis) * 100);

            return (
              <div
                key={pos.playerId}
                className="position-item"
                onClick={() => onSelectPlayer(pos.playerId)}
              >
                <div className="position-player">{pos.playerName}</div>

                <div className="position-column">
                  <div className="column-label">Shares</div>
                  <div className="column-value">{pos.shares}</div>
                </div>

                <div className="position-column">
                  <div className="column-label">Avg. Cost</div>
                  <div className="column-value">${pos.avgBuyPrice.toFixed(2)}</div>
                </div>

                <div className="position-column">
                  <div className="column-label">Current Price</div>
                  <div className="column-value">${pos.currentPrice.toFixed(2)}</div>
                </div>

                <div className="position-column">
                  <div className="column-label">P&L</div>
                  <div
                    className="column-value"
                    style={{ color: pnl >= 0 ? '#00ba7c' : '#f4212e' }}
                  >
                    {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No positions yet</h3>
            <p>Start trading to build your portfolio</p>
          </div>
        )}
      </div>

      <div className="transactions-list">
        <div className="transactions-header">
          <h2>Recent Transactions</h2>
        </div>
        {transactions.length > 0 ? (
          transactions.slice(0, 20).map(tx => (
            <div key={tx.id} className="transaction-item">
              <div>
                <span className={`transaction-type ${tx.type.toLowerCase()}`}>
                  {tx.type}
                </span>
              </div>
              <div>{tx.playerName}</div>
              <div>{tx.shares} shares</div>
              <div>${tx.price.toFixed(2)}</div>
              <div style={{ color: '#71767b', fontSize: '13px' }}>
                {new Date(tx.timestamp).toLocaleString()}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3>No transactions yet</h3>
            <p>Your trading history will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioView;
