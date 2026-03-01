import { useState, useCallback } from 'react';
import type { CameraMode } from '@/components/ModeSelector';

const STORAGE_KEY = 'camera-mode';
const DEFAULT_MODE: CameraMode = 'Photo';

function loadMode(): CameraMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as CameraMode | null;
    const valid: CameraMode[] = ['Photo', 'Video', 'Portrait', 'Cinematic', 'Night', 'Pro'];
    if (stored && valid.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_MODE;
}

export function useCameraMode() {
  const [mode, setModeState] = useState<CameraMode>(loadMode);

  const setMode = useCallback((newMode: CameraMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // ignore
    }
  }, []);

  return { mode, setMode };
}
