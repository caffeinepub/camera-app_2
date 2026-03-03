import { useCallback, useState } from "react";

export type CineColorProfile = "Rec.709" | "Log-C" | "D-Cinema";

const STORAGE_KEY = "cineCameraColorProfile";

const PROFILE_FILTERS: Record<CineColorProfile, string> = {
  "Rec.709": "saturate(1.1) contrast(1.05)",
  "Log-C": "saturate(0.6) contrast(0.75) brightness(1.1)",
  "D-Cinema": "saturate(1.3) contrast(1.15) hue-rotate(5deg)",
};

function getStoredProfile(): CineColorProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "Rec.709" || stored === "Log-C" || stored === "D-Cinema") {
      return stored as CineColorProfile;
    }
  } catch {}
  return "Rec.709";
}

export function useCineColorProfile() {
  const [profile, setProfileState] =
    useState<CineColorProfile>(getStoredProfile);

  const setProfile = useCallback((newProfile: CineColorProfile) => {
    setProfileState(newProfile);
    try {
      localStorage.setItem(STORAGE_KEY, newProfile);
    } catch {}
  }, []);

  return {
    profile,
    cssFilter: PROFILE_FILTERS[profile],
    setProfile,
  };
}
