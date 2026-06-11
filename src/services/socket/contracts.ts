import type { Song, SongStatus } from '@/types/songs';

export interface SongEventPayload {
  id?: string;
  songId?: string;
  _id?: string;
  title?: string;
  artist?: string;
  voteScore?: number;
  downvoteCount?: number;
  voteCount?: number;
  status?: SongStatus | string;
  totalDuration?: number;
  queuePosition?: number;
  isPremiumSuggestion?: boolean;
  requestedBy?: Song['requestedBy'];
  recognitionMatch?: Song['recognitionMatch'];
  eventId?: string;
  reason?: string;
  startedAt?: string | null;
  playingStartedAt?: string | null;
  startedPlayingAt?: string | null;
  elapsedTime?: number;
  remainingTime?: number;
  albumArt?: string | null;
}

export interface NowPlayingEventPayload extends SongEventPayload {
  timestamp?: string;
}

export interface QueueUpdatedPayload {
  queue?: Song[];
  nowPlaying?: NowPlayingEventPayload | null;
}

export interface VotesUpdatedPayload {
  eventId?: string;
  songId?: string;
  participantId?: string;
  value?: number;
  voteScore?: number;
  downvoteCount?: number;
  voteCount?: number;
  status?: SongStatus | string;
  timestamp?: string;
  affectedSongs?: Array<{
    songId?: string;
    _id?: string;
    id?: string;
    queuePosition?: number;
  }>;
}

export interface NormalizedNowPlaying {
  songId: string;
  title: string;
  artist: string;
  totalDuration?: number;
  startedAt: number;
  elapsedTime?: number;
  remainingTime?: number;
  albumArt?: string | null;
}

export interface ParticipantEventPayload {
  eventId?: string;
  participantId?: string;
  nickname?: string;
  profilePicture?: string | null;
  userId?: string;
}

export interface ParticipantCooldownPayload {
  participantId?: string;
  cooldownUntil?: string | Date;
  reason?: string;
}

export interface ParticipantPremiumPayload {
  participantId?: string;
  isPremium?: boolean;
}

export interface ParticipantUpdatedPayload extends ParticipantEventPayload {
  nickname?: string;
  profilePicture?: string | null;
}

export interface AccessCodeUpdatedPayload {
  eventId?: string;
  accessCode?: string;
}

export interface EventUpdatedPayload {
  event?: unknown;
  eventId?: string;
}

export interface EventEndedPayload {
  eventId?: string;
  reason?: string;
}

export interface SocketErrorPayload {
  message?: string;
  error?: string;
}

export interface AttendeePasswordPromptPayload {
  participantId?: string;
}

export interface PhoneMicrophoneConnectedPayload {
  eventId?: string;
  deviceName?: string;
}

export interface PhoneMicrophoneDisconnectedPayload {
  eventId?: string;
  timestamp?: string;
}

export interface AudioMatchUpdatePayload {
  eventId?: string;
  timestamp?: string;
  matches?: Array<{
    trackId: string;
    title: string;
    artist: string;
    coverUrl?: string | null;
    duration?: number | null;
    offset: number;
    score: number;
  }>;
}

export interface AudioMatchLockedPayload {
  eventId?: string;
  timestamp?: string;
  state?: string;
  candidate?: {
    trackId?: string;
    title?: string;
    artist?: string;
    coverUrl?: string | null;
    duration?: number | null;
    score?: number;
    totalAligned?: number;
    offsetConcentration?: number;
    lockedAt?: number | null;
    queueContext?: {
      hasMatch?: boolean;
      isInQueue?: boolean;
      hasPending?: boolean;
      hasApproved?: boolean;
      hasPlaying?: boolean;
      nextApproved?: NowPlayingEventPayload | null;
      playing?: NowPlayingEventPayload | null;
      approvedCount?: number;
    };
  };
}

export interface AudioMatchChunkPayload {
  sampleRate: number;
  pcm: Float32Array;
}

export interface PhoneAudioStreamPayload {
  eventId: string;
  pcm: number[];
  sampleRate: number;
  timestamp: number;
}

export interface DebugAudioHashesPayload {
  eventId?: string;
  chunkIndex: number;
  hashes: Array<{ hash: number; sourceTime: number }>;
  hashesGenerated: number;
  rawSamplesLength: number;
  inputSampleRate: number;
  targetSampleRate: number;
  timestamp: number;
}

export interface SocketEventPayloads {
  participant_joined: ParticipantEventPayload;
  participant_left: ParticipantEventPayload;
  participant_kicked: ParticipantEventPayload;
  participant_banned: ParticipantEventPayload;
  participant_cooldown: ParticipantCooldownPayload;
  participant_cooldown_set: ParticipantCooldownPayload;
  participant_cooldown_cleared: ParticipantEventPayload;
  participant_premium_updated: ParticipantPremiumPayload;
  participant_updated: ParticipantUpdatedPayload;
  participant_renamed: ParticipantUpdatedPayload;
  participant_profile_changed: ParticipantUpdatedPayload;
  votes_updated: VotesUpdatedPayload;
  song_suggested: SongEventPayload;
  song_approved: SongEventPayload;
  song_now_playing: NowPlayingEventPayload;
  song_rejected: SongEventPayload;
  song_skipped: SongEventPayload;
  queue_updated: QueueUpdatedPayload;
  error: SocketErrorPayload;
  access_code_updated: AccessCodeUpdatedPayload;
  event_updated: EventUpdatedPayload;
  event_ended: EventEndedPayload;
  attendee_password_prompt_requested: AttendeePasswordPromptPayload;
  phone_microphone_connected: PhoneMicrophoneConnectedPayload;
  phone_microphone_disconnected: PhoneMicrophoneDisconnectedPayload;
  audio_match_update: AudioMatchUpdatePayload;
  audio_match_locked: AudioMatchLockedPayload;
  audio_match_released: AudioMatchLockedPayload;
  audio_match_chunk: AudioMatchChunkPayload;
  phone_audio_stream: PhoneAudioStreamPayload;
  debug_audio_hashes: DebugAudioHashesPayload;
}

export type SocketEventName = keyof SocketEventPayloads;

// Listener for audio_match_chunk event - receives raw Float32 PCM from phone microphone
export type AudioMatchChunkListener = (data: AudioMatchChunkPayload) => void;

export type SocketListener<Event extends SocketEventName> = (
  data: SocketEventPayloads[Event],
) => void;
