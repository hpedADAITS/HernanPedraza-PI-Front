import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}

/**
 * Error display component for ErrorBoundary
 * Shows user-friendly error message and recovery options
 */
export default function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Error Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-3">
            <AlertCircle className="text-red-600" size={32} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Something went wrong
        </h1>

        {/* Subtitle */}
        <p className="text-center text-gray-600 mb-4">
          We&apos;re sorry for the inconvenience. Please try again or contact
          support if the problem persists.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Error Details
            </h3>
            <div className="space-y-2">
              <div className="bg-white rounded p-2">
                <p className="text-xs text-red-700 font-mono break-words">
                  {error.toString()}
                </p>
              </div>

              {errorInfo && (
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-gray-700 font-mono break-words max-h-32 overflow-y-auto">
                    {errorInfo.componentStack}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={onReset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Home
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          If you need help, please{' '}
          <a
            href="mailto:support@example.com"
            className="text-blue-600 hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
