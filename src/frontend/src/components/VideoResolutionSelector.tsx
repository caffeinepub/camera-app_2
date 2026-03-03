import React, { useEffect, useState } from "react";
import {
  VIDEO_RESOLUTIONS,
  type VideoResolution,
} from "../hooks/useVideoResolution";

interface VideoResolutionSelectorProps {
  activeResolution: VideoResolution;
  onResolutionChange: (res: VideoResolution) => void;
}

export default function VideoResolutionSelector({
  activeResolution,
  onResolutionChange,
}: VideoResolutionSelectorProps) {
  const [supports4K, setSupports4K] = useState<boolean | null>(null);

  useEffect(() => {
    // Check 4K support by attempting getUserMedia with 4K constraints
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 3840 }, height: { ideal: 2160 } },
      })
      .then((stream) => {
        if (cancelled) return;
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        const ok = (settings.width ?? 0) >= 3000;
        setSupports4K(ok);
        for (const t of stream.getTracks()) t.stop();
      })
      .catch(() => {
        if (!cancelled) setSupports4K(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      {VIDEO_RESOLUTIONS.map((res) => {
        const is4K = res.label === "4K·30";
        const disabled = is4K && supports4K === false;
        const isActive = activeResolution.label === res.label;
        return (
          <button
            key={res.label}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onResolutionChange(res)}
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border transition-all duration-200 ${
              isActive
                ? "bg-amber-400 text-black border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                : disabled
                  ? "bg-white/5 text-white/20 border-white/10 cursor-not-allowed"
                  : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:text-white"
            }`}
          >
            {res.label}
          </button>
        );
      })}
    </div>
  );
}
