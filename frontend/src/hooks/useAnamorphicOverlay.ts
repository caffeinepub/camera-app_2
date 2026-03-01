import { useState, useCallback } from 'react';

const STORAGE_KEY = 'cameraAnamorphicOverlay';

function getStoredState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {}
  return false;
}

export function useAnamorphicOverlay() {
  const [isActive, setIsActive] = useState<boolean>(getStoredState);

  const toggle = useCallback(() => {
    setIsActive((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  return { isActive, toggle };
}
