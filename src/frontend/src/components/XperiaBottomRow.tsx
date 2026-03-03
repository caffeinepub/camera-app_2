import React from "react";

interface XperiaBottomRowProps {
  isVideoMode: boolean;
  isRecording: boolean;
  onCapture: () => void;
  onRecordToggle: () => void;
  onSwitchCamera: () => void;
  lastPhotoUrl: string | null;
  onOpenGallery: () => void;
  isAIAutoMode: boolean;
  onToggleAIAuto: () => void;
  disabled: boolean;
}

export default function XperiaBottomRow({
  isVideoMode,
  isRecording,
  onCapture,
  onRecordToggle,
  lastPhotoUrl,
  onOpenGallery,
  isAIAutoMode,
  onToggleAIAuto,
  disabled,
}: XperiaBottomRowProps) {
  const handleMainAction = () => {
    if (isVideoMode) {
      onRecordToggle();
    } else {
      onCapture();
    }
  };

  return (
    <div className="w-full flex items-center justify-between px-6 py-4 bg-black">
      {/* Left: Last photo thumbnail / gallery */}
      <button
        type="button"
        data-ocid="camera.gallery.open_modal_button"
        onClick={onOpenGallery}
        className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20 bg-white/5 transition-all active:scale-95 flex-shrink-0"
        aria-label="Open gallery"
      >
        {lastPhotoUrl ? (
          <img
            src={lastPhotoUrl}
            alt="Last capture"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
      </button>

      {/* Center: Shutter / Record Button */}
      <button
        type="button"
        data-ocid="camera.capture.primary_button"
        onClick={handleMainAction}
        disabled={disabled}
        aria-label={
          isVideoMode
            ? isRecording
              ? "Stop recording"
              : "Start recording"
            : "Take photo"
        }
        className="relative flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
        style={{ width: 68, height: 68 }}
      >
        {isVideoMode ? (
          // Video mode: red ring
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              border: "3.5px solid",
              borderColor: isRecording ? "#ef4444" : "rgba(239,68,68,0.85)",
              background: isRecording ? "rgba(239,68,68,0.15)" : "transparent",
            }}
          >
            {isRecording ? (
              // Stop: red square
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  background: "#ef4444",
                }}
              />
            ) : (
              // Record: red dot
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "#ef4444",
                }}
              />
            )}
          </div>
        ) : (
          // Photo mode: white hollow ring
          <div
            className="w-full h-full rounded-full"
            style={{
              border: "3.5px solid rgba(255,255,255,0.9)",
              background: "rgba(255,255,255,0.08)",
              boxShadow: "0 0 0 1.5px rgba(255,255,255,0.2) inset",
            }}
          />
        )}
      </button>

      {/* Right: AI Auto button */}
      <button
        type="button"
        data-ocid="camera.ai_auto.toggle"
        onClick={onToggleAIAuto}
        aria-label="Toggle AI Auto mode"
        className="relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
        style={{
          border: `2px solid ${isAIAutoMode ? "#f59e0b" : "rgba(245,158,11,0.45)"}`,
          background: isAIAutoMode
            ? "rgba(245,158,11,0.15)"
            : "rgba(0,0,0,0.3)",
        }}
      >
        {/* Circular arrows + A letter */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          aria-hidden="true"
        >
          {/* Circular arrow arc top */}
          <path
            d="M14 4 A10 10 0 0 1 24 14"
            stroke={isAIAutoMode ? "#f59e0b" : "rgba(245,158,11,0.6)"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Arrow head top */}
          <polyline
            points="21.5,10.5 24,14 27,11.5"
            stroke={isAIAutoMode ? "#f59e0b" : "rgba(245,158,11,0.6)"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Circular arrow arc bottom */}
          <path
            d="M14 24 A10 10 0 0 1 4 14"
            stroke={isAIAutoMode ? "#f59e0b" : "rgba(245,158,11,0.6)"}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Arrow head bottom */}
          <polyline
            points="6.5,17.5 4,14 1,16.5"
            stroke={isAIAutoMode ? "#f59e0b" : "rgba(245,158,11,0.6)"}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* A letter in center */}
          <text
            x="14"
            y="17.5"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fontFamily="monospace"
            fill={isAIAutoMode ? "#f59e0b" : "rgba(245,158,11,0.75)"}
          >
            A
          </text>
        </svg>
      </button>
    </div>
  );
}
