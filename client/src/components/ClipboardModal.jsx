import React, { useEffect, useRef } from 'react';
import { Copy, X, Check, AlertCircle } from 'lucide-react';

export function ClipboardModal({ text, onClose, isTvMode = false }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [text]);

  if (!text) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className={`w-full bg-[#18181B] border border-zinc-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl ${
          isTvMode ? 'max-w-3xl border-2' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-primary">
              <Copy className={isTvMode ? 'w-8 h-8' : 'w-5 h-5'} />
            </div>
            <div>
              <h2 className={`font-bold text-white ${isTvMode ? 'text-2xl' : 'text-lg'}`}>
                Manual Copy Required
              </h2>
              <p className={`text-zinc-400 ${isTvMode ? 'text-lg' : 'text-xs'}`}>
                Your TV browser does not permit automatic clipboard access.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
          >
            <X className={isTvMode ? 'w-7 h-7' : 'w-5 h-5'} />
          </button>
        </div>

        <div className="mt-5">
          <label className={`block font-medium text-zinc-300 mb-2 ${isTvMode ? 'text-lg' : 'text-xs'}`}>
            Highlighted Content (Ready to Copy):
          </label>
          <textarea
            ref={textareaRef}
            readOnly
            value={text}
            rows={isTvMode ? 5 : 4}
            className={`w-full bg-[#09090B] border border-zinc-700 rounded-xl text-white font-mono p-4 outline-none resize-none focus:ring-2 focus:ring-primary ${
              isTvMode ? 'text-2xl' : 'text-sm'
            }`}
            onClick={(e) => e.target.select()}
          />
        </div>

        <div className={`mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start gap-3 ${
          isTvMode ? 'text-lg' : 'text-xs'
        }`}>
          <AlertCircle className={`shrink-0 mt-0.5 ${isTvMode ? 'w-6 h-6' : 'w-4 h-4'}`} />
          <div>
            <span className="font-semibold">TV Remote Instructions:</span> The text above is already selected. Press the <strong>Menu</strong> or <strong>Options</strong> button on your Smart TV remote and select <strong>Copy</strong>.
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold transition-all tv-focusable shadow-lg shadow-indigo-600/30 ${
              isTvMode ? 'text-xl py-4 px-8' : 'text-sm'
            }`}
            data-tv-focus
          >
            Got It / Done (Press OK)
          </button>
        </div>
      </div>
    </div>
  );
}
