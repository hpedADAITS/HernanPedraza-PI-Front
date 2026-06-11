import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { eventsAPI } from '@/services/api';
import { startAudioMatchStream } from '@/services/audio/micStream';
import { disconnectSocket, initSocket } from '@/services/socket/connection';
import { DEBUG_AUDIO_HASHES_CHANNEL } from '@/utils/debugAudioHashes';
import { t } from '@/i18n';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed';
type MatchCandidate = {
  trackId?: string;
  title?: string;
  artist?: string;
  score?: number;
  totalAligned?: number;
  offset?: number;
  offsetConcentration?: number;
  queueContext?: {
    hasPlaying?: boolean;
    hasApproved?: boolean;
    suggestedAction?: string;
  };
};
type MatchDebug = {
  event: string;
  state: string;
  track: string;
  score: string;
  offset: string;
  queue: string;
  pcm: string;
  ts: string;
  phones: string;
};

const EMPTY_DEBUG: MatchDebug = {
  event: 'idle',
  state: 'idle',
  track: '-',
  score: '-',
  offset: '-',
  queue: '-',
  pcm: '-',
  ts: '-',
  phones: '0',
};

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

function candidateLabel(candidate?: MatchCandidate | null) {
  if (!candidate) return '-';
  return `${candidate.title || '?'} / ${candidate.artist || '?'} [${candidate.trackId || '?'}]`;
}

function scoreLabel(candidate?: MatchCandidate | null) {
  if (!candidate) return '-';
  const concentration = Number.isFinite(candidate.offsetConcentration)
    ? ` c=${candidate.offsetConcentration?.toFixed(2)}`
    : '';
  return `s=${candidate.score ?? '-'} a=${candidate.totalAligned ?? '-'}${concentration}`;
}

function queueLabel(candidate?: MatchCandidate | null) {
  const context = candidate?.queueContext;
  if (!context) return '-';
  return `${context.suggestedAction || '-'} p=${Number(Boolean(context.hasPlaying))} a=${Number(Boolean(context.hasApproved))}`;
}

export function PhoneMicrophone() {
  const { eventId = '' } = useParams();
  const { hash } = useLocation();
  const streamRef = useRef<MediaStream | null>(null);
  const stopAudioMatchRef = useRef<null | (() => void)>(null);
  const stopPhoneListenerRef = useRef<null | (() => void)>(null);
  const hashChannelRef = useRef<BroadcastChannel | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('idle');
  const [error, setError] = useState('');
  const [bestMatch, setBestMatch] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [debug, setDebug] = useState<MatchDebug>(EMPTY_DEBUG);

  const stopActiveStream = useCallback(() => {
    stopAudioMatchRef.current?.();
    stopAudioMatchRef.current = null;
    stopPhoneListenerRef.current?.();
    stopPhoneListenerRef.current = null;
    if (hashChannelRef.current) {
      hashChannelRef.current.close();
      hashChannelRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    disconnectSocket();
    setDebug(EMPTY_DEBUG);
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
      const microphone = await eventsAPI.connectPhoneMicrophone(eventId, getPhoneDeviceName(), token);
      const audioEventId = microphone.eventId || eventId;
      const socket = initSocket(token);
      setDebug((current) => ({
        ...current,
        event: audioEventId,
        state: 'connecting',
        ts: new Date().toLocaleTimeString(),
      }));
      const updateDebug = (
        payload: {
          eventId?: string;
          state?: string;
          candidate?: MatchCandidate | null;
          matches?: MatchCandidate[];
          reason?: string;
          trackId?: string;
        } = {},
      ) => {
        const candidate = payload.candidate || payload.matches?.[0] || null;
        setDebug((current) => ({
          ...current,
          event: payload.eventId || audioEventId,
          state: payload.state || payload.reason || current.state,
          track: candidate ? candidateLabel(candidate) : (payload.trackId || '-'),
          score: scoreLabel(candidate),
          offset: candidate ? String(candidate.offset ?? '-') : '-',
          queue: queueLabel(candidate),
          ts: new Date().toLocaleTimeString(),
        }));
      };
      socket.on('audio_match_update', (payload) => {
        const match = payload?.matches?.[0];
        setBestMatch(match ? `${match.title} - ${match.artist}` : '');
        updateDebug(payload);
      });
      socket.on('audio_match_candidate', (payload) => updateDebug(payload));
      socket.on('audio_match_hold', (payload) => updateDebug(payload));
      socket.on('audio_match_hold_updated', (payload) => updateDebug(payload));
      socket.on('audio_match_locked', (payload) => {
        const match = payload?.candidate;
        setBestMatch(match ? `${match.title} - ${match.artist}` : '');
        updateDebug(payload);
      });
      socket.on('audio_match_released', (payload) => updateDebug(payload));
      socket.on('audio_match_idle', (payload) => updateDebug(payload));
      socket.on('audio_match_queue_updated', (payload) => updateDebug(payload));
      if (typeof BroadcastChannel !== 'undefined' && !hashChannelRef.current) {
        hashChannelRef.current = new BroadcastChannel(DEBUG_AUDIO_HASHES_CHANNEL);
        socket.on('debug_audio_hashes', (payload) => {
          hashChannelRef.current?.postMessage(payload);
        });
      }
      stopAudioMatchRef.current = await startAudioMatchStream({
        eventId: audioEventId,
        stream,
        socket,
        onError: (streamError) => setError(streamError.message),
        onDebug: (streamDebug) => {
          setDebug((current) => ({
            ...current,
            event: streamDebug.eventId || current.event,
            state: streamDebug.state || current.state,
            pcm: streamDebug.inputSamples == null || streamDebug.byteLength == null
              ? current.pcm
              : `${streamDebug.inputSamples}@${streamDebug.sampleRate} ${streamDebug.byteLength}b`,
            ts: new Date().toLocaleTimeString(),
          }));
        },
      });

      const phonesToDebugLine = (phoneList: Array<{ phoneId: string; deviceName: string; connectedAt: string }>) =>
        phoneList.length === 0 ? '0' : phoneList.map((p) => p.deviceName).join(', ');

      const handlePhoneRoster = (payload: { eventId?: string; phones?: Array<{ phoneId: string; deviceName: string; connectedAt: string }>; timestamp?: string }) => {
        if (payload.eventId && payload.eventId !== audioEventId) return;
        setDebug((current) => ({
          ...current,
          phones: phonesToDebugLine(payload.phones || []),
          ts: new Date().toLocaleTimeString(),
        }));
      };

      socket.on('phone_microphone_roster', handlePhoneRoster);
      stopPhoneListenerRef.current = () => socket.off('phone_microphone_roster', handlePhoneRoster);

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

        <button
          type="button"
          onClick={() => setShowDebug((value) => !value)}
          className="mt-4 h-8 rounded border border-slate-300 bg-slate-950 px-3 font-mono text-xs text-lime-300"
        >
          dbg
        </button>

        {showDebug && (
          <pre className="mt-2 w-full overflow-x-auto rounded border border-slate-800 bg-black p-3 text-left font-mono text-[11px] leading-5 text-lime-300">
{`event ${debug.event}
state ${debug.state}
track ${debug.track}
score ${debug.score}
off   ${debug.offset}
queue ${debug.queue}
pcm   ${debug.pcm}
phones ${debug.phones}
time  ${debug.ts}`}
          </pre>
        )}
      </main>
    </Layout>
  );
}
