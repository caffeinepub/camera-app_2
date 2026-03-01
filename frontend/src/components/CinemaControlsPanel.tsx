import React, { useRef, useCallback } from 'react';
import { CineColorProfile } from '@/hooks/useCineColorProfile';
import { useAnamorphicOverlay } from '@/hooks/useAnamorphicOverlay';
import { Layers, Film, Aperture } from 'lucide-react';

interface CinemaControlsPanelProps {
  exposure: number;
  onExposureChange: (ev: number) => void;
  colorProfile: CineColorProfile;
  onColorProfileChange: (profile: CineColorProfile) => void;
  zoom?: number;
}

const COLOR_PROFILES: CineColorProfile[] = ['Rec.709', 'Log-C', 'D-Cinema'];

const PROFILE_DESCRIPTIONS: Record<CineColorProfile, string> = {
  'Rec.709': 'Standard',
  'Log-C': 'Flat/Log',
  'D-Cinema': 'Vivid',
};

export default function CinemaControlsPanel({
  exposure,
  onExposureChange,
  colorProfile,
  onColorProfileChange,
  zoom = 1,
}: CinemaControlsPanelProps) {
  const { isActive: anamorphicActive, toggle: toggleAnamorphic } = useAnamorphicOverlay();
  const wheelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartEV = useRef(0);

  // Circular exposure wheel drag handlers
  const handleWheelPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      dragStartY.current = e.clientY;
      dragStartEV.current = exposure;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [exposure]
  );

  const handleWheelPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const delta = (dragStartY.current - e.clientY) / 80; // pixels per EV unit
      const newEV = Math.max(-2, Math.min(2, dragStartEV.current + delta));
      onExposureChange(Math.round(newEV * 10) / 10);
    },
    [onExposureChange]
  );

  const handleWheelPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Compute rotation for the wheel visual
  const wheelRotation = (exposure / 2) * 135; // -135 to +135 degrees

  // Tick marks for the exposure wheel
  const ticks = Array.from({ length: 21 }, (_, i) => i - 10);

  return (
    <div className="glass-panel border border-amber-500/20 rounded-2xl p-4 mx-2 mb-2 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Film className="w-4 h-4 text-amber-400" />
        <span className="text-amber-300 text-xs font-mono tracking-widest uppercase font-semibold">
          Cinema Controls
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Circular Exposure Wheel */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <span className="text-amber-400/60 text-xs font-mono tracking-wide">EXPOSURE</span>
          <div
            ref={wheelRef}
            className="relative w-20 h-20 cursor-ns-resize select-none touch-none"
            onPointerDown={handleWheelPointerDown}
            onPointerMove={handleWheelPointerMove}
            onPointerUp={handleWheelPointerUp}
            onPointerCancel={handleWheelPointerUp}
          >
            {/* Outer ring */}
            <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full">
              {/* Background arc */}
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="rgba(245,158,11,0.15)"
                strokeWidth="6"
              />
              {/* Active arc */}
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke="rgba(245,158,11,0.7)"
                strokeWidth="6"
                strokeDasharray={`${Math.abs(exposure / 2) * 107} 214`}
                strokeDashoffset={exposure >= 0 ? 0 : 107}
                strokeLinecap="round"
                transform={`rotate(${exposure >= 0 ? -90 : -90 + (exposure / 2) * 180} 40 40)`}
              />
              {/* Tick marks */}
              {ticks.map((tick) => {
                const angle = (tick / 10) * 135 - 90;
                const rad = (angle * Math.PI) / 180;
                const isMajor = tick % 5 === 0;
                const r1 = isMajor ? 28 : 30;
                const r2 = 34;
                return (
                  <line
                    key={tick}
                    x1={40 + r1 * Math.cos(rad)}
                    y1={40 + r1 * Math.sin(rad)}
                    x2={40 + r2 * Math.cos(rad)}
                    y2={40 + r2 * Math.sin(rad)}
                    stroke={isMajor ? 'rgba(245,158,11,0.6)' : 'rgba(245,158,11,0.25)'}
                    strokeWidth={isMajor ? 1.5 : 0.8}
                  />
                );
              })}
            </svg>

            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Aperture className="w-4 h-4 text-amber-400 mb-0.5" />
              <span className="text-amber-300 text-xs font-mono font-bold leading-none">
                {exposure >= 0 ? '+' : ''}{exposure.toFixed(1)}
              </span>
              <span className="text-amber-400/50 text-[9px] font-mono">EV</span>
            </div>

            {/* Drag indicator needle */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50" />
            </div>
          </div>

          {/* EV quick buttons */}
          <div className="flex gap-1">
            {[-2, -1, 0, 1, 2].map((ev) => (
              <button
                key={ev}
                onClick={() => onExposureChange(ev)}
                className={`w-6 h-5 rounded text-[9px] font-mono transition-all ${
                  Math.abs(exposure - ev) < 0.15
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-white/5 text-amber-400/60 hover:bg-white/10'
                }`}
              >
                {ev >= 0 ? `+${ev}` : ev}
              </button>
            ))}
          </div>
        </div>

        {/* Right column: Color Profile + Anamorphic */}
        <div className="flex flex-col gap-3 flex-1">
          {/* Color Profile Selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Layers className="w-3 h-3 text-amber-400/70" />
              <span className="text-amber-400/60 text-xs font-mono tracking-wide">COLOR PROFILE</span>
            </div>
            <div className="flex flex-col gap-1">
              {COLOR_PROFILES.map((p) => (
                <button
                  key={p}
                  onClick={() => onColorProfileChange(p)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    colorProfile === p
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                      : 'bg-white/5 border border-white/5 text-amber-400/50 hover:bg-white/10 hover:text-amber-300/70'
                  }`}
                >
                  <span className="font-semibold">{p}</span>
                  <span className="text-[10px] opacity-70">{PROFILE_DESCRIPTIONS[p]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Anamorphic Toggle */}
          <button
            onClick={toggleAnamorphic}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
              anamorphicActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-white/5 border-white/5 text-amber-400/50 hover:bg-white/10'
            }`}
          >
            <div className={`w-3 h-3 border-2 rounded-sm flex-shrink-0 ${anamorphicActive ? 'border-amber-400' : 'border-amber-400/30'}`}>
              {anamorphicActive && <div className="w-full h-full bg-amber-400 scale-50" />}
            </div>
            <span>2.39:1 Anamorphic</span>
            {anamorphicActive && (
              <span className="ml-auto text-amber-500 text-[9px] font-bold tracking-widest">ON</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
