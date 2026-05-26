import { type ReactNode, useEffect, useState, useRef } from 'react';

interface PageTransitionProps {
  /** Unique key to trigger re-animation (e.g., section name) */
  transitionKey: string;
  /** Content to animate */
  children: ReactNode;
  /** Animation type */
  animation?: 'fadeInUp' | 'fadeIn' | 'scaleIn';
  /** Duration in seconds */
  duration?: number;
}

/**
 * PageTransition — Wraps page content with a CSS animation that triggers
 * every time transitionKey changes. Provides smooth visual transitions
 * when navigating between sections.
 */
export default function PageTransition({
  transitionKey,
  children,
  animation = 'fadeInUp',
  duration = 0.35,
}: PageTransitionProps) {
  const [visible, setVisible] = useState(true);
  const prevKey = useRef(transitionKey);

  useEffect(() => {
    if (prevKey.current !== transitionKey) {
      // Brief flash to restart animation
      setVisible(false);
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      prevKey.current = transitionKey;
      return () => cancelAnimationFrame(frame);
    }
  }, [transitionKey]);

  return (
    <div
      key={transitionKey}
      className={visible ? 'fade-in-up' : 'opacity-0'}
      style={{
        animationDuration: visible ? `${duration}s` : '0s',
      }}
    >
      {children}
    </div>
  );
}
