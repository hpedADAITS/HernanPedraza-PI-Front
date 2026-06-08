import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { eventsAPI } from '@/services/api';
import { startAudioMatchStream } from '@/services/audio/micStream';
import { disconnectSocket, initSocket } from '@/services/socket/connection';
import { t } from '@/i18n';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed';

function canRequestMicrophone() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

function getMicrophoneSupportError() {
  if (window.isSecureContext === false) {
    return t('Microphone access requires HTTPS on phones. Use an HTTPS URL, or localhost during development.');
  }

  if (!canRequestMicrophone()) {
    return t('Microphone access is not available in this browser.');
  }

  return null;
}

function getMicrophoneErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return error instanceof Error
      ? error.message
      : t('Unable to connect this phone microphone.');
  }

  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(error.name)) {
    return t('Microphone permission was blocked. Allow microphone access in the browser and try again.');
  }

  if (['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError'].includes(error.name)) {
    return t('No microphone was found on this phone.');
  }

  if (error.name === 'NotReadableError') {
    return t('The microphone is already in use by another app or browser tab.');
  }

  return error.message || t('Unable to connect this phone microphone.');
}

function getPhoneDeviceName() {
  const platform = navigator.userAgent.includes('iPhone')
    ? t('iPhone microphone')
    : navigator.userAgent.includes('Android')
      ? t('Android microphone')
      : t('Phone microphone');

  return platform;
}

/* Read a phone-microphone token from the URL hash. The token is delivered
   in the fragment (not the query string) so it is not sent to the server,
   not recorded in access logs, and not leaked through the Referer header. */
function readPhoneMicrophoneTokenFromHash(hash: string) {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  return params.get('token') || '';
}

export function PhoneMicrophone() {
  const { eventId = '' } = useParams();
  const { hash } = useLocation();
  const streamRef = useRef<MediaStream | null>(null);
  const stopAudioMatchRef = useRef<null | (() => void)>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('idle');
  const [error, setError] = useState('');
  const [bestMatch, setBestMatch] = useState('');

  const stopActiveStream = useCallback(() => {
    stopAudioMatchRef.current?.();
    stopAudioMatchRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    disconnectSocket();
  }, []);

  const stopMicrophone = () => {
    stopActiveStream();
    setConnectionState('idle');
  };

  const connectMicrophone = async () => {
    if (!eventId) {
      setError(t('Microphone link is missing the event id.'));
      setConnectionState('failed');
      return;
    }

    const token = readPhoneMicrophoneTokenFromHash(hash);
    if (!token) {
      setError(t('This microphone link is missing its security token.'));
      setConnectionState('failed');
      return;
    }

    try {
      setError('');
      setConnectionState('connecting');

      const supportError = getMicrophoneSupportError();
      if (supportError) {
        throw new Error(supportError);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      streamRef.current = stream;
      await eventsAPI.connectPhoneMicrophone(eventId, getPhoneDeviceName(), token);
      const socket = initSocket(token);
      socket.on('audio_match_update', (payload) => {
        const match = payload?.matches?.[0];
        setBestMatch(match ? `${match.title} - ${match.artist}` : '');
      });
      socket.on('audio_match_locked', (payload) => {
        const match = payload?.candidate;
        setBestMatch(match ? `${match.title} - ${match.artist}` : '');
      });
      stopAudioMatchRef.current = await startAudioMatchStream({
        eventId,
        stream,
        socket,
        onError: (streamError) => setError(streamError.message),
      });
      setConnectionState('connected');
    } catch (err) {
      stopMicrophone();
      setConnectionState('failed');
      setError(getMicrophoneErrorMessage(err));
    }
  };

  useEffect(() => {
    return stopActiveStream;
  }, [stopActiveStream]);

  const isConnected = connectionState === 'connected';

  return (
    <Layout theme="white" showNav={false} className="min-h-screen p-6">
      <main className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center text-center">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-blue-600 text-white shadow-lg">
          {isConnected ? (
            <Mic className="h-9 w-9" />
          ) : (
            <MicOff className="h-9 w-9" />
          )}
        </div>

        <h1 className="text-3xl font-black tracking-normal text-slate-950">
          {t('Phone microphone')}
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
          {t('Connect this phone so the DJ dashboard can see it as the active remote microphone.')}
        </p>

        <button
          type="button"
          onClick={isConnected ? stopMicrophone : connectMicrophone}
          disabled={connectionState === 'connecting'}
          className={`mt-8 h-12 w-full rounded-xl px-5 text-sm font-bold text-white shadow-md transition ${
            isConnected
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-600 hover:bg-blue-700'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {connectionState === 'connecting'
            ? t('Connecting...')
            : isConnected
              ? t('Disconnect phone mic')
              : t('Connect phone mic')}
        </button>

        {connectionState === 'connected' && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {bestMatch || t('Connected. Listening for a reference-track match.')}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </main>
    </Layout>
  );
}
