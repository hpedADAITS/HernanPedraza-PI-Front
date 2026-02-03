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
import { songsAPI } from "../../services/api";

interface Song {
  _id: string;
  title: string;
  artist: string;
  voteScore: number;
  status: string;
}

interface QueueListProps {
  mode: "attendee" | "dj";
}

export function QueueList({ mode }: QueueListProps) {
  const isDj = mode === "dj";
  const primaryColor = THEME_CONFIG[isDj ? "dj" : "attendee"].primaryColor;
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        // Get event code from localStorage
        const eventData = localStorage.getItem("currentEvent");
        if (!eventData) {
          setLoading(false);
          return;
        }

        const parsed = JSON.parse(eventData);
        const eventCode = parsed.eventCode;

        // For now, use mock data since we need the eventId from DB
        // TODO: Implement event lookup by access code to get eventId
        setSongs([
          {
            _id: "1",
            title: "Blinding Lights",
            artist: "The Weeknd",
            voteScore: 5,
            status: "APPROVED",
          },
          {
            _id: "2",
            title: "Anti-Hero",
            artist: "Taylor Swift",
            voteScore: 3,
            status: "APPROVED",
          },
          {
            _id: "3",
            title: "Flowers",
            artist: "Miley Cyrus",
            voteScore: 2,
            status: "PENDING",
          },
        ]);
      } catch (error) {
        console.error("Error fetching queue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  return (
    <TooltipProvider>
      <motion.div
        {...SLIDE_UP}
        transition={{ ...SLIDE_UP.transition, delay: 0.15 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl flex-1 min-h-[400px]"
      >
      <h3 className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">
        Up Next
      </h3>

      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500">
            Loading queue...
          </div>
        ) : songs.length > 0 ? (
          songs.map((song, i) => (
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
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-40 text-slate-500">
            No songs in queue
          </div>
        )}
      </div>
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
}

function QueueItem({
  song,
  position,
  isFirst,
  primaryColor,
  isDj,
  isSelected,
  onSelect,
}: QueueItemProps) {
  const handleAdminAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.promise(
      new Promise((resolve) =>
        setTimeout(() => {
          resolve(null);
        }, 500),
      ),
      {
        success: `${action} executed for "${song.title}"`,
      },
    );
  };

  return (
    <motion.div
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
