import React from 'react';
import { motion } from 'motion/react';

interface NowPlayingProps {
  songTitle?: string;
  artist?: string;
  albumArt?: string;
  currentTime?: string;
  duration?: string;
  progress?: number;
  status?: 'playing' | 'rejected' | 'queued';
}

export function NowPlaying({
  songTitle = "Queue Song",
  artist = "Unknown Artist",
  albumArt,
  currentTime = "2:35",
  duration = "3:45",
  progress = 65,
  status = 'playing'
}: NowPlayingProps) {
  const getGradient = () => {
    switch (status) {
      case 'rejected':
        return 'bg-gradient-to-r from-red-500 to-red-700';
      case 'queued':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      default:
        return 'bg-gradient-to-r from-emerald-500 to-emerald-700';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'rejected':
        return 'Song Rejected';
      case 'queued':
        return 'Song in queue';
      default:
        return 'Accepted - Now playing';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative w-full ${getGradient()} rounded-2xl shadow-lg overflow-hidden`}
    >
      <div className="flex items-center gap-4 p-5">
        {/* Album Art */}
        <div className="w-16 h-16 bg-white/20 rounded-xl flex-shrink-0 backdrop-blur-sm border border-white/30" />

        {/* Song Info & Progress */}
        <div className="flex-1 min-w-0">
          {/* Status */}
          <p className="text-white/90 text-xs font-medium mb-1">
            {getStatusText()}
          </p>
          
          {/* Song Title */}
          <h3 className="text-white font-bold text-lg mb-2 truncate">
            {songTitle}
          </h3>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <span className="text-white/90 text-xs font-medium min-w-[35px]">
              {currentTime}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}