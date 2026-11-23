import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import { useClipboard } from './hooks/useClipboard';
import { useTvNavigation } from './hooks/useTvNavigation';
import { Header } from './components/Header';
import { PairingScreen } from './components/PairingScreen';
import { MobileSender } from './components/MobileSender';
import { TvReceiver } from './components/TvReceiver';
import { Toast } from './components/Toast';
import { ClipboardModal } from './components/ClipboardModal';
import { QrCodeModal } from './components/QrCodeModal';

// Helper to detect Smart TV User Agent
function detectSmartTv() {
  if (typeof window === 'undefined' || !navigator.userAgent) return false;
  const ua = navigator.userAgent.toLowerCase();
  const tvKeywords = [
    'smart-tv', 'smarttv', 'tizen', 'webos', 'web0s', 'hbbtv', 
    'viera', 'netcast', 'bravia', 'appletv', 'googletv', 
    'crkey', 'aftt', 'aftm', 'aftb', 'firetv', 'hisense', 'vidaa'
  ];
  return tvKeywords.some(keyword => ua.includes(keyword));
}

export default function App() {
  // Query parameters parsing
  const searchParams = new URLSearchParams(window.location.search);
  const codeParam = searchParams.get('code') || searchParams.get('room') || '';
  const modeParam = searchParams.get('mode');

  // Determine initial TV mode
  const initialTvMode = modeParam 
    ? modeParam === 'tv' 
    : (detectSmartTv() || (typeof window !== 'undefined' && window.innerWidth >= 1200 && !('ontouchstart' in window)));

  const [isTvMode, setIsTvMode] = useState(initialTvMode);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [localToast, setLocalToast] = useState(null);

  // Core Hooks
  const {
    session,
    messages,
    devices,
    isTvConnected,
    isMobileConnected,
    notification,
    clearNotification,
    joinSession,
    sendMessage,
    deleteMessage,
    clearSession,
    leaveSession
  } = useSocket();

  const {
    copiedId,
    fallbackContent,
    copyToClipboard,
    dismissFallback
  } = useClipboard();

  // TV Spatial Navigation Hook (active when in TV mode)
  useTvNavigation(isTvMode, () => {
    // On Back/Escape key
    if (isQrModalOpen) setIsQrModalOpen(false);
    if (fallbackContent) dismissFallback();
  });

  // Auto-join from URL parameter if provided
  useEffect(() => {
    if (codeParam && codeParam.length === 6 && !session) {
      const devType = modeParam || (isTvMode ? 'tv' : 'mobile');
      joinSession(codeParam, devType, devType === 'tv' ? 'Smart TV' : 'Phone');
    }
  }, [codeParam, modeParam, session, isTvMode, joinSession]);

  // Handle Copy Content with TV-optimized feedback
  const handleCopyContent = useCallback(async (content, id) => {
    const res = await copyToClipboard(content, id);
    if (res.success) {
      setLocalToast({
        type: 'success',
        title: 'Copied to Clipboard!',
        message: content.length > 50 ? `${content.slice(0, 50)}...` : content
      });
    }
  }, [copyToClipboard]);

  // Active toast (server notification or local copy notification)
  const activeToast = localToast || notification;
  const handleCloseToast = () => {
    setLocalToast(null);
    clearNotification();
  };

  return (
    <div className={`min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col transition-all ${
      isTvMode ? 'text-lg select-none' : 'text-sm'
    }`}>
      {/* If connected to a session: show full App interface */}
      {session ? (
        <>
          <Header
            session={session}
            devices={devices}
            isTvMode={isTvMode}
            setIsTvMode={setIsTvMode}
            onOpenQr={() => setIsQrModalOpen(true)}
            onClearSession={clearSession}
            onLeaveSession={leaveSession}
            messageCount={messages.length}
          />

          <main className="flex-1">
            {isTvMode ? (
              <TvReceiver
                session={session}
                messages={messages}
                devices={devices}
                isMobileConnected={isMobileConnected}
                onCopyContent={handleCopyContent}
                onDeleteMessage={deleteMessage}
                onClearSession={clearSession}
                copiedId={copiedId}
                onOpenQrModal={() => setIsQrModalOpen(true)}
              />
            ) : (
              <MobileSender
                session={session}
                messages={messages}
                devices={devices}
                isTvConnected={isTvConnected}
                onSendMessage={sendMessage}
                onDeleteMessage={deleteMessage}
                onClearSession={clearSession}
                onCopyContent={handleCopyContent}
                copiedId={copiedId}
              />
            )}
          </main>
        </>
      ) : (
        /* If not connected: Show Pairing & Connect Screen */
        <PairingScreen
          onJoin={(code, type, name) => {
            if (type === 'tv') setIsTvMode(true);
            else if (type === 'mobile') setIsTvMode(false);
            joinSession(code, type, name);
          }}
          initialCode={codeParam}
        />
      )}

      {/* Enlarged QR Code Modal */}
      <QrCodeModal
        session={session}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        isTvMode={isTvMode}
      />

      {/* Smart TV Clipboard Fallback Modal */}
      <ClipboardModal
        text={fallbackContent}
        onClose={dismissFallback}
        isTvMode={isTvMode}
      />

      {/* Toast Notification Banner */}
      <Toast
        notification={activeToast}
        onClose={handleCloseToast}
        isTvMode={isTvMode}
      />
    </div>
  );
}
