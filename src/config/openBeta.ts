/**
 * Open Beta Campaign Configuration
 * 
 * Controls the open beta promotional banner and credit offers.
 * 
 * HOW TO ADJUST FOR FUTURE CAMPAIGNS:
 * -----------------------------------
 * 1. Update OPEN_BETA_START_DATE to the campaign start date (UTC)
 *    Format: ISO 8601 string, e.g., '2025-12-28T00:00:00Z'
 * 2. Adjust OPEN_BETA_BONUS_DURATION_DAYS for campaign length
 * 3. Modify OPEN_BETA_FREE_CREDITS for the promotional credit amount
 * 4. Set SHOW_BANNER_AFTER_PROMO to control post-promo banner visibility
 * 
 * ENV VARS (for CRA - prefix with REACT_APP_):
 * - REACT_APP_OPEN_BETA_START_DATE: ISO 8601 UTC date string
 * - REACT_APP_OPEN_BETA_BONUS_DURATION_DAYS: number (default: 14)
 * - REACT_APP_OPEN_BETA_FREE_CREDITS: number (default: 5)
 * - REACT_APP_DEFAULT_FREE_CREDITS: number (default: 1)
 * - REACT_APP_SHOW_BANNER_AFTER_PROMO: 'true' | 'false' (default: true)
 * 
 * The banner will automatically:
 * - Show "5 free credits" during the promo window
 * - Switch to "1 free credit" after promo ends (if SHOW_BANNER_AFTER_PROMO is true)
 * - Hide completely if SHOW_BANNER_AFTER_PROMO is false
 */

/**
 * Open Beta start date (UTC)
 * Set to the date when open beta begins
 * 
 * IMPORTANT: Use ISO 8601 format with UTC timezone: 'YYYY-MM-DDTHH:mm:ssZ'
 * Example: '2025-12-28T00:00:00Z'
 * 
 * Default is set to December 28, 2025 (current open beta launch)
 */
const rawStartDate = process.env.REACT_APP_OPEN_BETA_START_DATE || '2025-12-28T00:00:00Z'
export const OPEN_BETA_START_DATE = new Date(rawStartDate)

// Validate the date parsed correctly
const isValidStartDate = !isNaN(OPEN_BETA_START_DATE.getTime())
if (!isValidStartDate && process.env.NODE_ENV === 'development') {
  console.warn(
    '[OpenBeta] Invalid OPEN_BETA_START_DATE:',
    rawStartDate,
    '- Using fallback behavior (promo inactive)'
  )
}

/**
 * Duration of the bonus credits promotion (days)
 * Default: 14 days (2 weeks)
 */
export const OPEN_BETA_BONUS_DURATION_DAYS = parseInt(
  process.env.REACT_APP_OPEN_BETA_BONUS_DURATION_DAYS || '14',
  10
)

/**
 * Number of free credits during open beta promotion
 * Default: 5 credits
 */
export const OPEN_BETA_FREE_CREDITS = parseInt(
  process.env.REACT_APP_OPEN_BETA_FREE_CREDITS || '5',
  10
)

/**
 * Default free trial credits (after promo ends)
 * Default: 1 credit
 */
export const DEFAULT_FREE_CREDITS = parseInt(
  process.env.REACT_APP_DEFAULT_FREE_CREDITS || '1',
  10
)

/**
 * Whether to show banner after promo period ends
 * If true, shows "1 free credit" messaging
 * If false, hides banner completely
 */
export const SHOW_BANNER_AFTER_PROMO = 
  process.env.REACT_APP_SHOW_BANNER_AFTER_PROMO !== 'false'

/**
 * Hard cutoff date for promo (must match backend trialPolicyService.ts)
 * This is the authoritative end date: 2026-01-15T00:00:00Z
 * After this date, new signups get 1 credit instead of 5
 */
export const PROMO_END_DATE = new Date('2026-01-15T00:00:00Z')

/**
 * Core promo calculation function - pure, testable logic
 * 
 * @param nowUtc - Current date (UTC)
 * @param startDateUtc - Promo start date (UTC)
 * @param durationDays - Length of promo in days
 * @param promoCredits - Credits during promo
 * @param defaultCredits - Credits after promo
 * @returns Object with credits, isPromoActive, and daysLeft
 */
