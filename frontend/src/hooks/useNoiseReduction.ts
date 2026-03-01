import { useCallback, useRef, useState, useEffect } from 'react';

export type NoiseReductionStrength = 'off' | 'light' | 'strong' | 'max';

const STRENGTH_MAP: Record<NoiseReductionStrength, number> = {
  off: 0,
  light: 1,
  strong: 2,
  max: 3,
};

/**
 * Applies a simple noise reduction pass on ImageData using a box-blur + unsharp mask approach
 * to simulate bilateral filtering for low-light denoising.
 */
function applyNoiseReduction(
  imageData: ImageData,
  passes: number
): ImageData {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let pass = 0; pass < passes; pass++) {
    const src = pass === 0 ? data : output.slice();
    const radius = 1;

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        const centerIdx = (y * width + x) * 4;
        const centerR = src[centerIdx];
        const centerG = src[centerIdx + 1];
        const centerB = src[centerIdx + 2];

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            const nr = src[idx];
            const ng = src[idx + 1];
            const nb = src[idx + 2];

            // Bilateral-like weight: reduce influence of pixels that differ too much
            const diff = Math.abs(nr - centerR) + Math.abs(ng - centerG) + Math.abs(nb - centerB);
            const weight = diff < 60 ? 1.0 : 0.2;

            r += nr * weight;
            g += ng * weight;
            b += nb * weight;
            count += weight;
          }
        }

        const outIdx = (y * width + x) * 4;
        output[outIdx] = r / count;
        output[outIdx + 1] = g / count;
        output[outIdx + 2] = b / count;
        output[outIdx + 3] = src[outIdx + 3];
      }
    }
  }

  return new ImageData(output, width, height);
}

/**
 * Applies noise reduction to a canvas element's image data.
 */
export function applyNoiseReductionToCanvas(
  canvas: HTMLCanvasElement,
  strength: NoiseReductionStrength
): void {
  if (strength === 'off') return;
  const passes = STRENGTH_MAP[strength];
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const processed = applyNoiseReduction(imageData, passes);
  ctx.putImageData(processed, 0, 0);
}

/**
 * Applies noise reduction to a Uint8Array of RGBA pixel data.
 */
export function applyNoiseReductionToBytes(
  bytes: Uint8Array,
  width: number,
  height: number,
  strength: NoiseReductionStrength
): Uint8Array {
  if (strength === 'off') return bytes;
  const passes = STRENGTH_MAP[strength];
  const imageData = new ImageData(new Uint8ClampedArray(bytes), width, height);
  const processed = applyNoiseReduction(imageData, passes);
  return new Uint8Array(processed.data.buffer);
}

export interface UseNoiseReductionReturn {
  isEnabled: boolean;
  strength: NoiseReductionStrength;
  setStrength: (s: NoiseReductionStrength) => void;
  toggle: () => void;
  processCanvas: (canvas: HTMLCanvasElement) => void;
  processBytes: (bytes: Uint8Array, width: number, height: number) => Uint8Array;
}

const STORAGE_KEY = 'cameraNoiseReduction';

export function useNoiseReduction(autoEnableForLowLight = false): UseNoiseReductionReturn {
  const [strength, setStrengthState] = useState<NoiseReductionStrength>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['off', 'light', 'strong', 'max'].includes(stored)) {
        return stored as NoiseReductionStrength;
      }
    } catch {}
    return autoEnableForLowLight ? 'strong' : 'off';
  });

  // Auto-enable when low-light mode is active
  useEffect(() => {
    if (autoEnableForLowLight && strength === 'off') {
      setStrengthState('strong');
    }
  }, [autoEnableForLowLight]);

  const setStrength = useCallback((s: NoiseReductionStrength) => {
    setStrengthState(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setStrength(strength === 'off' ? 'strong' : 'off');
  }, [strength, setStrength]);

  const processCanvas = useCallback(
    (canvas: HTMLCanvasElement) => {
      applyNoiseReductionToCanvas(canvas, strength);
    },
    [strength]
  );

  const processBytes = useCallback(
    (bytes: Uint8Array, width: number, height: number) => {
      return applyNoiseReductionToBytes(bytes, width, height, strength);
    },
    [strength]
  );

  return {
    isEnabled: strength !== 'off',
    strength,
    setStrength,
    toggle,
    processCanvas,
    processBytes,
  };
}
