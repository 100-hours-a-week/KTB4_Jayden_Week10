import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast } from './Toast.jsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, options = {}) => {
    setToast({ message, variant: options.variant ?? 'success' });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast는 ToastProvider 안에서 사용해야 합니다.');
  return context;
}
