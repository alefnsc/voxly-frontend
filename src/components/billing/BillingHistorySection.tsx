/**
 * Billing History Section Component
 * 
 * Extracted from billing page for reuse in Account Settings.
 * Features:
 * - Transaction history display
 * - Pagination/load more
 * 
 * Design System: Vocaid Brand (purple-first, white, black, zinc)
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from 'contexts/AuthContext';
import { useCreditsWallet, WalletTransaction } from 'hooks/use-credits-wallet';

// ==========================================
// TYPES
// ==========================================

interface BillingHistorySectionProps {
  /** Optional: custom class name */
  className?: string;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

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

export default function BillingHistorySection({ className = '' }: BillingHistorySectionProps) {
  const { t, i18n } = useTranslation();
  const { user, isLoaded } = useUser();
  
  // Credit wallet state (from hook)
  const {
    transactions,
    pagination,
    isLoadingHistory,
    fetchHistory,
    loadMoreHistory,
  } = useCreditsWallet({ autoFetch: false, historyLimit: 10 });

  // Initial history fetch
  useEffect(() => {
    if (isLoaded && user?.id) {
      fetchHistory();
    }
  }, [isLoaded, user?.id, fetchHistory]);

  return (
    <div className={className}>
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
    </div>
  );
}

export { BillingHistorySection };
