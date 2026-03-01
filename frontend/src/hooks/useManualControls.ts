import { useState, useCallback } from 'react';

export interface ManualControlsState {
  exposure: number; // EV -2 to +2
  whiteBalance: number; // Kelvin 2700-6500
}

export function useManualControls() {
  const [exposure, setExposureState] = useState<number>(0);
  const [whiteBalance, setWhiteBalanceState] = useState<number>(5500);

  const setExposure = useCallback(
    (ev: number, track?: MediaStreamTrack | null, videoEl?: HTMLVideoElement | null) => {
      setExposureState(ev);
      if (track) {
        try {
          track.applyConstraints({
            advanced: [{ exposureCompensation: ev } as any],
          });
        } catch {}
      }
      if (videoEl) {
        const brightness = 1 + ev * 0.25;
        videoEl.style.filter = `brightness(${brightness})`;
      }
    },
    []
  );

  const setWhiteBalance = useCallback(
    (kelvin: number, track?: MediaStreamTrack | null) => {
      setWhiteBalanceState(kelvin);
      if (track) {
        try {
          track.applyConstraints({
            advanced: [{ colorTemperature: kelvin } as any],
          });
        } catch {}
      }
    },
    []
  );

  return {
    exposure,
    whiteBalance,
    setExposure,
    setWhiteBalance,
  };
}
