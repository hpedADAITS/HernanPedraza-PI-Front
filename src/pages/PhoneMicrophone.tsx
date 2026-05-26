import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { eventsAPI } from '@/services/api';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed';

function canRequestMicrophone() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

function getMicrophoneSupportError() {
  if (window.isSecureContext === false) {
    return 'Microphone access requires HTTPS on phones. Use an HTTPS URL, or localhost during development.';
  }

  if (!canRequestMicrophone()) {
    return 'Microphone access is not available in this browser.';
  }

  return null;
}

function getMicrophoneErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return error instanceof Error
      ? error.message
      : 'Unable to connect this phone microphone.';
  }

  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(error.name)) {
    return 'Microphone permission was blocked. Allow microphone access in the browser and try again.';
  }

  if (['NotFoundError', 'DevicesNotFoundError', 'OverconstrainedError'].includes(error.name)) {
    return 'No microphone was found on this phone.';
  }

  if (error.name === 'NotReadableError') {
    return 'The microphone is already in use by another app or browser tab.';
  }

  return error.message || 'Unable to connect this phone microphone.';
}

function getPhoneDeviceName() {
  const platform = navigator.userAgent.includes('iPhone')
    ? 'iPhone microphone'
    : navigator.userAgent.includes('Android')
      ? 'Android microphone'
      : 'Phone microphone';

  return platform;
}

export function PhoneMicrophone() {
  const { eventId = '' } = useParams();
  const streamRef = useRef<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('idle');
  const [error, setError] = useState('');

  const stopMicrophone = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setConnectionState('idle');
  };

  const connectMicrophone = async () => {
    if (!eventId) {
      setError('Microphone link is missing the event id.');
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
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      streamRef.current = stream;
      await eventsAPI.connectPhoneMicrophone(eventId, getPhoneDeviceName());
      setConnectionState('connected');
    } catch (err) {
      stopMicrophone();
      setConnectionState('failed');
      setError(getMicrophoneErrorMessage(err));
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
          Phone microphone
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
          Connect this phone so the DJ dashboard can see it as the active remote
          microphone.
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
            ? 'Connecting...'
            : isConnected
              ? 'Disconnect phone mic'
              : 'Connect phone mic'}
        </button>

        {connectionState === 'connected' && (
          <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            Connected. Keep this page open while using the phone microphone.
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
