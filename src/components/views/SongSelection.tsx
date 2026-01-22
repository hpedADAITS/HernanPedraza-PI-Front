import React, { useState } from 'react';
import { Layout } from '../layout/Layout';
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
          className="text-3xl md:text-5xl font-light text-slate-800 text-center mb-8"
        >
          {isDj ? 'Select a song your audience submitted' : 'Select a song'}
        </motion.h1>

        {/* Search Bar */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-3xl relative mb-12"
        >
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={28} />
          </div>
          <input 
            type="text" 
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-20 pl-16 pr-6 rounded-2xl shadow-xl shadow-slate-200 border-none outline-none text-xl placeholder:text-slate-300 focus:ring-4 focus:ring-slate-100 transition-all"
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
              <div className="flex items-center justify-between relative z-10">
                
                {/* DJ: Requester Avatar */}
                {isDj && (
                  <div className="w-16 h-16 rounded-xl bg-white shadow-sm flex-shrink-0 mr-6 flex items-center justify-center overflow-hidden border-2 border-white">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${song.requester}`}
                      alt={song.requester}
                      className="w-full h-full"
                    />
                  </div>
                )}
                
                {/* Song Info (Left) */}
                <div className="flex-1 min-w-0 md:text-center md:absolute md:left-1/2 md:-translate-x-1/2 flex flex-col md:items-center">
                   <h3 className="text-2xl font-light text-slate-800 truncate">{song.title}</h3>
                   <p className="text-sm font-light text-slate-500">{song.artist}</p>
                </div>

                {/* Metadata Grid (Hidden on mobile, visible on desktop) */}
                <div className="hidden md:flex gap-8 lg:gap-16 items-center text-center absolute left-[20%] right-[10%] justify-center opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
                   <div>
                     <p className="text-xs uppercase tracking-wider text-slate-400">AI Eligibility</p>
                     <p className={clsx("font-medium", song.eligibility === 'High' ? "text-emerald-500" : "text-slate-600")}>
                       {song.eligibility}
                     </p>
                   </div>
                   <div>
                     <p className="text-xs uppercase tracking-wider text-slate-400">Duration</p>
                     <p className="text-slate-800">{song.duration}</p>
                   </div>
                   <div>
                     <p className="text-xs uppercase tracking-wider text-slate-400">Key</p>
                     <p className="text-slate-800">{song.key}</p>
                   </div>
                   <div>
                     <p className="text-xs uppercase tracking-wider text-slate-400">BPM</p>
                     <p className="text-slate-800">{song.bpm}</p>
                   </div>
                </div>

                {/* Arrow Button */}
                <div className="ml-auto bg-slate-600 group-hover:bg-slate-800 text-white w-14 h-14 rounded-xl flex items-center justify-center transition-colors shadow-md">
                   <ChevronRight size={28} />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Cancel/Back Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => onNavigate(isDj ? 'dj-dashboard' : 'attendee-dashboard')}
             className="bg-white px-8 py-4 rounded-full shadow-xl shadow-black/10 text-xl font-light text-slate-800 flex items-center gap-2 border border-slate-100"
          >
            Cancel
          </motion.button>
        </div>

      </div>
    </Layout>
  );
}
