import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
<<<<<<< Updated upstream
import { NowPlaying } from "@/components/common";
import { NOW_PLAYING } from "@/constants/dashboard";
import { SCALE_IN } from "@/constants/animations";
import { initSocket, onSongApproved, onSongRejected, onSongSkipped, onQueueUpdated, off } from "@/services/socket";
import { songsAPI } from "@/services/api";
=======
import { NowPlaying } from "@/components/common/NowPlaying";
import { NOW_PLAYING } from "@/constants/dashboard";
import { SCALE_IN } from "@/constants/animations";
import { initSocket, onSongApproved, onSongRejected, onSongSkipped, onQueueUpdated, off } from "../../services/socket";
import { songsAPI } from "../../services/api";
>>>>>>> Stashed changes

interface NowPlayingSong {
  id: string;
  title: string;
  artist: string;
  status: "playing" | "rejected" | "queued" | "skipped";
  progress?: number;
  currentTime?: string;
  duration?: string;
}

interface QueueSong {
  id: string;
  title: string;
  artist: string;
  status?: string;
  eventId?: string;
}

export function NowPlayingSection() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingSong | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueSong[]>([]);
  const [tempStatus, setTempStatus] = useState<NowPlayingSong | null>(null);

  useEffect(() => {
    // Get event ID from localStorage and fetch initial queue
    const eventData = localStorage.getItem("currentEvent");
    if (eventData) {
      const parsed = JSON.parse(eventData);
      setEventId(parsed.eventId);
      
      // Fetch initial queue
      const fetchQueue = async () => {
        try {
          const queueData = await songsAPI.getQueue(parsed.eventId);
          if (queueData) {
            setQueue(queueData);
          }
        } catch (error) {
          console.error("Error fetching queue:", error);
        }
      };
      
      fetchQueue();
    }
  }, []);

  useEffect(() => {
    if (!eventId) return;

    initSocket();

    const handleSongApproved = (data: any) => {
      setNowPlaying({
        id: data.songId,
        title: data.title || "Now Playing...",
        artist: data.artist || "Loading...",
        status: "playing",
        progress: 0,
        currentTime: "0:00",
        duration: "3:45",
      });
    };

    const handleSongRejected = (data: any) => {
      setTempStatus({
        id: data.songId,
        title: "Song Rejected",
        artist: data.reason || "No reason provided",
        status: "rejected",
      });
      setTimeout(() => setTempStatus(null), 2000);
    };

    const handleSongSkipped = (data: any) => {
      setTempStatus({
        id: data.songId,
        title: "Song Skipped",
        artist: data.reason || "DJ skipped",
        status: "skipped",
      });
      setTimeout(() => setTempStatus(null), 2000);
    };

    const handleQueueUpdated = (data: any) => {
      if (data.queue && data.queue.length > 0) {
        setQueue(data.queue);
        const firstSong = data.queue[0];
        setNowPlaying({
          id: firstSong._id || firstSong.id,
          title: firstSong.title,
          artist: firstSong.artist,
          status: (firstSong.status === "PLAYING" ? "playing" : "queued") as const,
          progress: 0,
          currentTime: "0:00",
          duration: "3:45",
        });
      }
    };

    onSongApproved(handleSongApproved);
    onSongRejected(handleSongRejected);
    onSongSkipped(handleSongSkipped);
    onQueueUpdated(handleQueueUpdated);

    return () => {
      off("song_approved", handleSongApproved);
      off("song_rejected", handleSongRejected);
      off("song_skipped", handleSongSkipped);
      off("queue_updated", handleQueueUpdated);
    };
  }, [eventId]);

  // Use temp status (rejected/skipped) if available, otherwise current playing, fallback to default
  const displayData = tempStatus || nowPlaying || NOW_PLAYING;

  return (
    <motion.div
      {...SCALE_IN}
      transition={{ ...SCALE_IN.transition, delay: 0.25 }}
      className="flex-1 flex items-center justify-center min-h-[200px]"
    >
      <motion.div
        className="w-full max-w-2xl"
        key={`${displayData.id}-${displayData.status}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <NowPlaying
          songTitle={displayData.title}
          artist={displayData.artist}
          status={displayData.status}
          progress={displayData.progress}
          currentTime={displayData.currentTime}
          duration={displayData.duration}
        />
      </motion.div>
    </motion.div>
  );
}
