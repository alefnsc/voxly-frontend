import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useMediaQuery } from '@mantine/hooks';
import { Sparkles, Crown, Star, Loader2, CreditCard, Shield, Globe } from 'lucide-react';
import { CREDIT_PACKAGES, CreditPackage } from '../../services/MercadoPagoService';
import apiService from '../../services/APIService';

// Payment provider types
type PaymentProvider = 'mercadopago' | 'paypal';

interface CreditPackagesProps {
  onPurchaseComplete?: () => void;
}

interface PackageCardProps {
  pkg: CreditPackage;
  getPackageIcon: (packageId: string) => React.ReactNode;
  onPurchase: (pkg: CreditPackage) => void;
  isLoading: boolean;
  loadingPackageId: string | null;
  t: (key: string, options?: Record<string, unknown>) => string;
}

// Individual package card - clean self-contained styling
const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  getPackageIcon,
  onPurchase,
  isLoading,
  loadingPackageId,
  t
}) => {
  const isThisLoading = isLoading && loadingPackageId === pkg.id;

  return (
    <div
      className={`
        relative bg-white rounded-2xl p-6 flex flex-col h-full
        transition-all duration-300 hover:shadow-xl
        ${pkg.popular
          ? 'border-2 border-purple-500 shadow-lg shadow-purple-100 ring-1 ring-purple-200'
          : 'border border-gray-200 hover:border-purple-300 shadow-md'
        }
      `}
    >
      {/* Popular Badge */}
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md whitespace-nowrap flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            {t('creditPackages.mostPopular')}
          </span>
        </div>
      )}

      {/* Savings Badge */}
      {pkg.savings && (
        <div className="absolute top-4 right-4">
          <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-semibold">
            {pkg.savings}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-4 mt-2">
        <div className={`
          p-4 rounded-2xl
          ${pkg.popular
            ? 'bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-200'
            : 'bg-purple-100 text-purple-700'
          }
        `}>
          {getPackageIcon(pkg.id)}
        </div>
      </div>

      {/* Package Name */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">
          {pkg.name}
        </h3>
        <p className="text-gray-500 text-sm">
          {pkg.description}
        </p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center">
          <span className="text-lg text-gray-500">$</span>
          <span className="text-4xl font-extrabold text-gray-900">
            {pkg.priceUSD.toFixed(2).split('.')[0]}
          </span>
          <span className="text-xl text-gray-500">.{pkg.priceUSD.toFixed(2).split('.')[1]}</span>
          <span className="text-sm text-gray-400 ml-1">USD</span>
        </div>
        <p className="text-gray-600 mt-2">
          <span className="font-bold text-lg text-purple-700">{pkg.credits}</span> {t('creditPackages.credits')}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          ${(pkg.priceUSD / pkg.credits).toFixed(2)} {t('creditPackages.perInterview')}
        </p>
        <p className="text-xs text-purple-600 font-medium mt-1">
          ≈ R$ {pkg.priceBRL.toFixed(2)} BRL
        </p>
      </div>

      {/* Purchase Button */}
      <button
        onClick={() => onPurchase(pkg)}
        disabled={isThisLoading}
        className={`
          w-full py-3 px-4 rounded-xl font-bold text-base
          transition-all duration-300 ease-out
          flex items-center justify-center gap-2
          shadow-md hover:shadow-lg
          transform hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
          ${pkg.popular
            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
          }
        `}
      >
        {isThisLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('creditPackages.processing')}</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>{t('creditPackages.buyCredits', { count: pkg.credits })}</span>
          </>
        )}
      </button>
    </div>
  );
};

