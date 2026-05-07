/**
 * Synced with _breakpoints.scss
 */
export const BREAKPOINTS = {
  xxs: 360,
  xs: 480,
  sm: 600,
  md: 768,
  smallDesktop: 800,
  lg: 1024,
  xl: 1300,
  xxl: 1440,
  ultraWide: 2048,
  /** Matches Tailwind's default `sm` breakpoint (40rem at a 16px root). Use when JS behaviour must align with the `sm:` / `max-sm:` Tailwind variants. */
  tailwindSm: 640,
} as const;

export const BREAKPOINT_QUERIES = {
  onlyMobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,
  onlyTablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  onlyDesktop: `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`,
  onlyWide: `(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS.ultraWide - 1}px)`,
  ultraWide: `(min-width: ${BREAKPOINTS.ultraWide}px)`,
  belowTailwindSm: `(max-width: ${BREAKPOINTS.tailwindSm - 1}px)`,
} as const;
