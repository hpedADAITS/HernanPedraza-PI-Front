import React, { useMemo, useState } from 'react';
import { Bug, ExternalLink, KeyRound, X } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { isDebugModeEnabled } from '@/utils/debugMode';
import { readStoredJson } from '@/utils/storage';
import { authAPI } from '@/services/api';

type DebugTrigger = 'queue' | 'playing' | 'rejected' | 'skipped';

const DEBUG_EVENT_NAME = 'syncrekuest:debug-song-event';
const COOLDOWN_MS = 5000;

interface DebugAccount {
  id: string;
  email: string;
  password: string;
  displayName: string;
  role: 'DJ' | 'ATTENDEE';
  emailRegistered: boolean;
  token: string;
}

interface DebugAccountsResult {
  createdAt: string;
  validatedAgainstMongo: boolean;
  event?: {
    id: string;
    name: string;
    eventId: string;
    accessCode: string;
    state: string;
    ownerId: string;
    ownerName: string;
  };
  attendeeLogin?: {
    nickname: string;
    accessCode: string;
    password: string;
    participantId: string;
  };
  accounts: DebugAccount[];
}

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

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function writeDebugWindow(target: Window, body: string) {
  target.document.open();
  target.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Debug Mock Accounts</title>
        <style>
          :root {
            color-scheme: light;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f8fafc;
            color: #0f172a;
          }
          body {
            margin: 0;
            padding: 28px;
          }
          main {
            max-width: 860px;
            margin: 0 auto;
          }
          h1 {
            margin: 0 0 8px;
            font-size: 24px;
            line-height: 1.2;
          }
          .meta {
            margin: 0 0 20px;
            color: #475569;
            font-size: 14px;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 14px;
          }
          .card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            background: white;
            padding: 16px;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
          }
          .role {
            display: inline-flex;
            margin-bottom: 12px;
            border-radius: 999px;
            background: #0f172a;
            color: white;
            padding: 4px 9px;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
          }
          dl {
            margin: 0;
            display: grid;
            gap: 10px;
          }
          dt {
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          dd {
            margin: 3px 0 0;
            overflow-wrap: anywhere;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
            font-size: 13px;
          }
          .status {
            color: #166534;
            font-weight: 700;
          }
          .login {
            border: 1px solid #86efac;
            border-radius: 8px;
            background: #f0fdf4;
            margin-bottom: 16px;
            padding: 16px;
          }
        </style>
      </head>
      <body>
        <main>${body}</main>
      </body>
    </html>`);
  target.document.close();
}

function renderAccountsWindow(result: DebugAccountsResult) {
  return `
    <h1>Debug Mock Accounts</h1>
    <p class="meta">
      Created ${escapeHtml(result.createdAt)}.
      <span class="status">Validated against MongoDB: ${result.validatedAgainstMongo ? 'yes' : 'no'}</span>
    </p>
    ${
      result.attendeeLogin && result.event
        ? `
          <section class="login">
            <span class="role">ATTENDEE GUI LOGIN</span>
            <dl>
              <div>
                <dt>Nickname</dt>
                <dd>${escapeHtml(result.attendeeLogin.nickname)}</dd>
              </div>
              <div>
                <dt>Access Code</dt>
                <dd>${escapeHtml(result.attendeeLogin.accessCode)}</dd>
              </div>
              <div>
                <dt>Nickname Password</dt>
                <dd>${escapeHtml(result.attendeeLogin.password)}</dd>
              </div>
              <div>
                <dt>Mock Event</dt>
                <dd>${escapeHtml(result.event.name)} (${escapeHtml(result.event.state)})</dd>
              </div>
              <div>
                <dt>DJ</dt>
                <dd>${escapeHtml(result.event.ownerName)}</dd>
              </div>
            </dl>
          </section>
        `
        : ''
    }
    <div class="grid">
      ${result.accounts
        .map(
          (account) => `
            <section class="card">
              <span class="role">${escapeHtml(account.role)}</span>
              <dl>
                <div>
                  <dt>Name</dt>
                  <dd>${escapeHtml(account.displayName)}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>${escapeHtml(account.email)}</dd>
                </div>
                <div>
                  <dt>Password</dt>
                  <dd>${escapeHtml(account.password)}</dd>
                </div>
                <div>
                  <dt>Email Verified</dt>
                  <dd>${account.emailRegistered ? 'true' : 'false'}</dd>
                </div>
                <div>
                  <dt>User ID</dt>
                  <dd>${escapeHtml(account.id)}</dd>
                </div>
                <div>
                  <dt>Token</dt>
                  <dd>${escapeHtml(account.token)}</dd>
                </div>
              </dl>
            </section>
          `,
        )
        .join('')}
    </div>
  `;
}

export function SongCardDebugModal() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [creatingAccounts, setCreatingAccounts] = useState(false);
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

  const openMockAccountsWindow = async () => {
    const accountWindow = window.open('', '_blank');
    if (!accountWindow) {
      toast.error('Allow popups to open the debug accounts window');
      return;
    }

    writeDebugWindow(
      accountWindow,
      '<h1>Debug Mock Accounts</h1><p class="meta">Creating accounts in MongoDB...</p>',
    );

    setCreatingAccounts(true);
    try {
      const result = await authAPI.createDebugMockAccounts();
      writeDebugWindow(accountWindow, renderAccountsWindow(result));
      toast.success('Debug accounts created and validated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      writeDebugWindow(
        accountWindow,
        `<h1>Debug Mock Accounts</h1><p class="meta">Failed: ${escapeHtml(message)}</p>`,
      );
      toast.error(message);
    } finally {
      setCreatingAccounts(false);
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
                    aria-label={label}
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

            <div className="mt-4 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={openMockAccountsWindow}
                disabled={creatingAccounts}
                className={clsx(
                  'flex w-full items-center justify-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-semibold',
                  creatingAccounts
                    ? 'cursor-wait bg-slate-100 text-slate-400'
                    : 'bg-white text-slate-900 hover:bg-slate-50',
                )}
              >
                <KeyRound size={16} />
                {creatingAccounts ? 'Creating accounts...' : 'Create mock accounts'}
                <ExternalLink size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { DEBUG_EVENT_NAME };
