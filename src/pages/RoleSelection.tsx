import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Logo } from '../components/ui/Logo';
import { motion, AnimatePresence } from 'motion/react';
import { User, Headphones } from 'lucide-react';

interface Props {
  onNavigate: (view: any) => void;
  logoWhite: boolean;
  onLogoChange: (white: boolean) => void;
}

export function RoleSelection({ onNavigate, logoWhite, onLogoChange }: Props) {
  const [expandingCircle, setExpandingCircle] = useState<{ x: number; y: number; color: string } | null>(null);

  const handleRoleClick = (role: 'attendee' | 'dj', event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const color = role === 'attendee' 
      ? 'linear-gradient(135deg, #77c76e 0%, #38997a 100%)'
      : 'linear-gradient(135deg, #4ca0f1 0%, #61c8fa 100%)';
    
    setExpandingCircle({ x, y, color });
    
    setTimeout(() => {
      onLogoChange(true);
      onNavigate(role === 'attendee' ? 'attendee-login' : 'dj-login');
      setExpandingCircle(null);
    }, 400);
  };

  return (
    <Layout theme="white" className="items-center justify-center min-h-screen">
      
      <div className="flex flex-col items-center gap-16 md:gap-24 -mt-12 scale-90 md:scale-100">
        
        {/* Logo */}
        <motion.div 
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Logo variant="color" useWhite={logoWhite} />
        </motion.div>

        {/* Cards Container */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          
          {/* Attendee Card */}
          <motion.button
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ scale: 1.03, y: -5, transition: { duration: 0.15, ease: "easeOut" } }}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
            onClick={(e) => handleRoleClick('attendee', e)}
            className="group relative w-72 h-80 rounded-xl overflow-hidden shadow-xl shadow-emerald-900/10 hover:shadow-2xl hover:shadow-emerald-900/20 transition-shadow duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#77c76e] to-[#38997a]" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-150" />
            
            <div className="relative h-full flex flex-col items-center justify-center gap-8 p-6 text-white">
              <h2 className="text-3xl font-normal tracking-wide">Attendee</h2>
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30">
                <User size={80} strokeWidth={1.5} fill="currentColor" className="text-white" />
              </div>
            </div>
          </motion.button>

          {/* DJ Card */}
          <motion.button
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ scale: 1.03, y: -5, transition: { duration: 0.15, ease: "easeOut" } }}
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
            onClick={(e) => handleRoleClick('dj', e)}
            className="group relative w-72 h-80 rounded-xl overflow-hidden shadow-xl shadow-blue-900/10 hover:shadow-2xl hover:shadow-blue-900/20 transition-shadow duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#4ca0f1] to-[#61c8fa]" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-150" />
            
            <div className="relative h-full flex flex-col items-center justify-center gap-8 p-6 text-white">
              <h2 className="text-3xl font-normal tracking-wide">DJ</h2>
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30">
                <Headphones size={80} strokeWidth={1.5} className="text-white" />
              </div>
            </div>
          </motion.button>

        </div>
      </div>

      {/* Expanding Circle Transition */}
      <AnimatePresence>
        {expandingCircle && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 50 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{
              position: 'fixed',
              left: expandingCircle.x,
              top: expandingCircle.y,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: expandingCircle.color,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}