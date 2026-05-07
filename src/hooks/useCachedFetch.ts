/**
 * Cached Fetch Hook
 * React hook for fetching data with automatic caching and cooldown protection
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { cachedApiCall, clearEndpointCache } from '../services/cache/cachedApiCall';
import type { CacheOptions } from '../services/cache/cachedApiCall';

export interface UseCachedFetchOptions extends CacheOptions {
  skipFetch?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseCachedFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isCached: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching data with caching and spam protection
 */
export function useCachedFetch<T = any>(
  endpoint: string,
  options: RequestInit & { cacheOptions?: CacheOptions } = {},
  fetchOptions: UseCachedFetchOptions = {}
): UseCachedFetchState<T> {
  const {
    skipFetch = false,
    onSuccess,
    onError,
    ...cacheOptions
  } = fetchOptions;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(!skipFetch);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (skipFetch) return;

    setIsLoading(true);
    setError(null);

    try {
      abortControllerRef.current = new AbortController();

      const result = await cachedApiCall(endpoint, {
        ...options,
        signal: abortControllerRef.current.signal,
        cacheOptions: {
          ...cacheOptions,
        },
      });

      if (mountedRef.current) {
        setData(result.data || result);
        setIsCached(false);
        onSuccess?.(result);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const error = err instanceof Error ? err : new Error('Unknown error');

      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [endpoint, options, cacheOptions, skipFetch, onSuccess, onError]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  const refetch = useCallback(async () => {
    clearEndpointCache(endpoint, options.method || 'GET');
    await fetchData();
  }, [endpoint, options.method, fetchData]);

  return {
    data,
    isLoading,
    error,
    isCached,
    refetch,
  };
}
