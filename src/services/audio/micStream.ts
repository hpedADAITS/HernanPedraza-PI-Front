import type { Socket } from 'socket.io-client';

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

export async function startAudioMatchStream({
  eventId,
  stream,
  socket,
  onError,
  onDebug,
}: MicStreamOptions) {
  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported in this browser');
  }

  const context = new AudioContextClass();

  try {
    await context.resume();

    if (!context.audioWorklet) {
      throw new Error('AudioWorklet is not supported in this browser');
    }

    const sampleRate = context.sampleRate;
    const workletUrl = '/audio-match-processor.js';

    try {
      await context.audioWorklet.addModule(workletUrl);
    } catch (error) {
      throw new Error(
        `Unable to load AudioWorklet module from ${workletUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    const source = context.createMediaStreamSource(stream);

    const worklet = new AudioWorkletNode(context, 'audio-match-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 0,
      channelCount: 1,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
    });

    socket.emit('audio_match_start', {
      eventId,
      sampleRate,
    });

    worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      try {
        const chunk = event.data;

        socket.emit('audio_match_chunk', {
          eventId,
          sampleRate,
          pcm: chunk.buffer,
        });

        onDebug?.({
          sampleRate,
          inputSamples: chunk.length,
          byteLength: chunk.byteLength,
        });
      } catch (error) {
        onError?.(
          error instanceof Error ? error : new Error('Audio stream failed')
        );
      }
    };

    source.connect(worklet);

    return () => {
      worklet.port.onmessage = null;

      source.disconnect();
      worklet.disconnect();

      socket.emit('audio_match_stop', { eventId });

      for (const track of stream.getTracks()) {
        track.stop();
      }

      void context.close();
    };
  } catch (error) {
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