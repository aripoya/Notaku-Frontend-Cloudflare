import { UploadProgress } from "@/types/api";
import { CheckCircle } from "lucide-react";

interface ProgressBarProps {
  progress: UploadProgress;
  className?: string;
  showPercentage?: boolean;
  showSize?: boolean;
}

/**
 * Upload progress bar component
 * Shows animated progress with percentage and file size
 * Color changes based on progress (blue → green when complete)
 */
export default function ProgressBar({
  progress,
  className = "",
  showPercentage = true,
  showSize = true,
}: ProgressBarProps) {
  const { loaded, total, percentage } = progress;
  const isComplete = percentage >= 100;

  // Format bytes to MB
  const formatSize = (bytes: number): string => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  // Determine progress bar color
  const getProgressColor = (): string => {
    if (isComplete) return "bg-green-600";
    if (percentage >= 75) return "bg-blue-600";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-blue-400";
  };

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      {/* Progress bar */}
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Info row */}
      <div className="mt-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {isComplete && (
            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
          )}
          {showPercentage && (
            <span
              className={`font-medium ${
                isComplete ? "text-green-700" : "text-slate-700"
              }`}
            >
              {percentage}%
            </span>
          )}
          {isComplete && (
            <span className="text-green-600 font-medium">Complete</span>
          )}
        </div>

        {showSize && total > 0 && (
          <span className="text-slate-500 text-xs">
            {formatSize(loaded)} MB / {formatSize(total)} MB
          </span>
        )}
      </div>
    </div>
  );
}
