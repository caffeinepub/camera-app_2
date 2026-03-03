import { Slider } from "@/components/ui/slider";
import { Aperture, Focus, Sun, Thermometer } from "lucide-react";
import React, { useState } from "react";

const ISO_VALUES = [50, 100, 200, 400, 800, 1600, 3200, 6400];
const SHUTTER_VALUES = [
  "1/4000",
  "1/2000",
  "1/1000",
  "1/500",
  "1/250",
  "1/125",
  "1/60",
  "1/30",
  "1/15",
  "1/8",
  "1/4",
  "1/2",
  '1"',
  '2"',
  '4"',
  '8"',
  '15"',
  '30"',
];
const WB_PRESETS = [
  { label: "Auto", temp: 0 },
  { label: "Daylight", temp: 5500 },
  { label: "Cloudy", temp: 6500 },
  { label: "Tungsten", temp: 3200 },
  { label: "Fluorescent", temp: 4000 },
];

interface ProModeControlsProps {
  videoTrack: MediaStreamTrack | null;
}

export default function ProModeControls({ videoTrack }: ProModeControlsProps) {
  const [isoIndex, setIsoIndex] = useState(3); // 400
  const [shutterIndex, setShutterIndex] = useState(6); // 1/60
  const [focusMode, setFocusMode] = useState<"AF" | "MF">("AF");
  const [focusDistance, setFocusDistance] = useState(0.5);
  const [wbPreset, setWbPreset] = useState("Auto");

  const applyISO = (idx: number) => {
    setIsoIndex(idx);
    if (!videoTrack) return;
    const iso = ISO_VALUES[idx];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videoTrack
        .applyConstraints({ advanced: [{ iso } as any] })
        .catch(() => {});
    } catch {
      /* not supported */
    }
  };

  const applyShutter = (idx: number) => {
    setShutterIndex(idx);
    if (!videoTrack) return;
    const label = SHUTTER_VALUES[idx];
    let secs = 1 / 60;
    if (label.includes("/")) {
      const parts = label.split("/");
      secs = 1 / Number.parseFloat(parts[1]);
    } else {
      secs = Number.parseFloat(label.replace('"', ""));
    }
    const exposureTime = secs * 1_000_000; // microseconds
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videoTrack
        .applyConstraints({
          advanced: [{ exposureTime, exposureMode: "manual" } as any],
        })
        .catch(() => {});
    } catch {
      /* not supported */
    }
  };

  const applyFocusMode = (mode: "AF" | "MF") => {
    setFocusMode(mode);
    if (!videoTrack) return;
    try {
      const focusModeValue = mode === "AF" ? "continuous" : "manual";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videoTrack
        .applyConstraints({ advanced: [{ focusMode: focusModeValue } as any] })
        .catch(() => {});
    } catch {
      /* not supported */
    }
  };

  const applyFocusDistance = (val: number) => {
    setFocusDistance(val);
    if (!videoTrack || focusMode !== "MF") return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      videoTrack
        .applyConstraints({ advanced: [{ focusDistance: val } as any] })
        .catch(() => {});
    } catch {
      /* not supported */
    }
  };

  const applyWB = (preset: (typeof WB_PRESETS)[0]) => {
    setWbPreset(preset.label);
    if (!videoTrack) return;
    try {
      if (preset.temp === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoTrack
          .applyConstraints({
            advanced: [{ whiteBalanceMode: "continuous" } as any],
          })
          .catch(() => {});
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        videoTrack
          .applyConstraints({
            advanced: [
              {
                whiteBalanceMode: "manual",
                colorTemperature: preset.temp,
              } as any,
            ],
          })
          .catch(() => {});
      }
    } catch {
      /* not supported */
    }
  };

  return (
    <div className="w-full px-2 py-2 space-y-3">
      {/* ISO */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber">
            <Sun className="w-3.5 h-3.5" />
            <span className="text-xs font-bold tracking-widest uppercase">
              ISO
            </span>
          </div>
          <span className="text-xs font-mono text-amber">
            {ISO_VALUES[isoIndex]}
          </span>
        </div>
        <Slider
          min={0}
          max={ISO_VALUES.length - 1}
          step={1}
          value={[isoIndex]}
          onValueChange={([v]) => applyISO(v)}
          className="w-full"
        />
      </div>

      {/* Shutter Speed */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber">
            <Aperture className="w-3.5 h-3.5" />
            <span className="text-xs font-bold tracking-widest uppercase">
              Shutter
            </span>
          </div>
          <span className="text-xs font-mono text-amber">
            {SHUTTER_VALUES[shutterIndex]}s
          </span>
        </div>
        <Slider
          min={0}
          max={SHUTTER_VALUES.length - 1}
          step={1}
          value={[shutterIndex]}
          onValueChange={([v]) => applyShutter(v)}
          className="w-full"
        />
      </div>

      {/* Focus Mode */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-amber">
          <Focus className="w-3.5 h-3.5" />
          <span className="text-xs font-bold tracking-widest uppercase">
            Focus
          </span>
        </div>
        <div className="flex gap-2">
          {(["AF", "MF"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => applyFocusMode(m)}
              className={`px-4 py-1 rounded-full text-xs font-bold border transition-all duration-200 ${
                focusMode === m
                  ? "bg-amber text-background border-amber"
                  : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {focusMode === "MF" && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Focus Distance</span>
              <span className="text-xs font-mono text-amber">
                {focusDistance.toFixed(2)}
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[focusDistance]}
              onValueChange={([v]) => applyFocusDistance(v)}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* White Balance */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-amber">
          <Thermometer className="w-3.5 h-3.5" />
          <span className="text-xs font-bold tracking-widest uppercase">
            White Balance
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {WB_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyWB(preset)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${
                wbPreset === preset.label
                  ? "bg-amber text-background border-amber"
                  : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
