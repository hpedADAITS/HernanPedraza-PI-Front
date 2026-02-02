import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Logo } from '../components/ui/Logo';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  onNavigate: (view: any) => void;
}

export function AttendeeLogin({ onNavigate }: Props) {
  return (
    <Layout theme="green" className="items-center justify-center min-h-screen">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <Logo />
      </motion.div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring' }}
        className="bg-white p-3 rounded-[24px] shadow-2xl shadow-black/10 max-w-sm w-72 md:w-80 aspect-square flex items-center justify-center relative"
      >
        <img 
          src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://syncrequest.app/join&color=000000&bgcolor=ffffff&margin=10" 
          alt="Scan to Join"
          className="w-full h-full object-contain rounded-xl rendering-pixelated" 
        />
      </motion.div>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onNavigate('attendee-dashboard')}
        className="mt-8 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center gap-3 text-xl font-bold transition-colors"
      >
        Enter Event
        <ArrowRight size={24} />
      </motion.button>

      {/* Back Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.95 }}
           onClick={() => onNavigate('role-selection')}
           className="bg-white px-8 py-4 rounded-full shadow-xl shadow-black/10 text-xl font-light text-slate-800 flex items-center gap-2 border border-slate-100"
        >
          <ArrowLeft size={20} />
          Back
        </motion.button>
      </div>
    </Layout>
  );
}