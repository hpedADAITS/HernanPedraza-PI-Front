import { readStoredJson, removeStoredItem, writeStoredJson } from '@/utils/storage';
import { getToken } from '@/services/api/client';

export interface StoredEvent {
  _id?: string;
  id?: string;
  eventId?: string;
  eventCode?: string;
  ownerName?: string;
  accessCode?: string;
  ownerProfilePicture?: string | null;
  settings?: {
    votingEnabled?: boolean;
    allowDownvotes?: boolean;
  };
}

export interface StoredParticipant {
  _id?: string;
  id?: string;
  nickname?: string;
  eventId?: string;
  profilePicture?: string | null;
  passwordProtected?: boolean;
  cooldownUntil?: string | Date | null;
  cooldownReason?: string | null;
}

export interface StoredUser {
  _id?: string;
  id?: string;
  displayName?: string;
  email?: string;
  role?: string;
  profilePicture?: string | null;
  hasSeenTutorial?: boolean;
  emailRegistered?: boolean;
}

export function getAuthToken() {
  return getToken();
}

export function getStoredEvent() {
  return readStoredJson<StoredEvent>('currentEvent');
}

export function getStoredEventId() {
  const event = getStoredEvent();
  return event?.eventId ?? event?._id ?? event?.id ?? null;
}

export function setStoredEvent(event: StoredEvent) {
  writeStoredJson('currentEvent', event);
}

export function clearStoredEvent() {
  removeStoredItem('currentEvent');
}

export function getStoredParticipant() {
  return readStoredJson<StoredParticipant>('currentParticipant');
}

export function getStoredParticipantId() {
  const participant = getStoredParticipant();
  return participant?._id ?? participant?.id ?? null;
}

export function setStoredParticipant(participant: StoredParticipant) {
  writeStoredJson('currentParticipant', participant);
}

export function clearStoredParticipant() {
  removeStoredItem('currentParticipant');
}

export function getStoredUser() {
  return readStoredJson<StoredUser>('user');
}

export function setStoredUser(user: StoredUser) {
  writeStoredJson('user', user);
}

export function clearStoredUser() {
  removeStoredItem('user');
}

export function getStoredDjUserId() {
  const user = getStoredUser();
  if (!isDjRole(user?.role)) return null;
  return user?._id ?? user?.id ?? null;
}

export function isDjRole(role: unknown): boolean {
  if (typeof role !== 'string') return false;
  const normalized = role.trim().toLowerCase();
  return normalized === 'dj';
}
