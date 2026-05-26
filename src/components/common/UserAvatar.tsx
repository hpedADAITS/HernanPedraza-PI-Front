import React from 'react';
import { clsx } from 'clsx';

interface UserAvatarProps {
  name: string;
  profilePicture?: string | null;
  imageAlt?: string;
  className: string;
  imageClassName?: string;
  fallbackClassName: string;
  fallbackContent?: React.ReactNode;
}

export function UserAvatar({
  name,
  profilePicture,
  imageAlt = 'Profile',
  className,
  imageClassName,
  fallbackClassName,
  fallbackContent,
}: UserAvatarProps) {
  return (
    <div className={className}>
      {profilePicture ? (
        <img
          src={profilePicture}
          alt={imageAlt}
          className={clsx('h-full w-full object-cover', imageClassName)}
        />
      ) : (
        <div className={clsx('h-full w-full', fallbackClassName)}>
          {fallbackContent ?? name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
