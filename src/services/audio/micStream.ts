import type { Socket } from 'socket.io-client';

interface MicStreamOptions {
  eventId: string;
  stream: MediaStream;
  socket: Socket;
  onError?: (error: Error) => void;
}

export async function startAudioMatchStream({
  eventId,
  stream,
  socket,
  onError,
}: MicStreamOptions) {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const context = new AudioContextClass();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);

  await context.resume();
  socket.emit('audio_match_start', { eventId, sampleRate: context.sampleRate });

  processor.onaudioprocess = (event) => {
    try {
      const input = event.inputBuffer.getChannelData(0);
      const chunk = new Float32Array(input.length);
      chunk.set(input);
      socket.emit('audio_match_chunk', chunk.buffer);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Audio stream failed'));
    }
  };

  source.connect(processor);
  processor.connect(context.destination);

  return () => {
    processor.disconnect();
    source.disconnect();
    socket.emit('audio_match_stop', { eventId });
    void context.close();
  };
}
