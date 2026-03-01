import { useState } from 'react';

export interface VideoResolution {
  label: string;
  width: number;
  height: number;
  frameRate: number;
}

export const VIDEO_RESOLUTIONS: VideoResolution[] = [
  { label: '1080p·30', width: 1920, height: 1080, frameRate: 30 },
  { label: '1080p·60', width: 1920, height: 1080, frameRate: 60 },
  { label: '4K·30', width: 3840, height: 2160, frameRate: 30 },
];

const STORAGE_KEY = 'lens-studio-video-resolution';

export function useVideoResolution() {
  const [resolution, setResolutionState] = useState<VideoResolution>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as VideoResolution;
        const found = VIDEO_RESOLUTIONS.find(r => r.label === parsed.label);
        if (found) return found;
      } catch {
        // ignore
      }
    }
    return VIDEO_RESOLUTIONS[0];
  });

  const setResolution = (res: VideoResolution) => {
    setResolutionState(res);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
  };

  return { resolution, setResolution };
}
