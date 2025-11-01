/**
 * Synced with _breakpoints.scss
 */
export const BREAKPOINTS = {
  xxs: 360, // very small phones
  xs: 480, // small phones
  sm: 640, // large phones
  md: 768, // tablets
  smallDesktop: 800, // sidebar-open compact desktop
  lg: 1024, // laptops
  xl: 1300, // compact desktop breakpoint
  xxl: 1440, // standard desktop
  ultraWide: 2048, // ultra-wide screens
} as const;

export const BREAKPOINT_QUERIES = {
  onlyMobile: `(max-width: ${BREAKPOINTS.md - 1}px)`, // < 768
  onlyTablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`, // 768–1023
  onlySmallDesktop: `(min-width: ${BREAKPOINTS.md + 1}px) and (max-width: ${BREAKPOINTS.smallDesktop}px)`, // 769–800
  onlyDesktop: `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xxl - 1}px)`, // 1024–1439
  onlyWide: `(min-width: ${BREAKPOINTS.xxl}px) and (max-width: ${BREAKPOINTS.ultraWide - 1}px)`, // 1440–2047
  ultraWide: `(min-width: ${BREAKPOINTS.ultraWide}px)`, // ≥ 2048
} as const;
