/**
 * Asset Cache Hook
 * React hook for caching image and media assets with automatic persistence
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { cacheManager } from './cacheManager';

export interface UseAssetCacheOptions {
  ttlMs?: number;
  cooldownMs?: number;
  fallbackSrc?: string;
}

/**
 * Hook for caching image and media assets
 * Stores in browser cache and localStorage
 */
export function useAssetCache(
  assetUrl: string,
  options: UseAssetCacheOptions = {}
) {
  const {
    ttlMs = 24 * 60 * 60 * 1000, // 24 hours for assets
    cooldownMs = 2000, // 2 seconds cooldown
    fallbackSrc,
  } = options;

  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadAttemptRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cacheKey = `asset:${assetUrl}`;

  const loadAsset = useCallback(async () => {
    // Check if already cached
    const cached = cacheManager.get<string>(cacheKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    // Check cooldown
    if (!cacheManager.isRequestAllowed(assetUrl, cooldownMs)) {
      // Return cached or fallback
      if (cached) {
        setSrc(cached);
      } else if (fallbackSrc) {
        setSrc(fallbackSrc);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // For direct URLs, load directly (they're typically served with cache headers)
      const response = await fetch(assetUrl, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load asset: ${response.statusText}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result as string;
        cacheManager.set(cacheKey, dataUrl, ttlMs);
        cacheManager.recordRequest(assetUrl, cooldownMs);
        setSrc(dataUrl);
        setIsLoading(false);
      };

      reader.onerror = () => {
        setError(new Error('Failed to read asset blob'));
        setIsLoading(false);
      };

      reader.readAsDataURL(blob);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't update state
        return;
      }

      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);

      // Use fallback or cached version on error
      const cached = cacheManager.get<string>(cacheKey);
      if (cached) {
        setSrc(cached);
      } else if (fallbackSrc) {
        setSrc(fallbackSrc);
      }

      setIsLoading(false);
    }
  }, [assetUrl, cacheKey, cooldownMs, ttlMs, fallbackSrc]);

  useEffect(() => {
    loadAttemptRef.current += 1;
    loadAsset();

    return () => {
      // Cancel in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [assetUrl, loadAsset]);

  const refetch = useCallback(async () => {
    cacheManager.delete(cacheKey);
    await loadAsset();
  }, [cacheKey, loadAsset]);

  return {
    src: src || assetUrl, // Fallback to original URL if no cached version
    isLoading,
    error,
    refetch,
    cached: cacheManager.has(cacheKey),
  };
}
