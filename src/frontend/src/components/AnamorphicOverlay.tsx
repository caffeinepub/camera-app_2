import React from "react";

interface AnamorphicOverlayProps {
  isActive: boolean;
}

export default function AnamorphicOverlay({
  isActive,
}: AnamorphicOverlayProps) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between">
      {/* Top letterbox bar */}
      <div
        className="w-full bg-black/90 flex items-center justify-center"
        style={{ height: "calc((100% - 100% / 2.39) / 2)" }}
      >
        <span className="text-amber-400/40 text-xs font-mono tracking-widest uppercase">
          2.39:1
        </span>
      </div>
      {/* Bottom letterbox bar */}
      <div
        className="w-full bg-black/90"
        style={{ height: "calc((100% - 100% / 2.39) / 2)" }}
      />
    </div>
  );
}
