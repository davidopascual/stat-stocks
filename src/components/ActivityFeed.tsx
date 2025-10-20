import React, { useState, useMemo } from 'react';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Filter, Download } from 'lucide-react';
import './ActivityFeed.css';

interface Transaction {
  id: string;
  type: 'BUY' | 'SELL';
  playerName: string;
  shares: number;
  price: number;
  timestamp: Date;
  status?: 'filled' | 'pending' | 'cancelled';
}

interface ActivityFeedProps {
  transactions: Transaction[];
}

type FilterType = 'all' | 'buy' | 'sell';
type SortType = 'newest' | 'oldest' | 'amount';

const ActivityFeed: React.FC<ActivityFeedProps> = ({ transactions }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type.toLowerCase() === filter);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'amount':
          return b.shares * b.price - a.shares * a.price;
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, filter, sort]);

  const handleExport = () => {
    // Generate CSV
    const headers = ['Date', 'Type', 'Player', 'Shares', 'Price', 'Total', 'Status'];
    const rows = filteredAndSortedTransactions.map(tx => [
      new Date(tx.timestamp).toLocaleString(),
      tx.type,
      tx.playerName,
      tx.shares,
      tx.price.toFixed(2),
      (tx.shares * tx.price).toFixed(2),
      tx.status || 'filled',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="activity-feed-container">
      <div className="activity-feed-header">
        <div>
          <h2 className="activity-feed-title">Activity</h2>
          <p className="activity-feed-subtitle">
            {filteredAndSortedTransactions.length} transactions
          </p>
        </div>

        <div className="activity-feed-actions">
          <button
            className="activity-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </button>
          <button className="activity-export-btn" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="activity-filters">
          <div className="filter-group">
            <label>Type</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'buy' ? 'active' : ''}`}
                onClick={() => setFilter('buy')}
              >
                Buy
              </button>
              <button
                className={`filter-btn ${filter === 'sell' ? 'active' : ''}`}
                onClick={() => setFilter('sell')}
              >
                Sell
              </button>
            </div>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${sort === 'newest' ? 'active' : ''}`}
                onClick={() => setSort('newest')}
              >
                Newest
              </button>
              <button
                className={`filter-btn ${sort === 'oldest' ? 'active' : ''}`}
                onClick={() => setSort('oldest')}
              >
                Oldest
              </button>
              <button
                className={`filter-btn ${sort === 'amount' ? 'active' : ''}`}
                onClick={() => setSort('amount')}
              >
                Amount
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="activity-feed-list">
        {filteredAndSortedTransactions.length > 0 ? (
          filteredAndSortedTransactions.map((tx, index) => {
            const total = tx.shares * tx.price;
            return (
              <div
                key={tx.id}
                className="activity-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`activity-icon ${tx.type.toLowerCase()}`}>
                  {tx.type === 'BUY' ? (
                    <ArrowUpCircle size={20} />
                  ) : (
                    <ArrowDownCircle size={20} />
                  )}
                </div>

                <div className="activity-content">
                  <div className="activity-main">
                    <div className="activity-title">
                      <span className={`activity-type ${tx.type.toLowerCase()}`}>
                        {tx.type}
                      </span>
                      <span className="activity-player">{tx.playerName}</span>
                    </div>
                    <div className="activity-details">
                      <span className="activity-shares">
                        {tx.shares} {tx.shares === 1 ? 'share' : 'shares'}
                      </span>
                      <span className="activity-dot">•</span>
                      <span className="activity-price font-mono">
                        ${tx.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="activity-meta">
                    <div className="activity-total font-mono">
                      ${total.toFixed(2)}
                    </div>
                    <div className="activity-time">{formatTime(tx.timestamp)}</div>
                  </div>
                </div>

                {tx.status && tx.status !== 'filled' && (
                  <div className={`activity-status ${tx.status}`}>
                    {tx.status}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="activity-empty">
            <TrendingUp size={48} className="empty-icon" />
            <h3>No transactions yet</h3>
            <p>Your trading activity will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
