import { AlertCircle } from "lucide-react";
import { ApiClientError } from "@/lib/api-client";

interface ErrorMessageProps {
  error: Error | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Reusable error display component
 * Displays error messages with optional retry functionality
 * Supports ApiClientError with status codes
 */
export default function ErrorMessage({
  error,
  title = "Error",
  onRetry,
  className = "",
}: ErrorMessageProps) {
  if (!error) return null;

  // Get user-friendly error message
  const getErrorMessage = (err: Error): string => {
    if (err instanceof ApiClientError) {
      switch (err.statusCode) {
        case 400:
          return "Invalid request. Please check your input.";
        case 401:
          return "Please log in to continue.";
        case 403:
          return "You don't have permission to perform this action.";
        case 404:
          return "The requested resource was not found.";
        case 422:
          return "Validation error. Please check your input.";
        case 429:
          return "Too many requests. Please try again later.";
        case 500:
          return "Server error. Please try again later.";
        case 503:
          return "Service temporarily unavailable.";
        default:
          return err.message || "An unexpected error occurred.";
      }
    }
    return err.message || "An unexpected error occurred.";
  };

  const errorMessage = getErrorMessage(error);
  const statusCode =
    error instanceof ApiClientError ? error.statusCode : undefined;

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900">
            {title}
            {statusCode && (
              <span className="ml-2 text-xs font-normal text-red-700">
                (Error {statusCode})
              </span>
            )}
          </h3>
          <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
          {error instanceof ApiClientError && error.details && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Technical details
              </summary>
              <pre className="mt-2 text-xs text-red-600 overflow-auto p-2 bg-red-100 rounded">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 w-full sm:w-auto px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          aria-label="Retry action"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
