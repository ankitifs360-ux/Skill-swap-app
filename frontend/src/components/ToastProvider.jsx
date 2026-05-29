import { useCallback, useMemo, useState } from "react";
import { ToastContext } from "./ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info") => {
      if (!message) return;

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      setToasts((prev) => [...prev, { id, message, type }]);

      window.setTimeout(() => {
        removeToast(id);
      }, 3200);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div 
              key={toast.id} 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`toast-item toast-${toast.type}`}
            >
              <span className="toast-icon flex-center" aria-hidden="true">
                {toast.type === "success" ? <CheckCircle size={18} /> : toast.type === "error" ? <AlertCircle size={18} /> : <Info size={18} />}
              </span>
              <span>{toast.message}</span>
              <button className="toast-close flex-center" onClick={() => removeToast(toast.id)}>
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
