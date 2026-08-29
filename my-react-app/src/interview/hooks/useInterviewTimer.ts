import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseInterviewTimerReturn {
  timeRemaining: number; // seconds
  isExpired: boolean;
  isRunning: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (durationMinutes: number) => void;
}

export function useInterviewTimer(
  durationMinutes: number,
  onExpired?: () => void
): UseInterviewTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpiredRef = useRef(onExpired);

  // Keep callback ref current
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onExpiredRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const reset = useCallback((minutes: number) => {
    setIsRunning(false);
    setTimeRemaining(minutes * 60);
  }, []);

  const isExpired = timeRemaining <= 0;

  const formattedTime = (() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  })();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isExpired,
    isRunning,
    formattedTime,
    start,
    pause,
    resume,
    reset,
  };
}
