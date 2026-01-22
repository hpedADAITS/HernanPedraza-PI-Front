import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Play, Pause, Volume2, Radio } from 'lucide-react';
import { PageTransition } from '../shared/PageTransition';

export function DjDashboard() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);

  const currentSong = {
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    progress: 65,
    duration: 3.2,
  };

  const queue = [
    { id: 1, title: 'Anti-Hero', artist: 'Taylor Swift', requestedBy: 'User123', priority: 'high' },
    { id: 2, title: 'Levitating', artist: 'Dua Lipa', requestedBy: 'User456', priority: 'normal' },
    { id: 3, title: 'Uptown Funk', artist: 'Bruno Mars ft. Mark Ronson', requestedBy: 'User789', priority: 'high' },
    { id: 4, title: 'Good as Hell', artist: 'Lizzo', requestedBy: 'User012', priority: 'normal' },
  ];

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-down">
          <h1 className="text-3xl font-bold text-slate-900">DJ Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage and play music • Live to 284 attendees</p>
        </div>

        {/* Now Playing Card */}
        <div className="animate-fade-in-up animation-delay-100 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <p className="text-sm opacity-80 mb-2">NOW PLAYING</p>
              <h2 className="text-3xl font-bold mb-2">{currentSong.title}</h2>
              <p className="text-lg opacity-80 mb-6">{currentSong.artist}</p>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse"
                    style={{ width: `${currentSong.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs opacity-70 mt-2">
                  <span>2:06</span>
                  <span>3:20</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <Volume2 size={24} />
                </button>
              </div>
            </div>

            {/* Album Art Placeholder */}
            <div className="w-48 h-48 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg shadow-2xl flex items-center justify-center">
              <Music size={80} opacity={0.3} />
            </div>
          </div>
        </div>

        {/* Queue Section */}
        <div className="animate-fade-in-up animation-delay-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Song Queue ({queue.length})</h2>
            <button
              onClick={() => navigate('/dj/songs')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Add Songs
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y">
              {queue.map((song, idx) => (
                <div
                  key={song.id}
                  className="p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-500">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-slate-900">{song.title}</p>
                          <p className="text-sm text-slate-600">{song.artist}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Requested by {song.requestedBy}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
                      song.priority === 'high'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {song.priority === 'high' ? '⭐ Priority' : 'Normal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="animate-fade-in-up animation-delay-300 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-slate-600">Uptime</p>
            <p className="text-2xl font-bold text-slate-900">2h 34m</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-slate-600">Songs Played</p>
            <p className="text-2xl font-bold text-slate-900">38</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-slate-600">Requests</p>
            <p className="text-2xl font-bold text-slate-900">156</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
