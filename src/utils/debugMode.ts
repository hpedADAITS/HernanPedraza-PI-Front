export function isDebugModeEnabled() {
  return Boolean(
    import.meta.env.DEV &&
      (import.meta.env.VITE_DEBUG_MODE === 'true' ||
        (typeof window !== 'undefined' && (window as any).__DEBUG_MODE__)),
  );
}
