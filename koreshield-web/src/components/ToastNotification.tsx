import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string, description?: string) => {
      addToast({ type: 'success', message, description });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, description?: string) => {
      addToast({ type: 'error', message, description });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, description?: string) => {
      addToast({ type: 'warning', message, description });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, description?: string) => {
      addToast({ type: 'info', message, description });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const styles = {
    success: 'bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    error: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg ${styles[toast.type]} backdrop-blur-sm`}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.message}</p>
        {toast.description && (
          <p className="text-sm opacity-80 mt-1">{toast.description}</p>
        )}
      </div>
      
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </motion.div>
  );
}

// Standalone toast function for use outside React components
let globalAddToast: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function setGlobalToast(addToast: (toast: Omit<Toast, 'id'>) => void) {
  globalAddToast = addToast;
}

export const toast = {
  success: (message: string, description?: string) => {
    globalAddToast?.({ type: 'success', message, description });
  },
  error: (message: string, description?: string) => {
    globalAddToast?.({ type: 'error', message, description });
  },
  warning: (message: string, description?: string) => {
    globalAddToast?.({ type: 'warning', message, description });
  },
  info: (message: string, description?: string) => {
    globalAddToast?.({ type: 'info', message, description });
  },
};

export default ToastProvider;
