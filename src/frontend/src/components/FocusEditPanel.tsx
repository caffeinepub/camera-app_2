import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useFocusEdit } from "@/hooks/useFocusEdit";
import { useSavePhoto } from "@/hooks/useQueries";
import { Download, Eye, EyeOff, Focus, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FocusEditPanelProps {
  videoId: string;
  videoDataUrl: string;
  onClose: () => void;
}

export default function FocusEditPanel({
  videoId,
  videoDataUrl,
  onClose,
}: FocusEditPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // useFocusEdit returns flat properties matching FocusEditState + setters
  const {
    focusX,
    focusY,
    focusRadius,
    blurIntensity,
    previewEnabled,
    setFocusPoint,
    setFocusRadius,
    setBlurIntensity,
    togglePreview,
  } = useFocusEdit(videoId);

  const savePhoto = useSavePhoto();
  const [isExporting, setIsExporting] = useState(false);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return;

    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!previewEnabled) {
      ctx.drawImage(video, 0, 0, w, h);
      return;
    }

    // Draw blurred background — multiply blurIntensity by 3 for stronger bokeh
    const offscreen = document.createElement("canvas");
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const blurPx = Math.round(blurIntensity * 3);
    offCtx.filter = `blur(${blurPx}px)`;
    offCtx.drawImage(video, 0, 0, w, h);
    offCtx.filter = "none";
    ctx.drawImage(offscreen, 0, 0, w, h);

    // Draw sharp focus area with feathered mask
    const fx = focusX * w;
    const fy = focusY * h;
    const r = focusRadius * Math.min(w, h);

    const sharpCanvas = document.createElement("canvas");
    sharpCanvas.width = w;
    sharpCanvas.height = h;
    const sharpCtx = sharpCanvas.getContext("2d");
    if (!sharpCtx) return;

    sharpCtx.drawImage(video, 0, 0, w, h);

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const grad = maskCtx.createRadialGradient(fx, fy, r * 0.3, fx, fy, r * 1.2);
    grad.addColorStop(0, "rgba(0,0,0,1)");
    grad.addColorStop(0.6, "rgba(0,0,0,0.8)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    maskCtx.fillStyle = grad;
    maskCtx.fillRect(0, 0, w, h);

    sharpCtx.globalCompositeOperation = "destination-in";
    sharpCtx.drawImage(maskCanvas, 0, 0);
    sharpCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(sharpCanvas, 0, 0);

    // Draw focus reticle
    ctx.strokeStyle = "rgba(245,158,11,0.8)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(fx, fy, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner brackets
    const bSize = r * 0.25;
    const corners: [number, number, number, number][] = [
      [fx - r * 0.85, fy - r * 0.85, 1, 1],
      [fx + r * 0.85, fy - r * 0.85, -1, 1],
      [fx - r * 0.85, fy + r * 0.85, 1, -1],
      [fx + r * 0.85, fy + r * 0.85, -1, -1],
    ];
    for (const [cx2, cy2, dx, dy] of corners) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(245,158,11,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.moveTo(cx2, cy2 + dy * bSize);
      ctx.lineTo(cx2, cy2);
      ctx.lineTo(cx2 + dx * bSize, cy2);
      ctx.stroke();
    }
  }, [focusX, focusY, focusRadius, blurIntensity, previewEnabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = videoDataUrl;
    video.load();
    video.currentTime = 0;
  }, [videoDataUrl]);

  useEffect(() => {
    const loop = () => {
      renderFrame();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      // setFocusPoint takes (x: number, y: number)
      setFocusPoint(x, y);
    },
    [setFocusPoint],
  );

  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("Failed to create image");
      const arrayBuffer = await blob.arrayBuffer();
      const imageData = new Uint8Array(arrayBuffer) as Uint8Array<ArrayBuffer>;
      const id = `focus-export-${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const timestamp = BigInt(Date.now());
      await savePhoto.mutateAsync({ id, timestamp, imageData });
      toast.success("Focus edit exported to gallery!");
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [savePhoto]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Focus className="w-4 h-4 text-amber-400" />
          <span className="text-amber-300 text-sm font-semibold font-mono tracking-wide">
            Focus Edit
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas preview */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-black"
      >
        <video ref={videoRef} className="hidden" playsInline muted loop />
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain cursor-crosshair"
          onClick={handleCanvasClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (!canvasRef.current) return;
              setFocusPoint(0.5, 0.5);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Click to set focus point"
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40 text-xs font-mono pointer-events-none">
          Tap to move focus point
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-white/10 px-4 py-4 flex flex-col gap-4 bg-black/90">
        {/* Preview toggle */}
        <div className="flex items-center justify-between">
          <span className="text-amber-300/70 text-xs font-mono tracking-wide">
            BOKEH PREVIEW
          </span>
          <button
            type="button"
            onClick={togglePreview}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
              previewEnabled
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-white/5 border-white/10 text-white/50"
            }`}
          >
            {previewEnabled ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
            {previewEnabled ? "On" : "Off"}
          </button>
        </div>

        {/* Focus Radius */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-amber-300/70 text-xs font-mono tracking-wide">
              FOCUS RADIUS
            </span>
            <span className="text-amber-400 text-xs font-mono">
              {Math.round(focusRadius * 100)}%
            </span>
          </div>
          <Slider
            min={5}
            max={60}
            step={1}
            value={[Math.round(focusRadius * 100)]}
            onValueChange={([v]) => setFocusRadius(v / 100)}
            className="w-full"
          />
        </div>

        {/* Blur Intensity */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-amber-300/70 text-xs font-mono tracking-wide">
              BLUR INTENSITY
            </span>
            <span className="text-amber-400 text-xs font-mono">
              {blurIntensity}px
            </span>
          </div>
          <Slider
            min={2}
            max={40}
            step={1}
            value={[blurIntensity]}
            onValueChange={([v]) => setBlurIntensity(v)}
            className="w-full"
          />
        </div>

        {/* Export button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
        >
          {isExporting ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Exporting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Frame
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
