/**
 * Synced with _breakpoints.scss
 */
export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
  xl: 1440,
  ultraWide: 2048,
} as const;

export const BREAKPOINT_QUERIES = {
  onlyMobile: `(max-width: ${BREAKPOINTS.md - 1}px)`, // < 768
  onlyTablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`, // 768–1023
  onlyDesktop: `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`, // 1024–1439
  onlyWide: `(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS.ultraWide - 1}px)`, // 1440–2047
  ultraWide: `(min-width: ${BREAKPOINTS.ultraWide}px)`, // ≥ 2048
} as const;
