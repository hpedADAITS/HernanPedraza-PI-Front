import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { t } from '@/i18n';

interface UseMicrophoneReturn {
  isListening: boolean;
  isAccessDenied: boolean;
  isNoSuitableMicFound: boolean;
  stream: MediaStream | null;
  requestMicrophoneAccess: () => Promise<void>;
  stopMicrophone: () => void;
  dismissMicrophoneIssue: () => void;
  error: string | null;
}

type MicrophoneIssue =
  | 'not-supported'
  | 'permission-denied'
  | 'not-found'
  | 'request-failed'
  | null;

export function useMicrophone(isDj: boolean): UseMicrophoneReturn {
  const [isListening, setIsListening] = useState(false);
  const [microphoneIssue, setMicrophoneIssue] =
    useState<MicrophoneIssue>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* Only DJ role can access microphone */
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

  const dismissMicrophoneIssue = useCallback(() => {
    setMicrophoneIssue(null);
    setError(null);
  }, []);

  const hasAudioInputDevice = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return true;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((device) => device.kind === 'audioinput');
  }, []);

  const checkMicrophonePermission = useCallback(async () => {
    if (!navigator.permissions?.query) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      });
      return permission.state;
    } catch {
      return 'prompt';
    }
  }, []);

  const requestMicrophoneAccess = useCallback(async () => {
    /* Only DJ role can request microphone access */
    if (!canAccessMicrophone) {
      const msg = t('Only DJs can access the microphone');
      setError(msg);
      toast.error(msg);
      setMicrophoneIssue('permission-denied');
      return;
    }

    /* Check browser support */
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg =
        t('Microphone access is not supported in your browser. Please use Chrome, Firefox, or Edge.');
      setError(msg);
      toast.error(msg);
      setMicrophoneIssue('not-supported');
      return;
    }

    try {
      setError(null);
      setMicrophoneIssue(null);

      const permissionState = await checkMicrophonePermission();
      if (permissionState === 'denied') {
        const msg =
          t('Microphone permission is blocked. Enable microphone access in your browser settings and try again.');
        setError(msg);
        setMicrophoneIssue('permission-denied');
        toast.error(msg);
        return;
      }

      const hasMicrophone = await hasAudioInputDevice();
      if (!hasMicrophone) {
        const msg =
          t('No suitable microphone was found. Connect or enable a microphone, then try again.');
        setError(msg);
        setMicrophoneIssue('not-found');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsListening(true);
      setMicrophoneIssue(null);
      toast.success(t('Microphone access granted'));
    } catch (err) {
      const issue =
        err instanceof DOMException &&
        ['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError'].includes(
          err.name,
        )
          ? 'not-found'
          : err instanceof DOMException &&
              ['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(
                err.name,
              )
            ? 'permission-denied'
            : 'request-failed';
      const errorMsg =
        issue === 'not-found'
          ? t('No suitable microphone was found. Connect or enable a microphone, then try again.')
          : err instanceof DOMException
          ? t('Microphone access denied: {message}', { message: err.message })
          : t('Failed to access microphone');

      setError(errorMsg);
      setMicrophoneIssue(issue);
      if (issue !== 'not-found') {
        toast.error(errorMsg);
      }
      console.error('Microphone access error:', err);
    }
  }, [canAccessMicrophone, checkMicrophonePermission, hasAudioInputDevice]);

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, [stopMicrophone]);

  return {
    isListening,
    isAccessDenied: microphoneIssue !== null,
    isNoSuitableMicFound: microphoneIssue === 'not-found',
    stream,
    requestMicrophoneAccess,
    stopMicrophone,
    dismissMicrophoneIssue,
    error,
  };
}
