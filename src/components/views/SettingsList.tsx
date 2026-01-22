import React from 'react';
import { Layout } from '../layout/Layout';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

interface Props {
  onNavigate: (view: any) => void;
}

const SETTINGS_ITEMS = [
  "Display Name Visibility",
  "Media Quality",
  "Social Settings",
  "Debug / Diagnostics",
  "Sign Out"
];

export function SettingsList({ onNavigate }: Props) {
  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full flex flex-col items-center mt-8"
      >
        <h1 className="text-5xl font-light text-slate-800 text-center mb-8">Account Settings</h1>

        {/* Search Bar */}
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

        {/* List */}
        <div className="w-full max-w-2xl flex flex-col gap-4">
          {SETTINGS_ITEMS.map((item, index) => (
            <motion.button
              key={item}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, backgroundColor: '#f8fafc' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => item === "Sign Out" ? onNavigate('dj-login') : null}
              className="bg-white h-20 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-xl font-light text-slate-700 hover:shadow-md transition-all"
            >
              {item}
            </motion.button>
          ))}
        </div>

        {/* Cancel Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => onNavigate('dj-settings')}
             className="bg-white px-8 py-4 rounded-full shadow-xl text-xl font-light text-slate-800 flex items-center gap-2"
          >
            Cancel
          </motion.button>
        </div>

      </motion.div>
    </Layout>
  );
}
