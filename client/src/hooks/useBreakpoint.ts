import { useState, useEffect, useMemo } from 'react';

/**
 * Tailwind CSS v4 Default Breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

type BreakpointKey = keyof typeof breakpoints;

/**
 * A hook that returns whether a specific Tailwind breakpoint is currently active.
 * Uses window.matchMedia for performance and stays in sync with browser resizing.
 *
 * @param breakpoint The Tailwind breakpoint to check (e.g., 'md', 'lg')
 * @returns boolean indicating if the viewport meets the breakpoint's min-width
 *
 * @example
 * const isDesktop = useBreakpoint('lg');
 */
export function useBreakpoint(breakpoint: BreakpointKey): boolean {
  const query = useMemo(() => `(min-width: ${breakpoints[breakpoint]})`, [breakpoint]);

  const [isMatch, setIsMatch] = useState(() => {
    // Check if window is available (for potential SSR/server environments, though not used here)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);

    // Modern event listener for media query changes
    const handler = (event: MediaQueryListEvent) => setIsMatch(event.matches);
    mediaQueryList.addEventListener('change', handler);

    return () => mediaQueryList.removeEventListener('change', handler);
  }, [query]);

  return isMatch;
}

/**
 * Returns an object containing the status of all breakpoints.
 * Useful for complex responsive logic where multiple breakpoints need to be checked.
 */
export function useBreakpoints() {
  const sm = useBreakpoint('sm');
  const md = useBreakpoint('md');
  const lg = useBreakpoint('lg');
  const xl = useBreakpoint('xl');
  const xxl = useBreakpoint('2xl');

  return { sm, md, lg, xl, xxl, isMobile: !sm, isTablet: sm && !lg, isDesktop: lg };
}
