import React from 'react';
import './OptionsConfirmationModal.css';

interface ExerciseOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exerciseDetails: {
    type: 'CALL' | 'PUT';
    playerName: string;
    strikePrice: number;
    currentPrice: number;
    contracts: number;
    profitPerShare: number;
  };
}

const ExerciseOptionsModal: React.FC<ExerciseOptionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  exerciseDetails
}) => {
  if (!isOpen) return null;

  const sharesTotal = exerciseDetails.contracts * 100;
  const totalProfit = exerciseDetails.profitPerShare * sharesTotal;
  const strikeTotal = exerciseDetails.strikePrice * sharesTotal;
  const marketValue = exerciseDetails.currentPrice * sharesTotal;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="exercise-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Exercise Option</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="exercise-summary">
          <div className={`option-type-badge ${exerciseDetails.type.toLowerCase()}`}>
            {exerciseDetails.type} OPTION
          </div>
          <div className="option-player">{exerciseDetails.playerName}</div>
          <div className="option-strike">Strike: ${exerciseDetails.strikePrice}</div>
          <div className="option-expiry">
            {exerciseDetails.contracts} Contract{exerciseDetails.contracts > 1 ? 's' : ''} ({sharesTotal} shares)
          </div>
        </div>

        <div className="exercise-warning">
          <strong>⚠️ Important:</strong> Exercising this option will convert it into {sharesTotal} shares.
          {exerciseDetails.type === 'CALL'
            ? ` You will purchase ${sharesTotal} shares at $${exerciseDetails.strikePrice} per share.`
            : ` You will sell ${sharesTotal} shares at $${exerciseDetails.strikePrice} per share.`
          }
        </div>

        <div className="exercise-breakdown">
          <div className="exercise-breakdown-row">
            <span>Strike Price:</span>
            <span>${exerciseDetails.strikePrice.toFixed(2)}</span>
          </div>
          <div className="exercise-breakdown-row">
            <span>Current Market Price:</span>
            <span>${exerciseDetails.currentPrice.toFixed(2)}</span>
          </div>
          <div className="exercise-breakdown-row">
            <span>Profit per Share:</span>
            <span className="positive">+${exerciseDetails.profitPerShare.toFixed(2)}</span>
          </div>
          <div className="exercise-breakdown-row">
            <span>Total Shares:</span>
            <span>{sharesTotal}</span>
          </div>
          <div className="exercise-breakdown-row">
            <span>{exerciseDetails.type === 'CALL' ? 'Purchase Cost:' : 'Sale Proceeds:'}</span>
            <span>${strikeTotal.toFixed(2)}</span>
          </div>
          <div className="exercise-breakdown-row">
            <span>Market Value:</span>
            <span>${marketValue.toFixed(2)}</span>
          </div>
          <div className="exercise-breakdown-row profit">
            <span>Total Profit:</span>
            <span>+${totalProfit.toFixed(2)}</span>
          </div>
        </div>

        <div className="modal-actions">
          <button className="cancel-order-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-exercise-btn confirm-order-btn call" onClick={onConfirm}>
            Exercise Option
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseOptionsModal;
