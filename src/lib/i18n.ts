/**
 * i18n Configuration
 * 
 * Internationalization setup using react-i18next.
 * Supports: Portuguese (BR), English (US/GB), Spanish, French, Russian, Chinese, Hindi
 * 
 * Language Detection Precedence Order:
 * 1. Explicit user preference (localStorage: Vocaid_language)
 * 2. Browser language (navigator.language / navigator.languages)
 * 3. Default fallback (en-US)
 * 
 * Note: Geo-based detection is handled separately via detectGeolocation()
 * and can be applied after initial load for first-time visitors.
 * 
 * @module lib/i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enUS from './locales/en-US.json';
import ptBR from './locales/pt-BR.json';
import esES from './locales/es-ES.json';
import frFR from './locales/fr-FR.json';
import ruRU from './locales/ru-RU.json';
import zhCN from './locales/zh-CN.json';
import hiIN from './locales/hi-IN.json';

// Supported languages configuration (deduplicated - single English entry)
export const SUPPORTED_LANGUAGES = {
  'pt-BR': { name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  'en-US': { name: 'English', flag: '🇺🇸', dir: 'ltr' },
  'es-ES': { name: 'Español', flag: '🇪🇸', dir: 'ltr' },
  'fr-FR': { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
  'ru-RU': { name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  'zh-CN': { name: '中文', flag: '🇨🇳', dir: 'ltr' },
  'hi-IN': { name: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Map partial locale codes to full supported locale codes
 * e.g., 'pt' → 'pt-BR', 'es' → 'es-ES', 'en' → 'en-US'
 */
const LOCALE_MAPPING: Record<string, SupportedLanguageCode> = {
  // Portuguese variants
  'pt': 'pt-BR',
  'pt-PT': 'pt-BR',
  'pt-BR': 'pt-BR',
  
  // English variants
  'en': 'en-US',
  'en-US': 'en-US',
  'en-GB': 'en-US',
  'en-AU': 'en-US',
  'en-CA': 'en-US',
  
  // Spanish variants
  'es': 'es-ES',
  'es-ES': 'es-ES',
  'es-MX': 'es-ES',
  'es-AR': 'es-ES',
  'es-CO': 'es-ES',
  'es-CL': 'es-ES',
  
  // French variants
  'fr': 'fr-FR',
  'fr-FR': 'fr-FR',
  'fr-CA': 'fr-FR',
  'fr-BE': 'fr-FR',
  
  // Russian
  'ru': 'ru-RU',
  'ru-RU': 'ru-RU',
  
  // Chinese variants
  'zh': 'zh-CN',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-CN',
  'zh-HK': 'zh-CN',
  
  // Hindi
  'hi': 'hi-IN',
  'hi-IN': 'hi-IN',
};

/**
 * Resolve a browser locale code to our supported locale
 */
export const resolveLocale = (browserLocale: string): SupportedLanguageCode => {
  // Direct match
  if (LOCALE_MAPPING[browserLocale]) {
    return LOCALE_MAPPING[browserLocale];
  }
  
  // Try base language code (e.g., 'en-AU' → 'en')
  const baseCode = browserLocale.split('-')[0];
  if (LOCALE_MAPPING[baseCode]) {
    return LOCALE_MAPPING[baseCode];
  }
  
  // Default fallback
  return 'en-US';
};

// Resources for i18next (deduplicated)
const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
  'fr-FR': { translation: frFR },
  'ru-RU': { translation: ruRU },
  'zh-CN': { translation: zhCN },
  'hi-IN': { translation: hiIN },
};

// Custom language detector for proper locale mapping
const customLanguageDetector = {
  name: 'customNavigator',
  lookup: (): string | undefined => {
    if (typeof navigator === 'undefined') return undefined;
    
    // Check navigator.languages first (array of preferred languages)
    if (navigator.languages?.length) {
      for (const lang of navigator.languages) {
        const resolved = resolveLocale(lang);
        if (resolved) return resolved;
      }
    }
    
    // Fallback to navigator.language
    if (navigator.language) {
      return resolveLocale(navigator.language);
    }
    
    return undefined;
  },
};

// Initialize language detector with custom detector
const languageDetector = new LanguageDetector();
languageDetector.addDetector(customLanguageDetector);

