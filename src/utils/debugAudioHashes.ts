export const DEBUG_AUDIO_HASHES_CHANNEL = 'Syncrequest:debug-audio-hashes';

export interface DebugAudioHash {
  hash: number;
  sourceTime: number;
}

export interface DebugAudioHashesMessage {
  eventId?: string;
  chunkIndex: number;
  hashes: DebugAudioHash[];
  hashesGenerated: number;
  rawSamplesLength: number;
  inputSampleRate: number;
  targetSampleRate: number;
  timestamp: number;
}
