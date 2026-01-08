/**
 * Landing Hero Promo Banner
 * 
 * Premium purple promotional banner for the open beta campaign.
 * Displays at the top of the hero section with animated effects.
 * 
 * HOW TO ADJUST FOR FUTURE CAMPAIGNS:
 * -----------------------------------
 * Edit src/config/openBeta.ts to change:
 * - OPEN_BETA_START_DATE: Campaign start date
 * - OPEN_BETA_BONUS_DURATION_DAYS: Length of promo period
 * - OPEN_BETA_FREE_CREDITS: Credits during promo
 * - DEFAULT_FREE_CREDITS: Credits after promo
 * - SHOW_BANNER_AFTER_PROMO: Whether to show banner post-promo
 * 
 * @module components/landing/LandingHeroPromoBanner
 */

'use client'

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from 'components/ui/button'
import { 
  ArrowRight,
  Gift,
} from 'lucide-react'
import {
  isWithinOpenBetaWindow,
  shouldShowPromoBanner,
} from 'config/openBeta'

export const LandingHeroPromoBanner: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  
  // Check if banner should be visible
  const showBanner = shouldShowPromoBanner()
  const isPromoActive = isWithinOpenBetaWindow()

  // Don't render if banner shouldn't show
  if (!showBanner) return null

  const handleStartFree = () => {
    navigate('/sign-up')
  }

  const handleLearnMore = () => {
    const pricingSection = document.getElementById('pricing')
    const faqSection = document.getElementById('faq')
    const target = pricingSection || faqSection
    target?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.2 : 0.5, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Main Banner Container */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 p-[1px] shadow-xl shadow-purple-500/20">
        {/* Animated shimmer overlay */}
        {!prefersReducedMotion && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer"
            style={{ 
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />
        )}
        
        {/* Inner content with subtle glow border */}
        <div className="relative rounded-[15px] bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 px-4 sm:px-6 py-4 sm:py-5">
          {/* Glow effects */}
          <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-purple-400/20 blur-2xl rounded-full -z-10" />
          <div className="absolute bottom-0 right-1/4 w-1/3 h-1/2 bg-purple-300/15 blur-xl rounded-full -z-10" />
          
          {/* Content Grid */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            
            {/* Left: Badge + Copy */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
              {/* Badge */}
              <div className="shrink-0">
                {isPromoActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-xs font-bold text-white uppercase tracking-wide">
                    <Gift className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('landing.promoBanner.badgeOpenBeta', 'Open Beta')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full text-xs font-semibold text-white/90 uppercase tracking-wide">
                    <Gift className="w-3.5 h-3.5" aria-hidden="true" />
                    {t('landing.promoBanner.badgeFreeTrial', 'Free Trial')}
                  </span>
                )}
              </div>
              
              {/* Copy */}
              <div className="flex flex-col">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {isPromoActive ? (
                    <>
                      {t('landing.promoBanner.headlinePromo', '5 Free Interview Credits')}
                    </>
                  ) : (
                    <>
                      {t('landing.promoBanner.headlineDefault', 'Start your free trial today')}
                    </>
                  )}
                </h3>
                    {/* <p className="mt-0.5 text-xs sm:text-sm text-purple-100 leading-relaxed max-w-md">
                    {isPromoActive ? (
                        <>
                        {t(
                            'landing.promoBanner.subtitlePromo', 
                            'For the first 2 weeks, new Personal accounts get 5 credits. After that, free trial returns to 1 credit.'
                        )}
                        </>
                    ) : (
                        <>
                        {t(
                            'landing.promoBanner.subtitleDefault',
                            'New Personal accounts get 1 free interview credit to experience Vocaid.'
                        )}
                        </>
                    )}
                    </p> */}
                
                {/* Days remaining indicator (promo only) */}
                {/* {isPromoActive && daysRemaining > 0 && (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-purple-200">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    <span>
                      {daysRemaining === 1 
                        ? t('landing.promoBanner.lastDay', 'Last day!')
                        : t('landing.promoBanner.daysRemaining', '{{days}} days remaining', { days: daysRemaining })
                      }
                    </span>
                  </div>
                )} */}
              </div>
            </div>

            {/* Right: CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Primary CTA */}
              <Button
                size="sm"
                onClick={handleStartFree}
                className="w-full sm:w-auto bg-white hover:bg-purple-50 text-purple-700 font-semibold px-5 py-2.5 shadow-lg shadow-purple-900/20 hover:shadow-xl transition-all group"
              >
                {t('Start Interview Practice for Free')}
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              
              {/* Secondary Link */}
              <button
                type="button"
                onClick={handleLearnMore}
                className="text-sm font-medium text-purple-100 hover:text-white underline underline-offset-2 decoration-purple-300/50 hover:decoration-white/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-purple-700 rounded px-2 py-1"
              >
                {t('landing.promoBanner.learnMore', 'Learn more')}
              </button>
            </div>
          </div>

          {/* Fine Print */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-[10px] sm:text-xs text-purple-200/70 text-center lg:text-left">
              {t(
                'landing.promoBanner.finePrint',
                'Offer applies to new B2C Personal accounts. Terms may change.'
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          50%, 100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </motion.div>
  )
}

export default LandingHeroPromoBanner