// Initialize i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en-US',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    // Language detection options
    // Precedence: localStorage (user preference) → custom navigator → fallback
    detection: {
      order: ['localStorage', 'customNavigator', 'htmlTag'],
      lookupLocalStorage: 'Vocaid_language',
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // React already handles escaping
    },
    
    // React specific options
    react: {
      useSuspense: false, // Disable suspense for immediate re-renders
      bindI18n: 'languageChanged loaded', // Bind to language change events
      bindI18nStore: 'added removed', // Bind to store changes
    },
  });

/**
 * Change the current language
 */
export const changeLanguage = async (languageCode: SupportedLanguageCode): Promise<void> => {
  await i18n.changeLanguage(languageCode);
  localStorage.setItem('Vocaid_language', languageCode);
  
  // Update document direction for RTL languages
  const lang = SUPPORTED_LANGUAGES[languageCode];
  document.documentElement.dir = lang.dir;
  document.documentElement.lang = languageCode;
};

/**
 * Get the current language code
 */
export const getCurrentLanguage = (): SupportedLanguageCode => {
  return (i18n.language as SupportedLanguageCode) || 'en-US';
};

/**
 * Check if a language code is supported
 */
export const isLanguageSupported = (code: string): code is SupportedLanguageCode => {
  return code in SUPPORTED_LANGUAGES;
};

/**
 * Get language display info
 */
export const getLanguageInfo = (code: SupportedLanguageCode) => {
  return SUPPORTED_LANGUAGES[code];
};

/**
 * Initialize language with geo fallback for first-time visitors
 * This should be called early in app initialization
 * 
 * Flow:
 * 1. Check if user has a saved preference → use it
 * 2. Check browser language → use if supported
 * 3. Fall back to geo detection → use country-based language
 * 4. Default to en-US
 */
export const initializeWithGeoFallback = async (): Promise<void> => {
  // Check if user already has a saved preference
  const savedLanguage = localStorage.getItem('Vocaid_language');
  if (savedLanguage && isLanguageSupported(savedLanguage)) {
    return; // User has already chosen, respect their preference
  }
  
  // Check if current detected language is already valid (browser detection worked)
  const currentLang = getCurrentLanguage();
  if (currentLang !== 'en-US') {
    // Browser detection found a non-default language, use it
    return;
  }
  
  // Try geo-based detection for first-time visitors
  try {
    // Dynamic import to avoid circular dependencies
    const { detectGeolocation } = await import('./geolocation');
    const geo = await detectGeolocation();
    
    if (geo?.country) {
      // Map country to language
      const countryToLanguage: Record<string, SupportedLanguageCode> = {
        'BR': 'pt-BR',
        'PT': 'pt-BR', // Portuguese speakers
        'AO': 'pt-BR', // Angola
        'MZ': 'pt-BR', // Mozambique
        'ES': 'es-ES',
        'MX': 'es-ES', // Mexico
        'AR': 'es-ES', // Argentina
        'CO': 'es-ES', // Colombia
        'CL': 'es-ES', // Chile
        'PE': 'es-ES', // Peru
        'VE': 'es-ES', // Venezuela
        'FR': 'fr-FR',
        'BE': 'fr-FR', // Belgium (French region)
        'CH': 'fr-FR', // Switzerland (French region)
        'CA': 'fr-FR', // Canada (Quebec)
        'RU': 'ru-RU',
        'BY': 'ru-RU', // Belarus
        'KZ': 'ru-RU', // Kazakhstan
        'CN': 'zh-CN',
        'TW': 'zh-CN', // Taiwan
        'HK': 'zh-CN', // Hong Kong
        'SG': 'zh-CN', // Singapore (Chinese speakers)
        'IN': 'hi-IN',
      };
      
      const geoLanguage = countryToLanguage[geo.country];
      if (geoLanguage) {
        await changeLanguage(geoLanguage);
        console.log(`[i18n] Geo-detected language: ${geoLanguage} (country: ${geo.country})`);
        return;
      }
    }
  } catch (error) {
    console.warn('[i18n] Geo detection failed:', error);
  }
  
  // Default is already en-US via fallback
};

export default i18n;
