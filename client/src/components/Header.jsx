import React from 'react';
import { 
  Tv, 
  Smartphone, 
  QrCode, 
  Trash2, 
  LogOut, 
  Layers, 
  Share2, 
  Sparkles,
  Copy,
  Check
} from 'lucide-react';
import { DeviceBadge } from './DeviceBadge';

export function Header({
  session,
  devices,
  isTvMode,
  setIsTvMode,
  onOpenQr,
  onClearSession,
  onLeaveSession,
  messageCount = 0
}) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  const handleCopyCode = () => {
    if (!session?.code) return;
    navigator.clipboard?.writeText(session.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formattedCode = session?.code 
    ? `${session.code.slice(0, 3)}-${session.code.slice(3)}`
    : '--- ---';

  return (
    <header className={`border-b border-zinc-800 bg-[#09090B]/90 backdrop-blur-md sticky top-0 z-40 transition-all ${
      isTvMode ? 'py-5 px-8' : 'py-3.5 px-4'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Brand & Mode */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 bg-primary/10 border border-primary/30 rounded-xl text-primary flex items-center justify-center shadow-glow ${
            isTvMode ? 'p-3.5' : ''
          }`}>
            {isTvMode ? (
              <Tv className={isTvMode ? 'w-8 h-8' : 'w-5 h-5'} />
            ) : (
              <Smartphone className={isTvMode ? 'w-8 h-8' : 'w-5 h-5'} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-extrabold tracking-tight text-white flex items-center gap-1.5 ${
                isTvMode ? 'text-3xl' : 'text-lg'
              }`}>
                Phone<span className="text-primary">2</span>TV
              </h1>
              <span className={`px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${
                isTvMode 
                  ? 'bg-primary/20 text-primary-light text-xs border border-primary/30' 
                  : 'bg-zinc-800 text-zinc-400 text-[10px]'
              }`}>
                {isTvMode ? 'TV Screen' : 'Sender'}
              </span>
            </div>
            {!isTvMode && (
              <p className="text-xs text-zinc-400 hidden sm:block">
                Instant cross-device clipboard & sharing
              </p>
            )}
          </div>
        </div>

        {/* Center: Session Code with Quick Copy & QR */}
        {session && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              title="Click to copy pairing code"
              data-tv-focus
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-primary transition-all tv-focusable ${
                isTvMode ? 'px-5 py-2.5' : ''
              }`}
            >
              <span className={`text-zinc-400 font-medium ${isTvMode ? 'text-lg' : 'text-xs'}`}>
                Code:
              </span>
              <span className={`font-mono font-bold tracking-widest text-primary-light ${
                isTvMode ? 'text-2xl' : 'text-sm'
              }`}>
                {formattedCode}
              </span>
              {copiedCode ? (
                <Check className={`text-emerald-400 ${isTvMode ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              ) : (
                <Copy className={`text-zinc-500 hover:text-zinc-300 ${isTvMode ? 'w-5 h-5' : 'w-3.5 h-3.5'}`} />
              )}
            </button>

            {onOpenQr && (
              <button
                onClick={onOpenQr}
                title="Show pairing QR code"
                data-tv-focus
                className={`p-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-primary text-zinc-300 hover:text-white transition-all tv-focusable ${
                  isTvMode ? 'p-3' : ''
                }`}
                aria-label="Show QR Code"
              >
                <QrCode className={isTvMode ? 'w-6 h-6' : 'w-4 h-4'} />
              </button>
            )}
          </div>
        )}

        {/* Right: Device Badges, Mode Switch, Clear, Leave */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <DeviceBadge 
            devices={devices} 
            isTvMode={isTvMode} 
          />

          {/* Mode Switcher Button (TV / Phone) */}
          <button
            onClick={() => setIsTvMode(!isTvMode)}
            data-tv-focus
            title={isTvMode ? 'Switch to Phone View' : 'Switch to TV View'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-500 transition-all tv-focusable ${
              isTvMode ? 'px-4 py-2.5 text-base' : 'text-xs'
            }`}
          >
            {isTvMode ? (
              <>
                <Smartphone className={isTvMode ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
                <span>Phone View</span>
              </>
            ) : (
              <>
                <Tv className={isTvMode ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
                <span>TV View</span>
              </>
            )}
          </button>

          {/* Clear All Messages Button */}
          {messageCount > 0 && onClearSession && (
            <button
              onClick={() => {
                if (window.confirm('Clear all shared content from this session?')) {
                  onClearSession();
                }
              }}
              data-tv-focus
              title="Clear all shared content"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 hover:bg-red-950/40 transition-all tv-focusable ${
                isTvMode ? 'px-4 py-2.5 text-base' : 'text-xs'
              }`}
            >
              <Trash2 className={isTvMode ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
              <span>Clear</span>
            </button>
          )}

          {/* Exit / Disconnect */}
          {onLeaveSession && (
            <button
              onClick={() => {
                if (window.confirm('Leave this session?')) {
                  onLeaveSession();
                }
              }}
              data-tv-focus
              title="Leave session"
              className={`p-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all tv-focusable ${
                isTvMode ? 'p-3' : ''
              }`}
              aria-label="Leave session"
            >
              <LogOut className={isTvMode ? 'w-6 h-6' : 'w-4 h-4'} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
