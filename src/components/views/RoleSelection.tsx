import React from 'react';
import { Layout } from '../layout/Layout';
import { Logo } from '../ui/Logo';
import { motion } from 'motion/react';
import { User, Headphones } from 'lucide-react';

interface Props {
  onNavigate: (view: any) => void;
}

export function RoleSelection({ onNavigate }: Props) {
  return (
    <Layout theme="white" className="items-center justify-center min-h-screen">
      
      <div className="flex flex-col items-center gap-16 md:gap-24 -mt-12 scale-90 md:scale-100">
        
        {/* Logo */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Logo variant="color" />
        </motion.div>

        {/* Cards Container */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          
          {/* Attendee Card */}
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('attendee-login')}
            className="group relative w-72 h-80 rounded-xl overflow-hidden shadow-xl shadow-emerald-900/10 transition-all hover:shadow-2xl hover:shadow-emerald-900/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#77c76e] to-[#38997a]" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            
            <div className="relative h-full flex flex-col items-center justify-center gap-8 p-6 text-white">
              <h2 className="text-3xl font-normal tracking-wide">Attendee</h2>
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30">
                <User size={80} strokeWidth={1.5} fill="currentColor" className="text-white" />
              </div>
            </div>
          </motion.button>

          {/* DJ Card */}
          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('dj-login')}
            className="group relative w-72 h-80 rounded-xl overflow-hidden shadow-xl shadow-blue-900/10 transition-all hover:shadow-2xl hover:shadow-blue-900/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#4ca0f1] to-[#61c8fa]" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
            
            <div className="relative h-full flex flex-col items-center justify-center gap-8 p-6 text-white">
              <h2 className="text-3xl font-normal tracking-wide">DJ</h2>
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30">
                <Headphones size={80} strokeWidth={1.5} className="text-white" />
              </div>
            </div>
          </motion.button>

        </div>
      </div>
    </Layout>
  );
}
