/**
 * Language Context Hook
 * 
 * Manages user language preferences with sync to backend preferences.
 * Provides language state across the application with persistence.
 * 
 * Features:
 * - Auto-detection from browser/system
 * - IP-based geolocation detection
 * - Sync with backend preferences
 * - Persistent storage in localStorage
 * - Real-time language switching
 * 
 * @module hooks/use-language
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from 'contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  changeLanguage as i18nChangeLanguage, 
  getCurrentLanguage, 
  SUPPORTED_LANGUAGES, 
  SupportedLanguageCode,
  isLanguageSupported 
} from '../../lib/i18n';
import { detectGeolocation, GeoLocation, clearGeoCache } from '../../lib/geolocation';
import apiService from '../../services/APIService';

// ========================================
// TYPES
// ========================================

interface LanguageContextType {
  // Current language state
  currentLanguage: SupportedLanguageCode;
  languageInfo: typeof SUPPORTED_LANGUAGES[SupportedLanguageCode];
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  
  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  
  // Actions
  changeLanguage: (language: SupportedLanguageCode) => Promise<void>;
  detectAndSetLanguage: () => Promise<void>;
  refreshGeolocation: () => Promise<GeoLocation | null>;
  setPreferredPhoneCountry: (country: string) => Promise<void>;
  
  // Region-based info (from geolocation)
  geolocation: GeoLocation | null;
  detectedRegion?: string;
  detectedCountry?: string;
  preferredPhoneCountry?: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ========================================
// PROVIDER
// ========================================

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguageCode>(() => {
    // Initialize from localStorage or i18n
    const stored = localStorage.getItem('Vocaid_language');
    if (stored && isLanguageSupported(stored)) {
      return stored as SupportedLanguageCode;
    }
    return getCurrentLanguage();
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [geolocation, setGeolocation] = useState<GeoLocation | null>(null);
  const [detectedRegion, setDetectedRegion] = useState<string>();
  const [detectedCountry, setDetectedCountry] = useState<string>();
  const [preferredPhoneCountry, setPreferredPhoneCountryState] = useState<string>();
  
  // Get language info for current language
  const languageInfo = SUPPORTED_LANGUAGES[currentLanguage];

  /**
   * Refresh geolocation data (clears cache and fetches fresh)
   */
  const refreshGeolocation = useCallback(async (): Promise<GeoLocation | null> => {
    try {
      clearGeoCache();
      const geo = await detectGeolocation();
      setGeolocation(geo);
      if (geo) {
        setDetectedRegion(geo.region);
        setDetectedCountry(geo.country);
      }
      return geo;
    } catch (error) {
      console.error('Failed to refresh geolocation:', error);
      return null;
    }
  }, []);
  
  /**
  * Change language and sync to backend
   */
  const changeLanguage = useCallback(async (language: SupportedLanguageCode) => {
    if (!isLanguageSupported(language)) {
      console.warn(`Language ${language} is not supported, falling back to en-US`);
      language = 'en-US';
    }
    
    setIsSyncing(true);
    
    try {
      // Update i18n
      await i18nChangeLanguage(language);
      setCurrentLanguage(language);
      
      // Sync to backend if user is logged in
      if (user) {
        try {
          await apiService.updateUserPreferences({
            preferredLanguage: language,
            languageSetByUser: true,
          });
        } catch (error) {
          console.warn('Failed to sync language preference:', error);
          // Continue anyway - language is saved locally
        }
      }
      
      // Update document attributes
      document.documentElement.lang = language;
      document.documentElement.dir = languageInfo.dir;
      
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [user, languageInfo.dir]);
  
  /**
  * Update preferred phone country and sync to backend
   */
  const setPreferredPhoneCountry = useCallback(async (country: string) => {
    if (!user) {
      console.warn('Cannot set phone country: user not logged in');
      return;
    }
    
    setIsSyncing(true);
    try {
      await apiService.updateUserPreferences({
        preferredPhoneCountry: country,
      });
      setPreferredPhoneCountryState(country);
    } catch (error) {
      console.error('Failed to update phone country preference:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [user]);
  
  /**
   * Auto-detect language from geolocation/browser and set if not manually configured
   */
  const detectAndSetLanguage = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Check if user has manually set language
      const manuallySet = localStorage.getItem('Vocaid_language_manual') === 'true';
      if (manuallySet) {
        setIsLoading(false);
        return;
      }
      
      // Try to get from user metadata first (user has previously set preference)
      if (user?.publicMetadata) {
        const storedLanguage = user.publicMetadata.preferred_language as string;
        const userSetLanguage = user.publicMetadata.languageSetByUser as boolean;
        
        if (storedLanguage && isLanguageSupported(storedLanguage)) {
          if (userSetLanguage) {
            // User explicitly set this language, don't override
            await changeLanguage(storedLanguage as SupportedLanguageCode);
            setIsLoading(false);
            return;
          }
        }
        
        // Get region info from user metadata if available
        const region = user.publicMetadata.registration_region as string;
        const country = user.publicMetadata.registration_country as string;
        const phoneCountry = user.publicMetadata.preferredPhoneCountry as string;
        if (region) setDetectedRegion(region);
        if (country) setDetectedCountry(country);
        if (phoneCountry) setPreferredPhoneCountryState(phoneCountry);
      }
      
      // Use IP-based geolocation for better accuracy
      const geo = await detectGeolocation();
      if (geo) {
        setGeolocation(geo);
        setDetectedRegion(geo.region);
        setDetectedCountry(geo.country);
        
        // If geolocation detected a language, use it
        if (geo.inferredLanguage && isLanguageSupported(geo.inferredLanguage)) {
          await changeLanguage(geo.inferredLanguage as SupportedLanguageCode);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback to browser language detection
      const browserLang = navigator.language || (navigator as any).userLanguage;
      if (browserLang && isLanguageSupported(browserLang)) {
        await changeLanguage(browserLang as SupportedLanguageCode);
      } else {
        // Try matching base language
        const baseLang = browserLang?.split('-')[0];
        const matchingLang = Object.keys(SUPPORTED_LANGUAGES).find(
          lang => lang.startsWith(baseLang + '-')
        ) as SupportedLanguageCode | undefined;
        
        if (matchingLang) {
          await changeLanguage(matchingLang);
        }
        // Otherwise keep the current/default language
      }
    } catch (error) {
      console.error('Failed to detect language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, changeLanguage]);
  
  // Initialize language on mount and when user changes
  useEffect(() => {
    if (isUserLoaded) {
      detectAndSetLanguage();
    }
  }, [isUserLoaded, detectAndSetLanguage]);
  
  const value: LanguageContextType = {
    currentLanguage,
    languageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isLoading,
    isSyncing,
    changeLanguage,
    detectAndSetLanguage,
    refreshGeolocation,
    setPreferredPhoneCountry,
    geolocation,
    detectedRegion,
    detectedCountry,
    preferredPhoneCountry,
  };
  
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ========================================
// HOOK
// ========================================

/**
 * Hook to access language context
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
}

// ========================================
// HELPER HOOKS
// ========================================

/**
 * Hook to get translated text (wrapper around useTranslation)
 */
export function useLocalizedText() {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useLanguage();
  
  return {
    t,
    language: currentLanguage,
    isReady: i18n.isInitialized,
  };
}

/**
 * Hook to format dates according to current language
 */
export function useLocalizedDate() {
  const { currentLanguage } = useLanguage();
  
  const formatDate = useCallback((date: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
  }, [currentLanguage]);
  
  const formatRelativeTime = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const rtf = new Intl.RelativeTimeFormat(currentLanguage, { numeric: 'auto' });
    
    const now = new Date();
    const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (Math.abs(diffInDays) >= 1) {
      return rtf.format(diffInDays, 'day');
    } else if (Math.abs(diffInHours) >= 1) {
      return rtf.format(diffInHours, 'hour');
    } else if (Math.abs(diffInMinutes) >= 1) {
      return rtf.format(diffInMinutes, 'minute');
    } else {
      return rtf.format(diffInSeconds, 'second');
    }
  }, [currentLanguage]);
  
  return {
    formatDate,
    formatRelativeTime,
  };
}

/**
 * Hook to format numbers/currency according to current language
 */
export function useLocalizedNumber() {
  const { currentLanguage, detectedRegion } = useLanguage();
  
  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(currentLanguage, options).format(num);
  }, [currentLanguage]);
  
  const formatCurrency = useCallback((amount: number, currency?: string) => {
    // Default currency based on region
    const defaultCurrency = detectedRegion === 'LATAM' ? 'BRL' : 'USD';
    
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: currency || defaultCurrency,
    }).format(amount);
  }, [currentLanguage, detectedRegion]);
  
  const formatPercent = useCallback((value: number) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  }, [currentLanguage]);
  
  return {
    formatNumber,
    formatCurrency,
    formatPercent,
  };
}

export default useLanguage;
