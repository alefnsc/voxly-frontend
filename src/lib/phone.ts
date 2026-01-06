/**
 * Phone Number Utilities
 * 
 * Provides helpers for phone number formatting, validation, and country selection.
 * Uses libphonenumber-js/max for comprehensive international phone support.
 * 
 * @module lib/phone
 */

import {
  getCountries,
  getCountryCallingCode,
  AsYouType,
  parsePhoneNumberFromString,
  CountryCode,
  isValidPhoneNumber,
} from 'libphonenumber-js/max';

// Re-export CountryCode type for use in other modules
export type { CountryCode };

// ========================================
// TYPES
// ========================================

export interface CountryOption {
  iso2: CountryCode;
  name: string;
  flag: string;
  dialCode: string;
}

export interface PhoneValidationResult {
  isValid: boolean;
  isPossible: boolean;
  country?: CountryCode;
  nationalNumber?: string;
  e164?: string;
  error?: string;
}

// ========================================
// FLAG EMOJI HELPER
// ========================================

/**
 * Convert ISO-2 country code to flag emoji
 * Uses regional indicator symbols (Unicode)
 */
export function iso2ToFlag(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🏳️';
  
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  
  return String.fromCodePoint(...codePoints);
}

// ========================================
// COUNTRY LIST
// ========================================

/**
 * Get localized country display name using Intl.DisplayNames
 */
export function getCountryDisplayName(language: string, iso2: string): string {
  try {
    const displayNames = new Intl.DisplayNames([language], { type: 'region' });
    return displayNames.of(iso2.toUpperCase()) || iso2;
  } catch {
    // Fallback to ISO code if DisplayNames fails
    return iso2.toUpperCase();
  }
}

/**
 * Get all countries with their calling codes, names, and flags
 * Sorted alphabetically by localized name
 */
export function getAllCountriesWithCallingCodes(language: string = 'en'): CountryOption[] {
  const countries = getCountries();
  
  const options: CountryOption[] = countries.map((iso2) => {
    let dialCode = '';
    try {
      dialCode = getCountryCallingCode(iso2);
    } catch {
      dialCode = '';
    }
    
    return {
      iso2,
      name: getCountryDisplayName(language, iso2),
      flag: iso2ToFlag(iso2),
      dialCode,
    };
  });
  
  // Sort alphabetically by localized name
  return options.sort((a, b) => a.name.localeCompare(b.name, language));
}

/**
 * Get prioritized country list with common countries first
 * followed by the rest alphabetically
 */
export function getPrioritizedCountries(
  language: string = 'en',
  detectedCountry?: string
): CountryOption[] {
  const all = getAllCountriesWithCallingCodes(language);
  
  // Common/popular countries to prioritize
  const priorityList = [
    detectedCountry?.toUpperCase(),
    'US', 'GB', 'CA', 'AU', 'BR', 'MX', 'ES', 'FR', 'DE', 'IN', 'CN', 'JP'
  ].filter((c): c is string => !!c);
  
  // Remove duplicates from priority list
  const uniquePriority = [...new Set(priorityList)];
  
  // Split into priority and rest
  const priorityCountries: CountryOption[] = [];
  const restCountries: CountryOption[] = [];
  
  for (const country of all) {
    if (uniquePriority.includes(country.iso2)) {
      priorityCountries.push(country);
    } else {
      restCountries.push(country);
    }
  }
  
  // Sort priority countries by their order in priorityList
  priorityCountries.sort((a, b) => {
    return uniquePriority.indexOf(a.iso2) - uniquePriority.indexOf(b.iso2);
  });
  
  return [...priorityCountries, ...restCountries];
}

/**
 * Filter countries by search query
 * Matches against name, ISO code, and dial code
 */
export function filterCountries(
  countries: CountryOption[],
  query: string
): CountryOption[] {
  if (!query.trim()) return countries;
  
  const lowerQuery = query.toLowerCase().trim();
  
  return countries.filter((c) => {
    return (
      c.name.toLowerCase().includes(lowerQuery) ||
      c.iso2.toLowerCase().includes(lowerQuery) ||
      c.dialCode.includes(lowerQuery) ||
      `+${c.dialCode}`.includes(lowerQuery)
    );
  });
}

// ========================================
// PHONE FORMATTING
// ========================================

/**
 * Format phone number as user types
 * If input starts with '+', format as international
 * Otherwise format using the specified country
 */
export function formatAsYouType(input: string, country?: CountryCode): string {
  if (!input) return '';
  
  // Clean input but preserve + at start
  const cleaned = input.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+')) {
    // International format - let AsYouType detect country
    return new AsYouType().input(cleaned);
  }
  
  if (country) {
    // National format with specified country
    return new AsYouType(country).input(cleaned);
  }
  
  // No country specified, just return cleaned digits
  return cleaned;
}

