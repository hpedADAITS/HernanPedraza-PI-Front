export function isDebugModeEnabled() {
  return Boolean(
    import.meta.env.DEV &&
      (import.meta.env.VITE_DEBUG_MODE === 'true' ||
        (window as any).__DEBUG_MODE__),
  );
}
