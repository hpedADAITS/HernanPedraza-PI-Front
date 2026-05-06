import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface EventIdSetupModalProps {
  isOpen: boolean;
  onConfirm: (eventId: string) => void;
  displayName: string;
}

export function EventIdSetupModal({
  isOpen,
  onConfirm,
  displayName,
}: EventIdSetupModalProps) {
  const [eventId, setEventId] = useState('');
  const [generatedId, setGeneratedId] = useState('');
  const [mode, setMode] = useState<'input' | 'generated'>('generated');
  const [loading, setLoading] = useState(false);

  const generateRandomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedId(id);
    setMode('generated');
  };

  React.useEffect(() => {
    if (isOpen) {
      generateRandomId();
      setEventId('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    const finalEventId = mode === 'generated' ? generatedId : eventId.trim();

    if (!finalEventId) {
      toast.error('Please enter or generate an Event ID');
      return;
    }

    if (finalEventId.length < 4 || finalEventId.length > 20) {
      toast.error('Event ID must be between 4 and 20 characters');
      return;
    }

    setLoading(true);
    try {
      onConfirm(finalEventId);
    } catch (error) {
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-blue-500/30"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Create Your Event ID
            </h2>
            <p className="text-blue-200 text-sm mb-6">
              Attendees will use this to join your event. You can customize it or use a generated one.
            </p>

            <div className="space-y-4 mb-6">
              {/* Generated ID Mode */}
              <motion.div
                initial={false}
                animate={{
                  opacity: mode === 'generated' ? 1 : 0.5,
                  scale: mode === 'generated' ? 1 : 0.98,
                }}
              >
                <button
                  onClick={() => setMode('generated')}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    mode === 'generated'
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="font-semibold text-white">Generated ID</p>
                      <p className="text-blue-300 font-mono text-lg mt-1">
                        {generatedId}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        generateRandomId();
                      }}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition"
                      title="Generate new ID"
                    >
                      <RefreshCw size={18} className="text-blue-400" />
                    </button>
                  </div>
                </button>
              </motion.div>

              {/* Custom ID Mode */}
              <motion.div
                initial={false}
                animate={{
                  opacity: mode === 'input' ? 1 : 0.5,
                  scale: mode === 'input' ? 1 : 0.98,
                }}
              >
                <button
                  onClick={() => setMode('input')}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    mode === 'input'
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                  }`}
                >
                  <p className="font-semibold text-white mb-3">Custom Event ID</p>
                  <input
                    type="text"
                    placeholder="e.g., DJPARTY2024"
                    value={eventId}
                    onChange={(e) =>
                      setEventId(e.target.value.toUpperCase().slice(0, 20))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-700/50 text-white placeholder-slate-400 rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-400 focus:outline-none"
                    maxLength={20}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Use letters and numbers only, 4-20 characters
                  </p>
                </button>
              </motion.div>
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <Check size={18} />
                {loading ? 'Creating Event...' : 'Create Event'}
              </motion.button>
              <p className="text-xs text-slate-400 text-center">
                Your Event ID: <span className="font-mono text-blue-300">
                  {mode === 'generated' ? generatedId : eventId || '---'}
                </span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
