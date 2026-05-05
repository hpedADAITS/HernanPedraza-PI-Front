import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { QrCode } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PROFILE_IMAGE, THEME_CONFIG } from '@/constants/dashboard';
import { SLIDE_IN_LEFT } from '@/constants/animations';
import { QRCodeModal } from './QRCodeModal';

interface ProfileCardProps {
  mode: 'attendee' | 'dj';
  userName?: string;
  djName?: string;
  joinedAt?: Date | string;
  accessCode?: string;
  eventId?: string;
  onAccessCodeChange?: (newCode: string) => void;
}

export function ProfileCard({
  mode,
  userName = 'Lucas',
  djName = 'DJ',
  accessCode = 'PARTY2024',
  eventId,
  onAccessCodeChange,
}: ProfileCardProps) {
  const isDj = mode === 'dj';
  const config = THEME_CONFIG[isDj ? 'dj' : 'attendee'];
  const [showQRModal, setShowQRModal] = useState(false);

  const subtitle = useMemo(() => {
    if (isDj) return 'DJ on SyncRequest';
    return `DJ: ${djName}`;
  }, [isDj, djName]);

  return (
    <TooltipProvider>
      <>
        <motion.div
          {...SLIDE_IN_LEFT}
          className={clsx(
            'rounded-3xl p-6 shadow-xl text-white relative overflow-hidden',
            'min-h-[200px] flex flex-col items-center justify-center text-center',
            config.gradient,
          )}
        >
          {/* Glossy overlay */}
          <div className="absolute inset-0 bg-white/10" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className="relative overflow-visible">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner overflow-hidden border border-white/30 flex items-center justify-center">
                <img
                  src={PROFILE_IMAGE}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* QR Code Button (DJ only) - Bottom right corner of avatar */}
              {isDj && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowQRModal(true)}
                      className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-colors border-2 border-white animate-pulse"
                    >
                      <QrCode size={18} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>Generate QR Code</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* User Info */}
            <div>
              <h2 className="text-2xl font-bold">{userName}</h2>
              <p className="text-white/80 text-sm font-medium">{subtitle}</p>
            </div>
          </div>
        </motion.div>

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={showQRModal}
          accessCode={accessCode}
          onClose={() => setShowQRModal(false)}
          isDj={isDj}
          eventId={eventId}
          onAccessCodeChange={onAccessCodeChange}
        />
      </>
    </TooltipProvider>
  );
}
