import type React from "react";
import { useCallback, useRef } from "react";
import type { ProParam } from "./XperiaParamStrip";

interface XperiaRulerScrubberProps {
  param: ProParam;
  value: number;
  onChange: (value: number) => void;
  displayValue: string;
}

// Param ranges
const PARAM_CONFIG: Record<
  ProParam,
  { min: number; max: number; step: number }
> = {
  ISO: { min: 0, max: 7, step: 1 }, // index into ISO array
  S: { min: 0, max: 17, step: 1 }, // index into SHUTTER array
  WB: { min: 2700, max: 6500, step: 100 },
  AF: { min: 0, max: 1, step: 0.01 },
  EV: { min: -2, max: 2, step: 0.1 },
};

const TICK_COUNT = 61; // odd number so center is exact

// Pre-generate tick descriptors so keys are stable strings, not array indexes
const TICK_IDS = Array.from({ length: TICK_COUNT }, (_, i) => `t${i}`);

export default function XperiaRulerScrubber({
  param,
  value,
  onChange,
  displayValue,
}: XperiaRulerScrubberProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);
  const config = PARAM_CONFIG[param];
  const range = config.max - config.min;

  const handleDelta = useCallback(
    (dx: number) => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      // 1px = (range / width) * sensitivity
      const sensitivity = 0.4;
      const delta = (dx / width) * range * sensitivity;
      const clamped = Math.max(config.min, Math.min(config.max, value + delta));
      // Round to step
      const stepped =
        Math.round((clamped - config.min) / config.step) * config.step +
        config.min;
      onChange(Math.max(config.min, Math.min(config.max, stepped)));
    },
    [value, config, range, onChange],
  );

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      handleDelta(dx);
    },
    [handleDelta],
  );

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    lastXRef.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const x = e.touches[0].clientX;
      const dx = x - lastXRef.current;
      lastXRef.current = x;
      handleDelta(dx);
    },
    [handleDelta],
  );

  const center = Math.floor(TICK_COUNT / 2);

  return (
    <div
      className="w-full select-none"
      style={{ background: "rgba(0,0,0,0.88)" }}
    >
      {/* Current value display */}
      <div className="flex items-center justify-center pt-2 pb-1">
        <span
          className="text-xl font-mono font-bold tracking-wider"
          style={{ color: "#f59e0b" }}
        >
          {displayValue}
        </span>
      </div>

      {/* Ruler */}
      <div
        ref={containerRef}
        className="relative w-full h-10 cursor-ew-resize overflow-hidden"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      >
        {/* Tick marks */}
        <div className="absolute inset-0 flex items-end justify-center gap-0">
          {TICK_IDS.map((tickId, i) => {
            const distFromCenter = Math.abs(i - center);
            const isCenter = i === center;
            const isQuarter = (i - center) % 5 === 0;

            let height: number;
            let opacity: number;
            let color: string;

            if (isCenter) {
              height = 28;
              opacity = 1;
              color = "#f59e0b";
            } else if (isQuarter) {
              height = 16;
              opacity = 1 - distFromCenter * 0.025;
              color = "rgba(255,255,255,0.7)";
            } else {
              height = 8;
              opacity = Math.max(0.15, 1 - distFromCenter * 0.04);
              color = "rgba(255,255,255,0.45)";
            }

            return (
              <div
                key={tickId}
                className="flex-1 flex flex-col justify-end items-center"
                style={{ minWidth: 0, paddingBottom: 4 }}
              >
                <div
                  style={{
                    width: isCenter ? 2 : 1,
                    height,
                    background: color,
                    opacity,
                    borderRadius: 1,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Center reference line (invisible, just for alignment) */}
        <div
          className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: 1 }}
        />
      </div>

      <div className="pb-1" />
    </div>
  );
}
