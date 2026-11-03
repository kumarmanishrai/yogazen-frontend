import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const timerRef = useRef(null);

  // Dismiss notification immediately
  const dismissNotification = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotification(null);
  }, []);

  // Show top bar notification with increasing time slider
  const showNotification = useCallback((message, type = 'success', duration = 4000) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const id = Date.now();
    setNotification({ id, message, type, duration });

    timerRef.current = setTimeout(() => {
      setNotification((current) => (current?.id === id ? null : current));
      timerRef.current = null;
    }, duration);
  }, []);

  // Show custom confirmation modal instead of window.confirm
  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
  } = {}) => {
    return new Promise((resolve) => {
      setConfirmModal({
        title,
        message,
        confirmText,
        cancelText,
        type,
        resolve: (val) => {
          setConfirmModal(null);
          resolve(val);
        }
      });
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        dismissNotification,
        showConfirm
      }}
    >
      {children}

      {/* Top Bar Notification with Time Slider */}
      {notification && (
        <div
          key={notification.id}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92%] sm:w-auto sm:min-w-[400px] max-w-lg transition-all duration-300"
          style={{ animation: 'notificationSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          <div
            className={`relative overflow-hidden rounded-2xl shadow-2xl backdrop-blur-md border ${
              notification.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700/60 shadow-rose-950/30'
                : notification.type === 'info'
                ? 'bg-slate-900/90 text-white border-slate-700/60 shadow-slate-950/30'
                : 'bg-emerald-900/90 text-white border-emerald-700/60 shadow-emerald-950/30'
            }`}
          >
            {/* Content Row */}
            <div className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold shadow-sm ${
                    notification.type === 'error'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      : notification.type === 'info'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {notification.type === 'error' ? '✕' : notification.type === 'info' ? 'ℹ' : '✓'}
                </span>
                <p className="text-xs sm:text-sm font-semibold tracking-wide leading-snug break-words">
                  {notification.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={dismissNotification}
                className="shrink-0 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition text-sm leading-none"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>

            {/* Time Slider Bar (Increases from 0% to 100% as time finishes) */}
            <div className="h-1 bg-white/15 w-full overflow-hidden">
              <div
                className={`h-full ${
                  notification.type === 'error'
                    ? 'bg-rose-400'
                    : notification.type === 'info'
                    ? 'bg-sky-400'
                    : 'bg-emerald-400'
                }`}
                style={{
                  animation: `notificationProgress ${notification.duration}ms linear forwards`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modern Confirmation Modal (Replacing window.confirm) */}
      {confirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold ${
                  confirmModal.type === 'danger'
                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}
              >
                {confirmModal.type === 'danger' ? '🗑️' : '⚠️'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-gray-900 leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-medium">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => confirmModal.resolve(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs font-bold transition"
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={() => confirmModal.resolve(true)}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition ${
                  confirmModal.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                    : 'bg-saffron-500 hover:bg-saffron-600 shadow-saffron-500/25'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

