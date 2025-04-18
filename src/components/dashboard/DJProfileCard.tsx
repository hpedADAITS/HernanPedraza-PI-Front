import React, { useState } from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { QrCode } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProfilePictureUpload, UserAvatar } from '@/components/common';
import {
  SettingsDialog,
  SettingsDialogActions,
  SettingsDialogButton,
} from '@/components/settings/SettingsUI';
import { PROFILE_IMAGE, THEME_CONFIG } from '@/constants/dashboard';
import { SLIDE_IN_LEFT } from '@/constants/animations';
import { QRCodeModal } from './QRCodeModal';

interface DJProfileCardProps {
  userName: string;
  profilePicture?: string | null;
  accessCode: string;
  eventId: string;
  onAccessCodeChange: (newCode: string) => void;
  onProfilePictureChange?: (newPicture: string) => void;
}

export function DJProfileCard({
  userName,
  profilePicture,
  accessCode,
  eventId,
  onAccessCodeChange,
  onProfilePictureChange,
}: DJProfileCardProps) {
  const config = THEME_CONFIG.dj;
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] =
    useState(false);

  return (
    <TooltipProvider>
      <>
        <motion.div
          {...SLIDE_IN_LEFT}
          className={clsx(
            'rounded-3xl p-6 lg:p-4 shadow-xl text-white relative overflow-hidden',
            'min-h-[200px] lg:min-h-[128px] flex flex-col items-center justify-center text-center',
            config.gradient,
          )}
        >
          {/* Glossy overlay */}
          <div className="absolute inset-0 bg-white/10" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-4 lg:gap-3">
            {/* Avatar */}
            <div className="relative overflow-visible">
              <button
                type="button"
                onClick={() => setShowProfilePictureModal(true)}
                className="block rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                aria-label="Upload profile picture"
              >
                <UserAvatar
                  name={userName}
                  profilePicture={profilePicture}
                  className="w-24 h-24 lg:w-16 lg:h-16 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/30 flex items-center justify-center transition-transform hover:scale-[1.02]"
                  fallbackClassName="flex items-center justify-center"
                  fallbackContent={
                    <img
                      src={PROFILE_IMAGE}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  }
                />
              </button>

              {/* QR Code Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowQRModal(true)}
                    className="absolute bottom-0 right-0 w-10 h-10 lg:w-8 lg:h-8 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-colors border-2 border-white animate-pulse"
                  >
                    <QrCode size={18} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>Generate QR Code</TooltipContent>
              </Tooltip>
            </div>

            {/* User Info */}
            <div>
              <h2 className="text-2xl lg:text-xl font-semibold">{userName}</h2>
              <p className="text-white/80 text-sm font-medium">DJ on SyncRequest</p>
            </div>
          </div>
        </motion.div>

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={showQRModal}
          accessCode={accessCode}
          onClose={() => setShowQRModal(false)}
          isDj={true}
          eventId={eventId}
          onAccessCodeChange={onAccessCodeChange}
        />

        <SettingsDialog
          open={showProfilePictureModal}
          title="Profile Picture"
          onClose={() => setShowProfilePictureModal(false)}
        >
          <div className="mb-6 flex justify-center">
            <ProfilePictureUpload
              currentPicture={profilePicture}
              onPictureUpdated={(newPicture) => {
                onProfilePictureChange?.(newPicture);
                setShowProfilePictureModal(false);
              }}
              size="lg"
            />
          </div>
          <SettingsDialogActions>
            <SettingsDialogButton
              onClick={() => setShowProfilePictureModal(false)}
              className="w-full flex-none"
            >
              Done
            </SettingsDialogButton>
          </SettingsDialogActions>
        </SettingsDialog>
      </>
    </TooltipProvider>
  );
}
