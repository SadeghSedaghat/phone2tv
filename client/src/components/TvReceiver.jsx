import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Tv, 
  Smartphone, 
  Copy, 
  Check, 
  Trash2, 
  QrCode, 
  Radio, 
  ArrowDown, 
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { ContentCard } from './ContentCard';

export function TvReceiver({
  session,
  messages = [],
  devices = [],
  isMobileConnected,
  onCopyContent,
  onDeleteMessage,
  onClearSession,
  copiedId,
  onOpenQrModal
}) {
  const [serverUrl, setServerUrl] = useState('');

  // Fetch local server IP for the TV QR code display
  useEffect(() => {
    fetch('/api/info')
      .then(res => res.json())
      .then(data => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          setServerUrl(`http://${data.localIp}:${data.port}`);
        } else {
          setServerUrl(window.location.origin);
        }
      })
      .catch(() => {
        setServerUrl(window.location.origin);
      });
  }, []);

  const formattedCode = session?.code
    ? `${session.code.slice(0, 3)}-${session.code.slice(3)}`
    : '--- ---';

  const qrUrl = serverUrl && session?.code
    ? `${serverUrl}/?code=${session.code}&mode=mobile`
    : '';

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 min-h-[calc(100vh-100px)] flex flex-col justify-between">
      {/* Top Banner / TV Pairing Status */}
      <div className="bg-[#18181B] border border-zinc-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-glow shrink-0">
            <Tv className="w-9 h-9" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-full ${isMobileConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-sm font-semibold tracking-wide uppercase text-zinc-400">
                {isMobileConnected ? 'Phone Connected' : 'Waiting for Phone...'}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              Smart TV Receiver
            </h2>
            <p className="text-base text-zinc-400 mt-1">
              Use your TV remote arrow keys to navigate cards. Press <strong>OK</strong> to copy.
            </p>
          </div>
        </div>

        {/* Big Code & Quick QR */}
        <div className="flex items-center gap-4 bg-[#09090B] border border-zinc-800 p-4 rounded-2xl">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
              Pairing Code
            </p>
            <p className="text-3xl sm:text-4xl font-mono font-black text-primary-light tracking-widest">
              {formattedCode}
            </p>
          </div>

          {qrUrl && (
            <div 
              onClick={onOpenQrModal}
              title="Click or press OK to enlarge QR code"
              data-tv-focus
              className="bg-white p-2 rounded-xl cursor-pointer hover:scale-105 transition-transform tv-focusable"
            >
              <QRCodeSVG value={qrUrl} size={64} level="M" />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {messages.length === 0 ? (
          /* Empty State: Giant QR Code & TV Friendly Instructions */
          <div className="bg-[#18181B] border border-zinc-800/90 rounded-3xl p-10 sm:p-14 text-center shadow-2xl flex flex-col items-center justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-2xl mb-8 animate-fade-in hover:scale-105 transition-transform">
              {qrUrl ? (
                <QRCodeSVG value={qrUrl} size={220} level="H" />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-zinc-400 font-bold">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-primary-light text-sm font-semibold">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Ready to Receive Content</span>
              </div>

              <h3 className="text-4xl font-black text-white">
                Scan with your Phone Camera
              </h3>

              <p className="text-xl text-zinc-300 font-medium">
                Or open <span className="text-primary-light font-mono bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">{serverUrl || 'phone2tv'}</span> on your phone and enter:
              </p>

              <div className="pt-2">
                <span className="text-5xl font-mono font-black tracking-widest text-primary px-6 py-2 bg-zinc-900 rounded-2xl border-2 border-indigo-500/40 inline-block shadow-glow">
                  {formattedCode}
                </span>
              </div>

              <p className="text-sm text-zinc-500 pt-3">
                Anything you send will immediately pop up on this TV screen with a prominent COPY button.
              </p>
            </div>
          </div>
        ) : (
          /* Feed of Received Cards for TV Remote Navigation */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-white">
                  Incoming Content Feed
                </h3>
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary-light font-bold text-sm">
                  {messages.length} {messages.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {onClearSession && (
                <button
                  onClick={onClearSession}
                  data-tv-focus
                  className="px-5 py-2.5 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 hover:bg-red-950/40 font-semibold text-lg flex items-center gap-2 tv-focusable"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            <div className="space-y-6">
              {messages.map((msg, index) => (
                <ContentCard
                  key={msg.id}
                  message={msg}
                  onCopy={onCopyContent}
                  onDelete={onDeleteMessage}
                  isCopied={copiedId === msg.id}
                  isTvMode={true}
                  cardIndex={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Hints for Smart TV Remote */}
      <footer className="mt-12 pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-zinc-400 text-base">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono font-bold text-sm shadow">
              ▲ ▼ ◄ ►
            </kbd>
            <span>Navigate items</span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1 bg-primary text-white border border-primary-light rounded-lg font-mono font-bold text-sm shadow">
              OK / Enter
            </kbd>
            <span className="text-white font-semibold">Copy to TV Clipboard</span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono font-bold text-sm shadow">
              Back / Return
            </kbd>
            <span>Dismiss</span>
          </div>
        </div>

        <div className="text-sm text-zinc-500 font-mono">
          Session ID: {session?.sessionId?.slice(0, 8) || 'active'}
        </div>
      </footer>
    </div>
  );
}
