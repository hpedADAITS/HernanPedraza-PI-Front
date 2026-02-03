import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { NowPlaying } from "../ui/NowPlaying";
import { NOW_PLAYING } from "../../constants/dashboard";
import { SCALE_IN } from "../../constants/animations";
import * as socket from "../../services/socket";
import { songsAPI } from "../../services/api";

interface NowPlayingSong {
  id: string;
  title: string;
  artist: string;
  status: "playing" | "rejected" | "queued";
  progress?: number;
  currentTime?: string;
  duration?: string;
}

export function NowPlayingSection() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingSong | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    // Get event ID from localStorage
    const eventData = localStorage.getItem("currentEvent");
    if (eventData) {
      const parsed = JSON.parse(eventData);
      setEventId(parsed.eventId);
    }
  }, []);

  useEffect(() => {
    if (!eventId) return;

    // Listen for song status updates
    socket.onSongApproved((data) => {
      setNowPlaying({
        id: data.songId,
        title: "Now Playing...",
        artist: "Loading...",
        status: "playing",
        progress: 0,
        currentTime: "0:00",
        duration: "0:00",
      });
    });

    socket.onSongRejected((data) => {
      setNowPlaying({
        id: data.songId,
        title: "Song Rejected",
        artist: data.reason || "No reason provided",
        status: "rejected",
      });
    });

    socket.onQueueUpdated((data) => {
      if (data.queue && data.queue.length > 0) {
        const firstSong = data.queue[0];
        setNowPlaying({
          id: firstSong._id || firstSong.id,
          title: firstSong.title,
          artist: firstSong.artist,
          status: firstSong.status === "PLAYING" ? "playing" : "queued",
          progress: 0,
          currentTime: "0:00",
          duration: "3:45",
        });
      }
    });

    return () => {
      socket.off("song_approved");
      socket.off("song_rejected");
      socket.off("queue_updated");
    };
  }, [eventId]);

  // Use provided data or fallback to state
  const displayData = nowPlaying || NOW_PLAYING;

  return (
    <motion.div
      {...SCALE_IN}
      transition={{ ...SCALE_IN.transition, delay: 0.25 }}
      className="flex-1 flex items-center justify-center min-h-[200px]"
    >
      <div className="w-full max-w-2xl">
        <NowPlaying
          songTitle={displayData.title}
          artist={displayData.artist}
          status={displayData.status}
          progress={displayData.progress}
          currentTime={displayData.currentTime}
          duration={displayData.duration}
        />
      </div>
    </motion.div>
  );
}