// Main component
const CreditPackages: React.FC<CreditPackagesProps> = ({ onPurchaseComplete }) => {
  const { t } = useTranslation();
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  
  // Multi-provider payment state
  const [detectedProvider, setDetectedProvider] = useState<PaymentProvider>('paypal');
  const [providerName, setProviderName] = useState<string>('PayPal');
  const [isLoadingProvider, setIsLoadingProvider] = useState(false);

  // Storage key for persisting package selection through auth flow
  const PENDING_PACKAGE_KEY = 'Vocaid_pending_package';

  // Get pending package from localStorage
  const getPendingPackage = (): CreditPackage | null => {
    try {
      const stored = localStorage.getItem(PENDING_PACKAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Find the matching package from CREDIT_PACKAGES to ensure fresh data
        const pkg = CREDIT_PACKAGES.find(p => p.id === parsed.id);
        return pkg || null;
      }
    } catch (e) {
      console.warn('Failed to parse pending package:', e);
    }
    return null;
  };

  // Save pending package to localStorage
  const savePendingPackage = (pkg: CreditPackage) => {
    try {
      localStorage.setItem(PENDING_PACKAGE_KEY, JSON.stringify({ id: pkg.id }));
      console.log('📦 Saved pending package to localStorage:', pkg.id);
    } catch (e) {
      console.warn('Failed to save pending package:', e);
    }
  };

  // Clear pending package from localStorage
  const clearPendingPackage = () => {
    try {
      localStorage.removeItem(PENDING_PACKAGE_KEY);
      console.log('🗑️ Cleared pending package from localStorage');
    } catch (e) {
      console.warn('Failed to clear pending package:', e);
    }
  };

  // Detect preferred payment provider based on user's region
  const detectPaymentProvider = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingProvider(true);
    try {
      const result = await apiService.getPreferredPaymentProvider(user.id);
      if (result.status === 'success' && result.data) {
        setDetectedProvider(result.data.provider);
        setProviderName(result.data.name);
        console.log('💳 Detected payment provider:', result.data.provider, result.data.name);
      }
    } catch (err) {
      console.warn('Could not detect payment provider, defaulting to PayPal:', err);
      // Default to PayPal for global users
      setDetectedProvider('paypal');
      setProviderName('PayPal');
    } finally {
      setIsLoadingProvider(false);
    }
  }, [user?.id]);

  // Detect provider on mount/user change
  useEffect(() => {
    if (isSignedIn && user) {
      detectPaymentProvider();
    }
  }, [isSignedIn, user, detectPaymentProvider]);

  // Effect to handle purchase after sign-in (restored from localStorage)
  useEffect(() => {
    if (isSignedIn && user) {
      const pendingPackage = getPendingPackage();
      if (pendingPackage) {
        // User just signed in and has a pending package to purchase
        console.log('🔐 User signed in, found pending package in localStorage:', pendingPackage.id);
        
        // Clear it immediately to prevent duplicate processing
        clearPendingPackage();
        
        // Small delay to ensure user data is ready, then proceed with purchase
        setTimeout(async () => {
          if (!user) {
            setError(t('creditPackages.errors.authFailed'));
            return;
          }

          setIsLoading(true);
          setLoadingPackageId(pendingPackage.id);
          setError(null);
          setPaymentStatus(t('creditPackages.status.openingPayment'));

          try {
            console.log(`🛒 Resuming purchase for ${pendingPackage.name}...`);
            
            // Use multi-provider backend API
            const paymentResult = await apiService.createGeoPayment(user.id, {
              packageId: pendingPackage.id as 'starter' | 'intermediate' | 'professional',
            });

            if (paymentResult.status !== 'success' || !paymentResult.data.redirectUrl) {
              throw new Error('Failed to create payment');
            }

            const { redirectUrl, provider, sandboxMode } = paymentResult.data;
            console.log(`✅ Payment created via ${provider}${sandboxMode ? ' (sandbox)' : ''}`);

            const popupWidth = 600;
            const popupHeight = 700;
            const left = (window.screen.width - popupWidth) / 2;
            const top = (window.screen.height - popupHeight) / 2;

            const popupName = provider === 'mercadopago' ? 'MercadoPago Checkout' : 'PayPal Checkout';
            const popup = window.open(
              redirectUrl,
              popupName,
              `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            if (!popup) {
              setPaymentStatus(t('creditPackages.status.redirecting'));
              window.location.href = redirectUrl;
              return;
            }

            const providerDisplayName = provider === 'mercadopago' ? 'Mercado Pago' : 'PayPal';
            setPaymentStatus(t('creditPackages.status.completeInPopup', { provider: providerDisplayName }));

            // Get current credits from backend PostgreSQL (source of truth)
            let currentCredits = 0;
            try {
              const userResult = await apiService.getCurrentUser(user.id);
              currentCredits = userResult.user?.credits || 0;
            } catch (e) {
              console.warn('Could not fetch current credits, using 0');
            }
            const expectedCredits = currentCredits + pendingPackage.credits;

            pollForCreditsChange(currentCredits, expectedCredits, popup);
          } catch (err) {
            console.error('❌ Purchase error:', err);
            setError(t('creditPackages.errors.paymentFailed'));
            setPaymentStatus(null);
            setIsLoading(false);
            setLoadingPackageId(null);
          }
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user, t]);

  // Get icon for each package type
  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'professional':
        return <Crown className="w-8 h-8" />;
      case 'intermediate':
        return <Sparkles className="w-8 h-8" />;
      case 'starter':
      default:
        return <Star className="w-8 h-8" />;
    }
  };

  // Poll for credits change from PostgreSQL backend (source of truth)
  const pollForCreditsChange = async (initialCredits: number, expectedCredits: number, popup: Window | null) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s intervals)

    const checkCredits = async () => {
      try {
        // Check if popup was closed by user
        if (popup && popup.closed) {
          setPaymentStatus(t('creditPackages.status.windowClosed'));
        }

        // Fetch credits from backend PostgreSQL (source of truth) - skip cache for payment verification
        if (!user?.id) {
          console.error('No user ID available for credit check');
          return;
        }

        const result = await apiService.getCurrentUser(user.id, true); // skipCache = true for payment polling
        const currentCredits = result.user?.credits || 0;

        console.log(`Checking credits from backend: initial=${initialCredits}, current=${currentCredits}, expected=${expectedCredits}`);

        if (currentCredits >= expectedCredits) {
          console.log('✅ Credits updated in PostgreSQL!');
          setPaymentStatus(t('creditPackages.status.paymentSuccessful'));

          // Close popup if still open
          if (popup && !popup.closed) {
            popup.close();
          }

          // Redirect to success page
          setTimeout(() => {
            window.location.href = '/payment/success?status=approved&credits=' + currentCredits;
          }, 1500);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(checkCredits, 5000); // Check every 5 seconds
        } else {
          setPaymentStatus(t('creditPackages.status.verificationTimeout'));
          setIsLoading(false);
          setLoadingPackageId(null);
        }
      } catch (err) {
        console.error('Error checking credits from backend:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkCredits, 5000);
        }
      }
    };

    // Start polling after a short delay to allow webhook processing
    setTimeout(checkCredits, 5000);
  };

  // Handle purchase after authentication (for users who just signed in)
  const handlePurchaseAfterAuth = async (pkg: CreditPackage) => {
    if (!user) {
      setError(t('creditPackages.errors.authFailed'));
      return;
    }

    setIsLoading(true);
    setLoadingPackageId(pkg.id);
    setError(null);
    setPaymentStatus(t('creditPackages.status.creatingPayment'));

    try {
      console.log(`🛒 Initiating purchase for ${pkg.name}...`);
      console.log(`   Display: $${pkg.priceUSD} USD`);
      console.log(`   Provider: ${detectedProvider}`);

      // Use multi-provider backend API
      const paymentResult = await apiService.createGeoPayment(user.id, {
        packageId: pkg.id as 'starter' | 'intermediate' | 'professional',
      });

      if (paymentResult.status !== 'success' || !paymentResult.data.redirectUrl) {
        throw new Error('Failed to create payment');
      }

      const { redirectUrl, provider, sandboxMode } = paymentResult.data;
      console.log(`✅ Payment created via ${provider}${sandboxMode ? ' (sandbox)' : ''}`);

      // Open payment in a popup window
      const popupWidth = 600;
      const popupHeight = 700;
      const left = (window.screen.width - popupWidth) / 2;
      const top = (window.screen.height - popupHeight) / 2;

      const popupName = provider === 'mercadopago' ? 'MercadoPago Checkout' : 'PayPal Checkout';
      const popup = window.open(
        redirectUrl,
        popupName,
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        // Popup was blocked, fallback to redirect
        console.log('Popup blocked, redirecting instead...');
        setPaymentStatus(t('creditPackages.status.redirecting'));
        window.location.href = redirectUrl;
        return;
      }

      const providerDisplayName = provider === 'mercadopago' ? 'Mercado Pago' : 'PayPal';
      setPaymentStatus(t('creditPackages.status.completeInPopup', { provider: providerDisplayName }));

      // Get current credits from backend PostgreSQL (source of truth)
      let currentCredits = 0;
      try {
        const userResult = await apiService.getCurrentUser(user.id);
        currentCredits = userResult.user?.credits || 0;
      } catch (e) {
        console.warn('Could not fetch current credits, using 0');
      }
      const expectedCredits = currentCredits + pkg.credits;

      // Start polling for credits change
      pollForCreditsChange(currentCredits, expectedCredits, popup);
    } catch (err) {
      console.error('❌ Purchase error:', err);
      setError(t('creditPackages.errors.paymentFailed'));
      setPaymentStatus(null);
      setIsLoading(false);
      setLoadingPackageId(null);
    }
  };

  // Handle purchase - open MercadoPago in popup and poll for credits
  const handlePurchase = async (pkg: CreditPackage) => {
    // If user is not authenticated, save package to localStorage and prompt sign-in
    if (!user) {
      console.log('🔐 User not authenticated, saving package and prompting sign-in...');
      savePendingPackage(pkg);
      setError(null);
      // Always redirect to /credits page after sign-in to ensure CreditPackages component is mounted
      const creditsPageUrl = `${window.location.origin}/credits`;
      openSignIn({
        afterSignInUrl: creditsPageUrl,
        afterSignUpUrl: creditsPageUrl,
      });
      return;
    }

    // User is authenticated, proceed with purchase
    handlePurchaseAfterAuth(pkg);
  };

  // Detect mobile for ordering
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Sort packages: Mobile = Professional first (top), Desktop = Starter first (left)
  // Default to mobile order (Professional first) when isMobile is undefined (SSR/initial render)
  const mobileOrder: Record<string, number> = { professional: 0, intermediate: 1, starter: 2 };
  const desktopOrder: Record<string, number> = { starter: 0, professional: 1, intermediate: 2 };
  const order = isMobile === false ? desktopOrder : mobileOrder;
  const sortedPackages = [...CREDIT_PACKAGES].sort((a, b) => {
    // Defensive: If id is missing, put at end
    const aOrder = order.hasOwnProperty(a.id) ? order[a.id] : 99;
    const bOrder = order.hasOwnProperty(b.id) ? order[b.id] : 99;
    return aOrder - bOrder;
  });
  // Debug: Log the order and sorted package ids
  if (typeof window !== 'undefined') {
    // Only log in browser
    console.log('[CreditPackages] isMobile:', isMobile, '| Sorted order:', sortedPackages.map(p => p.id));
  }

  return (
    <div className="w-full">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Payment Status Message */}
      {paymentStatus && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <p className="text-purple-700 font-medium text-sm">{paymentStatus}</p>
          </div>
        </div>
      )}

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedPackages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            getPackageIcon={getPackageIcon}
            onPurchase={handlePurchase}
            isLoading={isLoading}
            loadingPackageId={loadingPackageId}
            t={t}
          />
        ))}
      </div>

      {/* Payment Security Info */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-gray-600 text-sm font-medium">
            {t('creditPackages.securePayment', { provider: providerName })}
          </span>
          {isLoadingProvider && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <Globe className="w-3 h-3 text-gray-400" />
          <p className="text-xs text-gray-400">
            {detectedProvider === 'mercadopago' 
              ? `${t('creditPackages.pricesUsd')} • ${t('creditPackages.paymentProcessing.latam')}` 
              : `${t('creditPackages.pricesUsd')} • ${t('creditPackages.paymentProcessing.global')}`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreditPackages;
