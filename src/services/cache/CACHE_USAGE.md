# Asset & API Caching System

This system provides browser-based caching with automatic persistence and request cooldown protection to prevent spam reloading.

## Features

- **Browser Caching**: Assets persist in memory and localStorage
- **Automatic Expiration**: Configurable TTL for cache entries
- **Request Throttling**: Cooldown mechanism prevents spam requests
- **Stale Cache Fallback**: Returns cached data when requests fail
- **Smart Loading**: Skips requests during cooldown period

## Components

### 1. `cacheManager` (Core)

Singleton instance managing the cache lifecycle.

```typescript
import { cacheManager } from '@/services/cache';

// Set cache
cacheManager.set('key', data, 5 * 60 * 1000); // 5 minute TTL

// Get cache
const data = cacheManager.get('key');

// Check if exists
if (cacheManager.has('key')) {
  // ...
}

// Check request cooldown
if (cacheManager.isRequestAllowed('url', 1000)) {
  // Make request
  cacheManager.recordRequest('url', 1000);
}

// Get cooldown time remaining
const remaining = cacheManager.getCooldownRemaining('url');

// Clear specific key
cacheManager.delete('key');

// Clear all
cacheManager.clear();
```

### 2. `cachedApiCall` (API Calls)

Wrapper around `apiCall` with caching and cooldown.

```typescript
import { cachedApiCall, clearEndpointCache, preloadCache } from '@/services/cache';

// Basic usage - auto-caches GET requests
const data = await cachedApiCall('/events');

// Custom options
const data = await cachedApiCall('/events?limit=50', {
  cacheOptions: {
    ttlMs: 10 * 60 * 1000,        // 10 minute cache
    cooldownMs: 2000,               // 2 second request cooldown
    skipCache: false,               // Use cache if available
    forceRefresh: false,            // Ignore cache
  }
});

// Clear cache for endpoint
clearEndpointCache('/events');

// Preload/warm cache
await preloadCache('/events', {
  cacheOptions: { forceRefresh: true }
});
```

### 3. `useCachedFetch` Hook (React)

React hook for components fetching data.

```typescript
import { useCachedFetch } from '@/hooks/useCachedFetch';

function MyComponent() {
  const { data, isLoading, error, isCached, refetch } = useCachedFetch(
    '/events',
    {},
    {
      ttlMs: 5 * 60 * 1000,
      cooldownMs: 1000,
      onSuccess: (data) => console.log('Loaded', data),
      onError: (error) => console.error(error),
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {isCached && <span>📦 Cached</span>}
      <button onClick={refetch}>Refresh</button>
      {/* render data */}
    </div>
  );
}
```

### 4. `useAssetCache` Hook (Images/Media)

React hook for caching image and media assets.

```typescript
import { useAssetCache } from '@/services/cache';

function ImageComponent({ imageUrl }) {
  const { src, isLoading, error, cached, refetch } = useAssetCache(
    imageUrl,
    {
      ttlMs: 24 * 60 * 60 * 1000, // 24 hours
      cooldownMs: 2000,
      fallbackSrc: '/placeholder.png',
    }
  );

  if (error) return <img src="/placeholder.png" alt="Failed" />;

  return (
    <div>
      {cached && <span>📦</span>}
      <img src={src} alt="Asset" />
      {isLoading && <span>Loading...</span>}
      <button onClick={refetch}>Reload</button>
    </div>
  );
}
```

## Caching Strategies

### Quick Data (Real-time)
```typescript
// Short TTL, tight cooldown
cachedApiCall('/api/status', {
  cacheOptions: {
    ttlMs: 10 * 1000,        // 10 seconds
    cooldownMs: 5 * 1000,    // 5 second cooldown
  }
});
```

### Standard Data (Lists, Details)
```typescript
// Default 5 minute cache, 1 second cooldown
cachedApiCall('/events?limit=50');
```

### Long-lived Assets (Images, Static)
```typescript
// Long TTL for static assets
useAssetCache(imageUrl, {
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
});
```

### User-specific Data (Profiles, Settings)
```typescript
// Shorter TTL for user data
cachedApiCall(`/users/${userId}`, {
  cacheOptions: {
    ttlMs: 2 * 60 * 1000,  // 2 minutes
    cooldownMs: 3000,      // 3 second cooldown
  }
});
```

## Storage

- **Memory Cache**: Fast in-memory storage (lost on reload)
- **localStorage**: Persists across sessions
  - Max ~5-10MB per domain
  - Auto-cleaned when quota exceeded
  - Prefixed with `cache:` for safety

## Best Practices

1. **GET requests only**: Cache only idempotent operations (GET)
2. **Appropriate TTL**: Balance freshness vs performance
3. **Cooldown protection**: Prevent client-side spam loops
4. **Error handling**: System falls back to stale cache on errors
5. **Clear on logout**: Call `clearAllCaches()` when user logs out

```typescript
import { clearAllCaches } from '@/services/api/client';

function handleLogout() {
  clearAllCaches(); // Clear cache on logout
  // ... other logout logic
}
```

## Monitoring

```typescript
import { cacheManager } from '@/services/cache';

const stats = cacheManager.getStats();
console.log(stats);
// { cacheSize: 15, cooldownsActive: 3 }
```

## Examples

### Events List with Caching

```typescript
import { useCachedFetch } from '@/hooks/useCachedFetch';

function EventsList() {
  const [limit, setLimit] = useState(50);
  const { data: events, isLoading, refetch } = useCachedFetch(
    `/events?limit=${limit}`,
    {},
    {
      ttlMs: 5 * 60 * 1000,
      cooldownMs: 1000,
    }
  );

  return (
    <div>
      {events?.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}
```

### Profile Picture with Caching

```typescript
import { useAssetCache } from '@/services/cache';

function ProfilePicture({ userId, pictureUrl }) {
  const { src, cached } = useAssetCache(pictureUrl, {
    ttlMs: 24 * 60 * 60 * 1000,
    fallbackSrc: '/default-avatar.png',
  });

  return (
    <div>
      {cached && <span className="text-xs">cached</span>}
      <img src={src} alt={`${userId}'s avatar`} />
    </div>
  );
}
```

## Cooldown Behavior

When a user spams requests:

1. **First request**: Executes and caches
2. **Request within cooldown**: Returns cached data
3. **Cache expired, within cooldown**: Waits for cooldown, then fetches
4. **All cache expired, request fails**: Returns stale cache if available, otherwise error

This prevents:
- Network congestion
- Server overload
- Redundant requests
- Battery drain on mobile
