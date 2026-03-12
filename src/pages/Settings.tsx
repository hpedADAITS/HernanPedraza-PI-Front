import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'motion/react';
import { Search, User, Settings as SettingsIcon } from 'lucide-react';

interface Props {
  onNavigate: (view: any) => void;
}

export function Settings({ onNavigate }: Props) {
  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full flex flex-col items-center mt-8"
      >
        <h1 className="text-5xl font-light text-[rgb(255,255,255)] text-center mb-8">Settings</h1>

        <div className="w-full max-w-lg relative mb-16">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={24} />
          </div>
          <input 
            type="text" 
            placeholder=""
            className="w-full h-16 pl-16 pr-6 rounded-2xl shadow-lg bg-white border-none outline-none text-xl transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('dj-account-settings')}
            className="bg-white rounded-2xl h-32 md:h-24 shadow-md flex items-center justify-center text-xl font-bold text-slate-700 hover:shadow-xl transition-all"
          >
            Account Settings
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('dj-app-settings')}
            className="bg-white rounded-2xl h-32 md:h-24 shadow-md flex items-center justify-center text-xl font-bold text-slate-700 hover:shadow-xl transition-all"
          >
            App Settings
          </motion.button>

          <motion.button
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => onNavigate('dj-account-settings')}
             className="bg-white rounded-2xl aspect-square shadow-md flex items-center justify-center text-slate-200 hover:shadow-xl transition-all"
          >
            <User size={80} />
          </motion.button>

          <motion.button
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={() => onNavigate('dj-app-settings')}
             className="bg-white rounded-2xl aspect-square shadow-md flex items-center justify-center text-slate-200 hover:shadow-xl transition-all"
          >
            <SettingsIcon size={80} />
          </motion.button>

        </div>

        <div className="fixed bottom-8 right-8 z-50">
          <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => onNavigate('dj-dashboard')}
             className="bg-white px-8 py-4 rounded-full shadow-xl text-xl font-light text-slate-800 flex items-center gap-2"
          >
            Cancel
          </motion.button>
        </div>

      </motion.div>
    </Layout>
  );
}
