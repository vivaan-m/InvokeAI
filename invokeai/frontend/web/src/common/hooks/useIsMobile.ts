import { useEffect, useState } from 'react';

// Max viewport width (CSS px) at which the app uses the mobile stacked layout. Targets phones
// (~390px) with a small buffer so tablets keep the desktop experience.
const MOBILE_MAX_WIDTH_PX = 480;

const getIsMobile = () => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches;
};

/**
 * Returns `true` when the viewport is phone-width. Used to gate all mobile-specific layouts so
 * the desktop experience is untouched. Re-renders on viewport changes.
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobile);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);

    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    // `addEventListener` is the modern API; fall back to `addListener` for older browsers.
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }

    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  return isMobile;
};
