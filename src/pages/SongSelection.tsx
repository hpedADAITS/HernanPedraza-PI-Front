import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'motion/react';
import {
  Search,
  ChevronRight,
  ArrowLeft,
  Check,
  X,
  Music2,
  Mic2,
  UserRound,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/common';
import { useDarkMode } from '@/hooks/useDarkMode';
import { songsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { readStoredJson } from '@/utils/storage';
import type { NavigateToView } from '@/types';

interface Song {
  _id: string;
  title: string;
  artist: string;
  voteScore: number;
  status: string;
  requestedBy: { _id: string; nickname: string } | null;
  eventId: string;
}

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

function getLocalStorageIds() {
  const eventData = readStoredJson<{ eventId?: string }>('currentEvent');
  const participantData = readStoredJson<{ _id?: string }>('currentParticipant');
  const eventId = eventData?.eventId || null;
  const participantId = participantData?._id || null;
  return { eventId, participantId };
}

export function SongSelection({ mode, onNavigate }: Props) {
  const isDj = mode === 'dj';
  const theme = isDj ? 'blue' : 'green';
  const [isDarkMode] = useDarkMode();

  const { eventId, participantId } = getLocalStorageIds();

  /* DJ state */
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSongId, setActiveSongId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  /* Attendee state */
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getLocalNickname = () => {
    const data = readStoredJson<{ nickname?: string }>('currentParticipant');
    return data?.nickname || 'User';
  };

  const fetchPendingSongs = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const songs = await songsAPI.getPendingSongs(eventId);
      setPendingSongs(songs);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load pending songs');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isDj) {
      fetchPendingSongs();
    }
  }, [isDj, fetchPendingSongs]);

  const filteredSongs = pendingSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleApprove = async (songId: string) => {
    if (!eventId) return;
    try {
      await songsAPI.approveSong(eventId, songId);
      socket.approveSong(eventId, songId);
      toast.success('Song approved');
      setActiveSongId(null);
      await fetchPendingSongs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve song');
    }
  };

  const handleReject = async (songId: string) => {
    if (!eventId) return;
    try {
      await songsAPI.rejectSong(eventId, songId, 'Rejected by DJ');
      socket.rejectSong(eventId, songId, 'Rejected by DJ');
      toast.success('Song rejected');
      setActiveSongId(null);
      await fetchPendingSongs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject song');
    }
  };

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !participantId || !title.trim() || !artist.trim()) return;
    setSubmitting(true);
    try {
      const song = await songsAPI.suggestSong(
        eventId,
        participantId,
        title.trim(),
        artist.trim(),
      );
      socket.suggestSong(
        eventId,
        song._id,
        song.title,
        song.artist,
        participantId,
        getLocalNickname(),
      );
      toast.success(`"${song.title}" suggested`);
      onNavigate('attendee-dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to suggest song');
    } finally {
      setSubmitting(false);
    }
  };

  const requestCardClassName = clsx(
    'relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border p-5 md:p-7',
    isDarkMode
      ? 'border-white/10 bg-[radial-gradient(circle_at_72%_18%,rgba(70,156,255,0.16),transparent_24%),linear-gradient(180deg,#182235_0%,#111827_100%)] text-white shadow-[0_18px_42px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]'
      : 'border-slate-900/10 bg-[radial-gradient(circle_at_72%_18%,rgba(16,185,129,0.10),transparent_24%),linear-gradient(180deg,#ffffff_0%,#fbfffd_100%)] text-slate-900 shadow-[0_18px_42px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]',
  );

  const requestTitleClassName = clsx(
    'text-[22px] font-black leading-tight tracking-normal',
    isDarkMode ? 'text-white' : 'text-[#101c3a]',
  );

  const requestHelperClassName = clsx(
    'mt-1.5 text-[13px] font-bold leading-snug tracking-normal',
    isDarkMode ? 'text-slate-300' : 'text-[#73829d]',
  );

  const requestFieldClassName = clsx(
    'group flex h-[52px] min-w-0 cursor-text items-center gap-3.5 rounded-xl border px-[18px]',
    isDarkMode
      ? 'border-white/10 bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-md'
      : 'border-slate-900/10 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)]',
  );

  const requestIconClassName = clsx(
    'h-5 w-5 flex-shrink-0 transition-colors group-focus-within:text-emerald-500',
    isDarkMode ? 'text-slate-300' : 'text-[#526990]',
  );

  const requestInputClassName = clsx(
    'h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold tracking-normal outline-none placeholder:font-normal placeholder:tracking-normal',
    isDarkMode
      ? 'text-white placeholder:text-slate-400'
      : 'text-[#14213f] placeholder:text-[#8b9ab4]',
  );

  const requestButtonClassName = clsx(
    'mt-1 h-[52px] w-full rounded-xl text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(16,185,129,0.24)] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100',
    submitting || !title.trim() || !artist.trim()
      ? isDarkMode
        ? 'cursor-not-allowed bg-slate-500/70 opacity-80 shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
        : 'cursor-not-allowed bg-slate-400 opacity-80 shadow-[0_10px_20px_rgba(15,23,42,0.08)]'
      : isDarkMode
        ? 'cursor-pointer bg-emerald-500 hover:bg-emerald-600 shadow-[0_10px_20px_rgba(16,185,129,0.20)] focus-visible:ring-emerald-200'
        : 'cursor-pointer bg-emerald-500 hover:bg-emerald-600',
  );

  return (
    <Layout
      theme={theme}
      className="px-5 py-6 md:px-10 md:py-8"
      showNav={true}
    >
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="absolute left-0 top-0 z-20">
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={() =>
              onNavigate(isDj ? 'dj-dashboard' : 'attendee-dashboard')
            }
            className="flex h-11 items-center gap-2 rounded-full border border-white/55 bg-white/16 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 backdrop-blur-md transition-colors hover:bg-white/24"
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>
        </div>

        <div className="mb-8 flex min-h-11 items-center justify-center px-24 md:mb-10">
          <motion.h1
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center text-2xl font-semibold tracking-normal text-white drop-shadow-sm md:text-4xl"
          >
            {isDj ? 'Pending Requests' : 'Suggest a Song'}
          </motion.h1>
        </div>

        {isDj ? (
          <>
            {/* Search Bar */}
            <motion.div
              layoutId="search-bar"
              whileHover={{ y: -2 }}
              className="group mx-auto mb-6 mt-2 flex h-[52px] w-full max-w-2xl cursor-text items-center gap-3.5 rounded-xl border border-slate-900/10 bg-white px-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] md:mb-8 md:mt-4"
            >
              <Search className="h-5 w-5 flex-shrink-0 text-[#526990] transition-colors group-hover:text-[#2878ff]" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pending songs..."
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold tracking-normal text-[#14213f] outline-none placeholder:text-[#8b9ab4]"
              />
            </motion.div>

            {/* Song List */}
            {loading ? (
              <p className="self-center rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
                Loading…
              </p>
            ) : filteredSongs.length === 0 ? (
              <p className="self-center rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
                No pending songs
              </p>
            ) : (
              <motion.div
                className="flex w-full flex-col gap-3 pb-6"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 },
                  },
                }}
              >
                {filteredSongs.map((song) => (
                  <motion.div
                    key={song._id}
                    variants={{
                      hidden: { y: 20, opacity: 0 },
                      show: { y: 0, opacity: 1 },
                    }}
                    onClick={() =>
                      setActiveSongId(
                        activeSongId === song._id ? null : song._id,
                      )
                    }
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-white/65 bg-white p-3 shadow-lg shadow-slate-900/10 transition-colors duration-200 hover:bg-slate-50 md:p-4"
                  >
                    <div className="relative z-10 flex items-center gap-3 md:gap-4">
                      {/* Requester Avatar */}
                      <UserAvatar
                        name={song.requestedBy?.nickname || '?'}
                        imageAlt={`${song.requestedBy?.nickname || 'Unknown'} profile`}
                        className="h-11 w-11 flex-shrink-0 rounded-lg border border-slate-200 bg-slate-800 shadow-sm md:h-12 md:w-12"
                        fallbackClassName="flex items-center justify-center text-base font-semibold text-white"
                      />

                      {/* Song Info */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="truncate text-base font-semibold text-slate-900 md:text-lg">
                          {song.title}
                        </h3>
                        <p className="truncate text-sm font-medium text-slate-500">
                          {song.artist}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-slate-400">
                          <UserRound size={13} />
                          {song.requestedBy?.nickname || 'Unknown'}
                        </p>
                      </div>

                      {/* Approve / Reject or Chevron */}
                      {activeSongId === song._id ? (
                        <div className="flex flex-shrink-0 gap-2">
                          <button
                            type="button"
                            aria-label={`Approve ${song.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(song._id);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-200 md:h-11 md:w-11"
                          >
                            <Check size={21} />
                          </button>
                          <button
                            type="button"
                            aria-label={`Reject ${song.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(song._id);
                            }}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 md:h-11 md:w-11"
                          >
                            <X size={21} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700 text-white shadow-sm transition-colors group-hover:bg-slate-900 md:h-11 md:w-11">
                          <ChevronRight size={22} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        ) : (
          /* Attendee: Suggest Song Form */
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onSubmit={handleSuggest}
            className={requestCardClassName}
          >
            <div
              className="pointer-events-none absolute left-[58%] top-7 hidden h-[50px] w-[190px] opacity-45 md:block"
              aria-hidden="true"
            >
              <svg viewBox="0 0 190 50" className="h-full w-full">
                <g className="fill-[#34d399] opacity-35">
                  <circle cx="4" cy="24" r="1.4" />
                  <circle cx="10" cy="22" r="1.4" />
                  <circle cx="16" cy="20" r="1.4" />
                  <circle cx="22" cy="18" r="1.4" />
                  <circle cx="28" cy="16" r="1.4" />
                  <circle cx="34" cy="20" r="1.4" />
                  <circle cx="40" cy="24" r="1.4" />
                  <circle cx="46" cy="28" r="1.4" />
                  <circle cx="52" cy="32" r="1.4" />
                </g>
                <g className="fill-[#10b981] opacity-45">
                  <circle cx="64" cy="21" r="1.5" />
                  <circle cx="70" cy="15" r="1.5" />
                  <circle cx="76" cy="10" r="1.5" />
                  <circle cx="82" cy="12" r="1.5" />
                  <circle cx="88" cy="20" r="1.5" />
                  <circle cx="94" cy="27" r="1.5" />
                  <circle cx="100" cy="34" r="1.5" />
                </g>
                <g className="fill-[#6ee7b7] opacity-40">
                  <circle cx="112" cy="31" r="1.5" />
                  <circle cx="118" cy="26" r="1.5" />
                  <circle cx="124" cy="21" r="1.5" />
                  <circle cx="130" cy="18" r="1.5" />
                  <circle cx="136" cy="20" r="1.5" />
                  <circle cx="142" cy="25" r="1.5" />
                  <circle cx="148" cy="30" r="1.5" />
                </g>
              </svg>
            </div>

            <div className="relative z-10 mb-5">
              <h2 className={requestTitleClassName}>
                Request a track
              </h2>
              <p className={requestHelperClassName}>
                Add a song suggestion to the DJ queue.
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <label className={requestFieldClassName}>
                <Music2 className={requestIconClassName} />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Song title"
                  required
                  className={requestInputClassName}
                />
              </label>

              <label className={requestFieldClassName}>
                <Mic2 className={requestIconClassName} />
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Artist"
                  required
                  className={requestInputClassName}
                />
              </label>

              <motion.button
                type="submit"
                disabled={submitting || !title.trim() || !artist.trim()}
                whileHover={
                  submitting || !title.trim() || !artist.trim()
                    ? undefined
                    : { y: -1 }
                }
                whileTap={
                  submitting || !title.trim() || !artist.trim()
                    ? undefined
                    : { scale: 0.98 }
                }
                className={requestButtonClassName}
              >
                {submitting ? 'Submitting…' : 'Suggest Song'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </div>
    </Layout>
  );
}
