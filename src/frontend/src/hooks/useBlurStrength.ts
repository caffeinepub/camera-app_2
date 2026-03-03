import { useCallback, useState } from "react";

export type BlurStrengthLevel = "Light" | "Strong" | "Max";

const BLUR_MULTIPLIERS: Record<BlurStrengthLevel, number> = {
  Light: 1.0,
  Strong: 1.8,
  Max: 3.0,
};

const STORAGE_KEY = "cameraBlurStrength";

function getStoredLevel(): BlurStrengthLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "Light" || stored === "Strong" || stored === "Max") {
      return stored;
    }
  } catch {}
  return "Strong";
}

export function useBlurStrength() {
  const [level, setLevelState] = useState<BlurStrengthLevel>(getStoredLevel);

  const setLevel = useCallback((newLevel: BlurStrengthLevel) => {
    setLevelState(newLevel);
    try {
      localStorage.setItem(STORAGE_KEY, newLevel);
    } catch {}
  }, []);

  return {
    level,
    multiplier: BLUR_MULTIPLIERS[level],
    setLevel,
  };
}
