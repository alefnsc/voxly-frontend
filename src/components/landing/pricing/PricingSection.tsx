'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useTranslation } from 'react-i18next'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from 'components/ui/button'
import { PricingTabs } from './PricingTabs'
import { PricingToggle } from './PricingToggle'
import { PricingCard } from './PricingCard'
import {
  PlatformType,
  B2CToggleType,
  B2C_CREDITS_PLANS,
  B2C_SUBSCRIPTION_PLANS,
  B2B_PLANS,
  HR_PLANS,
  PLATFORM_CONFIGS,
  B2C_TOGGLE_CONFIG,
} from 'config/pricing.config'

interface PricingSectionProps {
  onDemoClick: () => void
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onDemoClick }) => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Initialize from URL query param
  const initialPlan = (searchParams.get('plan') as PlatformType) || 'b2c'
  const [activePlatform, setActivePlatform] = useState<PlatformType>(
    ['b2c', 'b2b', 'hr'].includes(initialPlan) ? initialPlan : 'b2c'
  )
  const [b2cToggle, setB2cToggle] = useState<B2CToggleType>('credits')

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  // Persist selected tab in URL
  const handlePlatformChange = useCallback((platform: PlatformType) => {
    setActivePlatform(platform)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('plan', platform)
    navigate(`?${newParams.toString()}`, { replace: true })
  }, [navigate, searchParams])

  // Restore from URL on mount
  useEffect(() => {
    const planParam = searchParams.get('plan') as PlatformType
    if (planParam && ['b2c', 'b2b', 'hr'].includes(planParam)) {
      setActivePlatform(planParam)
    }
  }, [searchParams])

  const handleCtaClick = (action: string, planId: string) => {
    switch (action) {
      case 'sales':
        onDemoClick()
        break
      case 'waitlist':
        // Could open a waitlist modal or scroll to contact
        onDemoClick()
        break
      case 'buy':
      case 'subscribe':
        // Navigate to sign-up or billing
        navigate('/sign-up')
        break
      default:
        break
    }
  }

  const getPlansForPlatform = () => {
    switch (activePlatform) {
      case 'b2c':
        return b2cToggle === 'credits' ? B2C_CREDITS_PLANS : B2C_SUBSCRIPTION_PLANS
      case 'b2b':
        return B2B_PLANS
      case 'hr':
        return HR_PLANS
      default:
        return B2C_CREDITS_PLANS
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.2 : 0.5, ease: 'easeOut' },
    },
  }

  const plans = getPlansForPlatform()
  const platformConfig = PLATFORM_CONFIGS[activePlatform]

  return (
    <section
      id="pricing"
      className="py-24 relative overflow-hidden scroll-mt-20 md:scroll-mt-24"
      style={{
        background: 'linear-gradient(180deg, rgba(250, 245, 255, 0.5) 0%, rgba(255, 255, 255, 1) 100%)',
      }}
    >
      {/* Subtle decorative gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-50/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <div className="text-center mb-12">
            <motion.h2
              variants={itemVariants}
              className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4"
            >
              <span className="text-zinc-900">{t('pricing.titleFirst')}</span>
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-lg text-zinc-600 max-w-2xl mx-auto mb-2"
            >
              {t('pricing.subtitle')}
            </motion.p>
            <motion.p
              variants={itemVariants}
              className="text-sm text-zinc-500 max-w-xl mx-auto"
            >
              {t('pricing.microcopy')}
            </motion.p>
          </div>

          {/* Platform Tabs */}
          <motion.div variants={itemVariants} className="mb-8">
            <PricingTabs
              activeTab={activePlatform}
              onChange={handlePlatformChange}
            />
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activePlatform}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
            >
              {/* Platform Intro */}
              <div className="text-center mb-8">
                <p className="text-zinc-700 max-w-2xl mx-auto">
                  {t(platformConfig.introKey)}
                </p>
                {platformConfig.noteKey && (
                  <p className="text-sm text-purple-600 mt-2">
                    {t(platformConfig.noteKey)}
                  </p>
                )}
              </div>

              {/* B2C Toggle (Credits vs Subscription) */}
              {activePlatform === 'b2c' && (
                <div className="text-center mb-8">
                  <PricingToggle
                    options={[
                      { id: 'credits', label: t(B2C_TOGGLE_CONFIG.credits.labelKey) },
                      { id: 'subscription', label: t(B2C_TOGGLE_CONFIG.subscription.labelKey) },
                    ]}
                    activeId={b2cToggle}
                    onChange={(id) => setB2cToggle(id as B2CToggleType)}
                  />
                  <p className="text-sm text-zinc-500 mt-4">
                    {t(B2C_TOGGLE_CONFIG[b2cToggle].helperKey)}
                  </p>
                </div>
              )}

              {/* Pricing Cards Grid */}
              <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                {plans.map((plan, index) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    onCtaClick={handleCtaClick}
                    animationDelay={index * 0.1}
                  />
                ))}
              </div>

              {/* Footnote */}
              {activePlatform === 'b2c' && (
                <motion.p
                  variants={itemVariants}
                  className="text-center text-sm text-zinc-500 mt-8"
                >
                  {t(B2C_TOGGLE_CONFIG[b2cToggle].footnoteKey)}
                </motion.p>
              )}

              {/* B2B/HR Bottom Section */}
              {(activePlatform === 'b2b' || activePlatform === 'hr') && (
                <motion.div
                  variants={itemVariants}
                  className="mt-12 text-center"
                >
                  <p className="text-zinc-600 mb-4">
                    {t(`pricing.${activePlatform}.customText`)}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="outline"
                      className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    >
                      {t('pricing.viewFullPricing')}
                    </Button>
                    <Button
                      onClick={onDemoClick}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {t('pricing.talkToSales')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Universal Disclaimers */}
          <motion.div
            variants={itemVariants}
            className="mt-16 text-center"
          >
            <div className="max-w-3xl mx-auto space-y-2">
              <p className="text-xs text-zinc-400">
                {t('pricing.disclaimers.beta')}
              </p>
              <p className="text-xs text-zinc-400">
                {t('pricing.disclaimers.usage')}
              </p>
              <p className="text-xs text-zinc-400">
                {t('pricing.disclaimers.enterprise')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default PricingSection
