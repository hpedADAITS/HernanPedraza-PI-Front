import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'motion/react';
import { Search, ChevronRight, ArrowLeft, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { songsAPI } from '@/services/api';
import * as socket from '@/services/socket';

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
  onNavigate: (view: any) => void;
}

function getLocalStorageIds() {
  const eventData = localStorage.getItem('currentEvent');
  const participantData = localStorage.getItem('currentParticipant');
  const eventId = eventData ? JSON.parse(eventData).eventId : null;
  const participantId = participantData
    ? JSON.parse(participantData)._id
    : null;
  return { eventId, participantId };
}

export function SongSelection({ mode, onNavigate }: Props) {
  const isDj = mode === 'dj';
  const theme = isDj ? 'blue' : 'green';

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
    const data = localStorage.getItem('currentParticipant');
    if (!data) return 'User';
    try {
      return JSON.parse(data).nickname || 'User';
    } catch {
      return 'User';
    }
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

  return (
    <Layout theme={theme} className="p-6 md:p-12" showNav={true}>
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center mt-8">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl md:text-5xl font-light text-white text-center mb-8"
        >
          {isDj ? 'Pending Song Requests' : 'Suggest a Song'}
        </motion.h1>

        {isDj ? (
          <>
            {/* Search Bar */}
            <motion.div
              layoutId="search-bar"
              className="w-full max-w-3xl relative mb-12"
            >
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
                  <Search size={24} className="text-slate-800" />
                </div>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search pending songs..."
                className="w-full h-20 pl-20 pr-6 rounded-2xl shadow-xl bg-white text-slate-800 border-none outline-none text-xl placeholder:text-slate-400 focus:ring-4 focus:ring-slate-300 transition-all"
              />
            </motion.div>

            {/* Song List */}
            {loading ? (
              <p className="text-white/60 text-lg">Loading...</p>
            ) : filteredSongs.length === 0 ? (
              <p className="text-white/60 text-lg">No pending songs</p>
            ) : (
              <motion.div
                className="w-full flex flex-col gap-4 pb-24"
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
                    className="bg-slate-200 hover:bg-white hover:scale-[1.01] hover:shadow-lg transition-all duration-300 rounded-2xl p-4 md:p-6 cursor-pointer relative group overflow-hidden"
                  >
                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                      {/* Requester Avatar */}
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 shadow-sm flex items-center justify-center overflow-hidden border-2 border-white flex-shrink-0">
                        <span className="text-lg md:text-xl font-bold text-white">
                          {(song.requestedBy?.nickname || '?')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="text-xl md:text-2xl font-light text-slate-800 truncate">
                          {song.title}
                        </h3>
                        <p className="text-sm font-light text-slate-500 truncate">
                          {song.artist}
                        </p>
                      </div>

                      {/* Approve / Reject or Chevron */}
                      {activeSongId === song._id ? (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(song._id);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-colors shadow-md"
                          >
                            <Check size={24} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(song._id);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-colors shadow-md"
                          >
                            <X size={24} />
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-600 group-hover:bg-slate-800 text-white w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-colors shadow-md flex-shrink-0">
                          <ChevronRight size={24} className="md:w-7 md:h-7" />
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
            className="w-full max-w-3xl flex flex-col gap-6"
          >
            {/* Title Field */}
            <div className="relative">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center">
                  <Search size={24} className="text-slate-800" />
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Song title"
                required
                className="w-full h-20 pl-20 pr-6 rounded-2xl shadow-xl bg-white text-slate-800 border-none outline-none text-xl placeholder:text-slate-400 focus:ring-4 focus:ring-slate-300 transition-all"
              />
            </div>

            {/* Artist Field */}
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist"
              required
              className="w-full h-20 px-8 rounded-2xl shadow-xl bg-white text-slate-800 border-none outline-none text-xl placeholder:text-slate-400 focus:ring-4 focus:ring-slate-300 transition-all"
            />

            <motion.button
              type="submit"
              disabled={submitting || !title.trim() || !artist.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                'w-full h-20 rounded-2xl shadow-xl text-xl font-light text-white transition-all',
                submitting || !title.trim() || !artist.trim()
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 cursor-pointer',
              )}
            >
              {submitting ? 'Submitting...' : 'Suggest Song'}
            </motion.button>
          </motion.form>
        )}

        {/* Back Button */}
        <div className="fixed bottom-16 right-8" style={{ zIndex: 999999 }}>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              onNavigate(isDj ? 'dj-dashboard' : 'attendee-dashboard')
            }
            className="bg-white px-8 py-4 rounded-full shadow-xl shadow-black/10 text-xl font-light text-slate-800 flex items-center gap-2 border border-slate-100 select-none pointer-events-auto cursor-pointer"
          >
            <ArrowLeft size={20} />
            Back
          </motion.button>
        </div>
      </div>
    </Layout>
  );
}
