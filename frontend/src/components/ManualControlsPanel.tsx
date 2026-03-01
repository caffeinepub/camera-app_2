import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Sun, Thermometer } from 'lucide-react';

interface ManualControlsPanelProps {
  exposure: number;
  whiteBalance: number;
  exposureSupported: boolean;
  whiteBalanceSupported: boolean;
  onExposureChange: (ev: number) => void;
  onWhiteBalanceChange: (kelvin: number) => void;
}

export default function ManualControlsPanel({
  exposure,
  whiteBalance,
  exposureSupported,
  whiteBalanceSupported,
  onExposureChange,
  onWhiteBalanceChange,
}: ManualControlsPanelProps) {
  const evLabel = exposure >= 0 ? `+${exposure.toFixed(1)}` : exposure.toFixed(1);

  return (
    <div
      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-4 p-3 rounded-2xl glass-light"
      style={{ minWidth: '72px' }}
    >
      {/* Exposure */}
      <div className="flex flex-col items-center gap-2">
        <Sun size={16} className="text-amber" />
        <div
          className="flex flex-col items-center"
          style={{ height: '120px' }}
        >
          <Slider
            orientation="vertical"
            min={-2}
            max={2}
            step={0.1}
            value={[exposure]}
            onValueChange={(vals) => onExposureChange(vals[0])}
            className="h-full"
            disabled={false}
          />
        </div>
        <span className="text-xs font-mono text-amber font-semibold">{evLabel}</span>
        {!exposureSupported && (
          <span className="text-xs text-muted-foreground text-center leading-tight" style={{ fontSize: '9px' }}>CSS</span>
        )}
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-border" />

      {/* White Balance */}
      <div className="flex flex-col items-center gap-2">
        <Thermometer size={16} className="text-amber" />
        <div
          className="flex flex-col items-center"
          style={{ height: '120px' }}
        >
          <Slider
            orientation="vertical"
            min={2700}
            max={6500}
            step={100}
            value={[whiteBalance]}
            onValueChange={(vals) => onWhiteBalanceChange(vals[0])}
            className="h-full"
            disabled={!whiteBalanceSupported}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground" style={{ fontSize: '9px' }}>
          {whiteBalance}K
        </span>
        {!whiteBalanceSupported && (
          <span className="text-xs text-muted-foreground text-center leading-tight" style={{ fontSize: '9px' }}>N/A</span>
        )}
      </div>
    </div>
  );
}
