import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Clock, Users, Zap } from 'lucide-react';
import { PageTransition } from '../shared/PageTransition';
import { AnimatedButton } from '../shared/AnimatedButton';

export function AttendeeDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const stats = [
    { icon: Music, label: 'Requested Songs', value: '3', color: 'from-emerald-400 to-teal-600' },
    { icon: Clock, label: 'Songs in Queue', value: '12', color: 'from-blue-400 to-cyan-600' },
    { icon: Users, label: 'Attendees', value: '284', color: 'from-purple-400 to-pink-600' },
    { icon: Zap, label: 'Energy Level', value: 'High', color: 'from-yellow-400 to-orange-600' },
  ];

  const recentRequests = [
    { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', status: 'Playing' },
    { id: 2, title: 'Anti-Hero', artist: 'Taylor Swift', status: 'Queued' },
    { id: 3, title: 'Levitating', artist: 'Dua Lipa', status: 'Queued' },
  ];

  const handleRequestSong = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/attendee/songs');
      setIsLoading(false);
    }, 500);
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in-down">
          <h1 className="text-3xl font-bold text-slate-900">Event Dashboard</h1>
          <p className="text-slate-600 mt-1">Live Event • 02:34 remaining</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up animation-delay-100">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`bg-gradient-to-br ${stat.color} rounded-lg p-4 text-white shadow-lg hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon size={32} opacity={0.3} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <div className="lg:col-span-2 animate-fade-in-up animation-delay-200">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Requests</h2>
              <div className="space-y-3">
                {recentRequests.map((request, idx) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{request.title}</p>
                      <p className="text-sm text-slate-600">{request.artist}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.status === 'Playing'
                        ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>

              <AnimatedButton
                onClick={handleRequestSong}
                disabled={isLoading}
                className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Loading...' : '+ Request a Song'}
              </AnimatedButton>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="animate-fade-in-up animation-delay-300">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Event Info</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600">Event Name</p>
                  <p className="font-medium text-slate-900">Summer Festival 2024</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Current DJ</p>
                  <p className="font-medium text-slate-900">DJ Awesome</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Location</p>
                  <p className="font-medium text-slate-900">Central Park</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-slate-600">Next Event</p>
                  <p className="font-medium text-slate-900">Tomorrow, 8:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Example */}
        <div className="animate-fade-in-up animation-delay-400 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
          <p className="text-blue-700 text-sm">
            Request your favorite songs now! Popular requests will appear first in the DJ queue.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
