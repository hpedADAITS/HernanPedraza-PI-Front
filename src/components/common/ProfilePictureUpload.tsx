import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '@/services/api';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewPicture, setPreviewPicture] = useState<string | null>(
    currentPicture || null,
  );

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    /* Validate file type */
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    /* Validate file size (5MB max) */
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        setPreviewPicture(base64String);

        /* Send to backend */
        try {
          const response = await authAPI.updateProfilePicture({
            profilePicture: base64String,
          });

          /* Update localStorage */
          const user = localStorage.getItem('user');
          if (user) {
            const parsed = JSON.parse(user);
            parsed.profilePicture = base64String;
            localStorage.setItem('user', JSON.stringify(parsed));
          }

          toast.success('Profile picture updated');
          onPictureUpdated?.(base64String);
        } catch (error) {
          setPreviewPicture(currentPicture || null);
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to update profile picture',
          );
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={isLoading}
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-dashed border-slate-300 hover:border-slate-400 flex items-center justify-center bg-slate-50 transition-all disabled:opacity-50`}
      >
        {previewPicture ? (
          <>
            <img
              src={previewPicture}
              alt="Profile"
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
            <span className="text-xs text-slate-400">Upload</span>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
