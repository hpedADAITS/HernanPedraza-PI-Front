/**
 * Formatting utilities
 * Format dates, times, durations, and other data for display
 */

/**
 * Format duration in milliseconds to "MM:SS" or "HH:MM:SS" format
 */
export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Format ISO datetime string to readable format
 * Example: "2026-02-05T10:30:00Z" → "Feb 5, 2026 10:30 AM"
 */
export function formatDateTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format date only (no time)
 * Example: "2026-02-05T10:30:00Z" → "Feb 5, 2026"
 */
export function formatDate(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }

    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format time only
 * Example: "2026-02-05T10:30:00Z" → "10:30 AM"
 */
export function formatTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return 'Invalid time';
    }

    return dateObj.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Invalid time';
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 5 minutes")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) {
      return 'just now';
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }

    return formatDate(dateObj);
  } catch {
    return 'Invalid date';
  }
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format queue item display (song title + artist)
 */
export function formatQueueItem(item: any): string {
  if (!item) return 'Unknown';

  const title = item.title || 'Unknown Title';
  const artist = item.artist || 'Unknown Artist';

  return `${title} - ${artist}`;
}

/**
 * Format participant display name with optional status badge
 */
export function formatParticipantName(
  nickname: string,
  isPremium?: boolean,
): string {
  const badge = isPremium ? ' ⭐' : '';
  return `${nickname}${badge}`;
}

/**
 * Format vote count with display logic
 */
export function formatVoteCount(count: number): string {
  if (count < 0) return '0';
  if (count === 1) return '1 vote';
  return `${count} votes`;
}

/**
 * Format event status with color/styling hint
 */
export function formatEventStatus(status: string): {
  label: string;
  style: string;
} {
  const statusMap: Record<string, { label: string; style: string }> = {
    PENDING: { label: 'Pending', style: 'bg-gray-100 text-gray-800' },
    LIVE: { label: 'Live', style: 'bg-green-100 text-green-800' },
    PAUSED: { label: 'Paused', style: 'bg-yellow-100 text-yellow-800' },
    ENDED: { label: 'Ended', style: 'bg-red-100 text-red-800' },
    CANCELLED: { label: 'Cancelled', style: 'bg-red-100 text-red-800' },
  };

  return (
    statusMap[status] || { label: status, style: 'bg-gray-100 text-gray-800' }
  );
}

/**
 * Format song status
 */
export function formatSongStatus(status: string): {
  label: string;
  style: string;
} {
  const statusMap: Record<string, { label: string; style: string }> = {
    PENDING: { label: 'Pending', style: 'bg-gray-100 text-gray-800' },
    APPROVED: { label: 'Approved', style: 'bg-green-100 text-green-800' },
    QUEUED: { label: 'Queued', style: 'bg-blue-100 text-blue-800' },
    PLAYING: { label: 'Playing', style: 'bg-purple-100 text-purple-800' },
    SKIPPED: { label: 'Skipped', style: 'bg-red-100 text-red-800' },
    REJECTED: { label: 'Rejected', style: 'bg-red-100 text-red-800' },
  };

  return (
    statusMap[status] || { label: status, style: 'bg-gray-100 text-gray-800' }
  );
}

/**
 * Format byte size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
