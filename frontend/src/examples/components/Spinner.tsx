import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

/**
 * Loading spinner component with optional text
 * Animated spinner using Tailwind and lucide-react
 */
export default function Spinner({
  size = "md",
  className = "",
  text,
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
    >
      <Loader2
        className={`${sizeClasses[size]} animate-spin text-blue-600`}
        aria-hidden="true"
      />
      {text && (
        <p className={`${textSizeClasses[size]} text-slate-600 font-medium`}>
          {text}
        </p>
      )}
      <span className="sr-only">{text || "Loading..."}</span>
    </div>
  );
}
