import { useState, useRef, type ReactNode, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  /** Callback when pull-to-refresh is triggered */
  onRefresh: () => Promise<void> | void;
  /** Content to wrap */
  children: ReactNode;
  /** Threshold in pixels before refresh triggers (default: 80) */
  threshold?: number;
  /** Maximum pull distance in pixels (default: 120) */
  maxPull?: number;
  /** Optional className */
  className?: string;
}

/**
 * PullToRefresh — Adds pull-to-refresh gesture to mobile views.
 * Uses stable refs internally so touch event listeners don't need to be re-attached.
 * Renders a pull indicator at the top of the container.
 */
export default function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPull = 120,
  className = '',
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const scrollTop = useRef(0);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);

  // Keep callback ref in sync
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Stable handlers using refs — never need to be recreated
  const handleTouchStartRef = useRef((e: TouchEvent) => {
    if (isRefreshingRef.current) return;
    scrollTop.current = containerRef.current?.scrollTop ?? 0;
    if (scrollTop.current <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  });

  const handleTouchMoveRef = useRef((e: TouchEvent) => {
    if (!pulling.current || isRefreshingRef.current) return;

    const scrollTopVal = containerRef.current?.scrollTop ?? 0;
    if (scrollTopVal > 5) {
      setPullDistance(0);
      pullDistanceRef.current = 0;
      pulling.current = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      const resisted = Math.min(diff * 0.4, maxPull);
      pullDistanceRef.current = resisted;
      setPullDistance(resisted);

      if (diff > 10) {
        e.preventDefault();
      }
    }
  });

  const handleTouchEndRef = useRef(async () => {
    if (!pulling.current || isRefreshingRef.current) return;
    pulling.current = false;

    // Use ref for latest pull distance (avoids stale closure)
    const currentPull = pullDistanceRef.current;

    if (currentPull >= threshold) {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefreshRef.current();
      } finally {
        isRefreshingRef.current = false;
        setIsRefreshing(false);
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    } else {
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  });

  // Attach touch events once — stable refs prevent thrashing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const touchStart = (e: TouchEvent) => handleTouchStartRef.current(e);
    const touchMove = (e: TouchEvent) => handleTouchMoveRef.current(e);
    const touchEnd = () => handleTouchEndRef.current();

    el.addEventListener('touchstart', touchStart, { passive: true });
    el.addEventListener('touchmove', touchMove, { passive: false });
    el.addEventListener('touchend', touchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', touchStart);
      el.removeEventListener('touchmove', touchMove);
      el.removeEventListener('touchend', touchEnd);
    };
  }, []); // Empty deps — stable refs never require re-attach

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const rotation = pullProgress * 360;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center transition-all duration-200 ease-out"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? 1 : 0,
          overflow: 'hidden',
        }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
          <RefreshCw
            className="w-4 h-4"
            style={{
              transform: `rotate(${rotation}deg)`,
              animation: isRefreshing ? 'spinSlow 0.8s linear infinite' : 'none',
            }}
          />
          <span>
            {isRefreshing
              ? 'Actualizando...'
              : pullDistance >= threshold
              ? 'Suelta para actualizar'
              : 'Tira hacia abajo'}
          </span>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
