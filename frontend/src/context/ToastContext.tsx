import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
}

interface ToastContextType {
  toast: (message: string, options?: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const icons = { 
  success: CheckCircle, 
  error: XCircle, 
  info: Info,
  warning: AlertTriangle 
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const iconColors = { 
  success: 'text-green-500', 
  error: 'text-red-500', 
  info: 'text-blue-500',
  warning: 'text-yellow-500' 
};

const positionClasses: Record<ToastPosition, string> = {
  'top-right': 'top-6 right-6',
  'top-left': 'top-6 left-6',
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'top-center': 'top-6 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [position] = useState<ToastPosition>('bottom-right');

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    const { type = 'success', duration = 3500 } = options;
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    toast(message, { type: 'success', duration });
  }, [toast]);

  const error = useCallback((message: string, duration?: number) => {
    toast(message, { type: 'error', duration });
  }, [toast]);

  const info = useCallback((message: string, duration?: number) => {
    toast(message, { type: 'info', duration });
  }, [toast]);

  const warning = useCallback((message: string, duration?: number) => {
    toast(message, { type: 'warning', duration });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className={`fixed ${positionClasses[position]} z-[9999] flex flex-col gap-2 pointer-events-none max-w-md`}>
        <AnimatePresence>
          {toasts.map((t, index) => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: position.includes('right') ? 60 : -60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: position.includes('right') ? 60 : -60, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ zIndex: 9999 - index }}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[280px] ${colors[t.type]}`}
              >
                <div className={`flex-shrink-0 ${iconColors[t.type]}`}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium flex-1 leading-snug">{t.message}</span>
                <button 
                  onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} 
                  className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Cerrar notificación"
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
