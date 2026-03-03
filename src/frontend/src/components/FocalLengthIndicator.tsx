import React from "react";

interface FocalLengthIndicatorProps {
  focalLength?: number;
  zoom?: number;
}

// Map zoom level to approximate 35mm equivalent focal length
function zoomToFocalLength(zoom: number): number {
  const base = 24; // wide angle base
  return Math.round(base * zoom);
}

export default function FocalLengthIndicator({
  focalLength,
  zoom = 1,
}: FocalLengthIndicatorProps) {
  const mm = focalLength ?? zoomToFocalLength(zoom);

  return (
    <div className="absolute top-3 right-3 z-20 pointer-events-none">
      <div className="glass-panel px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-80" />
        <span className="text-amber-300 text-xs font-mono tracking-wider font-semibold">
          {mm}mm eq.
        </span>
      </div>
    </div>
  );
}
