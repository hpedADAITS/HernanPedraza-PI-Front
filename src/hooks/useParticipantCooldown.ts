import { useEffect, useMemo, useState } from 'react';
import { participantsAPI } from '@/services/api';
import { getSocket } from '@/services/socket';
import type { ParticipantCooldownPayload } from '@/services/socket/contracts';

function parseCooldown(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) || date.getTime() <= Date.now() ? null : date;
}

export function useParticipantCooldown(participantId: string | null, enabled = true) {
  const [cooldownUntil, setCooldownUntil] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());
  const remainingMs = useMemo(
    () => Math.max(0, (cooldownUntil?.getTime() ?? 0) - now),
    [cooldownUntil, now],
  );

  useEffect(() => {
    if (!enabled || !participantId) {
      setCooldownUntil(null);
      return;
    }

    let active = true;
    participantsAPI.getParticipant(participantId)
      .then((participant) => {
        if (active) setCooldownUntil(parseCooldown(participant?.cooldownUntil));
      })
      .catch(() => {});

    const socket = getSocket();
    const handleCooldown = (payload: ParticipantCooldownPayload) => {
      if (payload.participantId === participantId) {
        setCooldownUntil(parseCooldown(payload.cooldownUntil));
      }
    };

    socket?.on('participant_cooldown', handleCooldown);
    return () => {
      active = false;
      socket?.off('participant_cooldown', handleCooldown);
    };
  }, [enabled, participantId]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    if (cooldownUntil && remainingMs <= 0) setCooldownUntil(null);
  }, [cooldownUntil, remainingMs]);

  return { cooldownUntil, isCoolingDown: remainingMs > 0, remainingMs };
}
