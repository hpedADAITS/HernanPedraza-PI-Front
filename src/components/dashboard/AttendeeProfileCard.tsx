import React, { useState } from 'react';
import { m } from 'motion/react';
import { clsx } from 'clsx';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProfilePictureUpload, UserAvatar } from '@/components/common';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton } from '@/components/settings/SettingsUI';
import { PROFILE_IMAGE, THEME_CONFIG } from '@/constants/dashboard';
import { SLIDE_IN_LEFT } from '@/constants/animations';

interface AttendeeProfileCardProps {
  userName: string;
  djName: string;
  profilePicture?: string | null;
  onProfilePictureChange?: (newPicture: string) => void;
}

export function AttendeeProfileCard({
  userName,
  djName,
  profilePicture,
  onProfilePictureChange,
}: AttendeeProfileCardProps) {
  const config = THEME_CONFIG.attendee;
  const [showProfilePictureModal, setShowProfilePictureModal] =
    useState(false);

  const subtitle = `Following: DJ ${djName}`;

  return (
    <TooltipProvider>
      <m.div
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
          <button
            type="button"
            onClick={() => setShowProfilePictureModal(true)}
            className="block rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            aria-label="Upload profile picture"
          >
            <UserAvatar
              name={userName}
              profilePicture={profilePicture}
              className="w-24 h-24 lg:w-16 lg:h-16 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-md shadow-inner border border-white/30 flex items-center justify-center transition-transform hover:scale-[1.02]"
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

          {/* User Info */}
          <div>
            <h2 className="text-2xl lg:text-xl font-bold">{userName}</h2>
            <p className="text-white/80 text-sm font-medium">{subtitle}</p>
          </div>
        </div>
      </m.div>

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
    </TooltipProvider>
  );
}
