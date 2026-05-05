import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, clearToken } from '@/services/api';
import { disconnectSocket, getSocket } from '@/services/socket';

interface Props {
  onNavigate: (view: any) => void;
}

type MediaQuality = 'low' | 'medium' | 'high' | 'auto';

interface SocialPrefs {
  showDisplayName: boolean;
  showProfilePicture: boolean;
  allowFriendRequests: boolean;
}

const MEDIA_QUALITY_OPTIONS: { value: MediaQuality; label: string }[] = [
  { value: 'auto', label: 'Auto (recommended)' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low (data saver)' },
];

const DEFAULT_SOCIAL_PREFS: SocialPrefs = {
  showDisplayName: true,
  showProfilePicture: true,
  allowFriendRequests: true,
};

export function SettingsList({ onNavigate }: Props) {
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showMediaQualityModal, setShowMediaQualityModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [mediaQuality, setMediaQuality] = useState<MediaQuality>('auto');
  const [socialPrefs, setSocialPrefs] =
    useState<SocialPrefs>(DEFAULT_SOCIAL_PREFS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedQuality = localStorage.getItem(
      'mediaQuality',
    ) as MediaQuality | null;
    if (
      storedQuality &&
      MEDIA_QUALITY_OPTIONS.some((o) => o.value === storedQuality)
    ) {
      setMediaQuality(storedQuality);
    }
    const storedSocial = localStorage.getItem('socialPrefs');
    if (storedSocial) {
      try {
        setSocialPrefs({ ...DEFAULT_SOCIAL_PREFS, ...JSON.parse(storedSocial) });
      } catch {}
    }
  }, []);

  const handleSelectMediaQuality = (value: MediaQuality) => {
    setMediaQuality(value);
    localStorage.setItem('mediaQuality', value);
    toast.success(`Media quality set to ${value}`);
    setShowMediaQualityModal(false);
  };

  const handleToggleSocial = (key: keyof SocialPrefs) => {
    const next = { ...socialPrefs, [key]: !socialPrefs[key] };
    setSocialPrefs(next);
    localStorage.setItem('socialPrefs', JSON.stringify(next));
  };

  const handleDisplayName = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setNewDisplayName(parsed.displayName || '');
      } catch {}
    }
    setShowNameModal(true);
  };

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim() || newDisplayName.trim().length < 2) {
      toast.error('Display name must be at least 2 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.updateProfile({ displayName: newDisplayName.trim() });
      const user = localStorage.getItem('user');
      const parsed = user ? JSON.parse(user) : {};
      parsed.displayName = newDisplayName.trim();
      localStorage.setItem('user', JSON.stringify(parsed));
      toast.success('Display name updated');
      setShowNameModal(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update display name',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    clearToken();
    disconnectSocket();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentEvent');
    localStorage.removeItem('currentParticipant');
    toast.success('Signed out');
    onNavigate('role-selection');
  };

  const getDebugInfo = () => {
    const hasToken = !!localStorage.getItem('authToken');
    const eventData = localStorage.getItem('currentEvent');
    const participantData = localStorage.getItem('currentParticipant');
    let eventId = 'None';
    let participantId = 'None';
    try {
      if (eventData) eventId = JSON.parse(eventData).eventId || 'None';
    } catch {}
    try {
      if (participantData)
        participantId = JSON.parse(participantData)._id || 'None';
    } catch {}
    const socketConnected = getSocket()?.connected || false;

    return { hasToken, eventId, participantId, socketConnected };
  };

  const handleItemClick = (item: string) => {
    switch (item) {
      case 'Display Name Visibility':
        handleDisplayName();
        break;
      case 'Media Quality':
        setShowMediaQualityModal(true);
        break;
      case 'Social Settings':
        setShowSocialModal(true);
        break;
      case 'Debug / Diagnostics':
        setShowDebugModal(true);
        break;
      case 'Sign Out':
        handleSignOut();
        break;
    }
  };

  const SETTINGS_ITEMS = [
    'Display Name Visibility',
    'Media Quality',
    'Social Settings',
    'Debug / Diagnostics',
    'Sign Out',
  ];

  const debugInfo = getDebugInfo();

  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full flex flex-col items-center mt-8"
      >
        <h1 className="text-5xl font-light text-slate-800 text-center mb-8">
          Account Settings
        </h1>

        <div className="w-full max-w-lg relative mb-16">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">
            <Search size={24} />
          </div>
          <input
            type="text"
            placeholder="Search settings..."
            className="w-full h-16 pl-16 pr-6 rounded-2xl shadow-lg bg-white border-none outline-none text-xl transition-all"
          />
        </div>

        <div className="w-full max-w-2xl flex flex-col gap-4">
          {SETTINGS_ITEMS.map((item, index) => (
            <motion.button
              key={item}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, backgroundColor: '#f8fafc' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleItemClick(item)}
              className="bg-white h-20 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-xl font-light text-slate-700 hover:shadow-md transition-all"
            >
              {item}
            </motion.button>
          ))}
        </div>

        <div className="fixed bottom-8 right-8 z-50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('dj-settings')}
            className="bg-white px-8 py-4 rounded-full shadow-xl text-xl font-light text-slate-800 flex items-center gap-2"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showNameModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNameModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Change Display Name
                </h2>
                <button
                  onClick={() => setShowNameModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="New display name"
                className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none text-lg text-slate-700 focus:ring-2 focus:ring-blue-300 mb-4"
              />
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNameModal(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveDisplayName}
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDebugModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDebugModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Debug Info</h2>
                <button
                  onClick={() => setShowDebugModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="space-y-3 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Auth Token:</span>
                  <span
                    className={
                      debugInfo.hasToken ? 'text-green-600' : 'text-red-500'
                    }
                  >
                    {debugInfo.hasToken ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Event ID:</span>
                  <span className="text-slate-700 truncate max-w-[180px]">
                    {debugInfo.eventId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Participant ID:</span>
                  <span className="text-slate-700 truncate max-w-[180px]">
                    {debugInfo.participantId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Socket:</span>
                  <span
                    className={
                      debugInfo.socketConnected
                        ? 'text-green-600'
                        : 'text-red-500'
                    }
                  >
                    {debugInfo.socketConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDebugModal(false)}
                className="w-full mt-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-medium transition-colors"
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMediaQualityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMediaQualityModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Media Quality
                </h2>
                <button
                  onClick={() => setShowMediaQualityModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {MEDIA_QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectMediaQuality(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      mediaQuality === opt.value
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSocialModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSocialModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Social Settings
                </h2>
                <button
                  onClick={() => setShowSocialModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {(
                  [
                    ['showDisplayName', 'Show display name'],
                    ['showProfilePicture', 'Show profile picture'],
                    ['allowFriendRequests', 'Allow friend requests'],
                  ] as [keyof SocialPrefs, string][]
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50"
                  >
                    <span className="text-slate-700">{label}</span>
                    <input
                      type="checkbox"
                      checked={socialPrefs[key]}
                      onChange={() => handleToggleSocial(key)}
                      className="h-5 w-5 accent-blue-500"
                    />
                  </label>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSocialModal(false)}
                className="w-full mt-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-medium transition-colors"
              >
                Done
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
