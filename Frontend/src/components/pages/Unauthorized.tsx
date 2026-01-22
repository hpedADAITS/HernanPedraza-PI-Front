import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { PageTransition } from '../shared/PageTransition';

export function Unauthorized() {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center animate-fade-in-up">
          <Lock size={64} className="mx-auto text-orange-500 mb-6" />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Unauthorized</h1>
          <h2 className="text-2xl font-semibold text-slate-700 mb-4">Access Denied</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            You don't have permission to access this page. Please log in with the correct account.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/role')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            >
              Back to Login
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-slate-300 hover:bg-slate-400 text-slate-900 rounded-lg font-semibold transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
