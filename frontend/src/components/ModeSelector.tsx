import React, { useRef, useEffect, useState } from 'react';

export type CameraMode = 'Photo' | 'Video' | 'Portrait' | 'Cinematic' | 'Night' | 'Pro';

interface ModeSelectorProps {
  mode: CameraMode;
  onModeChange: (mode: CameraMode) => void;
}

const MODES: CameraMode[] = ['Photo', 'Video', 'Portrait', 'Cinematic', 'Night', 'Pro'];

export default function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const activeRect = activeRef.current.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
      });
    }
  }, [mode]);

  return (
    <div className="relative flex items-center justify-center w-full overflow-x-auto scrollbar-hide">
      <div ref={containerRef} className="relative flex items-center gap-1 px-2">
        {/* Animated underline indicator */}
        <div
          className="absolute bottom-0 h-0.5 transition-all duration-300 ease-out rounded-full"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            background: mode === 'Cinematic'
              ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
              : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            boxShadow: mode === 'Cinematic'
              ? '0 0 8px rgba(59,130,246,0.8)'
              : '0 0 8px rgba(251,191,36,0.8)',
          }}
        />

        {MODES.map((m) => (
          <button
            key={m}
            ref={m === mode ? activeRef : undefined}
            onClick={() => onModeChange(m)}
            className={`relative px-3 py-2 text-xs font-semibold tracking-widest uppercase transition-all duration-200 whitespace-nowrap ${
              mode === m
                ? m === 'Cinematic'
                  ? 'text-blue-400'
                  : 'text-amber-400'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {m === 'Cinematic' && mode === m ? (
              <span className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                {m}
              </span>
            ) : (
              m
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
