import * as React from 'react';
import { useNavigation } from 'react-router-dom';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { ProgressBar } from './ProgressBar';

/**
 * GlobalProgressBar
 * Implements a high-fidelity 'Simulated Trickle' algorithm.
 * Mimics industry standards (nprogress/GitHub) for perceived performance.
 */
export function GlobalProgressBar() {
  const navigation = useNavigation();
  // We only care about 'hard' fetches (initial loads where no data exists in cache yet).
  // Background revalidations (SWR) should remain silent to provide a smooth 'App-like' experience.
  const isHardFetching = useIsFetching({
    predicate: (query) => query.state.status === 'pending' && query.state.data === undefined,
  });
  const isMutating = useIsMutating();

  const isActive = navigation.state === 'loading' || isHardFetching > 0 || isMutating > 0;

  const [progress, setProgress] = React.useState(0);
  const [isVisible, setIsVisible] = React.useState(false);

  // The Trickle Effect
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let timeout: ReturnType<typeof setTimeout>;

    if (isActive) {
      // Small debounce before showing to avoid flicker on ultra-fast requests
      timeout = setTimeout(() => {
        setIsVisible(true);
        setProgress(10); // Initial jump for immediate gratification

        interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 95) return prev; // Don't hit 100% until actually done

            // Random incremental jump that slows down as it approaches 100
            const remaining = 100 - prev;
            const increment = Math.max(0.5, Math.random() * (remaining * 0.1));
            return Math.min(95, prev + increment);
          });
        }, 300);
      }, 150);
    } else if (isVisible) {
      // Snap to completion
      setProgress(100);

      // Hold the 100% state briefly for visual confirmation, then fade out
      timeout = setTimeout(() => {
        setIsVisible(false);
        // Reset progress after fade out completes
        setTimeout(() => setProgress(0), 400);
      }, 300);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isActive, isVisible]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-9999 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <ProgressBar
        value={progress}
        height={2}
        // We use a custom ease for the trickle to make it feel snappier
        className="bg-transparent"
      />
      {/* Subtle glow effect for premium feel */}
      <div
        className="absolute top-0 right-0 h-full w-24 bg-primary blur-sm opacity-50"
        style={{ left: `${progress}%`, marginLeft: '-24px' }}
      />
    </div>
  );
}
