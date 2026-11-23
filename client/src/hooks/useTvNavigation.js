import { useEffect, useRef, useCallback } from 'react';

// Gentle web audio sound generator for TV remote feedback
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playFocus() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context may be restricted before interaction
    }
  }

  playAction() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    } catch {}
  }
}

const sfx = new SoundEffects();

export function useTvNavigation(isEnabled = true, onEscape = null) {
  const currentFocusIndexRef = useRef(0);

  const getFocusableElements = useCallback(() => {
    const selector = 'button:not([disabled]), a[href]:not([disabled]), input:not([disabled]), [tabindex="0"], .tv-focusable';
    const elements = Array.from(document.querySelectorAll(selector))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
      });
    return elements;
  }, []);

  const focusElement = useCallback((element, playSound = true) => {
    if (!element) return;
    
    // Remove previous tv-focused class
    document.querySelectorAll('.tv-focused').forEach(el => el.classList.remove('tv-focused'));

    element.classList.add('tv-focused');
    element.focus();
    
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });

    if (playSound) {
      sfx.playFocus();
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    // Initial focus on first element after render
    const timer = setTimeout(() => {
      const elements = getFocusableElements();
      if (elements.length > 0 && !document.activeElement?.classList.contains('tv-focusable')) {
        // Prefer element marked with data-tv-initial
        const initial = elements.find(el => el.hasAttribute('data-tv-initial')) || elements[0];
        focusElement(initial, false);
      }
    }, 300);

    const handleKeyDown = (e) => {
      const key = e.key;
      const keyCode = e.keyCode;

      // Smart TV remote keycodes:
      // Samsung Tizen: Enter=13, Return=10009
      // LG webOS: Back=461
      // Android TV / D-Pad: DPAD_UP=19, DPAD_DOWN=20, DPAD_LEFT=21, DPAD_RIGHT=22, DPAD_CENTER=23
      const isUp = key === 'ArrowUp' || keyCode === 19;
      const isDown = key === 'ArrowDown' || keyCode === 20;
      const isLeft = key === 'ArrowLeft' || keyCode === 21;
      const isRight = key === 'ArrowRight' || keyCode === 22;
      const isEnter = key === 'Enter' || keyCode === 13 || keyCode === 23;
      const isBack = key === 'Escape' || keyCode === 27 || keyCode === 10009 || keyCode === 461;

      if (!isUp && !isDown && !isLeft && !isRight && !isEnter && !isBack) {
        return;
      }

      const elements = getFocusableElements();
      if (elements.length === 0) return;

      if (isBack) {
        if (typeof onEscape === 'function') {
          e.preventDefault();
          onEscape();
        }
        return;
      }

      if (isEnter) {
        // Activate current element with sound
        sfx.playAction();
        return; // default click triggers
      }

      e.preventDefault();

      const activeEl = document.activeElement;
      let currentIndex = elements.indexOf(activeEl);
      if (currentIndex === -1) {
        // Fallback check for .tv-focused
        const focusedEl = document.querySelector('.tv-focused');
        currentIndex = focusedEl ? elements.indexOf(focusedEl) : 0;
      }

      // Spatial 2D navigation logic
      // Find candidate based on geometric direction or index fallback
      if (activeEl && activeEl.getBoundingClientRect) {
        const curRect = activeEl.getBoundingClientRect();
        const curCenter = {
          x: curRect.left + curRect.width / 2,
          y: curRect.top + curRect.height / 2
        };

        let bestElement = null;
        let minDistance = Infinity;

        for (const el of elements) {
          if (el === activeEl) continue;
          const rect = el.getBoundingClientRect();
          const targetCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };

          const dx = targetCenter.x - curCenter.x;
          const dy = targetCenter.y - curCenter.y;

          let isCandidate = false;
          if (isDown && dy > 15) isCandidate = true;
          if (isUp && dy < -15) isCandidate = true;
          if (isRight && dx > 15 && Math.abs(dy) < 80) isCandidate = true;
          if (isLeft && dx < -15 && Math.abs(dy) < 80) isCandidate = true;

          if (isCandidate) {
            // Distance with penalty for perpendicular offset
            const dist = (isDown || isUp)
              ? Math.abs(dy) + Math.abs(dx) * 1.5
              : Math.abs(dx) + Math.abs(dy) * 2.0;

            if (dist < minDistance) {
              minDistance = dist;
              bestElement = el;
            }
          }
        }

        if (bestElement) {
          focusElement(bestElement);
          return;
        }
      }

      // Fallback linear cycling if directional candidate not found
      let nextIndex = currentIndex;
      if (isDown || isRight) {
        nextIndex = (currentIndex + 1) % elements.length;
      } else if (isUp || isLeft) {
        nextIndex = (currentIndex - 1 + elements.length) % elements.length;
      }

      focusElement(elements[nextIndex]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, getFocusableElements, focusElement, onEscape]);

  return {
    focusElement,
    playActionSound: () => sfx.playAction()
  };
}
