/**
 * Asset & API Caching Integration Examples
 * Real-world usage examples for different scenarios
 */

import { useCachedFetch } from '@/hooks/useCachedFetch';
import { useAssetCache } from '@/services/cache';
import { clearApiCache } from '@/services/cache/cachedApiCall';

/**
 * Example 1: Events List with Caching
 * Demonstrates list API caching with refresh capability
 */
export function EventsListExample() {
  const { data: events, isLoading, error, refetch } = useCachedFetch<any[]>(
    '/events?limit=50&skip=0',
    {},
    {
      ttlMs: 5 * 60 * 1000, // 5 minute cache
      cooldownMs: 2000, // 2 second spam protection
      onSuccess: (data) => {
        console.log('Events loaded:', data);
      },
      onError: (error) => {
        console.error('Failed to load events:', error);
      },
    }
  );

  if (isLoading) return <div>Loading events...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Events</h2>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {events?.map((event) => (
          <li key={event.id}>{event.name}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 2: User Profile with Avatar Caching
 * Demonstrates asset caching for images
 */
export function UserProfileExample({ userId, avatarUrl }: { userId: string; avatarUrl: string }) {
  const { src: cachedAvatarUrl, cached, refetch: refetchAvatar } = useAssetCache(avatarUrl, {
    ttlMs: 24 * 60 * 60 * 1000, // 24 hour cache for avatars
    cooldownMs: 5000, // 5 second cooldown
    fallbackSrc: '/default-avatar.png',
  });

  return (
    <div>
      <img src={cachedAvatarUrl} alt="Avatar" />
      {cached && <span className="badge">cached</span>}
      <button onClick={refetchAvatar}>Reload Avatar</button>
    </div>
  );
}

/**
 * Example 3: Real-time Status with Short Cache
 * Demonstrates short TTL for frequently-updated data
 */
export function EventStatusExample({ eventId }: { eventId: string }) {
  const { data: status, isLoading, refetch } = useCachedFetch(
    `/events/${eventId}/status`,
    {},
    {
      ttlMs: 30 * 1000, // 30 second cache (shorter for real-time data)
      cooldownMs: 5 * 1000, // 5 second cooldown
    }
  );

  return (
    <div>
      <h3>Event Status</h3>
      {isLoading ? <span>Loading...</span> : <span>{status?.state}</span>}
      <button onClick={refetch}>Update</button>
    </div>
  );
}

/**
 * Example 4: Search with Request Deduplication
 * Demonstrates cooldown preventing rapid duplicate searches
 */
export function SearchExample({ query }: { query: string }) {
  const { data: results, isLoading, refetch } = useCachedFetch(
    `/search?q=${encodeURIComponent(query)}`,
    {},
    {
      ttlMs: 10 * 60 * 1000, // 10 minute cache
      cooldownMs: 3 * 1000, // 3 second cooldown - prevents search spam
    }
  );

  return (
    <div>
      <h3>Search Results for: {query}</h3>
      {isLoading && <p>Searching...</p>}
      <ul>
        {results?.map((result) => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
      <button onClick={refetch} disabled={isLoading}>
        Search Again
      </button>
    </div>
  );
}

/**
 * Example 5: Lazy Loading with Cache Prewarming
 * Demonstrates preloading cache for better UX
 */
import { preloadCache } from '@/services/cache/cachedApiCall';

export function EventDetailsExample({ eventId }: { eventId: string }) {
  const [eventDetails, setEventDetails] = React.useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  const handleLoadDetails = async () => {
    setIsLoadingDetails(true);
    try {
      // Preload and cache event details
      const details = await preloadCache(`/events/${eventId}`, {
        cacheOptions: {
          ttlMs: 10 * 60 * 1000,
          cooldownMs: 2000,
        },
      });
      setEventDetails(details.data);
    } catch (error) {
      console.error('Failed to load details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div>
      <button onClick={handleLoadDetails} disabled={isLoadingDetails}>
        {isLoadingDetails ? 'Loading...' : 'Load Details'}
      </button>
      {eventDetails && <pre>{JSON.stringify(eventDetails, null, 2)}</pre>}
    </div>
  );
}

/**
 * Example 6: Logout with Cache Clearing
 * Demonstrates clearing cache on auth state changes
 */
import { clearAllCaches } from '@/services/api/client';
import React from 'react';

export function LogoutButtonExample() {
  const handleLogout = async () => {
    // Clear all API caches when user logs out
    clearAllCaches();

    // Then proceed with logout
    // await logoutAPI();
    console.log('Logged out and caches cleared');
  };

  return <button onClick={handleLogout}>Logout</button>;
}

/**
 * Example 7: Cache Management Dashboard
 * Monitor and manage cache stats
 */
import { cacheManager } from '@/services/cache';

export function CacheStatsExample() {
  const [stats, setStats] = React.useState(cacheManager.getStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheManager.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cache-stats">
      <h3>Cache Statistics</h3>
      <p>Cached Items: {stats.cacheSize}</p>
      <p>Active Cooldowns: {stats.cooldownsActive}</p>
      <button onClick={() => cacheManager.clear()}>Clear All Cache</button>
    </div>
  );
}

/**
 * Example 8: Optimistic Updates with Cache
 * Demonstrates updating cache optimistically before API confirmation
 */
export function OptimisticUpdateExample({ eventId }: { eventId: string }) {
  const { data: event, refetch } = useCachedFetch(`/events/${eventId}`, {}, {
    ttlMs: 5 * 60 * 1000,
    cooldownMs: 1000,
  });

  const handleUpdateEvent = async (newName: string) => {
    // Optimistically update cache
    const optimisticEvent = { ...event, name: newName };
    cacheManager.set(`api:GET:/events/${eventId}`, optimisticEvent, 5 * 60 * 1000);

    try {
      // Make API call
      await fetch(`/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName }),
      });
      // API confirmed, cache is already updated
    } catch (error) {
      // On error, refresh from API to get actual state
      console.error('Update failed:', error);
      refetch();
    }
  };

  return (
    <div>
      <h3>{event?.name}</h3>
      <button onClick={() => handleUpdateEvent('New Event Name')}>Rename</button>
    </div>
  );
}
