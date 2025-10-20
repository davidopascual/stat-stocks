import React from 'react';
import './LoadingStates.css';

/**
 * PROFESSIONAL LOADING STATES
 *
 * Robinhood-style loading indicators:
 * - Skeleton screens
 * - Spinner
 * - Pulse animations
 * - Shimmer effects
 */

// Spinner for general loading
export const Spinner: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ size = 'medium' }) => {
  return (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-inner"></div>
    </div>
  );
};

// Full page loader
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="page-loader">
      <Spinner size="large" />
      <div className="page-loader-message">{message}</div>
    </div>
  );
};

// Skeleton for player card
export const PlayerCardSkeleton: React.FC = () => {
  return (
    <div className="player-card skeleton-card">
      <div className="player-card-header">
        <div className="skeleton-player-info">
          <div className="skeleton skeleton-text skeleton-text-large"></div>
          <div className="skeleton skeleton-text skeleton-text-small"></div>
        </div>
        <div className="skeleton-player-price">
          <div className="skeleton skeleton-text skeleton-text-large"></div>
          <div className="skeleton skeleton-text skeleton-text-small"></div>
        </div>
      </div>
      <div className="player-stats">
        {[1, 2, 3].map(i => (
          <div key={i} className="stat-item">
            <div className="skeleton skeleton-text skeleton-text-small"></div>
            <div className="skeleton skeleton-text skeleton-text-medium"></div>
          </div>
        ))}
      </div>
      <div className="skeleton skeleton-text skeleton-text-small" style={{ marginTop: '12px' }}></div>
    </div>
  );
};

// Skeleton for portfolio position
export const PositionSkeleton: React.FC = () => {
  return (
    <div className="position-item skeleton-card">
      <div className="position-player">
        <div className="skeleton skeleton-text skeleton-text-large"></div>
      </div>
      <div className="position-column">
        <div className="skeleton skeleton-text skeleton-text-small"></div>
        <div className="skeleton skeleton-text skeleton-text-medium"></div>
      </div>
      <div className="position-column">
        <div className="skeleton skeleton-text skeleton-text-small"></div>
        <div className="skeleton skeleton-text skeleton-text-medium"></div>
      </div>
      <div className="position-column">
        <div className="skeleton skeleton-text skeleton-text-small"></div>
        <div className="skeleton skeleton-text skeleton-text-medium"></div>
      </div>
      <div className="position-column">
        <div className="skeleton skeleton-text skeleton-text-small"></div>
        <div className="skeleton skeleton-text skeleton-text-medium"></div>
      </div>
    </div>
  );
};

// Skeleton for chart
export const ChartSkeleton: React.FC = () => {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-chart-bars">
        {[40, 65, 45, 80, 55, 70, 50, 85, 60].map((height, i) => (
          <div
            key={i}
            className="skeleton-chart-bar"
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

// Skeleton for transaction
export const TransactionSkeleton: React.FC = () => {
  return (
    <div className="transaction-item skeleton-card">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i}>
          <div className="skeleton skeleton-text skeleton-text-medium"></div>
        </div>
      ))}
    </div>
  );
};

// Loading overlay for button
export const ButtonLoader: React.FC = () => {
  return (
    <div className="button-loader">
      <div className="button-loader-dot"></div>
      <div className="button-loader-dot"></div>
      <div className="button-loader-dot"></div>
    </div>
  );
};

// Empty state component
interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📊', title, description, action }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <button className="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

// Error state component
interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  retry
}) => {
  return (
    <div className="error-state">
      <div className="error-state-icon">⚠️</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {retry && (
        <button className="error-state-retry" onClick={retry}>
          Try Again
        </button>
      )}
    </div>
  );
};

// Pulse animation for real-time updates
export const PulseIndicator: React.FC<{ color?: string }> = ({ color = '#00ba7c' }) => {
  return (
    <div className="pulse-indicator">
      <div className="pulse-dot" style={{ backgroundColor: color }}></div>
      <div className="pulse-ring" style={{ borderColor: color }}></div>
    </div>
  );
};

// Loading bar for page transitions
export const LoadingBar: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div className="loading-bar">
      <div
        className="loading-bar-fill"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      ></div>
    </div>
  );
};
