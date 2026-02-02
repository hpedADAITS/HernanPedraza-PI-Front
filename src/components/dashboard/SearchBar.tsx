import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { SLIDE_UP } from '../../constants/animations';

interface SearchBarProps {
  onNavigate: (view: string) => void;
  isDj: boolean;
}

export function SearchBar({ onNavigate, isDj }: SearchBarProps) {
  const handleClick = () => {
    const view = isDj ? 'dj-song-select' : 'attendee-song-select';
    onNavigate(view);
  };

  return (
    <motion.div 
      layoutId="search-bar"
      {...SLIDE_UP}
      transition={{ ...SLIDE_UP.transition, delay: 0.2 }}
      whileHover={{ y: -2 }}
      onClick={handleClick}
      className="bg-white rounded-2xl shadow-xl h-16 flex items-center px-6 gap-4 cursor-text group"
    >
      <Search className="text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" size={24} />
      <span className="text-slate-400 font-medium text-lg">Search for a song...</span>
    </motion.div>
  );
}
