import React from 'react';
import { motion } from 'motion/react';
import { NowPlaying } from '../ui/NowPlaying';
import { NOW_PLAYING } from '../../constants/dashboard';

export function NowPlayingSection() {
  return (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="flex-1 flex items-center justify-center min-h-[200px]"
    >
      <div className="w-full max-w-2xl">
        <NowPlaying {...NOW_PLAYING} />
      </div>
    </motion.div>
  );
}
