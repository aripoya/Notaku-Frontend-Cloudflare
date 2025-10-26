"use client";

export default function ReceiptCardSkeleton({ index = 0 }: { index?: number }) {
  const animationDelay = `${Math.min(index * 100, 500)}ms`;

  return (
    <div
      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse"
      style={{ animationDelay }}
    >
      {/* Image skeleton */}
      <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Merchant name & category */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>

        {/* Amount */}
        <div className="h-8 bg-gray-200 rounded w-2/3" />

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex-1 h-9 bg-gray-100 rounded" />
          <div className="h-9 w-9 bg-gray-100 rounded" />
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
