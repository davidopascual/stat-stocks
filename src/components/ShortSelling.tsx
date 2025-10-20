import React, { useState, useEffect } from 'react';
import { ShortPosition, Player } from '../types';

interface ShortSellingProps {
  player: Player;
  userId: string;
}

const ShortSelling: React.FC<ShortSellingProps> = ({ player, userId }) => {
  const [positions, setPositions] = useState<ShortPosition[]>([]);
  const [availableShares, setAvailableShares] = useState(0);
  const [shares, setShares] = useState(1);

  useEffect(() => {
    fetchShortPositions();
    fetchAvailableShares();
  }, [player.id]);

  const fetchShortPositions = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/short/positions/${userId}`);
      const data = await res.json();
      setPositions(data.filter((p: ShortPosition) => p.playerId === player.id));
    } catch (error) {
      console.error('Error fetching short positions:', error);
    }
  };

  const fetchAvailableShares = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/short/available/${player.id}`);
      const data = await res.json();
      setAvailableShares(data.availableShares);
    } catch (error) {
      console.error('Error fetching available shares:', error);
    }
  };

  const shortSell = async () => {
    if (shares > availableShares) {
      alert(`Only ${availableShares} shares available to short`);
      return;
    }

    const proceeds = player.currentPrice * shares;
    if (!confirm(`Short sell ${shares} shares for $${proceeds.toFixed(2)}?`)) return;

    try {
      const res = await fetch('http://localhost:3001/api/short/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, playerId: player.id, shares })
      });

      const result = await res.json();
      if (result.success) {
        alert(`Success! Proceeds: $${result.proceeds.toFixed(2)}`);
        fetchShortPositions();
        fetchAvailableShares();
        setShares(1);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Error shorting');
    }
  };

  const coverShort = async (sharesToCover: number) => {
    const cost = player.currentPrice * sharesToCover;
    if (!confirm(`Cover ${sharesToCover} shares for $${cost.toFixed(2)}?`)) return;

    try {
      const res = await fetch('http://localhost:3001/api/short/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          playerId: player.id,
          shares: sharesToCover,
          currentPrice: player.currentPrice
        })
      });

      const result = await res.json();
      if (result.success) {
        alert(`Covered! P&L: ${result.profit >= 0 ? '+' : ''}$${result.profit.toFixed(2)} (after fees: $${result.fees.toFixed(2)})`);
        fetchShortPositions();
        fetchAvailableShares();
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Error covering short');
    }
  };

  const calculatePnL = (position: ShortPosition) => {
    const daysHeld = Math.floor(
      (Date.now() - new Date(position.borrowDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const fees = position.borrowPrice * position.sharesBorrowed * position.dailyFee * daysHeld;
    const priceDiff = (position.borrowPrice - player.currentPrice) * position.sharesBorrowed;
    return priceDiff - fees;
  };

  const totalPosition = positions.reduce((sum, p) => sum + p.sharesBorrowed, 0);

  return (
    <div className="short-selling">
      <div className="short-header">
        <h3>Short Selling</h3>
        <div className="warning-badge">
          ⚠️ Unlimited Risk
        </div>
      </div>

      <div className="short-info-cards">
        <div className="info-card">
          <div className="label">Available to Short</div>
          <div className="value">{availableShares.toLocaleString()} shares</div>
        </div>
        <div className="info-card">
          <div className="label">Current Price</div>
          <div className="value">${player.currentPrice.toFixed(2)}</div>
        </div>
        <div className="info-card">
          <div className="label">Daily Fee</div>
          <div className="value">0.1%</div>
        </div>
        {totalPosition > 0 && (
          <div className="info-card">
            <div className="label">Your Short Position</div>
            <div className="value">{totalPosition} shares</div>
          </div>
        )}
      </div>

      <div className="short-form">
        <h4>New Short Position</h4>

        <div className="form-group">
          <label>Shares to Short</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(parseInt(e.target.value) || 1)}
            min="1"
            max={availableShares}
          />
          <div className="quick-amounts">
            <button onClick={() => setShares(Math.min(10, availableShares))}>10</button>
            <button onClick={() => setShares(Math.min(50, availableShares))}>50</button>
            <button onClick={() => setShares(Math.min(100, availableShares))}>100</button>
          </div>
        </div>

        <div className="short-summary">
          <div className="summary-row">
            <span>Proceeds:</span>
            <span className="positive">${(player.currentPrice * shares).toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Daily Fee:</span>
            <span className="negative">-${(player.currentPrice * shares * 0.001).toFixed(2)}</span>
          </div>
        </div>

        <button
          className="short-btn"
          onClick={shortSell}
          disabled={availableShares === 0}
        >
          Short Sell {shares} Shares
        </button>

        <div className="short-warnings">
          <p><strong>How Short Selling Works:</strong></p>
          <ol>
            <li>Borrow shares and sell at current price</li>
            <li>Wait for price to drop</li>
            <li>Buy back shares at lower price</li>
            <li>Return borrowed shares and keep profit</li>
          </ol>
          <p className="warning-text">
            ⚠️ <strong>Risk:</strong> If price goes UP, you lose money. Losses can exceed initial proceeds!
          </p>
        </div>
      </div>

      {/* Existing Short Positions */}
      {positions.length > 0 && (
        <div className="short-positions">
          <h4>Your Short Positions</h4>
          <table>
            <thead>
              <tr>
                <th>Shares</th>
                <th>Borrow Price</th>
                <th>Current Price</th>
                <th>Days Held</th>
                <th>Fees Accrued</th>
                <th>Unrealized P&L</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position, idx) => {
                const daysHeld = Math.floor(
                  (Date.now() - new Date(position.borrowDate).getTime()) / (1000 * 60 * 60 * 24)
                );
                const fees = position.borrowPrice * position.sharesBorrowed * position.dailyFee * daysHeld;
                const pnl = calculatePnL(position);

                return (
                  <tr key={idx}>
                    <td>{position.sharesBorrowed}</td>
                    <td>${position.borrowPrice.toFixed(2)}</td>
                    <td>${player.currentPrice.toFixed(2)}</td>
                    <td>{daysHeld}</td>
                    <td className="negative">-${fees.toFixed(2)}</td>
                    <td className={pnl >= 0 ? 'positive' : 'negative'}>
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                    </td>
                    <td>
                      <button
                        className="cover-btn"
                        onClick={() => coverShort(position.sharesBorrowed)}
                      >
                        Cover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShortSelling;
