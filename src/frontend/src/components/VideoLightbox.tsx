import { ChevronLeft, ChevronRight, Focus, Trash2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import type { Video } from "../backend";
import FocusEditPanel from "./FocusEditPanel";

interface VideoLightboxProps {
  video: Video;
  onClose: () => void;
  onDelete: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
  isDeleting?: boolean;
  hasNext: boolean;
  hasPrev: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function VideoLightbox({
  video,
  onClose,
  onDelete,
  onNext,
  onPrev,
  isDeleting,
  hasNext,
  hasPrev,
}: VideoLightboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showFocusEdit, setShowFocusEdit] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showFocusEdit) {
          setShowFocusEdit(false);
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowRight" && hasNext) onNext();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "Delete") onDelete(video.id);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    onClose,
    onNext,
    onPrev,
    onDelete,
    video.id,
    hasNext,
    hasPrev,
    showFocusEdit,
  ]);

  const timestamp = new Date(Number(video.timestamp)).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-fade-in">
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(video.id)}
        disabled={isDeleting}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {isDeleting ? (
          <div className="w-4 h-4 border-2 border-red-400/40 border-t-red-400 rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 text-red-400" />
        )}
      </button>

      {/* Focus Edit button */}
      <button
        type="button"
        onClick={() => setShowFocusEdit(true)}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-xs font-semibold transition-colors"
      >
        <Focus className="w-3.5 h-3.5" />
        Focus Edit
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Video */}
      <div className="w-full max-w-4xl px-16">
        <video
          ref={videoRef}
          src={video.dataUrl}
          controls
          autoPlay
          className="w-full max-h-[75vh] rounded-xl object-contain"
        >
          <track kind="captions" />
        </video>
        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-white/50 text-sm">{timestamp}</span>
          <span className="text-amber-400 text-sm font-mono font-semibold">
            {formatDuration(Number(video.durationSeconds))}
          </span>
        </div>
      </div>

      {/* Focus Edit Panel overlay */}
      {showFocusEdit && (
        <FocusEditPanel
          videoId={video.id}
          videoDataUrl={video.dataUrl}
          onClose={() => setShowFocusEdit(false)}
        />
      )}
    </div>
  );
}
