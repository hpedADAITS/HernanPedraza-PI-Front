import React from 'react';
import { clsx } from 'clsx';
import { LazyMotion, domAnimation, m } from 'motion/react';
import logoWhite from '@/assets/logo_white.png';
import logoNormal from '@/assets/logo_normal.png';
import { useAssetCache } from '@/services/cache';

interface LogoProps {
  className?: string;
  size?: 'default' | 'large';
  variant?: 'light' | 'dark' | 'color';
  useWhite?: boolean;
}

export function Logo({
  className,
  size = 'default',
  variant = 'light',
  useWhite = false,
}: LogoProps) {
  const useLogo = useWhite ? logoWhite : logoNormal;
  const { src } = useAssetCache(useLogo, {
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    cooldownMs: 60000,
    fallbackSrc: useLogo,
  });

  return (
    <div className={clsx('flex items-center justify-center select-none', className)}>
      <LazyMotion features={domAnimation}>
        <div
          className={clsx(
            'flex items-center justify-center overflow-hidden rounded-lg transition-colors',
            size === 'large'
              ? 'w-[min(86vw,34rem)]'
              : 'w-32 h-32',
            variant === 'dark' ? 'bg-slate-900' : 'bg-transparent',
          )}
          style={
            size === 'large'
              ? { aspectRatio: '2476 / 934' }
              : undefined
          }
        >
          <m.img
            key={useLogo}
            src={src}
            alt="Sync Rekuest Logo"
            className={clsx(
              'block object-contain object-center',
              size === 'large'
                ? 'h-full w-full max-w-none'
                : 'w-full h-full',
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </LazyMotion>
    </div>
  );
}
