import React, { useRef, useState, useTransition } from 'react';
import { m } from 'motion/react';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { authAPI, participantsAPI } from '@/services/api';
import { readStoredJson, writeStoredJson } from '@/utils/storage';
import { t } from '@/i18n';

const PROFILE_PICTURE_SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

/* Resize any image file to fit within `maxDim` on the long edge, encoded as
   JPEG quality 0.92. Returns a base64 data URL. PNG is kept when the source
   has transparency; otherwise we transcode to JPEG which is ~6× smaller at
   equivalent quality. Bounded output keeps the participant list payload and
   MongoDB document well under the 16 MB document limit. */
const PROFILE_PICTURE_MAX_DIM = 1024;

async function resizeImageToDataUrl(file: File, maxDim: number): Promise<string> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Failed to decode image'));
      element.src = sourceUrl;
    });

    const longEdge = Math.max(img.width, img.height);
    const scale = longEdge > maxDim ? maxDim / longEdge : 1;
    const targetWidth = Math.max(1, Math.round(img.width * scale));
    const targetHeight = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context is unavailable');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const isPng = file.type === 'image/png';
    const mimeType = isPng ? 'image/png' : 'image/jpeg';
    const quality = isPng ? undefined : 0.92;
    return canvas.toDataURL(mimeType, quality);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

interface ProfilePictureUploadProps {
  currentPicture?: string | null;
  onPictureUpdated?: (newPicture: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ProfilePictureUpload({
  currentPicture,
  onPictureUpdated,
  size = 'md',
}: ProfilePictureUploadProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [previewPicture, setPreviewPicture] = useState<string | null>(
    currentPicture || null,
  );
  const isBusy = isLoading || isPending;

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    /* Validate file type */
    if (!file.type.startsWith('image/')) {
      toast.error(t('Please select an image file'));
      return;
    }

    /* Validate file size (5MB max) */
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Image must be less than 5MB'));
      return;
    }

    setIsLoading(true);
    try {
      const base64String = await resizeImageToDataUrl(file, PROFILE_PICTURE_MAX_DIM);
      startTransition(() => {
        setPreviewPicture(base64String);
      });

      /* Send to backend */
      try {
        await authAPI.updateProfilePicture({
          profilePicture: base64String,
        });

        /* Update localStorage */
        const user = readStoredJson<{ profilePicture?: string | null }>('user');
        if (user) {
          writeStoredJson('user', {
            ...user,
            profilePicture: base64String,
          });
        }

        const participant = readStoredJson<
          { _id?: string; id?: string; profilePicture?: string | null } & Record<string, unknown>
        >('currentParticipant');
        const participantId = participant?._id || participant?.id;
        const updatedParticipant = participantId
          ? await participantsAPI.updateProfile(participantId, {
              profilePicture: base64String,
            })
          : null;
        if (participant) {
          writeStoredJson('currentParticipant', {
            ...participant,
            ...(updatedParticipant || {}),
            profilePicture: base64String,
          });
        }

        toast.success(t('Profile picture updated'));
        onPictureUpdated?.(base64String);
      } catch (error) {
        startTransition(() => {
          setPreviewPicture(currentPicture || null);
        });
        toast.error(
          error instanceof Error
            ? error.message
            : t('Failed to update profile picture'),
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('Failed to update profile picture'),
      );
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenFilePicker = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        aria-label={t('Upload profile picture')}
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isBusy}
      />

      <m.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleOpenFilePicker}
        disabled={isBusy}
        aria-label={previewPicture ? t('Change profile picture') : t('Upload profile picture')}
        className={`relative ${PROFILE_PICTURE_SIZE_CLASSES[size]} rounded-full overflow-hidden border-2 border-dashed border-slate-300 hover:border-slate-400 flex items-center justify-center bg-slate-50 transition-all disabled:opacity-50`}
      >
        {previewPicture ? (
          <>
            <img
              src={previewPicture}
              alt={t('Profile')}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-all">
              <Upload
                size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
                className="text-white opacity-0 hover:opacity-100"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Upload
              size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
              className="text-slate-400 mb-1"
            />
            <span className="text-xs text-slate-400">{t('Upload')}</span>
          </div>
        )}

        {isBusy && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </m.button>
    </div>
  );
}
