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
  const [cooldownState, setCooldownState] = useState<{
    participantId: string | null;
    until: Date | null;
  }>({ participantId, until: null });
  const [now, setNow] = useState(() => Date.now());

  if (cooldownState.participantId !== participantId) {
    setCooldownState({ participantId, until: null });
  }

  const cooldownUntil =
    enabled && cooldownState.until && cooldownState.until.getTime() > now
      ? cooldownState.until
      : null;
  const remainingMs = useMemo(
    () => Math.max(0, (cooldownUntil?.getTime() ?? 0) - now),
    [cooldownUntil, now],
  );

  useEffect(() => {
    if (!enabled || !participantId) return;

    let active = true;
    participantsAPI.getParticipant(participantId)
      .then((participant) => {
        if (active) {
          setCooldownState({ participantId, until: parseCooldown(participant?.cooldownUntil) });
        }
      })
      .catch(() => {});

    const socket = getSocket();
    const handleCooldown = (payload: ParticipantCooldownPayload) => {
      if (payload.participantId === participantId) {
        setCooldownState({ participantId, until: parseCooldown(payload.cooldownUntil) });
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

  return { cooldownUntil, isCoolingDown: remainingMs > 0, remainingMs };
}
