import React from 'react';
import { X } from 'lucide-react';
import './OrderConfirmationModal.css';

interface OrderConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderDetails: {
    type: 'BUY' | 'SELL';
    playerName: string;
    shares: number;
    price: number;
    total: number;
  };
}

const OrderConfirmationModal: React.FC<OrderConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderDetails
}) => {
  if (!isOpen) return null;

  const isBuy = orderDetails.type === 'BUY';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Order</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          <div className="order-type-badge" data-type={orderDetails.type}>
            {orderDetails.type}
          </div>

          <div className="order-summary">
            <div className="order-row">
              <span className="label">Player</span>
              <span className="value bold">{orderDetails.playerName}</span>
            </div>
            <div className="order-row">
              <span className="label">Quantity</span>
              <span className="value">{orderDetails.shares} shares</span>
            </div>
            <div className="order-row">
              <span className="label">Price per share</span>
              <span className="value">${orderDetails.price.toFixed(2)}</span>
            </div>
            <div className="divider"></div>
            <div className="order-row total">
              <span className="label">Total {isBuy ? 'Cost' : 'Proceeds'}</span>
              <span className="value total-amount">${orderDetails.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="order-note">
            <p>
              {isBuy
                ? `You're about to buy ${orderDetails.shares} shares of ${orderDetails.playerName} for $${orderDetails.total.toFixed(2)}.`
                : `You're about to sell ${orderDetails.shares} shares of ${orderDetails.playerName} for $${orderDetails.total.toFixed(2)}.`
              }
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${isBuy ? 'btn-buy' : 'btn-sell'}`}
            onClick={onConfirm}
          >
            Confirm {orderDetails.type}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationModal;
