import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ notification, onClose, isTvMode = false }) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, isTvMode ? 4500 : 3500);
    return () => clearTimeout(timer);
  }, [notification, onClose, isTvMode]);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';
  const isError = notification.type === 'error';

  return (
    <div className={`fixed z-50 transition-all duration-300 animate-slide-up ${
      isTvMode 
        ? 'bottom-12 right-12 max-w-xl' 
        : 'bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md'
    }`}>
      <div className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
        isSuccess
          ? 'bg-zinc-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40'
          : isError
          ? 'bg-zinc-900/95 border-red-500/40 text-red-300 shadow-red-950/40'
          : 'bg-zinc-900/95 border-indigo-500/40 text-zinc-100 shadow-indigo-950/40'
      }`}>
        {isSuccess ? (
          <CheckCircle2 className={`shrink-0 text-emerald-400 ${isTvMode ? 'w-8 h-8' : 'w-5 h-5'}`} />
        ) : isError ? (
          <AlertCircle className={`shrink-0 text-red-400 ${isTvMode ? 'w-8 h-8' : 'w-5 h-5'}`} />
        ) : (
          <Info className={`shrink-0 text-indigo-400 ${isTvMode ? 'w-8 h-8' : 'w-5 h-5'}`} />
        )}
        
        <div className="flex-1 min-w-0">
          {notification.title && (
            <p className={`font-semibold leading-tight ${isTvMode ? 'text-xl' : 'text-sm'}`}>
              {notification.title}
            </p>
          )}
          <p className={`text-zinc-300 truncate ${isTvMode ? 'text-lg mt-0.5' : 'text-xs mt-0.5'}`}>
            {notification.message}
          </p>
        </div>

        <button 
          onClick={onClose}
          className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className={isTvMode ? 'w-6 h-6' : 'w-4 h-4'} />
        </button>
      </div>
    </div>
  );
}
