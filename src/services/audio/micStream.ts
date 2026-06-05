import type { Socket } from 'socket.io-client';

const AUDIO_MATCH_PROCESSOR_NAME = 'audio-match-processor';
const TARGET_SAMPLE_RATE = 32000;

function resampleLinear(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.round(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const sourceIndex = i * ratio;
    const index = Math.floor(sourceIndex);
    const fraction = sourceIndex - index;
    const a = input[index];
    const b = index + 1 < input.length ? input[index + 1] : a;
    output[i] = a + (b - a) * fraction;
  }
  return output;
}

interface MicStreamOptions {
  eventId: string;
  stream: MediaStream;
  socket: Socket;
  onError?: (error: Error) => void;
  onDebug?: (data: {
    sampleRate: number;
    inputSamples: number;
    byteLength: number;
  }) => void;
}

type WebkitAudioWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

export async function startAudioMatchStream({
  eventId,
  stream,
  socket,
  onError,
  onDebug,
}: MicStreamOptions): Promise<() => void> {
  const AudioContextClass =
    window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser');
  }

  const context = new AudioContextClass();

  let source: MediaStreamAudioSourceNode | null = null;
  let worklet: AudioWorkletNode | null = null;
  let muteGain: GainNode | null = null;
  let stopped = false;

  try {
    await context.resume();

    if (!context.audioWorklet) {
      throw new Error('AudioWorklet is not supported in this browser');
    }

    const sampleRate = context.sampleRate;

    // Load processor from public/ directory for reliable Vite/Render serving
    const workletUrl = new URL('/audio/audio-match-processor.js', window.location.origin);

    console.log('[micStream] Loading AudioWorklet from:', workletUrl.href);

    await context.audioWorklet.addModule(workletUrl.href);

    console.log('[micStream] AudioWorklet loaded successfully');

    source = context.createMediaStreamSource(stream);

    worklet = new AudioWorkletNode(context, AUDIO_MATCH_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      outputChannelCount: [1],
    });

    muteGain = context.createGain();
    muteGain.gain.value = 0;

    worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      try {
        if (stopped) return;

        const chunk = event.data;

        // Resample to 32kHz for efficient fingerprinting
        const resampled = resampleLinear(chunk, sampleRate, TARGET_SAMPLE_RATE);

        socket.emit('audio_match_chunk', {
          eventId,
          sampleRate: TARGET_SAMPLE_RATE,
          pcm: resampled.buffer,
        });

        onDebug?.({
          sampleRate: TARGET_SAMPLE_RATE,
          inputSamples: resampled.length,
          byteLength: resampled.byteLength,
        });
      } catch (error) {
        onError?.(
          error instanceof Error ? error : new Error('Audio stream failed'),
        );
      }
    };

    source.connect(worklet);
    worklet.connect(muteGain);
    muteGain.connect(context.destination);

    socket.emit('audio_match_start', {
      eventId,
      sampleRate,
    });

    return () => {
      stopped = true;

      worklet?.port.close();
      worklet?.disconnect();
      muteGain?.disconnect();
      source?.disconnect();

      socket.emit('audio_match_stop', { eventId });

      for (const track of stream.getTracks()) {
        track.stop();
      }

      void context.close();
    };
  } catch (error) {
    stopped = true;

    worklet?.port.close();
    worklet?.disconnect();
    muteGain?.disconnect();
    source?.disconnect();

    for (const track of stream.getTracks()) {
      track.stop();
    }

    void context.close();

    const normalizedError =
      error instanceof Error ? error : new Error(String(error));

    onError?.(normalizedError);

    throw normalizedError;
  }
}