/**
 * Normalize phone number to E.164 format
 * Returns undefined if invalid
 */
export function normalizeToE164(input: string, country?: CountryCode): string | undefined {
  if (!input) return undefined;
  
  try {
    const phone = parsePhoneNumberFromString(input, country);
    if (phone) {
      return phone.format('E.164');
    }
  } catch {
    // Parse failed
  }
  
  return undefined;
}

// ========================================
// PHONE VALIDATION
// ========================================

/**
 * Validate phone number
 * If input starts with '+', validates as international
 * Otherwise validates against the specified country
 */
export function validatePhone(
  input: string,
  country?: CountryCode
): PhoneValidationResult {
  if (!input || input.trim().length === 0) {
    return {
      isValid: false,
      isPossible: false,
      error: 'Phone number is required',
    };
  }
  
  try {
    const isInternational = input.trim().startsWith('+');
    const phone = parsePhoneNumberFromString(input, isInternational ? undefined : country);
    
    if (!phone) {
      return {
        isValid: false,
        isPossible: false,
        error: 'Invalid phone number format',
      };
    }
    
    const isPossible = phone.isPossible();
    const isValid = phone.isValid();
    
    // If a specific country was expected (not international input), check it matches
    if (country && !isInternational && phone.country !== country) {
      return {
        isValid: false,
        isPossible,
        country: phone.country,
        nationalNumber: phone.nationalNumber,
        e164: phone.format('E.164'),
        error: `Phone number appears to be from ${phone.country || 'another country'}, not ${country}`,
      };
    }
    
    if (!isValid) {
      return {
        isValid: false,
        isPossible,
        country: phone.country,
        nationalNumber: phone.nationalNumber,
        e164: phone.format('E.164'),
        error: isPossible ? 'Phone number format is incorrect' : 'Phone number is too short or too long',
      };
    }
    
    return {
      isValid: true,
      isPossible: true,
      country: phone.country,
      nationalNumber: phone.nationalNumber,
      e164: phone.format('E.164'),
    };
  } catch (error) {
    return {
      isValid: false,
      isPossible: false,
      error: 'Failed to parse phone number',
    };
  }
}

/**
 * Quick validation check (simpler API)
 */
export function isPhoneValid(input: string, country?: CountryCode): boolean {
  if (!input) return false;
  
  try {
    const isInternational = input.trim().startsWith('+');
    return isValidPhoneNumber(input, isInternational ? undefined : country);
  } catch {
    return false;
  }
}

// ========================================
// UTILITY HELPERS
// ========================================

/**
 * Get the dial code for a country
 */
export function getDialCode(country: CountryCode): string {
  try {
    return getCountryCallingCode(country);
  } catch {
    return '';
  }
}

/**
 * Extract just the digits from a phone input
 */
export function extractDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Get example placeholder for a country (simple format hint)
 */
export function getPlaceholder(country: CountryCode): string {
  const dialCode = getDialCode(country);
  
  // Simple placeholders by common countries
  const placeholders: Record<string, string> = {
    US: '(555) 123-4567',
    CA: '(555) 123-4567',
    GB: '7911 123456',
    BR: '(11) 91234-5678',
    MX: '55 1234 5678',
    ES: '612 34 56 78',
    FR: '6 12 34 56 78',
    DE: '151 12345678',
    IN: '98765 43210',
    CN: '131 2345 6789',
    JP: '90-1234-5678',
    AU: '412 345 678',
    RU: '912 345-67-89',
  };
  
  return placeholders[country] || `+${dialCode} ...`;
}

/**
 * Get default country based on preferences and fallbacks
 * Priority: preferredPhoneCountry > detectedCountry > browser locale > 'US'
 */
export function getDefaultCountry(
  preferredPhoneCountry?: string,
  detectedCountry?: string
): CountryCode {
  // First try preferred phone country
  if (preferredPhoneCountry && isValidCountryCode(preferredPhoneCountry)) {
    return preferredPhoneCountry as CountryCode;
  }
  
  // Then try detected country
  if (detectedCountry && isValidCountryCode(detectedCountry)) {
    return detectedCountry as CountryCode;
  }
  
  // Try browser locale
  try {
    const locale = navigator.language || (navigator as any).userLanguage;
    if (locale) {
      // Extract country from locale like "en-US" or "pt-BR"
      const parts = locale.split('-');
      if (parts.length >= 2) {
        const country = parts[1].toUpperCase();
        if (isValidCountryCode(country)) {
          return country as CountryCode;
        }
      }
    }
  } catch {
    // Ignore errors
  }
  
  // Default fallback
  return 'US';
}

/**
 * Check if a string is a valid country code
 */
export function isValidCountryCode(code: string): boolean {
  if (!code || typeof code !== 'string' || code.length !== 2) {
    return false;
  }
  
  const countries = getCountries();
  return countries.includes(code.toUpperCase() as CountryCode);
}
