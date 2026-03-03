import React from "react";
import type { GridMode } from "../hooks/useCameraSettings";

interface GridOverlayProps {
  mode: GridMode;
}

export default function GridOverlay({ mode }: GridOverlayProps) {
  if (mode === "off") return null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
    >
      {mode === "rule-of-thirds" && (
        <>
          {/* Vertical lines at 1/3 and 2/3 */}
          <line
            x1="33.33%"
            y1="0%"
            x2="33.33%"
            y2="100%"
            stroke="white"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
          <line
            x1="66.66%"
            y1="0%"
            x2="66.66%"
            y2="100%"
            stroke="white"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
          {/* Horizontal lines at 1/3 and 2/3 */}
          <line
            x1="0%"
            y1="33.33%"
            x2="100%"
            y2="33.33%"
            stroke="white"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
          <line
            x1="0%"
            y1="66.66%"
            x2="100%"
            y2="66.66%"
            stroke="white"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
        </>
      )}
      {mode === "square" && (
        <>
          {/* Centered square crop guide — 1:1 aspect ratio guide */}
          {/* We use a rect centered in the viewbox */}
          <rect
            x="12.5%"
            y="0%"
            width="75%"
            height="100%"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            strokeDasharray="6 4"
          />
          {/* Corner accents */}
          <line
            x1="12.5%"
            y1="0%"
            x2="12.5%"
            y2="8%"
            stroke="white"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          <line
            x1="12.5%"
            y1="0%"
            x2="20%"
            y2="0%"
            stroke="white"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          <line
            x1="87.5%"
            y1="0%"
            x2="87.5%"
            y2="8%"
            stroke="white"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          <line
            x1="87.5%"
            y1="0%"
            x2="80%"
            y2="0%"
            stroke="white"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          <line
            x1="12.5%"
            y1="100%"
            x2="12.5%"
            y2="92%"
            stroke="white"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          <line
            x1="12.5%"
            y1="100%"
            x2="20%"
            y2="100%"
            stroke="white"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          <line
            x1="87.5%"
            y1="100%"
            x2="87.5%"
            y2="92%"
            stroke="white"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
          <line
            x1="87.5%"
            y1="100%"
            x2="80%"
            y2="100%"
            stroke="white"
            strokeWidth="2.5"
            strokeOpacity="0.8"
          />
        </>
      )}
    </svg>
  );
}
