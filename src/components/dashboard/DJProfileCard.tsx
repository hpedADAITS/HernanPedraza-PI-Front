import React, { useState } from 'react';
import { m } from 'motion/react';
import { clsx } from 'clsx';
import { QrCode, SlidersHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProfilePictureUpload, UserAvatar } from '@/components/common';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton, SettingsToggleRow } from '@/components/settings/SettingsUI';
import { PROFILE_IMAGE, THEME_CONFIG } from '@/constants/dashboard';
import { SLIDE_IN_LEFT } from '@/constants/animations';
import { QRCodeModal } from './QRCodeModal';
import { t } from '@/i18n';
import { eventsAPI } from '@/services/api';
import { getStoredEvent, setStoredEvent } from '@/services/session';
import { useToast } from '@/hooks/useToast';

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
  const [showVotingSettings, setShowVotingSettings] = useState(false);
  const [premiumVotesEnabled, setPremiumVotesEnabled] = useState(
    getStoredEvent()?.settings?.premiumVotesEnabled !== false,
  );
  const [savingVotingSettings, setSavingVotingSettings] = useState(false);
  const { toast } = useToast();

  const openVotingSettings = async () => {
    setShowVotingSettings(true);
    try {
      const event = await eventsAPI.getEvent(eventId);
      setPremiumVotesEnabled(event?.settings?.premiumVotesEnabled !== false);
      setStoredEvent({ ...(getStoredEvent() || {}), ...event });
    } catch {
      /* use cached setting */
    }
  };

  const saveVotingSettings = async () => {
    setSavingVotingSettings(true);
    try {
      const event = await eventsAPI.updateEvent(eventId, {
        settings: { premiumVotesEnabled },
      });
      setStoredEvent({ ...(getStoredEvent() || {}), ...event });
      toast.success(t('Voting settings updated'));
      setShowVotingSettings(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('Failed to update voting settings'));
    } finally {
      setSavingVotingSettings(false);
    }
  };

  return (
    <TooltipProvider>
      <>
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

          <Tooltip>
            <TooltipTrigger asChild>
              <m.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={openVotingSettings}
                className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/25"
              >
                <SlidersHorizontal size={18} />
              </m.button>
            </TooltipTrigger>
            <TooltipContent>{t('Voting Settings')}</TooltipContent>
          </Tooltip>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-4 lg:gap-3">
            {/* Avatar */}
            <div className="relative overflow-visible">
              <button
                type="button"
                onClick={() => setShowProfilePictureModal(true)}
                className="block rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                aria-label={t('Upload profile picture')}
              >
                <UserAvatar
                  name={userName}
                  profilePicture={profilePicture}
                  className="w-24 h-24 lg:w-16 lg:h-16 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-md shadow-inner border border-white/30 flex items-center justify-center transition-transform hover:scale-[1.02]"
                  fallbackClassName="flex items-center justify-center"
                  fallbackContent={
                    <img
                      src={PROFILE_IMAGE}
                      alt={t('Profile')}
                      className="h-full w-full object-cover"
                    />
                  }
                />
              </button>

              {/* QR Code Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowQRModal(true)}
                    className="absolute bottom-0 right-0 w-10 h-10 lg:w-8 lg:h-8 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg flex items-center justify-center text-white transition-colors border-2 border-white animate-pulse"
                  >
                    <QrCode size={18} />
                  </m.button>
                </TooltipTrigger>
                <TooltipContent>{t('Generate QR Code')}</TooltipContent>
              </Tooltip>
            </div>

            {/* User Info */}
            <div>
              <h2 className="text-2xl lg:text-xl font-semibold">{userName}</h2>
              <p className="text-white/80 text-sm font-medium">{t('DJ on SyncRequest')}</p>
            </div>
          </div>

        </m.div>

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
          title={t('Profile Picture')}
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
              {t('Done')}
            </SettingsDialogButton>
          </SettingsDialogActions>
        </SettingsDialog>

        <SettingsDialog
          open={showVotingSettings}
          title={t('Voting Settings')}
          onClose={() => setShowVotingSettings(false)}
        >
          <div className="mb-6 flex flex-col gap-3">
            <SettingsToggleRow
              label={t('Premium vote weighting')}
              checked={premiumVotesEnabled}
              onChange={() => setPremiumVotesEnabled((value) => !value)}
            />
          </div>
          <SettingsDialogActions>
            <SettingsDialogButton
              onClick={() => setShowVotingSettings(false)}
              disabled={savingVotingSettings}
            >
              {t('Cancel')}
            </SettingsDialogButton>
            <SettingsDialogButton
              onClick={saveVotingSettings}
              disabled={savingVotingSettings}
              variant="primary"
            >
              {t('Save')}
            </SettingsDialogButton>
          </SettingsDialogActions>
        </SettingsDialog>

      </>
    </TooltipProvider>
  );
}
