import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onNavigate: (view: any) => void;
}

export function AppSettings({ onNavigate }: Props) {
  const [showMediaQuality, setShowMediaQuality] = useState(false);
  const [showSocialSettings, setShowSocialSettings] = useState(false);
  const [mediaQuality, setMediaQuality] = useState('high');
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);

  const handleMediaQualitySave = () => {
    localStorage.setItem('mediaQuality', mediaQuality);
    toast.success(`Media quality set to ${mediaQuality}`);
    setShowMediaQuality(false);
  };

  const handleSocialSettingsSave = () => {
    localStorage.setItem(
      'allowNotifications',
      JSON.stringify(allowNotifications),
    );
    localStorage.setItem('allowSharing', JSON.stringify(allowSharing));
    toast.success('Social settings updated');
    setShowSocialSettings(false);
  };

  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full flex flex-col items-center mt-8"
      >
        <h1 className="text-5xl font-light text-[rgb(255,255,255)] text-center mb-8">
          App Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMediaQuality(true)}
            className="bg-white rounded-2xl h-32 md:h-24 shadow-md flex items-center justify-center text-xl font-bold text-slate-700 hover:shadow-xl transition-all"
          >
            Media Quality
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSocialSettings(true)}
            className="bg-white rounded-2xl h-32 md:h-24 shadow-md flex items-center justify-center text-xl font-bold text-slate-700 hover:shadow-xl transition-all"
          >
            Social Settings
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMediaQuality(true)}
            className="bg-white rounded-2xl aspect-square shadow-md flex items-center justify-center text-slate-200 hover:shadow-xl transition-all"
          >
            <span className="text-6xl">🎵</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSocialSettings(true)}
            className="bg-white rounded-2xl aspect-square shadow-md flex items-center justify-center text-slate-200 hover:shadow-xl transition-all"
          >
            <span className="text-6xl">👥</span>
          </motion.button>
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
        {showMediaQuality && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMediaQuality(false)}
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
                  onClick={() => setShowMediaQuality(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                {['low', 'medium', 'high'].map((quality) => (
                  <label
                    key={quality}
                    className="flex items-center cursor-pointer hover:bg-slate-50 p-3 rounded-lg"
                  >
                    <input
                      type="radio"
                      name="quality"
                      value={quality}
                      checked={mediaQuality === quality}
                      onChange={(e) => setMediaQuality(e.target.value)}
                      className="w-5 h-5 text-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-slate-700 capitalize font-medium">
                      {quality}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowMediaQuality(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMediaQualitySave}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSocialSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSocialSettings(false)}
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
                  onClick={() => setShowSocialSettings(false)}
                  className="p-1 rounded-full hover:bg-slate-100"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <label className="flex items-center cursor-pointer hover:bg-slate-50 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={allowNotifications}
                    onChange={(e) => setAllowNotifications(e.target.checked)}
                    className="w-5 h-5 text-blue-500 rounded cursor-pointer"
                  />
                  <span className="ml-3 text-slate-700 font-medium">
                    Allow Notifications
                  </span>
                </label>
                <label className="flex items-center cursor-pointer hover:bg-slate-50 p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={allowSharing}
                    onChange={(e) => setAllowSharing(e.target.checked)}
                    className="w-5 h-5 text-blue-500 rounded cursor-pointer"
                  />
                  <span className="ml-3 text-slate-700 font-medium">
                    Allow Sharing
                  </span>
                </label>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSocialSettings(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSocialSettingsSave}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  Save
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
