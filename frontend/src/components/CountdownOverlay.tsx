import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface CountdownOverlayProps {
  remainingSeconds: number;
  onCancel: () => void;
}

export default function CountdownOverlay({ remainingSeconds, onCancel }: CountdownOverlayProps) {
  const numRef = useRef<HTMLDivElement>(null);

  // Trigger pulse animation on each tick
  useEffect(() => {
    const el = numRef.current;
    if (!el) return;
    el.classList.remove('countdown-tick');
    // Force reflow
    void el.offsetWidth;
    el.classList.add('countdown-tick');
  }, [remainingSeconds]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80">
      <div
        ref={numRef}
        className="countdown-tick text-foreground font-display font-bold select-none"
        style={{ fontSize: '9rem', lineHeight: 1, textShadow: '0 0 40px oklch(0.78 0.16 75 / 0.8)' }}
      >
        {remainingSeconds}
      </div>
      <p className="text-muted-foreground text-sm mt-4 tracking-widest uppercase">
        Get ready…
      </p>
      <button
        onClick={onCancel}
        className="mt-10 flex items-center gap-2 px-5 py-2.5 rounded-full glass-light text-foreground text-sm font-semibold transition-all hover:text-amber active:scale-95"
      >
        <X size={16} />
        Cancel
      </button>
    </div>
  );
}
