import { useState, useCallback, useEffect } from 'react';

export interface FocusEditState {
  focusX: number; // 0-1 normalized
  focusY: number; // 0-1 normalized
  focusRadius: number; // 0-1 normalized
  blurIntensity: number; // 0-30 px
  previewEnabled: boolean;
}

const DEFAULT_STATE: FocusEditState = {
  focusX: 0.5,
  focusY: 0.5,
  focusRadius: 0.25,
  blurIntensity: 12,
  previewEnabled: false,
};

function getStorageKey(videoId: string) {
  return `focus-edit-${videoId}`;
}

function loadState(videoId: string): FocusEditState {
  try {
    const raw = localStorage.getItem(getStorageKey(videoId));
    if (raw) {
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_STATE };
}

function saveState(videoId: string, state: FocusEditState) {
  try {
    localStorage.setItem(getStorageKey(videoId), JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function useFocusEdit(videoId: string) {
  const [state, setState] = useState<FocusEditState>(() => loadState(videoId));

  useEffect(() => {
    setState(loadState(videoId));
  }, [videoId]);

  const updateState = useCallback((updates: Partial<FocusEditState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };
      saveState(videoId, next);
      return next;
    });
  }, [videoId]);

  const setFocusPoint = useCallback((x: number, y: number) => {
    updateState({ focusX: x, focusY: y });
  }, [updateState]);

  const setFocusRadius = useCallback((radius: number) => {
    updateState({ focusRadius: radius });
  }, [updateState]);

  const setBlurIntensity = useCallback((intensity: number) => {
    updateState({ blurIntensity: intensity });
  }, [updateState]);

  const togglePreview = useCallback(() => {
    updateState({ previewEnabled: !state.previewEnabled });
  }, [updateState, state.previewEnabled]);

  return {
    ...state,
    setFocusPoint,
    setFocusRadius,
    setBlurIntensity,
    togglePreview,
  };
}
