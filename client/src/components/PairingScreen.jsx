import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Tv, 
  Smartphone, 
  ArrowRight, 
  QrCode, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  Radio,
  CheckCircle2,
  Copy
} from 'lucide-react';

export function PairingScreen({ onJoin, initialCode = '' }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'tv_start' | 'phone_join'
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef([]);

  // Auto-fill from URL param if available
  useEffect(() => {
    if (initialCode && initialCode.length === 6) {
      const parts = initialCode.split('');
      setDigits(parts);
      setMode('phone_join');
    }
  }, [initialCode]);

  // Fetch local server info for accurate QR Code URL
  useEffect(() => {
    fetch('/api/info')
      .then(res => res.json())
      .then(data => {
        // If window.location.hostname is localhost, use LAN IP for QR code so phone on same Wi-Fi can open it!
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

  // Generate new session for TV or phone
  const handleStartTv = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/session/new');
      const data = await res.json();
      setGeneratedCode(data.code);
      setMode('tv_start');
      // Also join session room on server
      onJoin(data.code, 'tv', 'Smart TV');
    } catch (err) {
      setErrorMsg('Failed to initialize session. Is the server running?');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 6-digit keypad inputs
  const handleDigitChange = (index, val) => {
    // Only accept numeric
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean && val !== '') return;

    const newDigits = [...digits];
    
    // Support pasting the entire 6 digits into any field
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      if (pasted.length === 6) {
        handleConnect(newDigits.join(''));
      } else {
        const nextIdx = Math.min(pasted.length, 5);
        inputRefs.current[nextIdx]?.focus();
      }
      return;
    }

    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (clean && index === 5 && newDigits.every(d => d !== '')) {
      handleConnect(newDigits.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConnect = (fullCode = null) => {
    const code = fullCode || digits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter a complete 6-digit code');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    // Verify session
    fetch(`/api/session/${code}`)
      .then(res => {
        if (!res.ok) throw new Error('Session not found or expired');
        return res.json();
      })
      .then(data => {
        onJoin(data.code, 'mobile', 'Phone');
      })
      .catch(err => {
        // Still allow joining if new session can be created with that code
        onJoin(code, 'mobile', 'Phone');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const pairingUrl = serverUrl && generatedCode
    ? `${serverUrl}/?code=${generatedCode}&mode=mobile`
    : '';

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl z-10 animate-fade-in">
        {/* Logo & Headline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-primary-light font-medium mb-4">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Instant Peer-to-Peer Cross-Device Sync</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Phone<span className="text-primary">2</span>TV
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-md mx-auto">
            Send text, links, code, images, and files from your phone to your Smart TV screen in real-time.
          </p>
        </div>

        {/* Mode 1: Initial Choice (TV or Mobile) */}
        {mode === 'choose' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: TV Mode (Receiver) */}
              <button
                onClick={handleStartTv}
                disabled={isLoading}
                data-tv-focus
                className="group p-6 rounded-2xl bg-[#18181B] border border-zinc-800 hover:border-primary transition-all text-left flex flex-col justify-between shadow-tv-card hover:shadow-glow tv-focusable"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                    <Tv className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Display on TV
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Set up this screen as the receiver. Shows a big QR code & 6-digit code for your phone to connect.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary-light">
                  <span>Start TV Receiver</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: Phone Mode (Sender) */}
              <button
                onClick={() => setMode('phone_join')}
                data-tv-focus
                className="group p-6 rounded-2xl bg-[#18181B] border border-zinc-800 hover:border-emerald-500/50 transition-all text-left flex flex-col justify-between shadow-tv-card tv-focusable"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Send from Phone
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Enter the 6-digit code displayed on your TV screen to pair your phone and start sending.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span>Enter 6-Digit Code</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            <div className="pt-4 text-center">
              <span className="text-xs text-zinc-500">
                No sign up, no app installation required. Works in any standard TV browser.
              </span>
            </div>
          </div>
        )}

        {/* Mode 2: Phone Join Screen (Enter 6-digit code) */}
        {mode === 'phone_join' && (
          <div className="bg-[#18181B] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-primary border border-indigo-500/20 mb-3">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Enter Pairing Code</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Type the 6-digit code shown on your Smart TV
              </p>
            </div>

            {/* 6 Digit Inputs */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-6">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className="w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-bold bg-[#09090B] border-2 border-zinc-700 rounded-xl sm:rounded-2xl text-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all font-mono"
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 text-center mb-4">
                {errorMsg}
              </p>
            )}

            <button
              onClick={() => handleConnect()}
              disabled={isLoading || digits.some(d => d === '')}
              className="w-full py-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Connect & Start Sharing</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
              <button
                onClick={() => setMode('choose')}
                className="hover:text-zinc-300 underline"
              >
                ← Back to options
              </button>
              <button
                onClick={handleStartTv}
                className="hover:text-primary underline"
              >
                Start as TV screen instead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
