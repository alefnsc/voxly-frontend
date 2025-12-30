/**
 * B2C Billing Page
 * 
 * Credit management and purchasing via Mercado Pago or PayPal.
 * Features:
 * - Current credit balance from API
 * - Credit pack selection with localized pricing
 * - Payment provider auto-detection + manual override
 * - Purchase history from API
 * - Transaction ledger
 * 
 * Design System: Vocaid Brand (purple-first, white, black, zinc)
 * Title Pattern: "first word black + second word purple"
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { DefaultLayout } from 'components/default-layout';
import { useCreditsWallet, WalletTransaction } from 'hooks/use-credits-wallet';
import apiService from 'services/APIService';

// ==========================================
// TYPES
// ==========================================

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  priceUSD: number;
  currency: string;
  description: string;
}

type PaymentProvider = 'mercadopago' | 'paypal';

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatCurrency(amount: number, currency: string = 'USD'): string {
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateString: string, locale: string = 'en-US'): string {
  return new Date(dateString).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getTransactionIndicator(type: WalletTransaction['type'] | string) {
  const baseClasses = "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold";
  switch (type) {
    case 'GRANT':
      return <span className={`${baseClasses} bg-purple-100 text-purple-600`}>+</span>;
    case 'PURCHASE':
      return <span className={`${baseClasses} bg-purple-600 text-white`}>$</span>;
    case 'USAGE':
    case 'SPEND':
      return <span className={`${baseClasses} bg-zinc-100 text-zinc-600`}>−</span>;
    case 'REFUND':
    case 'RESTORE':
      return <span className={`${baseClasses} bg-purple-50 text-purple-600`}>↺</span>;
    case 'PROMO':
      return <span className={`${baseClasses} bg-purple-100 text-purple-700`}>★</span>;
    default:
      return <span className={`${baseClasses} bg-zinc-100 text-zinc-600`}>•</span>;
  }
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const { user, isLoaded } = useUser();
  
  // Credit wallet state (from hook)
  const {
    balance,
    transactions,
    pagination,
    isLoading: isLoadingBalance,
    isLoadingHistory,
    error: walletError,
    refreshBalance,
    fetchHistory,
    loadMoreHistory,
  } = useCreditsWallet({ autoFetch: true, historyLimit: 10 });

  // Packages state
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [, setCurrency] = useState('USD');
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  // Provider state
  const [detectedProvider, setDetectedProvider] = useState<PaymentProvider>('paypal');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('paypal');
  const [providerName, setProviderName] = useState('PayPal');
  const [, setIsLoadingProvider] = useState(true);
  const [showProviderSelector, setShowProviderSelector] = useState(false);

  // Purchase state
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Fetch packages from backend
  const fetchPackages = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingPackages(true);
    setPackagesError(null);
    
    try {
      const response = await apiService.getLocalizedPackages(user.id);
      if (response.status === 'success' && response.data) {
        setPackages(response.data.packages);
        setCurrency(response.data.currency);
      }
    } catch (err: any) {
      console.error('Failed to fetch packages:', err);
      setPackagesError(t('billing.failedToLoadPackages'));
    } finally {
      setIsLoadingPackages(false);
    }
  }, [user?.id, t]);

  // Fetch preferred provider from backend
  const fetchProvider = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingProvider(true);
    
    try {
      const response = await apiService.getPreferredPaymentProvider(user.id);
      if (response.status === 'success' && response.data) {
        setDetectedProvider(response.data.provider);
        setSelectedProvider(response.data.provider);
        setProviderName(response.data.name);
      }
    } catch (err: any) {
      console.error('Failed to fetch provider:', err);
      // Default to PayPal on error
      setDetectedProvider('paypal');
      setSelectedProvider('paypal');
    } finally {
      setIsLoadingProvider(false);
    }
  }, [user?.id]);

  // Initial data fetch
  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchPackages();
      fetchProvider();
      fetchHistory();
    }
  }, [isLoaded, user?.id, fetchPackages, fetchProvider, fetchHistory]);

  // Handle provider selection
  const handleSelectProvider = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    setProviderName(provider === 'mercadopago' ? 'Mercado Pago' : 'PayPal');
    setShowProviderSelector(false);
  };

  // Handle purchase
  const handlePurchase = async (packageId: string) => {
    if (!user?.id) return;
    
    setSelectedPackage(packageId);
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      const response = await apiService.createGeoPayment(user.id, {
        packageId: packageId as 'starter' | 'intermediate' | 'professional',
        provider: selectedProvider,
      });

      if (response.status === 'success' && response.data?.redirectUrl) {
        // Redirect to payment provider
        window.location.href = response.data.redirectUrl;
      } else {
        throw new Error('Failed to create payment');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      setPurchaseError(error.message || t('billing.paymentFailed'));
    } finally {
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

  // Determine which package is "popular" (highest value)
  const getPopularPackageId = () => {
    if (packages.length >= 3) return packages[2].id; // Professional (highest)
    if (packages.length === 2) return packages[1].id;
    return packages[0]?.id;
  };

  const isPopular = (pkgId: string) => pkgId === getPopularPackageId();

  return (
    <DefaultLayout className="bg-zinc-50">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          
          {/* Header - Brand Pattern: first word black, second word purple */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              <span className="text-zinc-900">Credits &</span>{' '}
              <span className="text-purple-600">Billing</span>
            </h1>
            <p className="text-sm sm:text-base text-zinc-500 mt-1 sm:mt-2">
              {t('creditsPage.billing.pageSubtitle', 'Manage your credits and purchase more interviews')}
            </p>
          </div>

          {/* Error Messages */}
          {(walletError || packagesError || purchaseError) && (
            <div className="bg-white border border-red-200 rounded-xl p-4 text-red-700 shadow-sm">
              {walletError || packagesError || purchaseError}
              <button
                onClick={() => {
                  setPurchaseError(null);
                  refreshBalance();
                  fetchPackages();
                }}
                className="ml-2 underline hover:no-underline font-medium"
              >
                {t('billing.retry')}
              </button>
            </div>
          )}

          {/* Balance Card - Purple Gradient Hero */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-36 sm:w-48 h-36 sm:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-purple-200 text-xs sm:text-sm font-medium uppercase tracking-wide">
                  {t('creditsPage.billing.currentBalance', 'Current Balance')}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  {isLoadingBalance ? (
                    <span className="text-xl sm:text-2xl text-purple-200 animate-pulse">{t('billing.loading')}</span>
                  ) : (
                    <>
                      <span className="text-4xl sm:text-5xl lg:text-6xl font-bold">{balance ?? 0}</span>
                      <span className="text-purple-200 text-base sm:text-lg font-medium">
                        {t('creditsPage.billing.credits', 'credits')}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-purple-200/80 text-xs sm:text-sm mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t('creditsPage.billing.creditsNeverExpire', 'Credits never expire')}
                </p>
              </div>
              <button
                onClick={() => refreshBalance()}
                disabled={isLoadingBalance}
                className="px-4 sm:px-5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 border border-white/20 min-h-[44px]"
              >
                {isLoadingBalance ? t('billing.refreshing') : t('billing.refresh')}
              </button>
            </div>
          </div>

          {/* Payment Provider Selector */}
          <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-zinc-900">{t('billing.paymentMethod')}</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 truncate">
                    {selectedProvider === detectedProvider 
                      ? t('billing.recommendedForRegion') 
                      : t('billing.manuallySelected')}
                  </p>
                </div>
              </div>
              
              {showProviderSelector ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleSelectProvider('paypal')}
                    className={`flex-1 px-4 sm:px-5 py-3 rounded-lg border-2 font-medium transition-all min-h-[48px] ${
                      selectedProvider === 'paypal'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-zinc-200 hover:border-purple-300 text-zinc-700'
                    }`}
                  >
                    PayPal
                  </button>
                  <button
                    onClick={() => handleSelectProvider('mercadopago')}
                    className={`flex-1 px-4 sm:px-5 py-3 rounded-lg border-2 font-medium transition-all min-h-[48px] ${
                      selectedProvider === 'mercadopago'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-zinc-200 hover:border-purple-300 text-zinc-700'
                    }`}
                  >
                    Mercado Pago
                  </button>
                  <button
                    onClick={() => setShowProviderSelector(false)}
                    className="px-4 py-3 text-zinc-500 hover:text-zinc-700 min-h-[48px]"
                  >
                    {t('billing.cancel')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-4 sm:px-5 py-2.5 bg-purple-50 rounded-lg font-semibold text-purple-700 border border-purple-200">
                    {providerName}
                  </span>
                  <button
                    onClick={() => setShowProviderSelector(true)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2 min-h-[44px] flex items-center"
                  >
                    {t('billing.change')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Credit Packages - Section Title with Brand Pattern */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
              <span className="text-zinc-900">Buy</span>{' '}
              <span className="text-purple-600">Credits</span>
            </h2>
            
            {isLoadingPackages ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl sm:rounded-2xl border border-zinc-200 p-4 sm:p-6 animate-pulse shadow-sm">
                    <div className="h-6 bg-zinc-200 rounded w-1/2 mb-4" />
                    <div className="h-10 bg-zinc-200 rounded w-2/3 mb-4" />
                    <div className="h-4 bg-zinc-200 rounded w-full mb-2" />
                    <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative bg-white rounded-xl sm:rounded-2xl transition-all hover:shadow-lg ${
                      isPopular(pkg.id)
                        ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/10 sm:scale-[1.02]'
                        : 'border border-zinc-200 shadow-sm hover:border-purple-300'
                    }`}
                  >
                    {isPopular(pkg.id) && (
                      <div className="absolute -top-3 sm:-top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-purple-500 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-md uppercase tracking-wide whitespace-nowrap">
                          {t('billing.bestValue')}
                        </span>
                      </div>
                    )}

                    <div className="p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900">{pkg.name}</h3>
                      <p className="text-xs sm:text-sm text-zinc-500 mt-1">{pkg.description}</p>

                      <div className="mt-4 sm:mt-6">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl sm:text-3xl font-bold ${isPopular(pkg.id) ? 'text-purple-600' : 'text-zinc-900'}`}>
                            {formatCurrency(pkg.price, pkg.currency)}
                          </span>
                        </div>
                        {pkg.currency !== 'USD' && (
                          <p className="text-xs text-zinc-400 mt-1">
                            ≈ {formatCurrency(pkg.priceUSD, 'USD')}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-zinc-500 mt-2 font-medium">
                          {t('billing.interviewCredits', { count: pkg.credits })}
                        </p>
                      </div>

                      <ul className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                        <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-600">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          {t('billing.practiceInterviews', { count: pkg.credits })}
                        </li>
                        <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-600">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          {t('billing.aiFeedback')}
                        </li>
                        <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-600">
                          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                          {t('billing.performanceAnalytics')}
                        </li>
                      </ul>

                      <button
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={isPurchasing}
                        className={`w-full mt-4 sm:mt-6 py-3 sm:py-3.5 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] ${
                          isPopular(pkg.id)
                            ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 shadow-md shadow-purple-500/25'
                            : 'bg-zinc-100 text-zinc-900 hover:bg-purple-50 hover:text-purple-700 border border-zinc-200 hover:border-purple-300'
                        }`}
                      >
                        {isPurchasing && selectedPackage === pkg.id
                          ? t('billing.processing')
                          : t('billing.buyNow')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-center text-sm text-zinc-500 mt-6 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              {t('billing.securePaymentVia')}{' '}
              <span className="font-semibold text-purple-700">{providerName}</span>
            </p>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-zinc-50 to-white">
              <div>
                <h2 className="text-lg font-bold">
                  <span className="text-zinc-900">Transaction</span>{' '}
                  <span className="text-purple-600">History</span>
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  {t('creditsPage.billing.yourPurchasesAndUsage', 'Your purchases and usage')}
                </p>
              </div>
              {isLoadingHistory && (
                <span className="text-sm text-purple-600 animate-pulse font-medium">{t('billing.loading')}</span>
              )}
            </div>

            <div className="divide-y divide-zinc-100">
              {transactions.length === 0 && !isLoadingHistory ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-zinc-500 font-medium">
                    {t('creditsPage.billing.noTransactions', 'No transactions yet')}
                  </p>
                  <p className="text-zinc-400 text-sm mt-1">
                    {t('billing.purchaseToSeeHistory', 'Purchase credits to see your history')}
                  </p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 hover:bg-purple-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getTransactionIndicator(transaction.type)}
                      <div>
                        <p className="font-medium text-zinc-900">{transaction.description}</p>
                        <p className="text-sm text-zinc-500">{formatDate(transaction.createdAt, i18n.language)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.amount > 0 ? 'text-purple-600' : 'text-zinc-500'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}
                        {transaction.amount} {t('billing.credits')}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {t('billing.balance')}: {transaction.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More */}
            {pagination?.hasMore && (
              <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
                <button
                  onClick={loadMoreHistory}
                  disabled={isLoadingHistory}
                  className="w-full py-3 px-4 text-sm font-semibold text-purple-600 hover:bg-purple-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  {isLoadingHistory ? t('billing.loading') : t('billing.loadMore')}
                </button>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-2xl p-8 text-center border border-purple-200/50">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-zinc-900 text-lg">
              {t('billing.needHelp')}
            </h3>
            <p className="text-zinc-600 mt-2">
              {t('billing.contactUsAt')}{' '}
              <a href="mailto:support@vocaid.com" className="text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2">
                support@vocaid.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
