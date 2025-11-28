import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Check, Sparkles, Zap, Crown, Star, Loader2 } from 'lucide-react';
import mercadoPagoService, { CREDIT_PACKAGES, CreditPackage } from '../../services/MercadoPagoService';

// Initialize Mercado Pago SDK
const publicKey = process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY || '';
if (publicKey) {
  initMercadoPago(publicKey, { locale: 'pt-BR' });
}

interface PackageCardProps {
  pkg: CreditPackage;
  userId: string;
  userEmail: string;
  getPackageIcon: (packageId: string) => React.ReactNode;
}

// Individual package card with its own preference state
const PackageCard: React.FC<PackageCardProps> = ({ pkg, userId, userEmail, getPackageIcon }) => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create preference when card mounts or user changes
  const createPreference = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const prefId = await mercadoPagoService.createPreference(pkg.id, userId, userEmail);
      setPreferenceId(prefId);
    } catch (err) {
      console.error(`Error creating preference for ${pkg.id}:`, err);
      setError('Failed to load payment');
    } finally {
      setIsLoading(false);
    }
  }, [pkg.id, userId, userEmail]);

  useEffect(() => {
    createPreference();
  }, [createPreference]);

  return (
    <Card
      className={`relative p-6 sm:p-8 flex flex-col transition-all duration-300 hover:shadow-xl ${
        pkg.popular
          ? 'border-2 border-gray-800 shadow-lg scale-105'
          : 'border border-gray-200 hover:border-gray-400'
      }`}
    >
      {/* Popular Badge */}
      {pkg.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gray-800 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
            Most Popular
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
        <div className={`p-4 rounded-full ${pkg.popular ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
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

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center">
          <span className="text-sm text-gray-600 mr-1">{pkg.currencySymbol}</span>
          <span className="text-4xl font-extrabold text-gray-900">
            {pkg.price.toFixed(2).split('.')[0]}
          </span>
          <span className="text-lg text-gray-600">,{pkg.price.toFixed(2).split('.')[1]}</span>
        </div>
        <p className="text-gray-600 mt-2">
          <span className="font-semibold text-lg">{pkg.credits}</span> Credits
        </p>
        <p className="text-sm text-gray-500">
          {pkg.currencySymbol} {(pkg.price / pkg.credits).toFixed(2)} per interview
        </p>
      </div>

      {/* Features */}
      <CardContent className="p-0 mb-6 flex-grow">
        <ul className="space-y-3">
          {pkg.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      {/* MercadoPago Wallet Button */}
      <CardFooter className="p-0">
        {isLoading ? (
          <div className="w-full py-4 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600">Loading payment...</span>
          </div>
        ) : error ? (
          <button
            onClick={createPreference}
            className="w-full py-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            {error} - Click to retry
          </button>
        ) : preferenceId ? (
          <div className="w-full mercadopago-wallet-dark">
            <Wallet
              initialization={{ preferenceId }}
              customization={{
                visual: {
                  buttonBackground: pkg.popular ? 'black' : 'white',
                  borderRadius: '8px',
                  valuePropColor: 'grey'
                },
                texts: {
                  action: 'pay',
                  valueProp: 'security_safety'
                }
              }}
              onError={(error) => {
                console.error('Wallet error:', error);
                setError('Payment error');
              }}
            />
          </div>
        ) : (
          <div className="w-full py-4 text-center text-gray-500">
            Initializing...
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

interface CreditPackagesProps {
  onPurchaseComplete?: () => void;
}

export const CreditPackages: React.FC<CreditPackagesProps> = ({ onPurchaseComplete }) => {
  const { user } = useUser();

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'professional':
        return <Crown className="w-8 h-8" />;
      case 'intermediate':
        return <Star className="w-8 h-8" />;
      case 'starter':
        return <Sparkles className="w-8 h-8" />;
      default:
        return <Zap className="w-8 h-8" />;
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Please log in to purchase credits</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 bg-clip-text text-transparent mb-4">
          Choose Your Credit Package
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select the perfect package for your interview preparation needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {CREDIT_PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            userId={user.id}
            userEmail={user.primaryEmailAddress?.emailAddress || ''}
            getPackageIcon={getPackageIcon}
          />
        ))}
      </div>

      {/* Trust Indicators */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Secure payment powered by Mercado Pago • All transactions are encrypted
        </p>
        <div className="flex justify-center items-center space-x-6 text-gray-400 flex-wrap">
          <span className="text-xs">🔒 256-bit SSL</span>
          <span className="text-xs">✓ PCI Compliant</span>
          <span className="text-xs">💳 Pix, Card, Boleto</span>
        </div>
      </div>

      {/* Custom styles for MercadoPago Wallet in dark theme */}
      <style>{`
        .mercadopago-wallet-dark {
          --mp-primary-color: #1f2937;
        }
        .mercadopago-wallet-dark .mercadopago-button {
          width: 100% !important;
          min-height: 48px;
        }
      `}</style>
    </div>
  );
};

export default CreditPackages;
