import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseMicrophoneReturn {
  isListening: boolean;
  isAccessDenied: boolean;
  stream: MediaStream | null;
  requestMicrophoneAccess: () => Promise<void>;
  stopMicrophone: () => void;
  error: string | null;
}

export function useMicrophone(isDj: boolean): UseMicrophoneReturn {
  const [isListening, setIsListening] = useState(false);
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Only DJ role can access microphone
  const canAccessMicrophone = isDj;

  const stopMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
      setIsListening(false);
    }
  }, []);

  const requestMicrophoneAccess = useCallback(async () => {
    // Only DJ role can request microphone access
    if (!canAccessMicrophone) {
      const msg = 'Only DJs can access the microphone';
      setError(msg);
      toast.error(msg);
      setIsAccessDenied(true);
      return;
    }

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg =
        'Microphone access is not supported in your browser. Please use Chrome, Firefox, or Edge.';
      setError(msg);
      toast.error(msg);
      setIsAccessDenied(true);
      return;
    }

    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsListening(true);
      setIsAccessDenied(false);
      toast.success('Microphone access granted');
    } catch (err) {
      const errorMsg =
        err instanceof DOMException
          ? `Microphone access denied: ${err.message}`
          : 'Failed to access microphone';

      setError(errorMsg);
      setIsAccessDenied(true);
      toast.error(errorMsg);
      console.error('Microphone access error:', err);
    }
  }, [canAccessMicrophone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, [stopMicrophone]);

  return {
    isListening,
    isAccessDenied,
    stream,
    requestMicrophoneAccess,
    stopMicrophone,
    error,
  };
}
