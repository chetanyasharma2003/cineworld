import { useState, useEffect } from "react";

const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 1024,
  lg: 1280,
  xl: 1920,
};

export const useResponsive = () => {
  const [screen, setScreen] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < BREAKPOINTS.sm,
    isTablet: window.innerWidth >= BREAKPOINTS.sm && window.innerWidth < BREAKPOINTS.md,
    isDesktop: window.innerWidth >= BREAKPOINTS.md,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreen({
        width,
        height,
        isMobile: width < BREAKPOINTS.sm,
        isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
        isDesktop: width >= BREAKPOINTS.md,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screen;
};

export const useIsMobile = () => {
  const { isMobile } = useResponsive();
  return isMobile;
};

export const useIsTablet = () => {
  const { isTablet } = useResponsive();
  return isTablet;
};

export const useIsDesktop = () => {
  const { isDesktop } = useResponsive();
  return isDesktop;
};

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

export const useOrientation = () => {
  const [orientation, setOrientation] = useState(
    window.innerHeight > window.innerWidth ? "portrait" : "landscape"
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? "portrait" : "landscape");
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  return orientation;
};

export const useViewport = () => {
  const [viewport, setViewport] = useState({
    vw: window.innerWidth / 100,
    vh: window.innerHeight / 100,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        vw: window.innerWidth / 100,
        vh: window.innerHeight / 100,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewport;
};
