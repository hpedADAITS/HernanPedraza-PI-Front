import React from 'react';
import { clsx } from 'clsx';

interface UserAvatarProps {
  name: string;
  profilePicture?: string | null;
  imageAlt?: string;
  className: string;
  fallbackClassName: string;
  fallbackContent?: React.ReactNode;
}

export function UserAvatar({
  name,
  profilePicture,
  imageAlt = 'Profile',
  className,
  fallbackClassName,
  fallbackContent,
}: UserAvatarProps) {
  return (
    <div className={clsx(className, 'overflow-hidden')}>
      {profilePicture ? (
        <img
          src={profilePicture}
          alt={imageAlt}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className={clsx('h-full w-full', fallbackClassName)}>
          {fallbackContent ?? name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
