import { type ReactNode } from 'react';

interface SkeletonLoaderProps {
  /** Number of skeleton rows/cards to render */
  count?: number;
  /** Variant determines the visual layout */
  variant?: 'card' | 'chart' | 'list' | 'text' | 'profile-header' | 'stats-grid' | 'form';
  /** Optional class name override */
  className?: string;
  /** Custom children override the default skeleton layout */
  children?: ReactNode;
}

/**
 * SkeletonLoader — A reusable loading placeholder component.
 * Renders animated skeleton blocks that mimic the layout of real content.
 */
export default function SkeletonLoader({ count = 1, variant = 'text', className = '' }: SkeletonLoaderProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  const renderSkeleton = (key: number) => {
    switch (variant) {
      case 'card':
        return (
          <div key={key} className="bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700 space-y-3">
            <div className="skeleton-block h-4 w-1/3" />
            <div className="skeleton-block h-8 w-2/3" />
            <div className="skeleton-block h-3 w-1/2" />
          </div>
        );

      case 'chart':
        return (
          <div key={key} className="bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="skeleton-block h-4 w-1/4" />
              <div className="skeleton-block h-4 w-1/6" />
            </div>
            {/* Simulated bar chart */}
            <div className="flex items-end gap-2 h-32">
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className="skeleton-block flex-1 rounded-sm"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="skeleton-block h-3 w-8" />
              ))}
            </div>
          </div>
        );

      case 'list':
        return (
          <div key={key} className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-4">
                <div className="skeleton-block h-12 w-16 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton-block h-4 w-2/3" />
                  <div className="skeleton-block h-3 w-1/2" />
                </div>
                <div className="skeleton-block h-8 w-8 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>
        );

      case 'profile-header':
        return (
          <div key={key} className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700">
            <div className="flex items-center gap-4">
              <div className="skeleton-block h-16 w-16 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-block h-6 w-2/3" />
                <div className="skeleton-block h-4 w-1/2" />
                <div className="skeleton-block h-5 w-24 rounded-full" />
              </div>
            </div>
          </div>
        );

      case 'stats-grid':
        return (
          <div key={key} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-700 space-y-2">
                <div className="skeleton-block h-3 w-1/2" />
                <div className="skeleton-block h-7 w-2/3" />
                <div className="skeleton-block h-3 w-1/3" />
              </div>
            ))}
          </div>
        );

      case 'form':
        return (
          <div key={key} className="bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-700 space-y-5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton-block h-4 w-1/4" />
                <div className="skeleton-block h-12 w-full rounded-xl" />
              </div>
            ))}
            <div className="skeleton-block h-12 w-full rounded-xl" />
          </div>
        );

      case 'text':
      default:
        return (
          <div key={key} className={`space-y-2 ${className}`}>
            <div className="skeleton-block h-4 w-full" />
            <div className="skeleton-block h-4 w-5/6" />
            <div className="skeleton-block h-4 w-2/3" />
          </div>
        );
    }
  };

  return <div className="animate-[fadeIn_0.3s_ease-out]">{items.map(renderSkeleton)}</div>;
}
