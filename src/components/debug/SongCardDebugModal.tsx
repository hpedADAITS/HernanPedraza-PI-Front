import React, { useMemo, useState } from 'react';
import { Bug, ExternalLink, KeyRound, ListMusic, X } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { isDebugModeEnabled } from '@/utils/debugMode';
import { readStoredJson } from '@/utils/storage';
import {
  DEBUG_EVENT_NAME,
  dispatchDebugSongEvent,
} from '@/utils/debugSongEvents';
import { authAPI } from '@/services/api';

type DebugTrigger = 'queue' | 'playing' | 'rejected' | 'skipped';

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

function renderQueueTestWindow(eventId: string) {
  return `
    <h1>Queue Test Page</h1>
    <p class="meta">Frontend simulator for event <strong>${escapeHtml(eventId)}</strong>. Events are sent to the opener dashboard.</p>
    <section class="card">
      <span class="role">SUBMIT SONG</span>
      <div class="form">
        <input id="title" value="Test Song" aria-label="Song title" />
        <input id="artist" value="Queue Simulator" aria-label="Artist" />
        <input id="duration" type="number" min="0" value="210" aria-label="Duration seconds" />
        <button id="submit">Submit pending</button>
      </div>
    </section>
    <div class="grid">
      <section class="card">
        <span class="role">PENDING</span>
        <div id="pending"></div>
      </section>
      <section class="card">
        <span class="role">QUEUE</span>
        <div id="queue"></div>
      </section>
    </div>
    <section class="card">
      <span class="role">NOW PLAYING</span>
      <div id="playing"></div>
      <p class="meta" id="wait"></p>
    </section>
    <section class="card">
      <span class="role">EVENT LOG</span>
      <pre id="log"></pre>
    </section>
    <style>
      .form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 120px auto;
        gap: 10px;
      }
      input, button {
        min-height: 38px;
        border-radius: 7px;
        border: 1px solid #cbd5e1;
        padding: 0 10px;
        font: inherit;
      }
      button {
        cursor: pointer;
        border-color: #0f172a;
        background: #0f172a;
        color: white;
        font-weight: 700;
      }
      button.secondary {
        border-color: #cbd5e1;
        background: white;
        color: #0f172a;
      }
      button.danger {
        border-color: #dc2626;
        background: #dc2626;
      }
      .song {
        display: grid;
        gap: 8px;
        border-top: 1px solid #e2e8f0;
        padding: 12px 0;
      }
      .song:first-child {
        border-top: 0;
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .title {
        min-width: 0;
        font-weight: 800;
      }
      .sub {
        color: #64748b;
        font-size: 13px;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      pre {
        max-height: 180px;
        overflow: auto;
        white-space: pre-wrap;
        font-size: 12px;
      }
      @media (max-width: 720px) {
        .form {
          grid-template-columns: 1fr;
        }
      }
    </style>
    <script>
      (() => {
        const DEBUG_EVENT_NAME = ${JSON.stringify(DEBUG_EVENT_NAME)};
        const DEBUG_CHANNEL_NAME = 'syncrekuest:debug-song-events';
        const DEBUG_STORAGE_KEY = 'syncrekuest:debug-song-event:last';
        const eventId = ${JSON.stringify(eventId)};
        const requester = { _id: 'debug-attendee', nickname: 'Debug Attendee' };
        const state = {
          nextId: 1,
          pending: [],
          queue: [],
          nowPlaying: null,
          log: [],
        };

        const byId = (id) =>
          state.pending.find((song) => song._id === id) ||
          state.queue.find((song) => song._id === id);

        const durationOf = (song) => song?.totalDuration ?? song?.duration ?? 0;

        const nowPlayingPayload = () => {
          if (!state.nowPlaying) return null;
          const elapsedTime = Math.max(
            0,
            Math.floor((Date.now() - new Date(state.nowPlaying.playingStartedAt).getTime()) / 1000),
          );
          const totalDuration = durationOf(state.nowPlaying);
          return {
            songId: state.nowPlaying._id,
            title: state.nowPlaying.title,
            artist: state.nowPlaying.artist,
            totalDuration,
            duration: totalDuration,
            playingStartedAt: state.nowPlaying.playingStartedAt,
            elapsedTime,
            remainingTime: totalDuration ? Math.max(0, totalDuration - elapsedTime) : null,
          };
        };

        const queuePayload = () => ({
          eventId,
          queue: state.queue.map((song, index) => ({
            ...song,
            queuePosition: song.status === 'PLAYING' ? 0 : index + 1,
          })),
          nowPlaying: nowPlayingPayload(),
        });

        const emit = (type, payload) => {
          const detail = {
            type,
            payload: { eventId, ...payload, timestamp: new Date().toISOString() },
            eventKey: Date.now() + '-' + Math.random().toString(36).slice(2),
          };
          window.opener?.dispatchEvent(new CustomEvent(DEBUG_EVENT_NAME, { detail }));
          if ('BroadcastChannel' in window) {
            const channel = new BroadcastChannel(DEBUG_CHANNEL_NAME);
            channel.postMessage(detail);
            channel.close();
          }
          try {
            localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(detail));
          } catch {}
          state.log.unshift(type + ' ' + JSON.stringify(detail.payload));
          state.log = state.log.slice(0, 40);
          render();
        };

        const emitQueue = () => emit('queue_updated', queuePayload());

        const rejectSong = (id, reason) => {
          const song = byId(id);
          if (!song) return;
          state.pending = state.pending.filter((item) => item._id !== id);
          state.queue = state.queue.filter((item) => item._id !== id);
          if (state.nowPlaying?._id === id) state.nowPlaying = null;
          emit('song_rejected', {
            songId: id,
            title: song.title,
            artist: song.artist,
            status: 'REJECTED',
            reason,
          });
          emitQueue();
        };

        const vote = (id, value) => {
          const song = byId(id);
          if (!song) return;
          song.voteScore += value;
          song.voteCount += 1;
          emit('votes_updated', {
            songId: id,
            participantId: requester._id,
            value,
            voteScore: song.voteScore,
            voteCount: song.voteCount,
            status: song.status,
          });
          if (song.voteScore <= -8 && (song.status === 'PENDING' || song.status === 'APPROVED')) {
            rejectSong(id, 'Rejected by downvotes');
            return;
          }
          state.queue.sort((a, b) => (b.voteScore || 0) - (a.voteScore || 0));
          emitQueue();
        };

        const approve = (id) => {
          const song = state.pending.find((item) => item._id === id);
          if (!song) return;
          state.pending = state.pending.filter((item) => item._id !== id);
          song.status = 'APPROVED';
          state.queue.push(song);
          state.queue.sort((a, b) => (b.voteScore || 0) - (a.voteScore || 0));
          emit('song_approved', {
            songId: song._id,
            title: song.title,
            artist: song.artist,
            requestedBy: song.requestedBy,
            status: song.status,
            voteScore: song.voteScore,
            voteCount: song.voteCount,
            totalDuration: song.totalDuration,
            duration: song.totalDuration,
          });
          emitQueue();
        };

        const play = (id) => {
          const song = state.queue.find((item) => item._id === id);
          if (!song) return;
          if (state.nowPlaying) state.nowPlaying.status = 'PLAYED';
          song.status = 'PLAYING';
          song.playingStartedAt = new Date().toISOString();
          state.nowPlaying = song;
          emit('song_now_playing', {
            songId: song._id,
            title: song.title,
            artist: song.artist,
            status: song.status,
            totalDuration: song.totalDuration,
            duration: song.totalDuration,
            playingStartedAt: song.playingStartedAt,
          });
          emitQueue();
        };

        const submit = () => {
          const title = document.getElementById('title').value.trim() || 'Untitled';
          const artist = document.getElementById('artist').value.trim() || 'Unknown Artist';
          const totalDuration = Number(document.getElementById('duration').value) || undefined;
          const song = {
            _id: 'debug-queue-' + state.nextId++,
            title,
            artist,
            requestedBy: requester,
            status: 'PENDING',
            voteScore: 0,
            voteCount: 0,
            totalDuration,
            duration: totalDuration,
            createdAt: new Date().toISOString(),
          };
          state.pending.push(song);
          emit('song_suggested', {
            songId: song._id,
            title,
            artist,
            participantId: requester._id,
            nickname: requester.nickname,
            requestedBy: requester,
            status: song.status,
            totalDuration,
            duration: totalDuration,
          });
        };

        const waitLabel = () => {
          let wait = 0;
          const playing = nowPlayingPayload();
          if (playing?.remainingTime != null) wait += playing.remainingTime;
          for (const song of state.queue) {
            if (song.status === 'PLAYING') continue;
            return 'Next attendee song starts in ~' + wait + 's';
          }
          return state.nowPlaying ? 'No queued attendee songs' : 'Nothing playing';
        };

        const renderSong = (song, pending) => \`
          <div class="song">
            <div class="row">
              <div>
                <div class="title">\${song.title}</div>
                <div class="sub">\${song.artist} | \${song.status} | votes \${song.voteScore} | duration \${durationOf(song) || 'unknown'}s</div>
              </div>
            </div>
            <div class="actions">
              \${pending ? \`<button data-approve="\${song._id}">Approve</button>\` : \`<button data-play="\${song._id}">Recognize now</button>\`}
              <button class="secondary" data-up="\${song._id}">+1</button>
              <button class="secondary" data-down="\${song._id}">-1</button>
              <button class="danger" data-reject="\${song._id}">Reject</button>
            </div>
          </div>
        \`;

        const render = () => {
          document.getElementById('pending').innerHTML =
            state.pending.map((song) => renderSong(song, true)).join('') || '<p class="meta">No pending songs</p>';
          document.getElementById('queue').innerHTML =
            state.queue.filter((song) => song.status !== 'PLAYING').map((song) => renderSong(song, false)).join('') || '<p class="meta">No queued songs</p>';
          document.getElementById('playing').innerHTML = state.nowPlaying
            ? renderSong(state.nowPlaying, false)
            : '<p class="meta">No recognized song</p>';
          document.getElementById('wait').textContent = waitLabel();
          document.getElementById('log').textContent = state.log.join('\\n\\n');
        };

        document.addEventListener('click', (event) => {
          const target = event.target;
          if (!(target instanceof HTMLElement)) return;
          if (target.id === 'submit') submit();
          if (target.dataset.approve) approve(target.dataset.approve);
          if (target.dataset.play) play(target.dataset.play);
          if (target.dataset.up) vote(target.dataset.up, 1);
          if (target.dataset.down) vote(target.dataset.down, -1);
          if (target.dataset.reject) rejectSong(target.dataset.reject, 'Rejected by DJ');
        });

        setInterval(render, 1000);
        render();
      })();
    </script>
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
      status: 'APPROVED',
      totalDuration: 205,
      duration: 205,
      queuePosition: 1,
      requestedBy: { _id: 'debug-attendee', nickname: 'Debug Attendee' },
    };
    const rejectedSong = {
      _id: ids.rejected,
      title: 'Debug Rejected Song',
      artist: 'Vote Test',
      voteScore: -5,
      status: 'APPROVED',
      totalDuration: 188,
      duration: 188,
      queuePosition: 2,
      requestedBy: { _id: 'debug-attendee', nickname: 'Debug Attendee' },
    };
    const skippedSong = {
      _id: ids.skipped,
      title: 'Debug Skipped Song',
      artist: 'DJ Test',
      voteScore: 2,
      status: 'APPROVED',
      totalDuration: 171,
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
            totalDuration: playSong.totalDuration,
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

  const openQueueTestWindow = () => {
    const queueWindow = window.open('', '_blank');
    if (!queueWindow) {
      toast.error('Allow popups to open the queue test window');
      return;
    }

    writeDebugWindow(queueWindow, renderQueueTestWindow(getEventId()));
    toast.success('Queue test page opened');
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
                onClick={openQueueTestWindow}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <ListMusic size={16} />
                Open queue test page
                <ExternalLink size={15} />
              </button>
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
