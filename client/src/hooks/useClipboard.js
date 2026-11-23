import { useState, useCallback } from 'react';

export function useClipboard() {
  const [copiedId, setCopiedId] = useState(null);
  const [fallbackContent, setFallbackContent] = useState(null);

  /**
   * Copy text with multi-tier fallback for Smart TV & restricted mobile browsers:
   * Tier 1: navigator.clipboard.writeText
   * Tier 2: document.execCommand('copy') via temporary textarea
   * Tier 3: Trigger fallback modal with auto-selected text
   */
  const copyToClipboard = useCallback(async (text, id = null) => {
    if (!text) return false;

    // Tier 1: Modern Async Clipboard API
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        if (id) {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2500);
        }
        return { success: true, method: 'async' };
      } catch (err) {
        console.warn('Clipboard API blocked or failed, attempting execCommand fallback...', err);
      }
    }

    // Tier 2: Legacy execCommand('copy')
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, 99999); // Mobile compatibility

      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        if (id) {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2500);
        }
        return { success: true, method: 'execCommand' };
      }
    } catch (err) {
      console.warn('execCommand fallback failed, triggering manual copy dialog...', err);
    }

    // Tier 3: Show Fallback UI
    setFallbackContent(text);
    return { success: false, fallbackRequired: true };
  }, []);

  const pasteFromClipboard = useCallback(async () => {
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      try {
        const text = await navigator.clipboard.readText();
        return { success: true, text };
      } catch (err) {
        console.warn('Clipboard read failed:', err);
        return { success: false, error: 'Clipboard access denied or unsupported' };
      }
    }
    return { success: false, error: 'Clipboard paste not supported in this browser' };
  }, []);

  const dismissFallback = useCallback(() => {
    setFallbackContent(null);
  }, []);

  return {
    copiedId,
    fallbackContent,
    copyToClipboard,
    pasteFromClipboard,
    dismissFallback
  };
}
