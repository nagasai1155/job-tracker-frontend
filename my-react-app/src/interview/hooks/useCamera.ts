import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseCameraReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hasPermission: boolean;
  isRequesting: boolean;
  requestPermission: () => Promise<void>;
  stopStream: () => void;
  error: string | null;
}

export function useCamera(): UseCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasPermission(false);
  }, []);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: true,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      const errMsg =
        err.name === 'NotAllowedError'
          ? 'Camera/microphone access denied. Please allow access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera or microphone found. Please connect a device.'
          : `Failed to access camera: ${err.message || 'Unknown error'}`;
      setError(errMsg);
      setHasPermission(false);
    } finally {
      setIsRequesting(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    stream,
    videoRef,
    hasPermission,
    isRequesting,
    requestPermission,
    stopStream,
    error,
  };
}