export function getPromoCredits(
  nowUtc: Date,
  startDateUtc: Date,
  durationDays: number,
  promoCredits: number,
  defaultCredits: number
): { credits: number; isPromoActive: boolean; daysLeft: number } {
  // Validate start date
  if (isNaN(startDateUtc.getTime())) {
    return { credits: defaultCredits, isPromoActive: false, daysLeft: 0 }
  }

  // Calculate end date (exclusive - promo ends at midnight of the 15th day)
  const promoEndUtc = new Date(startDateUtc)
  promoEndUtc.setUTCDate(promoEndUtc.getUTCDate() + durationDays)

  // Check if within window: now >= start AND now < end
  const isPromoActive = nowUtc >= startDateUtc && nowUtc < promoEndUtc

  // Calculate days remaining
  let daysLeft = 0
  if (isPromoActive) {
    const diffMs = promoEndUtc.getTime() - nowUtc.getTime()
    daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  const credits = isPromoActive ? promoCredits : defaultCredits

  // Development debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[OpenBeta] Promo Calculation:', {
      nowUtc: nowUtc.toISOString(),
      startDateUtc: startDateUtc.toISOString(),
      promoEndUtc: promoEndUtc.toISOString(),
      durationDays,
      isPromoActive,
      credits,
      daysLeft,
      promoCredits,
      defaultCredits,
    })
  }

  return { credits, isPromoActive, daysLeft }
}

/**
 * Calculate the end date of the open beta bonus period
 */
export function getOpenBetaEndDate(): Date {
  const endDate = new Date(OPEN_BETA_START_DATE)
  endDate.setUTCDate(endDate.getUTCDate() + OPEN_BETA_BONUS_DURATION_DAYS)
  return endDate
}

/**
 * Check if we're currently within the open beta bonus window
 * Uses UTC to avoid timezone issues
 */
export function isWithinOpenBetaWindow(): boolean {
  if (!isValidStartDate) return false
  const result = getPromoCredits(
    new Date(),
    OPEN_BETA_START_DATE,
    OPEN_BETA_BONUS_DURATION_DAYS,
    OPEN_BETA_FREE_CREDITS,
    DEFAULT_FREE_CREDITS
  )
  return result.isPromoActive
}

/**
 * Check if open beta has started (regardless of bonus window)
 */
export function hasOpenBetaStarted(): boolean {
  if (!isValidStartDate) return false
  return new Date() >= OPEN_BETA_START_DATE
}

/**
 * Get the current free credits amount based on promo status
 */
export function getCurrentFreeCredits(): number {
  const result = getPromoCredits(
    new Date(),
    OPEN_BETA_START_DATE,
    OPEN_BETA_BONUS_DURATION_DAYS,
    OPEN_BETA_FREE_CREDITS,
    DEFAULT_FREE_CREDITS
  )
  return result.credits
}

/**
 * Check if the promo banner should be visible
 */
export function shouldShowPromoBanner(): boolean {
  if (!hasOpenBetaStarted()) return false
  if (isWithinOpenBetaWindow()) return true
  return SHOW_BANNER_AFTER_PROMO
}

/**
 * Get days remaining in the open beta bonus period
 */
export function getDaysRemaining(): number {
  const result = getPromoCredits(
    new Date(),
    OPEN_BETA_START_DATE,
    OPEN_BETA_BONUS_DURATION_DAYS,
    OPEN_BETA_FREE_CREDITS,
    DEFAULT_FREE_CREDITS
  )
  return result.daysLeft
}

// Development-only sanity check
if (process.env.NODE_ENV === 'development') {
  // Test: if we simulate being 7 days after start, promo should be active with 5 credits
  const testDate = new Date(OPEN_BETA_START_DATE)
  testDate.setUTCDate(testDate.getUTCDate() + 7) // 7 days into promo
  const testResult = getPromoCredits(
    testDate,
    OPEN_BETA_START_DATE,
    14,
    5,
    1
  )
  if (!testResult.isPromoActive || testResult.credits !== 5) {
    console.error('[OpenBeta] SANITY CHECK FAILED: 7 days into promo should have 5 credits', testResult)
  }
}

const openBetaConfig = {
  OPEN_BETA_START_DATE,
  OPEN_BETA_BONUS_DURATION_DAYS,
  OPEN_BETA_FREE_CREDITS,
  DEFAULT_FREE_CREDITS,
  SHOW_BANNER_AFTER_PROMO,
  getPromoCredits,
  getOpenBetaEndDate,
  isWithinOpenBetaWindow,
  hasOpenBetaStarted,
  getCurrentFreeCredits,
  shouldShowPromoBanner,
  getDaysRemaining,
}

export default openBetaConfig
