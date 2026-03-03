import { useCallback, useEffect, useRef, useState } from "react";

export interface UseCountdownTimerReturn {
  isActive: boolean;
  remainingSeconds: number;
  start: (duration: number, onComplete: () => void) => void;
  cancel: () => void;
}

export function useCountdownTimer(): UseCountdownTimerReturn {
  const [isActive, setIsActive] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setRemainingSeconds(0);
    onCompleteRef.current = null;
  }, []);

  const start = useCallback(
    (duration: number, onComplete: () => void) => {
      if (duration <= 0) {
        onComplete();
        return;
      }
      cancel();
      onCompleteRef.current = onComplete;
      setRemainingSeconds(duration);
      setIsActive(true);

      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setIsActive(false);
            onCompleteRef.current?.();
            onCompleteRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [cancel],
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { isActive, remainingSeconds, start, cancel };
}
