/**
 * Routing Utilities
 *
 * Shared helpers for navigation paths and active-route detection.
 * Single source of truth for deep-link URLs so they stay consistent.
 *
 * @module utils/routing
 */

// Valid Account page sections
export type AccountSection =
  | 'security'
  | 'profile'
  | 'creditsPurchase'
  | 'billingHistory'
  | 'danger';

/**
 * Build a deep-link to a specific Account page section.
 *
 * @example
 * accountSectionLink('creditsPurchase') // '/account?section=creditsPurchase'
 */
export function accountSectionLink(section: AccountSection): string {
  return `/account?section=${section}`;
}

/**
 * Convenience constant for the most common deep-link.
 */
export const BUY_CREDITS_LINK = accountSectionLink('creditsPurchase');

/**
 * Check whether a given pathname is "active" relative to a target path.
 * - Exact match for `/` (home).
 * - Prefix match for everything else.
 *
 * @example
 * isPathActive('/app/b2c/dashboard', '/app/b2c/dashboard') // true
 * isPathActive('/app/b2c/dashboard/details', '/app/b2c/dashboard') // true
 * isPathActive('/app/b2c/billing', '/app/b2c/dashboard') // false
 */
export function isPathActive(pathname: string, path: string): boolean {
  if (path === '/') {
    return pathname === '/';
  }
  return pathname.startsWith(path);
}
