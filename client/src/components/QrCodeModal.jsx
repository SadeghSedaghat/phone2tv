import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone } from 'lucide-react';

export function QrCodeModal({ session, isOpen, onClose, isTvMode = false }) {
  const [copied, setCopied] = React.useState(false);
  const [serverUrl, setServerUrl] = React.useState('');

  React.useEffect(() => {
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

  if (!isOpen || !session?.code) return null;

  const formattedCode = `${session.code.slice(0, 3)}-${session.code.slice(3)}`;
  const qrUrl = `${serverUrl || window.location.origin}/?code=${session.code}&mode=mobile`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#18181B] border border-zinc-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-primary">
            <Smartphone className="w-5 h-5" />
            <span className="font-bold text-white text-base">Scan to Pair Phone</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-5 rounded-2xl inline-block shadow-xl mb-6">
          <QRCodeSVG value={qrUrl} size={isTvMode ? 260 : 200} level="H" />
        </div>

        {/* Code */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">
            Or Enter Pairing Code
          </p>
          <div className="text-4xl font-mono font-black text-primary-light tracking-widest bg-[#09090B] py-2 px-4 rounded-xl border border-zinc-800 inline-block">
            {formattedCode}
          </div>
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          data-tv-focus
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm flex items-center justify-center gap-2 tv-focusable"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Direct Join Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
