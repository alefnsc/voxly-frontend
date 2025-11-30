import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Check, Sparkles, Crown, Star, Loader2, CreditCard } from 'lucide-react';
import mercadoPagoService, { CREDIT_PACKAGES, CreditPackage } from '../../services/MercadoPagoService';

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

// Custom dark purple purchase button
const PurchaseButton: React.FC<{
  onClick: () => void;
  isLoading: boolean;
  credits: number;
  popular?: boolean;
}> = ({ onClick, isLoading, credits, popular }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        w-full py-4 px-6 rounded-xl font-bold text-lg
        transition-all duration-300 ease-out
        flex items-center justify-center gap-3
        shadow-lg hover:shadow-xl
        transform hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
        ${popular
          ? 'bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 text-white hover:from-purple-800 hover:via-purple-700 hover:to-violet-700 shadow-purple-500/30'
          : 'bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 text-white hover:from-purple-950 hover:via-purple-900 hover:to-purple-950 shadow-purple-900/30'
        }
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          <span>Buy {credits} Credits</span>
        </>
      )}
    </button>
  );
};

// Individual package card
const PackageCard: React.FC<PackageCardProps> = ({
  pkg,
  getPackageIcon,
  onPurchase,
  isLoading,
  loadingPackageId
}) => {
  const isThisLoading = isLoading && loadingPackageId === pkg.id;

  return (
    <Card
      className={`relative p-6 sm:p-8 flex flex-col transition-all duration-300 hover:shadow-xl ${pkg.popular
          ? 'border-2 border-purple-500 shadow-lg shadow-purple-200/50 scale-105'
          : 'border border-gray-200 hover:border-purple-300'
        }`}
    >
      {/* Popular Badge */}
      {pkg.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-700 to-violet-600 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-purple-500/30">
            ⭐ Most Popular
          </span>
        </div>
      )}

      {/* Savings Badge */}
      {pkg.savings && (
        <div className="absolute top-4 right-4">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
            {pkg.savings}
          </span>
        </div>
      )}

      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className={`p-4 rounded-full ${pkg.popular
            ? 'bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30'
            : 'bg-purple-100 text-purple-700'
          }`}>
          {getPackageIcon(pkg.id)}
        </div>
      </div>

      {/* Package Name */}
      <CardHeader className="text-center p-0 mb-4">
        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
          {pkg.name}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {pkg.description}
        </CardDescription>
      </CardHeader>

      {/* Price - Display in USD */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center">
          <span className="text-lg text-gray-600 mr-1">$</span>
          <span className="text-5xl font-extrabold text-gray-900">
            {pkg.priceUSD.toFixed(2).split('.')[0]}
          </span>
          <span className="text-xl text-gray-600">.{pkg.priceUSD.toFixed(2).split('.')[1]}</span>
          <span className="text-sm text-gray-500 ml-2">USD</span>
        </div>
        <p className="text-gray-600 mt-2">
          <span className="font-semibold text-lg">{pkg.credits}</span> Credits
        </p>
        <p className="text-sm text-gray-500">
          ${(pkg.priceUSD / pkg.credits).toFixed(2)} per interview
        </p>
        {/* Show BRL equivalent */}
        <p className="text-xs text-purple-600 mt-1 font-medium">
          ≈ R$ {pkg.priceBRL.toFixed(2)} BRL
        </p>
      </div>

      {/* Features */}
      <CardContent className="p-0 mb-6 flex-grow">
        <ul className="space-y-3">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      {/* Custom Purchase Button */}
      <CardFooter className="p-0 mt-auto">
        <PurchaseButton
          onClick={() => onPurchase(pkg)}
          isLoading={isThisLoading}
          credits={pkg.credits}
          popular={pkg.popular}
        />
      </CardFooter>
    </Card>
  );
};

// Main component
const CreditPackages: React.FC<CreditPackagesProps> = ({ onPurchaseComplete }) => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

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

  // Poll for credits change (more reliable than payment status)
  const pollForCreditsChange = async (initialCredits: number, expectedCredits: number, popup: Window | null) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s intervals)

    const checkCredits = async () => {
      try {
        // Check if popup was closed by user
        if (popup && popup.closed) {
          setPaymentStatus('Payment window closed. Checking for credit update...');
        }

        // Reload user to get fresh credits from Clerk
        await user?.reload();
        const currentCredits = (user?.publicMetadata?.credits as number) || 0;

        console.log(`Checking credits: initial=${initialCredits}, current=${currentCredits}, expected=${expectedCredits}`);

        if (currentCredits >= expectedCredits) {
          console.log('✅ Credits updated!');
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
        console.error('Error checking credits:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkCredits, 5000);
        }
      }
    };

    // Start polling after a short delay to allow webhook processing
    setTimeout(checkCredits, 5000);
  };

  // Handle purchase - open MercadoPago in popup and poll for credits
  const handlePurchase = async (pkg: CreditPackage) => {
    if (!user) {
      setError('Please sign in to purchase credits');
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

      // Get current credits to detect change
      const currentCredits = (user.publicMetadata?.credits as number) || 0;
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

  // Sort packages: Starter first, then Intermediate, then Professional
  const sortedPackages = [...CREDIT_PACKAGES].sort((a, b) => {
    const order: Record<string, number> = { starter: 0, intermediate: 1, professional: 2 };
    return (order[a.id] || 99) - (order[b.id] || 99);
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">

      <div className="flex-col items-center justify-center text-center mb-16 text-center">

        <h1 className='flex text-4xl lg:text-6xl font-bold text-gradient bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700'>Choose Your Plan</h1>
        <p className='flex text-xl font-bold text-gray-700'>          
          Get credits to practice interviews with our AI interviewer.
          Pay once, use anytime.
        </p>

      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-10 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Payment Status Message */}
      {paymentStatus && (
        <div className="mb-12 p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <p className="text-purple-700 font-medium">{paymentStatus}</p>
          </div>
        </div>
      )}

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
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

      {/* Payment Info */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-purple-700 font-medium">
            Secure payment powered by MercadoPago
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Prices shown in USD • Payment processed in BRL
        </p>
      </div>
    </div>
  );
};

export default CreditPackages;
