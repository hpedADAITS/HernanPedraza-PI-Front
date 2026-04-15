/**
 * Error handling utilities
 * Parse, format, and categorize API and application errors
 */

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  statusCode: number;
  timestamp?: string;
}

/**
 * Parse API error response into user-friendly message
 */
export function parseApiError(error: any): string {
  // Handle network errors
  if (!error.response && error.message) {
    return 'Network error. Please check your connection.';
  }

  // Handle API response errors
  if (error instanceof Error) {
    return error.message;
  }

  // Handle error objects
  if (typeof error === 'object') {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.message) {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Determine if error is network-related
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;

  const networkErrorIndicators = [
    'Network error',
    'Failed to fetch',
    'Connection refused',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ];

  const message = error.message || error.toString();
  return networkErrorIndicators.some((indicator) =>
    message.includes(indicator),
  );
}

/**
 * Determine if error is authorization-related
 */
export function isAuthError(error: any): boolean {
  const code = error?.error?.code;
  const statusCode = error?.statusCode;
  const message = parseApiError(error).toLowerCase();

  return (
    code === 'UnauthorizedError' ||
    statusCode === 401 ||
    message.includes('unauthorized') ||
    message.includes('invalid token') ||
    message.includes('not authenticated')
  );
}

/**
 * Determine if error is validation error
 */
export function isValidationError(error: any): boolean {
  const code = error?.error?.code;
  const statusCode = error?.statusCode;

  return code === 'ValidationError' || statusCode === 400;
}

/**
 * Determine if error is not found error
 */
export function isNotFoundError(error: any): boolean {
  const code = error?.error?.code;
  const statusCode = error?.statusCode;

  return code === 'NotFoundError' || statusCode === 404;
}

/**
 * Determine if error is server error
 */
export function isServerError(error: any): boolean {
  const statusCode = error?.statusCode;
  return statusCode && statusCode >= 500;
}

/**
 * Format error for user display with context
 */
export function formatErrorMessage(error: any, context?: string): string {
  const message = parseApiError(error);

  if (isNetworkError(error)) {
    return 'Unable to connect to server. Please try again later.';
  }

  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again.';
  }

  if (isValidationError(error)) {
    return `Invalid input: ${message}`;
  }

  if (isNotFoundError(error)) {
    return `Not found: ${message}`;
  }

  if (isServerError(error)) {
    return 'Server error. Please try again later.';
  }

  return context ? `${context}: ${message}` : message;
}

/**
 * Extract error details for logging
 */
export function extractErrorDetails(error: any): Record<string, any> {
  return {
    code: error?.error?.code || 'UnknownError',
    message: parseApiError(error),
    statusCode: error?.statusCode,
    details: error?.error?.details,
    timestamp: error?.timestamp,
    originalError: error,
  };
}

/**
 * Log error to console with context
 */
export function logError(error: any, context: string = 'Error'): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, extractErrorDetails(error));
  }
}
