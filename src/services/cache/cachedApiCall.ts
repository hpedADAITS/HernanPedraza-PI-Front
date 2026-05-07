/**
 * Cached API Call Wrapper
 * Adds caching and throttling to the standard apiCall
 */

import { apiCall } from '../api/client';
import { cacheManager } from './cacheManager';

export interface CacheOptions {
  ttlMs?: number; // Time to live in milliseconds
  cooldownMs?: number; // Cooldown between requests in milliseconds
  skipCache?: boolean; // Skip cache and always fetch fresh
  forceRefresh?: boolean; // Ignore cache and refresh
}

/**
 * Make a cached API call with optional cooldown
 * Caches GET requests by default, respects query parameters
 */
export async function cachedApiCall(
  endpoint: string,
  options: RequestInit & { cacheOptions?: CacheOptions } = {}
) {
  const { cacheOptions = {} } = options;
  const {
    ttlMs = 5 * 60 * 1000, // 5 minutes default
    cooldownMs = 1000, // 1 second default
    skipCache = false,
    forceRefresh = false,
  } = cacheOptions;

  const method = options.method?.toUpperCase() || 'GET';
  const isGetRequest = method === 'GET';
  const cacheKey = `api:${method}:${endpoint}`;

  // Only cache GET requests (idempotent, safe operations)
  if (!isGetRequest) {
    // For non-GET requests, record request and bypass cache
    cacheManager.recordRequest(endpoint, cooldownMs);
    return apiCall(endpoint, options);
  }

  // Check if we should use cache
  if (!skipCache && !forceRefresh && cacheManager.has(cacheKey)) {
    return cacheManager.get(cacheKey);
  }

  // Check cooldown for spam protection
  if (!cacheManager.isRequestAllowed(endpoint, cooldownMs)) {
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      // Return stale cache rather than fail
      return cached;
    }
    // Wait for cooldown to complete
    await cacheManager.waitForCooldown(endpoint);
  }

  // Record the request
  cacheManager.recordRequest(endpoint, cooldownMs);

  try {
    const response = await apiCall(endpoint, options);

    // Cache successful responses
    cacheManager.set(cacheKey, response, ttlMs);

    return response;
  } catch (error) {
    // On error, try to return cached data if available
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.warn(`API call failed, returning stale cache for ${endpoint}`);
      return cached;
    }
    throw error;
  }
}

/**
 * Clear cache for a specific endpoint
 */
export function clearEndpointCache(endpoint: string, method: string = 'GET') {
  const cacheKey = `api:${method}:${endpoint}`;
  cacheManager.delete(cacheKey);
}

/**
 * Clear all API cache
 */
export function clearApiCache() {
  cacheManager.clear();
}

/**
 * Preload/warm cache for an endpoint
 */
export async function preloadCache(
  endpoint: string,
  options?: RequestInit & { cacheOptions?: CacheOptions }
) {
  return cachedApiCall(endpoint, {
    ...options,
    cacheOptions: { skipCache: true, forceRefresh: true, ...options?.cacheOptions },
  });
}
