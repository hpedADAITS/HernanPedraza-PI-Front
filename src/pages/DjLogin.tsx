import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Logo } from '../components/ui/Logo';
import { motion } from 'motion/react';
import { User, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { authAPI } from '../services/api';

interface Props {
  onNavigate: (view: any) => void;
}

export function DjLogin({ onNavigate }: Props) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authAPI.login(email, password);
      const displayName = result.user?.displayName || 'DJ';
      
      // Store user data in localStorage for dashboard
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        // Store event code (for demo, using default)
        localStorage.setItem('currentEvent', JSON.stringify({
          eventCode: 'PARTY2024',
          ownerName: result.user.displayName
        }));
      }
      
      toast.success(`Welcome back, ${displayName}!`);
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
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-16 scale-90 md:scale-100"
      >
        <Logo />
      </motion.div>

      <motion.form 
        onSubmit={handleLogin}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-[400px] px-6 flex flex-col gap-5"
      >
        {/* Email Input */}
         <div className="relative group">
           <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none">
             <User size={26} strokeWidth={2} />
           </div>
           <input 
             type="email" 
             placeholder="Email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             className="w-full h-16 pl-16 pr-6 rounded-2xl bg-white shadow-lg shadow-blue-900/5 border-none outline-none text-lg text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50 transition-all"
           />
         </div>

         {/* Password Input */}
         <div className="relative group">
           <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none">
             <Lock size={26} strokeWidth={2} />
           </div>
           <input 
             type="password" 
             placeholder="Password"
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             className="w-full h-16 pl-16 pr-6 rounded-2xl bg-white shadow-lg shadow-blue-900/5 border-none outline-none text-lg text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50 transition-all"
           />
         </div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="h-14 mt-8 bg-slate-500 hover:bg-slate-600 text-white rounded-[10px] shadow-lg shadow-slate-900/20 text-lg font-medium tracking-wide flex items-center justify-center transition-all w-[160px] mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Login"
          )}
        </motion.button>

      </motion.form>

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
