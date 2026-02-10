import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";
import { Play, X, Clock, UserX, SkipForward } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { THEME_CONFIG } from "../../constants/dashboard";
import { SLIDE_UP, ANIMATION_DURATION } from "../../constants/animations";
import { songsAPI, eventsAPI, participantsAPI } from "../../services/api";
import * as socket from "../../services/socket";

interface Song {
  _id: string;
  title: string;
  artist: string;
  voteScore: number;
  status: string;
  requestedBy?: any;
  eventId?: string;
}

interface QueueListProps {
  mode: "attendee" | "dj";
  eventId?: string;
  participantId?: string;
  isDarkMode?: boolean;
}

export function QueueList({
  mode,
  eventId: propEventId,
  participantId: propParticipantId,
  isDarkMode = false,
}: QueueListProps) {
  const isDj = mode === "dj";
  const primaryColor = THEME_CONFIG[isDj ? "dj" : "attendee"].primaryColor;
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(propEventId || null);
  const [participantId, setParticipantId] = useState<string | null>(
    propParticipantId || null,
  );

  const removeSong = useCallback((songId: string) => {
    setSongs(prev => prev.filter(s => s._id !== songId));
    setSelectedSongId(prev => (prev === songId ? null : prev));
  }, []);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const eventData = localStorage.getItem("currentEvent");
        const participantData = localStorage.getItem("currentParticipant");

        if (!eventData) {
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(eventData);
        let resolvedEventId = propEventId || parsed.eventId;
        const eventCode = parsed.eventCode;

        if (!resolvedEventId) {
          const event = await eventsAPI.getEventByAccessCode(eventCode);
          if (!event) {
            setLoading(false);
            return;
          }
          resolvedEventId = event._id;
        }

        setEventId(resolvedEventId);

        if (participantData) {
          const participantParsed = JSON.parse(participantData);
          setParticipantId(propParticipantId || participantParsed._id);
        }

        const queue = await songsAPI.getQueue(resolvedEventId);
        setSongs(queue || []);
      } catch (error) {
        console.error("Error fetching queue:", error);
        toast.error("Failed to load queue");
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [propEventId, propParticipantId]);

  useEffect(() => {
    const handleApproved = (data: any) => {
      if (data?.songId) removeSong(data.songId);
    };
    const handleRejected = (data: any) => {
      if (data?.songId) removeSong(data.songId);
    };
    const handleSkipped = (data: any) => {
      if (data?.songId) removeSong(data.songId);
    };
    const handleVotesUpdated = (data: any) => {
      if (data?.songId && data?.voteScore != null) {
        setSongs(prev =>
          prev.map(s =>
            s._id === data.songId ? { ...s, voteScore: data.voteScore } : s,
          ),
        );
      }
    };

    try {
      socket.onSongApproved(handleApproved);
      socket.onSongRejected(handleRejected);
      socket.onSongSkipped(handleSkipped);
      socket.onVotesUpdated(handleVotesUpdated);
    } catch {
      // Socket not initialized yet — listeners will be missed, but no crash
    }

    return () => {
      socket.off("song_approved", handleApproved);
      socket.off("song_rejected", handleRejected);
      socket.off("song_skipped", handleSkipped);
      socket.off("votes_updated", handleVotesUpdated);
    };
  }, [removeSong]);

  return (
    <TooltipProvider>
      <motion.div
         {...SLIDE_UP}
         transition={{ ...SLIDE_UP.transition, delay: 0.15 }}
         layout
         className={clsx(
           "backdrop-blur-xl rounded-3xl p-6 shadow-xl flex-1"
         )}
         style={{
           backgroundColor: isDarkMode ? "rgba(100, 116, 139, 0.8)" : "rgba(255, 255, 255, 0.6)"
         }}
       >
         <h3 className={clsx(
           "font-bold mb-4 uppercase text-xs tracking-wider",
           isDarkMode ? "text-slate-300" : "text-slate-500"
         )}>
          Up Next
        </h3>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex flex-col gap-4"
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" layout className="text-slate-500 py-4">
                Loading queue...
              </motion.div>
            ) : songs.length > 0 ? (
              <motion.div
                key="queue-list"
                layout
                className="flex flex-col gap-4"
              >
                <AnimatePresence>
                  {songs.map((song, i) => (
                    <QueueItem
                      key={song._id}
                      song={song}
                      position={i + 1}
                      isFirst={i === 0}
                      primaryColor={primaryColor}
                      isDj={isDj}
                      isSelected={selectedSongId === song._id}
                      onSelect={(id) =>
                        setSelectedSongId(selectedSongId === id ? null : id)
                      }
                      onSongRemoved={removeSong}
                      eventId={eventId || undefined}
                      isDarkMode={isDarkMode}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                layout
                className="text-slate-500 py-4"
              >
                No songs in queue
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}

interface QueueItemProps {
  song: Song;
  position: number;
  isFirst: boolean;
  primaryColor: string;
  isDj: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSongRemoved: (songId: string) => void;
  eventId?: string;
  isDarkMode?: boolean;
}

function QueueItem({
  song,
  position,
  isFirst,
  primaryColor,
  isDj,
  isSelected,
  onSelect,
  onSongRemoved,
  eventId,
  isDarkMode = false,
}: QueueItemProps) {
  const handleAdminAction = async (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(`\n========== ADMIN ACTION: ${action} ==========`);

    try {
      const songId = song._id;
      console.log("Song object:", { _id: songId, title: song.title, artist: song.artist });
      console.log("EventId:", eventId);
      
      if (action === "Send Now" && eventId) {
        console.log("[Send Now] Calling approveSong with:", { eventId, songId });
        if (!songId) {
          console.error("Missing songId!");
          toast.error("Song ID not found");
          return;
        }
        await songsAPI.approveSong(eventId, songId);
        socket.approveSong(eventId, songId);
        onSongRemoved(songId);
        console.log("[Send Now] approveSong called successfully");
        toast.success(`Now playing "${song.title}"`);
      } else if (action === "Reject" && eventId) {
        console.log("[Reject] Calling rejectSong with:", { eventId, songId });
        if (!songId) {
          console.error("Missing songId!");
          toast.error("Song ID not found");
          return;
        }
        await songsAPI.rejectSong(eventId, songId, "Rejected by DJ");
        socket.rejectSong(eventId, songId, "Rejected by DJ");
        onSongRemoved(songId);
        console.log("[Reject] rejectSong called successfully");
        toast.success(`Rejected "${song.title}"`);
      } else if (action === "Cooldown" && eventId) {
        if (song.requestedBy?._id) {
          await participantsAPI.setCooldown(
            song.requestedBy._id,
            300000,
            "DJ applied cooldown",
          );
          toast.success("User on cooldown");
        }
      } else if (action === "Kick" && eventId) {
        if (song.requestedBy?._id) {
          await participantsAPI.kickParticipant(
            song.requestedBy._id,
            "Kicked by DJ",
          );
          toast.success("User kicked from event");
        }
      } else if (action === "Skip" && eventId) {
        console.log("[Skip] Calling skipSong with:", { eventId, songId });
        if (!songId) {
          console.error("Missing songId!");
          toast.error("Song ID not found");
          return;
        }
        await songsAPI.skipSong(eventId, songId, "Skipped by DJ");
        socket.skipSong(eventId, songId, "Skipped by DJ");
        onSongRemoved(songId);
        console.log("[Skip] skipSong called successfully");
        toast.success(`Skipped "${song.title}"`);
      } else {
        console.error(`[ERROR] Action "${action}" failed - eventId: ${eventId}, songId: ${songId}`);
        toast.error("Invalid action or missing event ID");
      }
    } catch (error) {
      console.error("Admin action failed:", error);
      toast.error(`Failed to ${action.toLowerCase()}`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        x: 20,
        scale: 0.95,
        transition: { duration: 0.3 },
      }}
      whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.7)" }}
      transition={{ duration: ANIMATION_DURATION.fast }}
      onClick={() => isDj && onSelect(song._id)}
      className={clsx(
        "flex items-center gap-4 group cursor-pointer p-3 rounded-xl transition-all",
        isDj ? "cursor-pointer hover:bg-slate-50" : "",
      )}
    >
      {/* Position Badge */}
      <div
        className={clsx(
          "w-12 h-12 rounded-xl shadow-md flex items-center justify-center text-white font-bold text-lg flex-shrink-0",
          isFirst ? primaryColor : "bg-slate-400",
        )}
      >
        {position}
      </div>

      {/* Song Info or Admin Controls */}
      <AnimatePresence mode="wait">
        {isSelected && isDj ? (
          <motion.div
            key="admin-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex items-center gap-2"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleAdminAction("Send Now", e)}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    isDarkMode 
                      ? "bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-300"
                      : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                  )}
                  >
                  <Play size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Send Song Now</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleAdminAction("Reject", e)}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    isDarkMode 
                      ? "bg-red-900/30 hover:bg-red-800/40 text-red-300"
                      : "bg-red-100 hover:bg-red-200 text-red-700"
                  )}
                  >
                  <X size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Reject Song</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleAdminAction("Cooldown", e)}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    isDarkMode 
                      ? "bg-yellow-900/30 hover:bg-yellow-800/40 text-yellow-300"
                      : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                  )}
                  >
                  <Clock size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Cooldown User</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleAdminAction("Skip", e)}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    isDarkMode 
                      ? "bg-gray-900/30 hover:bg-gray-800/40 text-gray-300"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  )}
                  >
                  <SkipForward size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Skip Song</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => handleAdminAction("Kick", e)}
                  className={clsx(
                    "p-2 rounded-lg transition-colors",
                    isDarkMode 
                      ? "bg-purple-900/30 hover:bg-purple-800/40 text-purple-300"
                      : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                  )}
                  >
                  <UserX size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Kick User</TooltipContent>
            </Tooltip>
            </motion.div>
        ) : (
          <motion.div
            key="song-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="flex-1 flex items-center gap-4"
          >
             <div className="flex-1 min-w-0 flex flex-col gap-1">
               <span className={clsx(
                 "font-semibold truncate",
                 isDarkMode ? "text-slate-100" : "text-slate-800"
               )}>
                 {song.title}
               </span>
               <span className={clsx(
                 "text-xs",
                 isDarkMode ? "text-slate-400" : "text-slate-500"
               )}>{song.artist}</span>
             </div>

             <div className="flex flex-col items-end gap-1">
               <span className={clsx(
                 "text-sm font-semibold",
                 isDarkMode ? "text-slate-100" : "text-slate-700"
               )}>
                 {song.voteScore}
               </span>
               <span className={clsx(
                 "text-xs",
                 isDarkMode ? "text-slate-400" : "text-slate-400"
               )}>votes</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
