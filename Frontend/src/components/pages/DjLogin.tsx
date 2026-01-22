import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Lock } from 'lucide-react';
import { PageTransition } from '../shared/PageTransition';
import { AnimatedButton } from '../shared/AnimatedButton';

export function DjLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (username === 'demo' && password === 'password') {
        login('dj', username);
        navigate('/dj/dashboard');
      } else {
        setError('Invalid credentials. Try demo/password');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
        {/* Logo */}
        <div className="mb-12 text-center animate-fade-in-down">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">SyncRequest</h1>
          <p className="text-slate-600">DJ Login</p>
        </div>

        {/* Login Form */}
        <div className="animate-fade-in-up animation-delay-200 w-full max-w-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full h-12 pl-12 pr-4 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-12 pl-12 pr-4 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <AnimatedButton
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-6 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </AnimatedButton>

              {/* Demo Credentials */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-slate-600">
                <p className="font-semibold mb-1">Demo Credentials:</p>
                <p>Username: <span className="font-mono">demo</span></p>
                <p>Password: <span className="font-mono">password</span></p>
              </div>
            </form>
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
