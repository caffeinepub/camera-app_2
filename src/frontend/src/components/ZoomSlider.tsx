import { Slider } from "@/components/ui/slider";
import React, { useState, useEffect, useRef } from "react";

interface ZoomSliderProps {
  zoom: number;
  maxZoom: number;
  onChange: (value: number) => void;
}

export default function ZoomSlider({
  zoom,
  maxZoom,
  onChange,
}: ZoomSliderProps) {
  const [showLabel, setShowLabel] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (values: number[]) => {
    onChange(values[0]);
    setShowLabel(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowLabel(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (maxZoom <= 1) return null;

  return (
    <div className="w-full flex flex-col items-center gap-2 px-8">
      {/* Zoom label */}
      <div
        className="text-amber font-display font-semibold text-sm transition-opacity duration-300"
        style={{ opacity: showLabel ? 1 : 0 }}
      >
        {zoom.toFixed(1)}×
      </div>
      {/* Slider */}
      <div className="w-full flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-6 text-right">1×</span>
        <Slider
          min={1}
          max={maxZoom}
          step={0.1}
          value={[zoom]}
          onValueChange={handleChange}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-8">
          {maxZoom.toFixed(0)}×
        </span>
      </div>
    </div>
  );
}
