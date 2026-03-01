import React from 'react';
import { BlurStrengthLevel } from '@/hooks/useBlurStrength';

interface BlurStrengthToggleProps {
  level: BlurStrengthLevel;
  onSelect: (level: BlurStrengthLevel) => void;
}

const LEVELS: BlurStrengthLevel[] = ['Light', 'Strong', 'Max'];

export default function BlurStrengthToggle({ level, onSelect }: BlurStrengthToggleProps) {
  return (
    <div className="flex items-center gap-1 glass-panel rounded-full px-1 py-1 border border-amber-500/20">
      <span className="text-amber-400/60 text-xs font-mono px-1.5 tracking-wide">BLUR</span>
      {LEVELS.map((l) => (
        <button
          key={l}
          onClick={() => onSelect(l)}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
            level === l
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
              : 'text-amber-300/70 hover:text-amber-200'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
