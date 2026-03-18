import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
<<<<<<< Updated upstream
import { Logo } from '@/components/common';
=======
import { Logo } from '@/components/common/Logo';
>>>>>>> Stashed changes
import { motion } from 'motion/react';
import { User, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, eventsAPI } from '@/services/api';
import * as socket from '@/services/socket';

interface Props {
  onNavigate: (view: any) => void;
  logoWhite?: boolean;
  onLogoChange?: (white: boolean) => void;
}

export function DjLogin({ onNavigate, logoWhite = false, onLogoChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authAPI.login(email, password);
      const displayName = result.user?.displayName || 'DJ';

      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));

        let event;
        const events = await eventsAPI.listEvents();

        if (events && events.length > 0) {
          event = events[0];
        } else {
          event = await eventsAPI.createEvent(
            `${displayName}'s Party`,
            'Auto-created event',
            new Date().toISOString()
          );
        }

        const eventId = event._id || event.id;
        const eventCode = event.accessCode || event.access_code;

        localStorage.setItem('currentEvent', JSON.stringify({
          eventCode,
          eventId,
          ownerName: displayName
        }));

        localStorage.setItem('currentParticipant', JSON.stringify({
          _id: result.user._id || result.user.id,
          nickname: displayName,
          eventId
        }));
      }

      toast.success(`Welcome back, ${displayName}!`);
      socket.initSocket(result.authToken);
      onNavigate('dj-dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout theme="blue" className="items-center justify-center min-h-screen">
      <motion.div 
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="mb-16 scale-90 md:scale-100"
      >
        <Logo variant="light" useWhite={logoWhite} />
      </motion.div>

      <motion.form 
        onSubmit={handleLogin}
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[400px] px-6 flex flex-col gap-4"
      >
        {/* Email Input */}
         <div className="relative group">
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
             <User size={20} strokeWidth={2} />
           </div>
           <input 
             type="email" 
             placeholder="Email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             className="w-full h-12 pl-14 pr-4 rounded-lg bg-white shadow-md shadow-blue-900/5 border border-slate-200 outline-none text-base text-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
           />
         </div>

         {/* Password Input */}
         <div className="relative group">
           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
             <Lock size={20} strokeWidth={2} />
           </div>
           <input 
             type="password" 
             placeholder="Password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             className="w-full h-12 pl-14 pr-4 rounded-lg bg-white shadow-md shadow-blue-900/5 border border-slate-200 outline-none text-base text-slate-700 placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
           />
         </div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="h-11 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-900/20 text-base font-semibold tracking-normal flex items-center justify-center transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Login"
          )}
        </motion.button>

      </motion.form>

      {/* Back Button */}
      <div className="fixed bottom-8 right-6" style={{ zIndex: 999999 }}>
        <motion.button
           initial={{ opacity: 0, x: 12 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.15, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
           whileHover={{ scale: 1.04, transition: { duration: 0.12 } }}
           whileTap={{ scale: 0.96, transition: { duration: 0.08 } }}
           onClick={() => onNavigate('role-selection')}
           className="bg-white px-5 py-2.5 rounded-lg shadow-md shadow-black/10 text-sm font-medium text-slate-800 flex items-center gap-1.5 border border-slate-200 select-none pointer-events-auto cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back
        </motion.button>
      </div>
    </Layout>
  );
}
