export const COOLDOWN_OPTIONS = [
  { label: '1m', valueMs: 60_000 },
  { label: '5m', valueMs: 300_000 },
  { label: '15m', valueMs: 900_000 },
  { label: '1h', valueMs: 3_600_000 },
] as const;

export const DEFAULT_COOLDOWN_MS: number = COOLDOWN_OPTIONS[1].valueMs;

export function formatCooldownDuration(durationMs: number) {
  const minutes = Math.round(durationMs / 60_000);
  return minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`;
}

export function formatCooldownRemaining(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s` : `${m}m ${s.toString().padStart(2, '0')}s`;
}
