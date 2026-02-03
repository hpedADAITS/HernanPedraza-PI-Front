/**
 * Professional animation presets for consistent, smooth transitions
 */

export const ANIMATION_DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  verySlow: 0.45,
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
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: ANIMATION_DURATION.normal },
} as const;

export const SLIDE_IN_LEFT = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: ANIMATION_DURATION.normal },
} as const;

export const SCALE_IN = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: ANIMATION_DURATION.normal },
} as const;

export const HOVER_LIFT = {
  whileHover: { y: -2 },
  transition: { duration: ANIMATION_DURATION.fast },
} as const;

export const BUTTON_TAP = {
  whileTap: { scale: 0.98 },
  transition: { duration: ANIMATION_DURATION.fast },
} as const;
