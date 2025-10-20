import React, { useState } from 'react';
import './OptionsConfirmationModal.css';

interface OptionsConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contracts: number) => void;
  optionDetails: {
    type: 'CALL' | 'PUT';
    playerName: string;
    strikePrice: number;
    premium: number;
    expirationDate: string;
    inTheMoney: boolean;
  };
}

const OptionsConfirmationModal: React.FC<OptionsConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  optionDetails
}) => {
  const [contracts, setContracts] = useState<number>(1);

  if (!isOpen) return null;

  const totalCost = optionDetails.premium * contracts * 100;
  const sharesControlled = contracts * 100;

  const handleConfirm = () => {
    onConfirm(contracts);
    setContracts(1); // Reset for next use
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="options-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Review Options Order</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="option-summary">
          <div className={`option-type-badge ${optionDetails.type.toLowerCase()}`}>
            {optionDetails.type}
          </div>
          <div className="option-player">{optionDetails.playerName}</div>
          <div className="option-strike">Strike: ${optionDetails.strikePrice}</div>
          <div className="option-expiry">
            Exp: {new Date(optionDetails.expirationDate).toLocaleDateString()}
          </div>
          {optionDetails.inTheMoney && (
            <div className="itm-badge">In The Money</div>
          )}
        </div>

        <div className="option-input-section">
          <label htmlFor="contracts">Number of Contracts:</label>
          <div className="contract-input-wrapper">
            <button
              className="qty-btn"
              onClick={() => setContracts(Math.max(1, contracts - 1))}
            >
              −
            </button>
            <input
              id="contracts"
              type="number"
              min="1"
              value={contracts}
              onChange={(e) => setContracts(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <button
              className="qty-btn"
              onClick={() => setContracts(contracts + 1)}
            >
              +
            </button>
          </div>
          <div className="shares-controlled">Controls {sharesControlled} shares</div>
        </div>

        <div className="option-breakdown">
          <div className="breakdown-row">
            <span>Premium per share:</span>
            <span>${optionDetails.premium.toFixed(2)}</span>
          </div>
          <div className="breakdown-row">
            <span>Contracts:</span>
            <span>{contracts} × 100</span>
          </div>
          <div className="breakdown-row total">
            <span>Total Cost:</span>
            <span>${totalCost.toFixed(2)}</span>
          </div>
        </div>

        <div className="option-info-box">
          <p>
            {optionDetails.type === 'CALL'
              ? `This CALL option gives you the right to BUY ${sharesControlled} shares at $${optionDetails.strikePrice} per share.`
              : `This PUT option gives you the right to SELL ${sharesControlled} shares at $${optionDetails.strikePrice} per share.`
            }
          </p>
        </div>

        <div className="modal-actions">
          <button className="cancel-order-btn" onClick={onClose}>
            Cancel
          </button>
          <button className={`confirm-order-btn ${optionDetails.type.toLowerCase()}`} onClick={handleConfirm}>
            Buy {contracts} Contract{contracts > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OptionsConfirmationModal;
