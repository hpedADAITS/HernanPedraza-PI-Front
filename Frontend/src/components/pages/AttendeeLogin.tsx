import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PageTransition } from '../shared/PageTransition';
import { AnimatedButton } from '../shared/AnimatedButton';

export function AttendeeLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleQRScan = () => {
    setIsLoading(true);
    // Simulate QR code scan
    setTimeout(() => {
      login('attendee', 'Attendee User');
      setIsLoading(false);
      navigate('/attendee/dashboard');
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        {/* Logo */}
        <div className="mb-12 text-center animate-fade-in-down">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">SyncRequest</h1>
          <p className="text-slate-600">Join the Event</p>
        </div>

        {/* QR Code Container */}
        <div className="animate-fade-in-up animation-delay-200">
          <div className="bg-white p-4 rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center relative overflow-hidden">
              {/* QR Code Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=https://syncrequest.app/join&color=000000&bgcolor=ffffff&margin=10"
                  alt="Scan to Join"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <p className="text-center text-slate-600 mt-4 text-sm">
              Scan the QR code with your phone to join
            </p>

            {/* Testing Button */}
            <AnimatedButton
              onClick={handleQRScan}
              disabled={isLoading}
              className="w-full mt-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? 'Joining...' : 'Simulate QR Scan'}
            </AnimatedButton>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate('/role')}
          className="mt-8 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
        >
          ← Back to Role Selection
        </button>
      </div>
    </PageTransition>
  );
}
