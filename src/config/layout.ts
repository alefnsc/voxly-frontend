/**
 * Layout Constants
 * 
 * Centralized layout values for consistent spacing across components.
 * Used primarily for fixed/sticky header offset calculations.
 */

/**
 * Landing page header height in pixels
 * - Base (mobile): 80px (h-20)
 * - MD+ (desktop): 96px (h-24)
 */
export const LANDING_HEADER_HEIGHT = {
  base: 80,
  md: 96,
} as const;

/**
 * CSS custom property name for header height
 * Can be used in calc() expressions
 */
export const LANDING_HEADER_HEIGHT_VAR = '--landing-header-h';

/**
 * Tailwind-compatible class strings for header offset
 */
export const HEADER_OFFSET_CLASSES = {
  paddingTop: 'pt-20 md:pt-24',
  marginTop: 'mt-20 md:mt-24',
  scrollMarginTop: 'scroll-mt-20 md:scroll-mt-24',
  minHeightOffset: 'min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-6rem)]',
} as const;

const layoutConfig = {
  LANDING_HEADER_HEIGHT,
  LANDING_HEADER_HEIGHT_VAR,
  HEADER_OFFSET_CLASSES,
};

export default layoutConfig;
