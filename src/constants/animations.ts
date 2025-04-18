/**
 * Professional animation presets for consistent, smooth transitions
 */

export const ANIMATION_DURATION = {
  fast: 0.12,
  normal: 0.22,
  slow: 0.3,
  verySlow: 0.4,
} as const;

export const ANIMATION_STAGGER = {
  fast: 0.03,
  normal: 0.06,
  slow: 0.08,
} as const;

export const FADE_IN = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: ANIMATION_DURATION.normal },
} as const;

export const SLIDE_UP = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: ANIMATION_DURATION.normal },
} as const;

export const SLIDE_IN_LEFT = {
  initial: { opacity: 0, x: -14 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: ANIMATION_DURATION.normal },
} as const;

export const SCALE_IN = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: ANIMATION_DURATION.normal },
} as const;

export const HOVER_LIFT = {
  whileHover: { y: -1 },
  transition: { duration: ANIMATION_DURATION.fast },
} as const;

export const BUTTON_TAP = {
  whileTap: { scale: 0.99 },
  transition: { duration: ANIMATION_DURATION.fast },
} as const;
