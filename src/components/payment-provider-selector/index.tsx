/**
 * Payment Provider Selector Component
 * 
 * Displays the detected payment provider based on user's region
 * and allows manual override for users who prefer a different provider.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { Globe, CreditCard, Check, Loader2, MapPin, RefreshCw } from 'lucide-react';
import apiService from '../../services/APIService';

// Payment provider types
type PaymentProvider = 'mercadopago' | 'paypal';

interface ProviderInfo {
  id: PaymentProvider;
  name: string;
  displayName: string;
  description: string;
  regions: string[];
  logo: string;
  currencies: string[];
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    displayName: 'Mercado Pago',
    description: 'Preferred for Latin America',
    regions: ['LATAM', 'Brazil', 'Argentina', 'Mexico', 'Chile', 'Colombia'],
    logo: '🟡', // Placeholder - would be actual logo
    currencies: ['BRL', 'ARS', 'MXN', 'CLP', 'COP'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    displayName: 'PayPal',
    description: 'Global payment processing',
    regions: ['Global', 'US', 'Europe', 'Asia Pacific'],
    logo: '🔵', // Placeholder - would be actual logo
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  },
];

interface PaymentProviderSelectorProps {
  onProviderChange?: (provider: PaymentProvider) => void;
  showRegionInfo?: boolean;
  compact?: boolean;
}

export const PaymentProviderSelector: React.FC<PaymentProviderSelectorProps> = ({
  onProviderChange,
  showRegionInfo = true,
  compact = false,
}) => {
  const { user, isSignedIn } = useUser();
  const { t } = useTranslation();
  const [detectedProvider, setDetectedProvider] = useState<PaymentProvider>('paypal');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('paypal');
  const [providerName, setProviderName] = useState<string>('PayPal');
  const [isLoading, setIsLoading] = useState(false);
  const [detectedRegion, setDetectedRegion] = useState<string>('Global');
  const [isFallback, setIsFallback] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  // Detect preferred payment provider based on user's region
  const detectPaymentProvider = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const result = await apiService.getPreferredPaymentProvider(user.id);
      if (result.status === 'success' && result.data) {
        setDetectedProvider(result.data.provider);
        setSelectedProvider(result.data.provider);
        setProviderName(result.data.name);
        setIsFallback(result.data.isFallback);
        
        // Try to get region info
        try {
          const prefs = await apiService.getUserPreferences(user.id);
          if (prefs.status === 'success' && prefs.data) {
            setDetectedRegion(prefs.data.region || 'Global');
          }
        } catch {
          // Region detection failed, use default
        }
      }
    } catch (err) {
      console.warn('Could not detect payment provider:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Detect provider on mount
  useEffect(() => {
    if (isSignedIn && user) {
      detectPaymentProvider();
    }
  }, [isSignedIn, user, detectPaymentProvider]);

  // Handle provider selection
  const handleSelectProvider = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    const providerInfo = PROVIDERS.find(p => p.id === provider);
    if (providerInfo) {
      setProviderName(providerInfo.displayName);
    }
    onProviderChange?.(provider);
    setShowSelector(false);
  };

  // Get provider info
  const getProviderInfo = (providerId: PaymentProvider): ProviderInfo => {
    return PROVIDERS.find(p => p.id === providerId) || PROVIDERS[1]; // Default to PayPal
  };

  const currentProvider = getProviderInfo(selectedProvider);
  const isAutoDetected = selectedProvider === detectedProvider;

  if (!isSignedIn) {
    return null;
  }

  // Compact mode - just show selected provider
  if (compact) {
    return (
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 
                   rounded-full border border-gray-200 text-sm transition-colors"
      >
        <span className="text-lg">{currentProvider.logo}</span>
        <span className="text-gray-700 font-medium">{currentProvider.displayName}</span>
        {isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">{t('paymentProvider.title')}</h3>
        </div>
        {isLoading && (
          <div className="flex items-center gap-1 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">{t('paymentProvider.detecting')}</span>
          </div>
        )}
      </div>

      {/* Region Info */}
      {showRegionInfo && (
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>
            {t('paymentProvider.detectedRegion')}: <span className="font-medium text-gray-700">{detectedRegion}</span>
          </span>
          {isAutoDetected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 
                             text-green-700 rounded-full text-xs font-medium">
              <Check className="w-3 h-3" />
              {t('paymentProvider.autoSelected')}
            </span>
          )}
        </div>
      )}

      {/* Provider Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROVIDERS.map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const isRecommended = detectedProvider === provider.id;

          return (
            <button
              key={provider.id}
              onClick={() => handleSelectProvider(provider.id)}
              className={`
                relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all
                text-left
                ${isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-md'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }
              `}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600 
                                   text-white rounded-full text-xs font-medium shadow-sm">
                    <Globe className="w-3 h-3" />
                    {t('paymentProvider.recommended')}
                  </span>
                </div>
              )}

              {/* Provider Logo */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-2xl
                ${isSelected ? 'bg-purple-100' : 'bg-gray-100'}
              `}>
                {provider.logo}
              </div>

              {/* Provider Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{provider.displayName}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{provider.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {provider.currencies.slice(0, 3).join(', ')}
                  {provider.currencies.length > 3 && ` +${provider.currencies.length - 3} more`}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fallback Warning */}
      {isFallback && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">{t('paymentProvider.fallback.title')}</p>
              <p className="text-xs text-yellow-600 mt-0.5">
                {t('paymentProvider.fallback.description')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        {t('paymentProvider.regionInfo')}
      </p>
    </div>
  );
};

export default PaymentProviderSelector;
