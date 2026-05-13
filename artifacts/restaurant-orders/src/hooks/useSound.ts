import { useCallback, useRef } from "react";

function beep(frequency = 880, duration = 0.12, gain = 0.15) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => ctx.close();
  } catch {
    // Audio context not available
  }
}

export function useNotificationSound() {
  const lastPlayedRef = useRef<number>(0);

  const playNewOrderAlert = useCallback(() => {
    const now = Date.now();
    // Debounce: don't play more than once per second
    if (now - lastPlayedRef.current < 1000) return;
    lastPlayedRef.current = now;
    // Double beep pattern for new order
    beep(880, 0.1, 0.15);
    setTimeout(() => beep(1100, 0.15, 0.15), 150);
  }, []);

  const playStatusChangeSound = useCallback(() => {
    beep(660, 0.1, 0.08);
  }, []);

  return { playNewOrderAlert, playStatusChangeSound };
}
