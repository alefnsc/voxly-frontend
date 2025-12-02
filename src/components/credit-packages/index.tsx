import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Check, Sparkles, Crown, Star, Loader2, CreditCard, Shield } from 'lucide-react';
import mercadoPagoService, { CREDIT_PACKAGES, CreditPackage } from '../../services/MercadoPagoService';
import apiService from '../../services/APIService';

interface CreditPackagesProps {
  onPurchaseComplete?: () => void;
}

interface PackageCardProps {
  pkg: CreditPackage;
  getPackageIcon: (packageId: string) => React.ReactNode;
  onPurchase: (pkg: CreditPackage) => void;
  isLoading: boolean;
  loadingPackageId: string | null;
}

// Individual package card - clean self-contained styling
const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  getPackageIcon,
  onPurchase,
  isLoading,
  loadingPackageId
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
            Most Popular
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
          <span className="font-bold text-lg text-purple-700">{pkg.credits}</span> Credits
        </p>
        <p className="text-xs text-gray-400 mt-1">
          ${(pkg.priceUSD / pkg.credits).toFixed(2)} per interview
        </p>
        <p className="text-xs text-purple-600 font-medium mt-1">
          ≈ R$ {pkg.priceBRL.toFixed(2)} BRL
        </p>
      </div>

      {/* Features */}
      <div className="flex-grow mb-6">
        <ul className="space-y-2">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <span className="text-gray-600 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
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
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Buy {pkg.credits} Credits</span>
          </>
        )}
      </button>
    </div>
  );
};

// Main component
const CreditPackages: React.FC<CreditPackagesProps> = ({ onPurchaseComplete }) => {
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // Storage key for persisting package selection through auth flow
  const PENDING_PACKAGE_KEY = 'voxly_pending_package';

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
            setError('Authentication failed. Please try again.');
            return;
          }

          setIsLoading(true);
          setLoadingPackageId(pendingPackage.id);
          setError(null);
          setPaymentStatus('Opening payment window...');

          try {
            console.log(`🛒 Resuming purchase for ${pendingPackage.name}...`);
            
            const paymentUrl = await mercadoPagoService.getPaymentUrl(
              pendingPackage.id,
              user.id,
              user.primaryEmailAddress?.emailAddress || ''
            );

            const popupWidth = 600;
            const popupHeight = 700;
            const left = (window.screen.width - popupWidth) / 2;
            const top = (window.screen.height - popupHeight) / 2;

            const popup = window.open(
              paymentUrl,
              'MercadoPago Checkout',
              `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
            );

            if (!popup) {
              setPaymentStatus('Redirecting to payment...');
              window.location.href = paymentUrl;
              return;
            }

            setPaymentStatus('Complete payment in the popup window. This page will update automatically.');

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
            setError('Failed to initiate payment. Please try again.');
            setPaymentStatus(null);
            setIsLoading(false);
            setLoadingPackageId(null);
          }
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user]);

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
          setPaymentStatus('Payment window closed. Checking for credit update...');
        }

        // Fetch credits from backend PostgreSQL (source of truth)
        if (!user?.id) {
          console.error('No user ID available for credit check');
          return;
        }

        const result = await apiService.getCurrentUser(user.id);
        const currentCredits = result.user?.credits || 0;

        console.log(`Checking credits from backend: initial=${initialCredits}, current=${currentCredits}, expected=${expectedCredits}`);

        if (currentCredits >= expectedCredits) {
          console.log('✅ Credits updated in PostgreSQL!');
          setPaymentStatus('Payment successful! Credits added.');

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
          setPaymentStatus('Credit verification timed out. If you completed the payment, please refresh the page.');
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
      setError('Authentication failed. Please try again.');
      return;
    }

    setIsLoading(true);
    setLoadingPackageId(pkg.id);
    setError(null);
    setPaymentStatus('Opening payment window...');

    try {
      console.log(`🛒 Initiating purchase for ${pkg.name}...`);
      console.log(`   Display: $${pkg.priceUSD} USD`);
      console.log(`   Payment: R$ ${pkg.priceBRL} BRL`);

      // Get the MercadoPago checkout URL
      const paymentUrl = await mercadoPagoService.getPaymentUrl(
        pkg.id,
        user.id,
        user.primaryEmailAddress?.emailAddress || ''
      );

      console.log('✅ Opening MercadoPago checkout in popup...');

      // Open MercadoPago in a popup window
      const popupWidth = 600;
      const popupHeight = 700;
      const left = (window.screen.width - popupWidth) / 2;
      const top = (window.screen.height - popupHeight) / 2;

      const popup = window.open(
        paymentUrl,
        'MercadoPago Checkout',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        // Popup was blocked, fallback to redirect
        console.log('Popup blocked, redirecting instead...');
        setPaymentStatus('Redirecting to payment...');
        window.location.href = paymentUrl;
        return;
      }

      setPaymentStatus('Complete payment in the popup window. This page will update automatically.');

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
      setError('Failed to initiate payment. Please try again.');
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
      openSignIn({
        afterSignInUrl: window.location.href,
        afterSignUpUrl: window.location.href,
      });
      return;
    }

    // User is authenticated, proceed with purchase
    handlePurchaseAfterAuth(pkg);
  };

  // Sort packages: Starter first, then Intermediate, then Professional
  const sortedPackages = [...CREDIT_PACKAGES].sort((a, b) => {
    const order: Record<string, number> = { starter: 0, intermediate: 1, professional: 2 };
    return (order[a.id] || 99) - (order[b.id] || 99);
  });

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
          />
        ))}
      </div>

      {/* Payment Security Info */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
          <Shield className="w-4 h-4 text-green-600" />
          <span className="text-gray-600 text-sm font-medium">
            Secure payment via MercadoPago
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Prices in USD • Payment processed in BRL
        </p>
      </div>
    </div>
  );
};

export default CreditPackages;
