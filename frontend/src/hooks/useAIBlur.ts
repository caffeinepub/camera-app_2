import { useEffect, useRef, useCallback } from 'react';

interface UseAIBlurOptions {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  blurMultiplier?: number;
}

export function useAIBlur({ enabled, videoRef, blurMultiplier = 1.0 }: UseAIBlurOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopProcessing = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopProcessing();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    const offscreen = document.createElement('canvas');

    const ctx = canvas.getContext('2d');
    const offCtx = offscreen.getContext('2d');
    if (!ctx || !offCtx) return;

    const baseBlur = 28;
    const blurPx = Math.round(baseBlur * blurMultiplier);

    const draw = () => {
      if (!video || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        offscreen.width = w;
        offscreen.height = h;
      }

      // Draw blurred background
      offCtx.filter = `blur(${blurPx}px)`;
      offCtx.drawImage(video, 0, 0, w, h);
      offCtx.filter = 'none';
      ctx.drawImage(offscreen, 0, 0, w, h);

      // Draw sharp center oval (subject mask) with feathered gradient
      const cx = w / 2;
      const cy = h / 2;
      const rx = w * 0.32;
      const ry = h * 0.48;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(video, 0, 0, w, h);

        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          const grad = maskCtx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.5, cx, cy, Math.max(rx, ry) * 1.1);
          grad.addColorStop(0, 'rgba(0,0,0,1)');
          grad.addColorStop(0.6, 'rgba(0,0,0,0.9)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          maskCtx.fillStyle = grad;
          maskCtx.fillRect(0, 0, w, h);

          tempCtx.globalCompositeOperation = 'destination-in';
          tempCtx.drawImage(maskCanvas, 0, 0);
          tempCtx.globalCompositeOperation = 'source-over';
        }

        ctx.drawImage(tempCanvas, 0, 0);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    try {
      // @ts-ignore
      streamRef.current = canvas.captureStream(30);
    } catch {}

    return () => {
      stopProcessing();
    };
  }, [enabled, videoRef, blurMultiplier, stopProcessing]);

  return {
    canvasStream: streamRef.current,
    outputCanvas: canvasRef.current,
  };
}
