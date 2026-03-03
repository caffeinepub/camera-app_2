import { Sparkles } from "lucide-react";
import React from "react";
import type { NoiseReductionStrength } from "../hooks/useNoiseReduction";

interface NoiseReductionToggleProps {
  strength: NoiseReductionStrength;
  onStrengthChange: (s: NoiseReductionStrength) => void;
}

const LEVELS: { value: NoiseReductionStrength; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "light", label: "Light" },
  { value: "strong", label: "Strong" },
  { value: "max", label: "Max" },
];

export default function NoiseReductionToggle({
  strength,
  onStrengthChange,
}: NoiseReductionToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 px-1">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold text-amber-300 tracking-wide uppercase">
          AI Denoise
        </span>
        {strength !== "off" && (
          <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-1.5 py-0.5 font-medium animate-pulse-slow">
            ON
          </span>
        )}
      </div>
      <div className="flex rounded-lg overflow-hidden border border-white/10 bg-black/30 backdrop-blur-sm">
        {LEVELS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onStrengthChange(value)}
            className={`flex-1 py-1.5 text-[11px] font-medium transition-all duration-150 ${
              strength === value
                ? "bg-amber-500/30 text-amber-300 border-b-2 border-amber-400"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
