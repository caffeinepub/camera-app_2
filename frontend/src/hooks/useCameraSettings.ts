// Manages camera settings persistence in localStorage

export type FacingMode = 'user' | 'environment';
export type GridMode = 'off' | 'rule-of-thirds' | 'square';
export type TimerDuration = 0 | 3 | 10;
export type TorchMode = 'off' | 'on' | 'auto';

export interface CameraSettings {
  facingMode: FacingMode;
  gridMode: GridMode;
  timerDuration: TimerDuration;
  torchMode: TorchMode;
  exposure: number;
  whiteBalance: number;
}

const STORAGE_KEY = 'lens-studio-camera-settings';

const DEFAULTS: CameraSettings = {
  facingMode: 'environment',
  gridMode: 'off',
  timerDuration: 0,
  torchMode: 'off',
  exposure: 0,
  whiteBalance: 4500,
};

function loadSettings(): CameraSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSettings(settings: Partial<CameraSettings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function useCameraSettings() {
  const settings = loadSettings();

  return {
    settings,
    saveFacingMode: (facingMode: FacingMode) => saveSettings({ facingMode }),
    saveGridMode: (gridMode: GridMode) => saveSettings({ gridMode }),
    saveTimerDuration: (timerDuration: TimerDuration) => saveSettings({ timerDuration }),
    saveTorchMode: (torchMode: TorchMode) => saveSettings({ torchMode }),
    saveExposure: (exposure: number) => saveSettings({ exposure }),
    saveWhiteBalance: (whiteBalance: number) => saveSettings({ whiteBalance }),
  };
}
