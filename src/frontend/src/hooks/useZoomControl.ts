import { useCallback, useEffect, useRef, useState } from "react";

export interface UseZoomControlReturn {
  zoom: number;
  maxZoom: number;
  setZoom: (value: number) => void;
  applyZoom: (videoTrack: MediaStreamTrack | null) => void;
  onPinchStart: (e: React.TouchEvent) => void;
  onPinchMove: (e: React.TouchEvent) => void;
  onPinchEnd: () => void;
}

export function useZoomControl(initialZoom = 1): UseZoomControlReturn {
  const [zoom, setZoomState] = useState(initialZoom);
  const [maxZoom, setMaxZoom] = useState(5);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(initialZoom);
  const currentTrackRef = useRef<MediaStreamTrack | null>(null);

  const applyZoom = useCallback((videoTrack: MediaStreamTrack | null) => {
    if (!videoTrack) return;
    currentTrackRef.current = videoTrack;

    try {
      const capabilities =
        videoTrack.getCapabilities() as MediaTrackCapabilities & {
          zoom?: { min: number; max: number; step: number };
        };
      if (capabilities.zoom) {
        const max = capabilities.zoom.max ?? 5;
        setMaxZoom(max);
      }
    } catch {
      // getCapabilities not supported
    }
  }, []);

  const setZoom = useCallback((value: number) => {
    setZoomState(value);
    const track = currentTrackRef.current;
    if (!track) return;
    try {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
        zoom?: { min: number; max: number };
      };
      if (capabilities.zoom) {
        track
          .applyConstraints({
            advanced: [{ zoom: value } as MediaTrackConstraintSet],
          })
          .catch(() => {});
      }
    } catch {
      // not supported
    }
  }, []);

  const getDistance = useCallback((touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const onPinchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDistRef.current = getDistance(e.touches);
        pinchStartZoomRef.current = zoom;
      }
    },
    [zoom, getDistance],
  );

  const onPinchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
        const dist = getDistance(e.touches);
        const scale = dist / pinchStartDistRef.current;
        const newZoom = Math.min(
          maxZoom,
          Math.max(1, pinchStartZoomRef.current * scale),
        );
        setZoom(Math.round(newZoom * 10) / 10);
      }
    },
    [maxZoom, setZoom, getDistance],
  );

  const onPinchEnd = useCallback(() => {
    pinchStartDistRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      currentTrackRef.current = null;
    };
  }, []);

  return {
    zoom,
    maxZoom,
    setZoom,
    applyZoom,
    onPinchStart,
    onPinchMove,
    onPinchEnd,
  };
}
