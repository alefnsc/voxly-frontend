'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { Button } from 'components/ui/button'
import { FEATURES } from 'config/features'

interface PricingCardsProps {
  onDemoClick: () => void
}

interface Plan {
  key: string
  highlighted: boolean
  isB2B: boolean
}

const planConfigs: Plan[] = [
  { key: 'starter', highlighted: false, isB2B: true },
  { key: 'growth', highlighted: true, isB2B: true },
  { key: 'enterprise', highlighted: false, isB2B: true },
]

export const PricingCards: React.FC<PricingCardsProps> = ({ onDemoClick }) => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.2 : 0.5, ease: 'easeOut' },
    },
  }

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-24 bg-zinc-50 scroll-mt-20 md:scroll-mt-24">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <motion.span
              variants={itemVariants}
              className="inline-block px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full mb-3 sm:mb-4"
            >
              {t('landing.pricing.badge')}
            </motion.span>
            <motion.h2
              variants={itemVariants}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4"
            >
              {t('landing.pricing.title')}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2"
            >
              {t('landing.pricing.subtitle')}
            </motion.p>
          </div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          >
            {planConfigs.map((plan) => {
              const isDisabled = plan.isB2B && !FEATURES.B2B_RECRUITER_PLATFORM_ENABLED
              const features = t(`landing.pricing.plans.${plan.key}.features`, { returnObjects: true }) as string[]
              
              return (
              <motion.div key={plan.key} variants={itemVariants}>
                <Card
                  className={`h-full flex flex-col transition-all duration-300 ${
                    isDisabled
                      ? 'border-zinc-200 opacity-80'
                      : plan.highlighted
                        ? 'border-purple-300 shadow-xl shadow-purple-100/50 ring-2 ring-purple-600'
                        : 'border-zinc-200 hover:border-purple-200 hover:shadow-lg'
                  }`}
                >
                  {isDisabled ? (
                    <div className="bg-gray-500 text-white text-center py-2 text-xs font-semibold uppercase tracking-wide">
                      {t('features.comingSoon')}
                    </div>
                  ) : plan.highlighted && (
                    <div className="bg-purple-600 text-white text-center py-2 text-xs font-semibold uppercase tracking-wide">
                      {t('landing.pricing.mostPopular')}
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-zinc-900">
                      {t(`landing.pricing.plans.${plan.key}.name`)}
                    </CardTitle>
                    <p className="text-sm text-zinc-600 mt-2">{t(`landing.pricing.plans.${plan.key}.description`)}</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-zinc-700">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-6 mt-6 border-t border-zinc-100">
                      <Button
                        disabled={isDisabled}
                        onClick={!isDisabled && plan.key === 'enterprise' ? onDemoClick : undefined}
                        className={`w-full ${
                          isDisabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : plan.highlighted
                              ? 'bg-purple-600 hover:bg-purple-700 text-white'
                              : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                        }`}
                      >
                        {isDisabled ? t('features.comingSoon') : t(`landing.pricing.plans.${plan.key}.cta`)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )})}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-12 text-center"
          >
            <p className="text-zinc-600 mb-4">
              {t('landing.pricing.customPlanText')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  const pricingSection = document.querySelector('#pricing')
                  if (pricingSection) pricingSection.scrollIntoView({ behavior: 'smooth' })
                }}
                className="border-zinc-300 text-zinc-700"
              >
                {t('landing.pricing.viewFullPricing')}
              </Button>
              <Button
                onClick={onDemoClick}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t('landing.pricing.talkToSales')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default PricingCards
