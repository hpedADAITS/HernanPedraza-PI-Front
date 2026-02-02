import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { motion } from 'motion/react';
import { Search, ChevronRight, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner@2.0.3';

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: (view: any) => void;
}

const SONGS = [
  { id: 1, title: 'Midnight City', artist: 'M83', key: 'C#m', bpm: 105, duration: '4:03', eligibility: 'High', requester: 'Alice' },
  { id: 2, title: 'Get Lucky', artist: 'Daft Punk', key: 'F#m', bpm: 116, duration: '4:08', eligibility: 'High', requester: 'Bob' },
  { id: 3, title: 'Levels', artist: 'Avicii', key: 'C#m', bpm: 126, duration: '3:19', eligibility: 'Medium', requester: 'Charlie' },
  { id: 4, title: 'Titanium', artist: 'David Guetta', key: 'Cm', bpm: 126, duration: '4:05', eligibility: 'High', requester: 'Dave' },
  { id: 5, title: 'Wake Me Up', artist: 'Avicii', key: 'Bm', bpm: 124, duration: '4:07', eligibility: 'Low', requester: 'Eve' },
];

export function SongSelection({ mode, onNavigate }: Props) {
  const isDj = mode === 'dj';
  const theme = isDj ? 'blue' : 'green';
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSongs = SONGS.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (song: typeof SONGS[0]) => {
    toast.success(`Queued "${song.title}"`);
    onNavigate(isDj ? 'dj-dashboard' : 'attendee-dashboard');
  };

  return (
    <Layout theme={theme} className="p-6 md:p-12" showNav={true}>
      <div className="max-w-5xl mx-auto w-full flex flex-col items-center mt-8">
        
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl md:text-5xl font-light text-white text-center mb-8"
        >
          {isDj ? 'Select a song your audience submitted' : 'Select a song'}
        </motion.h1>

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
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-20 pl-20 pr-6 rounded-2xl shadow-xl bg-slate-700 text-white border-none outline-none text-xl placeholder:text-slate-400 focus:ring-4 focus:ring-slate-500 transition-all"
          />
        </motion.div>

        {/* Song List */}
        <motion.div 
          className="w-full flex flex-col gap-4 pb-24"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {filteredSongs.map((song) => (
            <motion.div 
              key={song.id}
              variants={{
                hidden: { y: 20, opacity: 0 },
                show: { y: 0, opacity: 1 }
              }}
              onClick={() => handleSelect(song)}
              className="bg-slate-200 hover:bg-white hover:scale-[1.01] hover:shadow-lg transition-all duration-300 rounded-2xl p-4 md:p-6 cursor-pointer relative group overflow-hidden"
            >
              <div className="flex items-center gap-4 md:gap-6 relative z-10">
                
                {/* DJ: Requester Avatar */}
                {isDj && (
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white flex-shrink-0">
                    <span className="text-lg md:text-xl font-bold text-white">
                      {song.requester.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Song Info */}
                <div className="flex-1 min-w-0 flex flex-col">
                   <h3 className="text-xl md:text-2xl font-light text-slate-800 truncate">{song.title}</h3>
                   <p className="text-sm font-light text-slate-500 truncate">{song.artist}</p>
                </div>

                {/* Metadata Grid (Hidden on mobile, visible on desktop) */}
                <div className="hidden lg:flex gap-6 xl:gap-8 items-center opacity-60 group-hover:opacity-100 transition-opacity">
                   <div className="text-center min-w-[80px]">
                     <p className="text-xs uppercase tracking-wider text-slate-400">Eligibility</p>
                     <p className={clsx("font-medium text-sm", song.eligibility === 'High' ? "text-emerald-500" : "text-slate-600")}>
                       {song.eligibility}
                     </p>
                   </div>
                   <div className="text-center min-w-[60px]">
                     <p className="text-xs uppercase tracking-wider text-slate-400">Duration</p>
                     <p className="text-slate-800 text-sm">{song.duration}</p>
                   </div>
                   <div className="text-center min-w-[50px]">
                     <p className="text-xs uppercase tracking-wider text-slate-400">Key</p>
                     <p className="text-slate-800 text-sm">{song.key}</p>
                   </div>
                   <div className="text-center min-w-[50px]">
                     <p className="text-xs uppercase tracking-wider text-slate-400">BPM</p>
                     <p className="text-slate-800 text-sm">{song.bpm}</p>
                   </div>
                </div>

                {/* Arrow Button */}
                <div className="bg-slate-600 group-hover:bg-slate-800 text-white w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-colors shadow-md flex-shrink-0">
                   <ChevronRight size={24} className="md:w-7 md:h-7" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Back Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <motion.button
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => onNavigate(isDj ? 'dj-dashboard' : 'attendee-dashboard')}
             className="bg-white px-8 py-4 rounded-full shadow-xl shadow-black/10 text-xl font-light text-slate-800 flex items-center gap-2 border border-slate-100"
          >
            <ArrowLeft size={20} />
            Back
          </motion.button>
        </div>

      </div>
    </Layout>
  );
}