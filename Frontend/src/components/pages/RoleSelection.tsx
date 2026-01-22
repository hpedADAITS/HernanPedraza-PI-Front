import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Headphones } from 'lucide-react';
import { PageTransition } from '../shared/PageTransition';
import { AnimatedButton } from '../shared/AnimatedButton';

export function RoleSelection() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 p-4">
        {/* Logo */}
        <div className="mb-20 text-center animate-fade-in-down">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">SyncRequest</h1>
          <p className="text-slate-600">Event DJ Platform</p>
        </div>

        {/* Role Selection Cards */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Attendee Card */}
          <AnimatedButton
            onClick={() => navigate('/login/attendee')}
            delay={0.2}
            className="group relative w-64 h-72 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600"></div>
            <div className="relative h-full flex flex-col items-center justify-center gap-6 text-white p-6">
              <h2 className="text-2xl font-semibold">Attendee</h2>
              <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <User size={64} strokeWidth={1.5} />
              </div>
              <p className="text-sm text-white/80">Request songs from DJs</p>
            </div>
          </AnimatedButton>

          {/* DJ Card */}
          <AnimatedButton
            onClick={() => navigate('/login/dj')}
            delay={0.4}
            className="group relative w-64 h-72 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-600"></div>
            <div className="relative h-full flex flex-col items-center justify-center gap-6 text-white p-6">
              <h2 className="text-2xl font-semibold">DJ</h2>
              <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Headphones size={64} strokeWidth={1.5} />
              </div>
              <p className="text-sm text-white/80">Manage and play music</p>
            </div>
          </AnimatedButton>
        </div>
      </div>
    </PageTransition>
  );
}
