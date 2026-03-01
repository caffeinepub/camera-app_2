import { useState, useCallback } from 'react';
import { TorchMode } from './useCameraSettings';

export interface UseTorchControlReturn {
  torchMode: TorchMode;
  isSupported: boolean;
  setTorchMode: (mode: TorchMode, videoTrack: MediaStreamTrack | null) => void;
  initTorch: (videoTrack: MediaStreamTrack | null) => void;
}

export function useTorchControl(initialMode: TorchMode = 'off'): UseTorchControlReturn {
  const [torchMode, setTorchModeState] = useState<TorchMode>(initialMode);
  const [isSupported, setIsSupported] = useState(false);

  const initTorch = useCallback((videoTrack: MediaStreamTrack | null) => {
    if (!videoTrack) {
      setIsSupported(false);
      return;
    }
    try {
      const caps = videoTrack.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      setIsSupported(!!caps.torch);
    } catch {
      setIsSupported(false);
    }
  }, []);

  const setTorchMode = useCallback((mode: TorchMode, videoTrack: MediaStreamTrack | null) => {
    setTorchModeState(mode);
    if (!videoTrack) return;
    try {
      const torchOn = mode === 'on';
      videoTrack.applyConstraints({
        advanced: [{ torch: torchOn } as MediaTrackConstraintSet],
      }).catch(() => {});
    } catch {
      // not supported
    }
  }, []);

  return { torchMode, isSupported, setTorchMode, initTorch };
}
