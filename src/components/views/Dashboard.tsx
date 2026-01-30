import React from 'react';
import { Layout } from '../layout/Layout';
import { motion } from 'motion/react';
import { Search, ThumbsUp, ThumbsDown, UserPlus, LogOut, Settings, Plus, Music } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner@2.0.3';
import { NowPlaying } from '../ui/NowPlaying';

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: (view: any) => void;
}

export function Dashboard({ mode, onNavigate }: Props) {
  const isDj = mode === 'dj';
  const theme = isDj ? 'blue' : 'green';

  return (
    <Layout theme="white" className="p-6 md:p-12" showNav={true}>
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col lg:flex-row gap-8 mt-12">
        
        {/* Left Column: Profile & Queue */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          {/* Profile Card */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={clsx(
              "rounded-3xl p-6 shadow-xl text-white relative overflow-hidden min-h-[200px] flex flex-col items-center justify-center text-center",
              isDj ? "bg-gradient-to-br from-blue-400 to-blue-600" : "bg-gradient-to-br from-emerald-400 to-emerald-600"
            )}
          >
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-white/10" />
            
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner flex items-center justify-center overflow-hidden border border-white/30">
                 <img 
                   src="https://images.unsplash.com/photo-1678286742832-26543bb49959?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHVzZXIlMjBwcm9maWxlfGVufDF8fHx8MTc2OTEyMTA2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" 
                   alt="Profile" 
                   className="w-full h-full object-cover"
                 />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Lucas</h2>
                <p className="text-white/80 text-sm font-medium">
                  {isDj ? 'DJ on SyncRequest' : '2 years following this DJ'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Queue List */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl flex-1 min-h-[400px]"
          >
            <h3 className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">Up Next</h3>
            <div className="flex flex-col gap-4">
              {[
                { title: 'Blinding Lights', artist: 'The Weeknd' },
                { title: 'Levitating', artist: 'Dua Lipa' },
                { title: 'Save Your Tears', artist: 'The Weeknd' },
                { title: 'Don\'t Start Now', artist: 'Dua Lipa' }
              ].map((song, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors">
                  <div className={clsx(
                    "w-12 h-12 rounded-xl shadow-md flex items-center justify-center text-white font-bold text-lg",
                    i === 0 ? (isDj ? "bg-blue-600" : "bg-emerald-600") : "bg-slate-400"
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="font-semibold text-slate-800">{song.title}</span>
                    <span className="text-xs text-slate-500">{song.artist}</span>
                  </div>
                  <div className="text-slate-300 font-bold text-xl opacity-50">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column: Search & Actions */}
        <div className="w-full lg:w-2/3 flex flex-col justify-between gap-6 relative">
          
          {/* Search Bar */}
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl h-16 flex items-center px-6 gap-4 cursor-text group transition-transform hover:scale-[1.01]"
              onClick={() => onNavigate(isDj ? 'dj-song-select' : 'attendee-song-select')}
            >
              <Search className="text-slate-400 group-hover:text-slate-600 transition-colors" size={24} />
              <span className="text-slate-400 font-medium text-lg">Search for a song...</span>
            </div>
          </motion.div>

          {/* Now Playing Area */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={clsx(
              "flex-1 flex min-h-[200px]",
              isDj ? "items-start" : "items-center justify-center"
            )}
          >
            <div className="w-full max-w-2xl">
              <NowPlaying 
                songTitle="Blinding Lights"
                artist="The Weeknd"
                currentTime="2:35"
                duration="3:45"
                progress={68}
                status="playing"
              />
            </div>
          </motion.div>

          {/* Bottom Actions Area */}
          <div className="flex flex-col gap-6 items-center">
            
            {/* Attendee: Voting */}
            {!isDj && (
              <div className="flex gap-6 justify-center w-full">
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="w-20 h-20 md:w-24 md:h-24 bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-lg flex items-center justify-center text-white transition-colors"
                   onClick={() => toast.success("Voted Up!")}
                 >
                   <ThumbsUp size={36} fill="currentColor" />
                 </motion.button>
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   className="w-20 h-20 md:w-24 md:h-24 bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg flex items-center justify-center text-white transition-colors"
                   onClick={() => toast.success("Voted Down!")}
                 >
                   <ThumbsDown size={36} fill="currentColor" />
                 </motion.button>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(isDj ? 'dj-song-select' : 'attendee-song-select')}
                className="flex-1 h-14 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 font-semibold text-lg transition-colors"
              >
                <Plus size={22} /> Queue Song
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(isDj ? 'dj-login' : 'attendee-login')}
                className="flex-1 h-14 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 font-semibold text-lg transition-colors"
              >
                <LogOut size={22} /> Leave Party
              </motion.button>

              {/* Settings (DJ Only) */}
              {isDj && (
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('dj-settings')}
                  className="w-14 h-14 bg-slate-600 hover:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center text-white flex-shrink-0 transition-colors"
                >
                  <Settings size={24} />
                </motion.button>
              )}
            </div>

          </div>

        </div>
      </div>
    </Layout>
  );
}