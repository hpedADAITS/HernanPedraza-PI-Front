import { useState } from 'react';
import { ImagePlus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  SettingsDialog,
  SettingsDialogActions,
  SettingsDialogButton,
} from '@/components/settings/SettingsUI';
import { audioTracksAPI, eventsAPI } from '@/services/api';
import { toBrowserWav } from '@/services/audio/ffmpegWav';
import { getStoredEventId } from '@/services/session';
import { t } from '@/i18n';

const COVER_SIZE = 512;
const COVER_QUALITY = 0.82;

interface RecognitionTrackUploadDialogProps {
  eventId: string | null;
  open: boolean;
  onClose: () => void;
}

export function RecognitionTrackUploadDialog({
  eventId,
  open,
  onClose,
}: RecognitionTrackUploadDialogProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [progress, setProgress] = useState(0);

  const pickCover = async (image: File | null) => {
    if (!image) return;
    if (!image.type.startsWith('image/')) {
      toast.error(t('Select an image file'));
      return;
    }

    try {
      setCoverUrl(await imageToCoverDataUrl(image));
      toast.success(t('Cover art assigned'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Cover upload failed'));
    }
  };

  const close = () => {
    if (!busy) onClose();
  };

  const upload = async () => {
    if (!eventId || !file || !title.trim() || !artist.trim()) {
      toast.error(t('Select audio and enter title and artist'));
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      const dashboardEventId = eventId || getStoredEventId();
      const [wav, ownedEvent] = dashboardEventId
        ? [await toBrowserWav(file, setProgress), null]
        : await Promise.all([
            toBrowserWav(file, setProgress),
            eventsAPI.getMyActiveEvent().catch(() => null),
          ]);
      const uploadEventId = dashboardEventId || ownedEvent?.id || ownedEvent?._id;

      if (!uploadEventId) {
        toast.error(t('No active event found'));
        return;
      }

      const track = await audioTracksAPI.uploadTrack(
        uploadEventId,
        wav,
        title.trim(),
        artist.trim(),
        coverUrl.trim(),
      );
      toast.success(t('Fingerprinted {title}', { title: track.title }));
      setFile(null);
      setTitle('');
      setArtist('');
      setCoverUrl('');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Audio upload failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsDialog open={open} title={t('Recognition Track')} onClose={close}>
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          {t('Title')}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            disabled={busy}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('Artist')}
          <input
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            disabled={busy}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('Cover URL')}
          <div className="mt-1 flex h-10 w-full overflow-hidden rounded-lg border border-slate-300 bg-white">
            <input
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
              className="min-w-0 flex-1 px-3 text-sm outline-none"
              disabled={busy}
              placeholder="https://..."
            />
            <label
              className="grid w-10 shrink-0 cursor-pointer place-items-center border-l border-slate-200 text-slate-600 transition hover:bg-slate-50"
              title={t('Upload cover art')}
              aria-label={t('Upload cover art')}
            >
              <ImagePlus size={18} />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,.png,.jpg,.jpeg,.webp,.avif"
                className="hidden"
                disabled={busy}
                onChange={(event) => {
                  void pickCover(event.target.files?.[0] || null);
                  event.target.value = '';
                }}
              />
            </label>
          </div>
        </label>
        {coverUrl && (
          <div className="flex items-center gap-3">
            <img
              src={coverUrl}
              alt=""
              className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
            />
            <span className="min-w-0 truncate text-xs font-semibold text-slate-500">
              {coverUrl.startsWith('data:') ? t('Uploaded cover art') : coverUrl}
            </span>
          </div>
        )}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-700">
          <Upload size={18} />
          <span>{file ? file.name : t('Choose MP3 or WAV')}</span>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav"
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setFile(nextFile);
              if (nextFile && !title) setTitle(nextFile.name.replace(/\.[^.]+$/, ''));
            }}
          />
        </label>
      </div>
      <SettingsDialogActions>
        <SettingsDialogButton
          onClick={upload}
          disabled={busy}
          className="w-full flex-none"
        >
          {busy ? (progress > 0 ? `${t('Converting...')} ${progress}%` : t('Processing...')) : t('Fingerprint Track')}
        </SettingsDialogButton>
      </SettingsDialogActions>
    </SettingsDialog>
  );
}

async function imageToCoverDataUrl(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, COVER_SIZE / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => (nextBlob ? resolve(nextBlob) : reject(new Error(t('Cover upload failed')))),
        'image/jpeg',
        COVER_QUALITY,
      );
    });
    return await blobToDataUrl(blob);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(t('Cover upload failed')));
    image.src = url;
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(t('Cover upload failed')));
    reader.readAsDataURL(blob);
  });
}
