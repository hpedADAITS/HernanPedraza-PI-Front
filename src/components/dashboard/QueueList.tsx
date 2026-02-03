import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { clsx } from "clsx";
import { Play, X, Clock, UserX } from "lucide-react";
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
}

interface QueueListProps {
  mode: "attendee" | "dj";
  eventId?: string;
  participantId?: string;
}

export function QueueList({
  mode,
  eventId: propEventId,
  participantId: propParticipantId,
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

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        // Get event data from localStorage
        const eventData = localStorage.getItem("currentEvent");
        const participantData = localStorage.getItem("currentParticipant");

        if (!eventData) {
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(eventData);
        let resolvedEventId = propEventId || parsed.eventId;
        const eventCode = parsed.eventCode;

        // Lookup event by code if no eventId
        if (!resolvedEventId) {
          const event = await eventsAPI.getEventByAccessCode(eventCode);
          if (!event) {
            setLoading(false);
            return;
          }
          resolvedEventId = event._id;
        }

        setEventId(resolvedEventId);

        // Get participant ID
        if (participantData) {
          const participantParsed = JSON.parse(participantData);
          setParticipantId(propParticipantId || participantParsed._id);
        }

        // Fetch queue
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

  return (
    <TooltipProvider>
      <motion.div
        {...SLIDE_UP}
        transition={{ ...SLIDE_UP.transition, delay: 0.15 }}
        layout
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl flex-1"
      >
        <h3 className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">
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
                      eventId={eventId || undefined}
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
  eventId?: string;
}

function QueueItem({
  song,
  position,
  isFirst,
  primaryColor,
  isDj,
  isSelected,
  onSelect,
  eventId,
}: QueueItemProps) {
  const handleAdminAction = async (action: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (action === "Send Now" && eventId) {
        // Play the song
        socket.approveSong(eventId, song._id);
        toast.success(`Now playing "${song.title}"`);
      } else if (action === "Reject" && eventId) {
        // Reject the song
        socket.rejectSong(eventId, song._id, "Rejected by DJ");
        toast.success(`Rejected "${song.title}"`);
      } else if (action === "Cooldown" && eventId) {
        // Apply cooldown to requester
        if (song.requestedBy?._id) {
          await participantsAPI.setCooldown(
            song.requestedBy._id,
            300000, // 5 minutes
            "DJ applied cooldown",
          );
          toast.success("User on cooldown");
        }
      } else if (action === "Kick" && eventId) {
        // Kick the requester
        if (song.requestedBy?._id) {
          await participantsAPI.kickParticipant(
            song.requestedBy._id,
            "Kicked by DJ",
          );
          toast.success("User kicked from event");
        }
      } else {
        toast.error("Invalid action");
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
                  className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-700 transition-colors"
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
                  className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
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
                  className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-yellow-700 transition-colors"
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
                  onClick={(e) => handleAdminAction("Kick", e)}
                  className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-700 transition-colors"
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
            {/* Song Info */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="font-semibold text-slate-800 truncate">
                {song.title}
              </span>
              <span className="text-xs text-slate-500">{song.artist}</span>
            </div>

            {/* Vote Count */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-semibold text-slate-700">
                {song.voteScore}
              </span>
              <span className="text-xs text-slate-400">votes</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
