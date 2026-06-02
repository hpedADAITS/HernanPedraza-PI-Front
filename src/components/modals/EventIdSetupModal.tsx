import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';
import { t } from '@/i18n';

interface EventIdSetupModalProps {
  isOpen: boolean;
  onConfirm: (eventId: string) => void;
  displayName: string;
}

const createRandomEventId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

type EventIdSetupState = {
  eventId: string;
  generatedId: string;
  mode: 'input' | 'generated';
};

const getInitialEventIdSetupState = (): EventIdSetupState => ({
  eventId: '',
  generatedId: createRandomEventId(),
  mode: 'generated',
});

export function EventIdSetupModal({
  isOpen,
  onConfirm,
  displayName,
}: EventIdSetupModalProps) {
  const [{ eventId, generatedId, mode }, setSetupState] = useState(getInitialEventIdSetupState);
  const [loading, setLoading] = useState(false);

  const generateRandomId = () => {
    setSetupState((current) => ({
      ...current,
      generatedId: createRandomEventId(),
      mode: 'generated',
    }));
  };

  useEffect(() => {
    if (!isOpen) return;
    setSetupState(getInitialEventIdSetupState());
  }, [isOpen]);

  const handleConfirm = async () => {
    const finalEventId = mode === 'generated' ? generatedId : eventId.trim();

    if (!finalEventId) {
      toast.error(t('Please enter or generate an Event ID'));
      return;
    }

    if (finalEventId.length < 4 || finalEventId.length > 20) {
      toast.error(t('Event ID must be between 4 and 20 characters'));
      return;
    }

    setLoading(true);
    try {
      onConfirm(finalEventId);
    } catch (error) {
      toast.error(t('Failed to create event'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <m.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-blue-500/30"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('Create Your Event ID')}
            </h2>
            <p className="text-blue-200 text-sm mb-6">
              {t('Attendees will use this to join your event. You can customize it or use a generated one.')}
            </p>

            <div className="space-y-4 mb-6">
              <m.div
                initial={false}
                animate={{
                  opacity: mode === 'generated' ? 1 : 0.5,
                  scale: mode === 'generated' ? 1 : 0.98,
                }}
              >
                <div
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    mode === 'generated'
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSetupState((current) => ({ ...current, mode: 'generated' }))}
                      className="text-left"
                    >
                      <p className="font-semibold text-white">{t('Generated ID')}</p>
                      <p className="text-blue-300 font-mono text-lg mt-1">
                        {generatedId}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        generateRandomId();
                      }}
                      aria-label={t('Generate a new event ID')}
                      className="p-2 hover:bg-blue-500/20 rounded-lg transition"
                      title={t('Generate new ID')}
                    >
                      <RefreshCw size={18} className="text-blue-400" />
                    </button>
                  </div>
                </div>
              </m.div>

              <m.div
                initial={false}
                animate={{
                  opacity: mode === 'input' ? 1 : 0.5,
                  scale: mode === 'input' ? 1 : 0.98,
                }}
              >
                <div
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    mode === 'input'
                      ? 'border-blue-400 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSetupState((current) => ({ ...current, mode: 'input' }))}
                    className="font-semibold text-white mb-3 text-left"
                  >
                    {t('Custom Event ID')}
                  </button>
                  <input
                    type="text"
                    aria-label={t('Custom event ID')}
                    placeholder={t('e.g., DJPARTY2024')}
                    value={eventId}
                    onChange={(e) =>
                      setSetupState((current) => ({
                        ...current,
                        eventId: e.target.value.toUpperCase().slice(0, 20),
                      }))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-slate-700/50 text-white placeholder-slate-400 rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-400 focus:outline-none"
                    maxLength={20}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {t('Use letters and numbers only, 4-20 characters')}
                  </p>
                </div>
              </m.div>
            </div>

            <div className="space-y-3">
              <m.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <Check size={18} />
                {loading ? t('Creating Event…') : t('Create Event')}
              </m.button>
              <p className="text-xs text-slate-400 text-center">
                {t('Your Event ID')}: <span className="font-mono text-blue-300">
                  {mode === 'generated' ? generatedId : eventId || '---'}
                </span>
              </p>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
