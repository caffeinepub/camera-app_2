import { Play } from "lucide-react";
import React, { useRef, useEffect, useState } from "react";
import type { Video } from "../backend";

interface VideoThumbnailProps {
  video: Video;
  onClick: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function VideoThumbnail({
  video,
  onClick,
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbReady, setThumbReady] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const handleLoaded = () => {
      el.currentTime = 0.5;
    };
    const handleSeeked = () => {
      setThumbReady(true);
    };
    el.addEventListener("loadedmetadata", handleLoaded);
    el.addEventListener("seeked", handleSeeked);
    return () => {
      el.removeEventListener("loadedmetadata", handleLoaded);
      el.removeEventListener("seeked", handleSeeked);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      type="button"
      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-surface-800"
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src={video.dataUrl}
        preload="metadata"
        muted
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-300 ${thumbReady ? "opacity-100" : "opacity-0"}`}
      />
      {!thumbReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-800">
          <div className="w-8 h-8 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
        </div>
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-200">
        <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-200">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
      {/* Duration badge */}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-xs font-mono text-white font-semibold">
        {formatDuration(Number(video.durationSeconds))}
      </div>
    </button>
  );
}
