import React, { useState, useEffect } from 'react';
import { OrderBook, LimitOrder, Player } from '../types';
import toast from 'react-hot-toast';
import OrderConfirmationModal from './OrderConfirmationModal';

interface OrderBookViewProps {
  player: Player;
  userId: string;
}

const OrderBookView: React.FC<OrderBookViewProps> = ({ player, userId }) => {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [userOrders, setUserOrders] = useState<LimitOrder[]>([]);
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [limitPrice, setLimitPrice] = useState('');
  const [shares, setShares] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchOrderBook();
    fetchUserOrders();

    const interval = setInterval(() => {
      fetchOrderBook();
      fetchUserOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [player.id]);

  const fetchOrderBook = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/orderbook/${player.id}`);
      const data = await res.json();
      setOrderBook(data);
    } catch (error) {
      console.error('Error fetching order book:', error);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/orders/user/${userId}`);
      const data = await res.json();
      setUserOrders(data.filter((o: LimitOrder) => o.playerId === player.id && (o.status === 'OPEN' || o.status === 'PARTIAL')));
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  };

  const handlePlaceOrderClick = () => {
    if (!limitPrice || shares <= 0) {
      toast.error('Please enter valid price and shares', {
        style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmPlaceLimitOrder = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders/limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username: 'User',
          playerId: player.id,
          playerName: player.name,
          type: orderType,
          price: parseFloat(limitPrice),
          shares
        })
      });

      const result = await res.json();
      if (result.success) {
        toast.success(
          `Limit order placed! ${orderType} ${shares} shares at $${parseFloat(limitPrice).toFixed(2)}`,
          {
            style: {
              background: '#1a1a2e',
              color: '#e7e9ea',
              border: `1px solid ${orderType === 'BUY' ? '#00ba7c' : '#f4212e'}`
            },
            duration: 4000
          }
        );
        setLimitPrice('');
        setShares(1);
        fetchOrderBook();
        fetchUserOrders();
        setShowConfirmModal(false);
      } else {
        toast.error(result.message || 'Failed to place order', {
          style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
        });
      }
    } catch {
      toast.error('Error placing order', {
        style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
      });
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Order cancelled successfully', {
          style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #1d9bf0' }
        });
        fetchUserOrders();
        fetchOrderBook();
      } else {
        toast.error(result.message || 'Failed to cancel order', {
          style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
        });
      }
    } catch {
      toast.error('Error canceling order', {
        style: { background: '#1a1a2e', color: '#e7e9ea', border: '1px solid #f4212e' }
      });
    }
  };

  if (!orderBook) return <div>Loading order book...</div>;

  return (
    <div className="order-book-view">
      <div className="order-book-header">
        <h3>Order Book</h3>
        <div className="spread-info">
          Spread: ${orderBook.spread.toFixed(2)} ({((orderBook.spread / orderBook.lastTrade) * 100).toFixed(2)}%)
        </div>
      </div>

      <div className="order-book-grid">
        {/* Left side - Order Book Depth */}
        <div className="order-book-depth">
          <div className="depth-section asks-section">
            <h4>Asks (Sellers)</h4>
            <div className="depth-levels">
              {orderBook.depth.asks.slice(0, 10).map((level, i) => (
                <div key={i} className="depth-level ask-level">
                  <span className="price">${level.price.toFixed(2)}</span>
                  <span className="volume">{level.volume}</span>
                  <div
                    className="volume-bar"
                    style={{
                      width: `${(level.volume / Math.max(...orderBook.depth.asks.map(l => l.volume))) * 100}%`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="last-trade-price">
            <div className="label">Last Trade</div>
            <div className="price">${orderBook.lastTrade.toFixed(2)}</div>
          </div>

          <div className="depth-section bids-section">
            <h4>Bids (Buyers)</h4>
            <div className="depth-levels">
              {orderBook.depth.bids.slice(0, 10).map((level, i) => (
                <div key={i} className="depth-level bid-level">
                  <span className="price">${level.price.toFixed(2)}</span>
                  <span className="volume">{level.volume}</span>
                  <div
                    className="volume-bar"
                    style={{
                      width: `${(level.volume / Math.max(...orderBook.depth.bids.map(l => l.volume))) * 100}%`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Place Order */}
        <div className="place-order-panel">
          <h4>Place Limit Order</h4>

          <div className="order-type-toggle">
            <button
              className={`toggle-btn ${orderType === 'BUY' ? 'active buy' : ''}`}
              onClick={() => setOrderType('BUY')}
            >
              Buy
            </button>
            <button
              className={`toggle-btn ${orderType === 'SELL' ? 'active sell' : ''}`}
              onClick={() => setOrderType('SELL')}
            >
              Sell
            </button>
          </div>

          <div className="form-group">
            <label>Limit Price</label>
            <input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="Enter price"
            />
            <div className="quick-prices">
              <button onClick={() => setLimitPrice(orderBook.depth.bids[0]?.price.toString() || '')}>
                Best Bid: ${orderBook.depth.bids[0]?.price.toFixed(2)}
              </button>
              <button onClick={() => setLimitPrice(orderBook.depth.asks[0]?.price.toString() || '')}>
                Best Ask: ${orderBook.depth.asks[0]?.price.toFixed(2)}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Shares</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>

          <div className="order-summary">
            <div className="summary-row">
              <span>Total:</span>
              <span>${((parseFloat(limitPrice) || 0) * shares).toFixed(2)}</span>
            </div>
          </div>

          <button
            className={`place-order-btn ${orderType.toLowerCase()}`}
            onClick={handlePlaceOrderClick}
          >
            Review Limit Order
          </button>

          <div className="order-info">
            <p>• Limit orders wait in the book until matched</p>
            <p>• Orders expire in 24 hours</p>
            <p>• Can be canceled anytime before fill</p>
          </div>
        </div>
      </div>

      {/* User's Open Orders */}
      {userOrders.length > 0 && (
        <div className="user-orders">
          <h4>Your Open Orders</h4>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Price</th>
                <th>Shares</th>
                <th>Filled</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {userOrders.map(order => (
                <tr key={order.id}>
                  <td className={order.type === 'BUY' ? 'buy-type' : 'sell-type'}>
                    {order.type}
                  </td>
                  <td>${order.price.toFixed(2)}</td>
                  <td>{order.shares}</td>
                  <td>{order.filledShares}</td>
                  <td><span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span></td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="cancel-btn"
                      onClick={() => cancelOrder(order.id)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Limit Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmPlaceLimitOrder}
        orderDetails={{
          type: orderType,
          playerName: player.name,
          shares: shares,
          price: parseFloat(limitPrice) || 0,
          total: (parseFloat(limitPrice) || 0) * shares
        }}
      />
    </div>
  );
};

export default OrderBookView;
