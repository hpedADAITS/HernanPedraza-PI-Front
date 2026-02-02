import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { QUEUE_SONGS, THEME_CONFIG } from '../../constants/dashboard';

interface QueueListProps {
  mode: 'attendee' | 'dj';
}

export function QueueList({ mode }: QueueListProps) {
  const isDj = mode === 'dj';
  const primaryColor = THEME_CONFIG[isDj ? 'dj' : 'attendee'].primaryColor;

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl flex-1 min-h-[400px]"
    >
      <h3 className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">
        Up Next
      </h3>
      
      <div className="flex flex-col gap-4">
        {QUEUE_SONGS.map((song, i) => (
          <QueueItem 
            key={i}
            song={song}
            position={i + 1}
            isFirst={i === 0}
            primaryColor={primaryColor}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface QueueItemProps {
  song: typeof QUEUE_SONGS[number];
  position: number;
  isFirst: boolean;
  primaryColor: string;
}

function QueueItem({ song, position, isFirst, primaryColor }: QueueItemProps) {
  return (
    <div className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
      {/* Position Badge */}
      <div className={clsx(
        "w-12 h-12 rounded-xl shadow-md flex items-center justify-center text-white font-bold text-lg flex-shrink-0",
        isFirst ? primaryColor : "bg-slate-400"
      )}>
        {position}
      </div>
      
      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-slate-800 block truncate">{song.title}</span>
        <span className="text-xs text-slate-500">{song.artist}</span>
      </div>
      
      {/* Position Display */}
      <div className="text-slate-300 font-bold text-xl opacity-50">
        {position}
      </div>
    </div>
  );
}
