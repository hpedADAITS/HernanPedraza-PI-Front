import React, { useMemo, useState } from 'react';
import { Bug, X } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { isDebugModeEnabled } from '@/utils/debugMode';
import { readStoredJson } from '@/utils/storage';

type DebugTrigger = 'queue' | 'playing' | 'rejected' | 'skipped';

const DEBUG_EVENT_NAME = 'syncrekuest:debug-song-event';
const COOLDOWN_MS = 5000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEventId() {
  const event = readStoredJson<{ eventId?: string; _id?: string }>('currentEvent');
  return event?.eventId || event?._id || 'debug-event';
}

function dispatchDebugSongEvent(type: string, payload: Record<string, any>) {
  window.dispatchEvent(
    new CustomEvent(DEBUG_EVENT_NAME, {
      detail: {
        type,
        payload: {
          ...payload,
          timestamp: new Date().toISOString(),
        },
      },
    }),
  );
}

export function SongCardDebugModal() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<Record<DebugTrigger, boolean>>({
    queue: true,
    playing: true,
    rejected: true,
    skipped: false,
  });

  const ids = useMemo(() => {
    const stamp = Date.now();
    return {
      play: `debug-play-${stamp}`,
      rejected: `debug-reject-${stamp}`,
      skipped: `debug-skip-${stamp}`,
    };
  }, [open]);

  if (!isDebugModeEnabled()) return null;

  const updateSelected = (trigger: DebugTrigger) => {
    setSelected((current) => ({
      ...current,
      [trigger]: !current[trigger],
    }));
  };

  const runSelected = async () => {
    const eventId = getEventId();
    const playSong = {
      _id: ids.play,
      title: 'Debug Stretch Song',
      artist: 'Debug Console',
      voteScore: 9,
      status: 'QUEUED',
      duration: 205,
      queuePosition: 1,
      requestedBy: { _id: 'debug-attendee', nickname: 'Debug Attendee' },
    };
    const rejectedSong = {
      _id: ids.rejected,
      title: 'Debug Rejected Song',
      artist: 'Vote Test',
      voteScore: -5,
      status: 'QUEUED',
      duration: 188,
      queuePosition: 2,
      requestedBy: { _id: 'debug-attendee', nickname: 'Debug Attendee' },
    };
    const skippedSong = {
      _id: ids.skipped,
      title: 'Debug Skipped Song',
      artist: 'DJ Test',
      voteScore: 2,
      status: 'QUEUED',
      duration: 171,
      queuePosition: 3,
      requestedBy: { _id: 'debug-attendee', nickname: 'Debug Attendee' },
    };

    const steps: Array<{
      key: DebugTrigger;
      label: string;
      run: () => void;
    }> = [
      {
        key: 'queue',
        label: 'Queue updated',
        run: () =>
          dispatchDebugSongEvent('queue_updated', {
            eventId,
            queue: [playSong, rejectedSong, skippedSong],
          }),
      },
      {
        key: 'playing',
        label: 'Song now playing',
        run: () =>
          dispatchDebugSongEvent('song_now_playing', {
            eventId,
            songId: ids.play,
            title: playSong.title,
            artist: playSong.artist,
            duration: playSong.duration,
            playingStartedAt: new Date().toISOString(),
          }),
      },
      {
        key: 'rejected',
        label: 'Song rejected',
        run: () =>
          dispatchDebugSongEvent('song_rejected', {
            eventId,
            songId: ids.rejected,
            reason: 'Rejected by votes',
          }),
      },
      {
        key: 'skipped',
        label: 'Song skipped',
        run: () =>
          dispatchDebugSongEvent('song_skipped', {
            eventId,
            songId: ids.skipped,
            reason: 'Skipped by DJ',
          }),
      },
    ].filter((step) => selected[step.key]);

    if (steps.length === 0) {
      toast.info('Select at least one debug trigger');
      return;
    }

    setRunning(true);
    try {
      for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        step.run();
        toast.info(`Debug trigger: ${step.label}`);
        if (index < steps.length - 1) await wait(COOLDOWN_MS);
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[1200] flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl hover:bg-slate-800"
        aria-label="Open debug song card modal"
      >
        <Bug size={18} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-300 bg-white p-4 text-slate-900 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Debug Song Card
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close debug song card modal"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-2">
              {(
                [
                  ['queue', 'Queue updated / stretch card'],
                  ['playing', 'Now playing / confetti'],
                  ['rejected', 'Rejected / falling clone'],
                  ['skipped', 'Skipped / falling clone'],
                ] as Array<[DebugTrigger, string]>
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded border border-slate-200 p-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected[key]}
                    onChange={() => updateSelected(key)}
                    className="h-4 w-4"
                    disabled={running}
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">5s between triggers</span>
              <button
                type="button"
                onClick={runSelected}
                disabled={running}
                className={clsx(
                  'rounded px-3 py-2 text-sm font-semibold text-white',
                  running
                    ? 'cursor-wait bg-slate-400'
                    : 'bg-slate-950 hover:bg-slate-800',
                )}
              >
                {running ? 'Running…' : 'Run selected'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { DEBUG_EVENT_NAME };
