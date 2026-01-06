/**
 * B2C Billing Page
 * 
 * Credit management and purchasing via Mercado Pago or PayPal.
 * This page uses extracted components for reuse in Account Settings.
 * 
 * Legacy route: /app/b2c/billing
 * Components are also available in Account > Credits and Account > Billing
 * 
 * Design System: Vocaid Brand (purple-first, white, black, zinc)
 * Title Pattern: "first word black + second word purple"
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditsPurchaseSection, BillingHistorySection } from 'components/billing';

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function BillingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
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

          {/* Credits Purchase Section */}
          <CreditsPurchaseSection />

          {/* Billing History Section */}
          <BillingHistorySection />
        </div>
      </div>
    </div>
  );
}
