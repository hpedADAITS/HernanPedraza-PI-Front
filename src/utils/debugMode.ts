export function isDebugModeEnabled() {
  return Boolean(
    import.meta.env.DEV &&
      (import.meta.env.VITE_DEBUG_MODE === 'true' ||
        (typeof window !== 'undefined' &&
          (window as Window & { __DEBUG_MODE__?: boolean }).__DEBUG_MODE__)),
  );
}
