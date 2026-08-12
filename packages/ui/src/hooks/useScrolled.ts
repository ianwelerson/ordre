import { useEffect, useState } from 'react';

/**
 * Whether the page has scrolled past the threshold.
 *
 * Drives the site header's resting-to-glass transition. The listener is passive
 * because it only reads `scrollY`, so it never blocks the scroll it is watching.
 *
 * @param threshold Scroll distance in px before the page counts as scrolled.
 * @returns boolean
 */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);

    // The page can mount already scrolled: a refresh, or a restored position.
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
