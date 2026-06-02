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
  const normalLogo = useAssetCache(logoNormal, {
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    cooldownMs: 60000,
    fallbackSrc: logoNormal,
  }).src;
  const whiteLogo = useAssetCache(logoWhite, {
    ttlMs: 7 * 24 * 60 * 60 * 1000,
    cooldownMs: 60000,
    fallbackSrc: logoWhite,
  }).src;

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
          {[normalLogo, whiteLogo].map((src, index) => (
            <m.img
              key={index === 0 ? 'normal-logo' : 'white-logo'}
              src={src}
              alt={index === 0 ? 'Sync Rekuest Logo' : ''}
              aria-hidden={index === 1}
              className={clsx(
                'absolute block object-contain object-center transition-opacity duration-200',
                size === 'large'
                  ? 'h-full w-full max-w-none'
                  : 'w-full h-full',
              )}
              style={{ opacity: useWhite === (index === 1) ? 1 : 0 }}
              initial={false}
            />
          ))}
        </div>
      </LazyMotion>
    </div>
  );
}
