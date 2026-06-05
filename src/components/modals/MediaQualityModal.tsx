import React from 'react';
import { SettingsDialog, SettingsChoiceRow } from '@/components/settings/SettingsUI';
import { MEDIA_QUALITY_OPTIONS, useMediaQualityPreference } from '@/features/settings/preferences';
import { useToast } from '@/hooks/useToast';
import { t } from '@/i18n';

interface MediaQualityModalProps {
  open: boolean;
  onClose: () => void;
}

export function MediaQualityModal({ open, onClose }: MediaQualityModalProps) {
  const { mediaQuality, saveMediaQuality } = useMediaQualityPreference();
  const { toast } = useToast();

  const handleSelect = (value: typeof mediaQuality) => {
    saveMediaQuality(value);
    toast.success(t('Media quality set to {quality}', { quality: t(value) }));
    onClose();
  };

  return (
    <SettingsDialog open={open} title={t('Media Quality')} onClose={onClose}>
      <div className="flex flex-col gap-2">
        {MEDIA_QUALITY_OPTIONS.map((option) => (
          <SettingsChoiceRow
            key={option.value}
            selected={mediaQuality === option.value}
            onClick={() => handleSelect(option.value)}
          >
            {t(option.label)}
          </SettingsChoiceRow>
        ))}
      </div>
    </SettingsDialog>
  );
}
