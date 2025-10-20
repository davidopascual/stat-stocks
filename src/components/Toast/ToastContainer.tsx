import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import './Toast.css';

/**
 * PROFESSIONAL TOAST NOTIFICATION SYSTEM
 *
 * Robinhood-style notifications with:
 * - Multiple types (success, error, warning, info)
 * - Auto-dismiss with progress bar
 * - Smooth animations
 * - Queue management
 * - Action buttons
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, maxToasts = 3 }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      id,
      ...toast,
      duration: toast.duration || 4000
    };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Keep only maxToasts
      return updated.slice(0, maxToasts);
    });

    // Auto-dismiss
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => removeToast(id), newToast.duration);
    }
  }, [maxToasts, removeToast]);

  const success = useCallback((message: string, description?: string) => {
    showToast({ type: 'success', message, description });
  }, [showToast]);

  const error = useCallback((message: string, description?: string) => {
    showToast({ type: 'error', message, description });
  }, [showToast]);

  const warning = useCallback((message: string, description?: string) => {
    showToast({ type: 'warning', message, description });
  }, [showToast]);

  const info = useCallback((message: string, description?: string) => {
    showToast({ type: 'info', message, description });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration! / 100));
          return Math.max(0, newProgress);
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
              fill="currentColor"
            />
          </svg>
        );
      case 'error':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
              fill="currentColor"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M1 17H19L10 0L1 17ZM11 14H9V12H11V14ZM11 10H9V6H11V10Z"
              fill="currentColor"
            />
          </svg>
        );
      case 'info':
        return (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z"
              fill="currentColor"
            />
          </svg>
        );
    }
  };

  return (
    <div className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`}>
      <div className="toast-content">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-text">
          <div className="toast-message">{toast.message}</div>
          {toast.description && (
            <div className="toast-description">{toast.description}</div>
          )}
        </div>
        {toast.action && (
          <button
            className="toast-action"
            onClick={() => {
              toast.action!.onClick();
              handleClose();
            }}
          >
            {toast.action.label}
          </button>
        )}
        <button className="toast-close" onClick={handleClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      {toast.duration && toast.duration > 0 && (
        <div className="toast-progress">
          <div
            className="toast-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
