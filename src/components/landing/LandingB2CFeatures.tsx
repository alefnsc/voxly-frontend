/**
 * Landing B2C Features Section
 * 
 * Displays the Personal (B2C) platform features that are live now.
 * Uses the two-tone title pattern (first word black, second word purple).
 */

'use client'

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Button } from 'components/ui/button'
import { Card } from 'components/ui/card'
import { B2C_FEATURES } from './LandingMockData'
import {
  ArrowRight,
  Sparkles,
  Mic,
  BarChart3,
  FileText,
  Link,
  Lock,
  LucideIcon,
} from 'lucide-react'

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, LucideIcon> = {
  Mic,
  BarChart3,
  FileText,
  Link,
  Lock,
}

export const LandingB2CFeatures: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
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

  return (
    <section id="personal" className="py-12 sm:py-16 lg:py-24 bg-white relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gradient-to-bl from-purple-50/50 to-transparent rounded-full blur-3xl -z-10" />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4">
              {t('landing.b2c.title', 'Interview')} <span className="text-purple-600">{t('landing.b2c.titleHighlight', 'Practice')}</span>
            </h2>
            <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2">
              {t('landing.b2c.subtitle', 'Practice AI-powered interviews, track your progress, and land your dream job. Start for free with credits included.')}
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12"
          >
            {B2C_FEATURES.map((feature) => {
              const IconComponent = ICON_MAP[feature.iconName] || Mic
              return (
              <motion.div key={feature.id} variants={itemVariants}>
                <Card className="h-full p-6 border-zinc-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300 group relative overflow-hidden">
                  {/* Coming soon badge */}
                  {feature.comingSoon && (
                    <span className="absolute top-4 right-4 px-2 py-1 text-[10px] font-semibold text-purple-600 bg-purple-100 rounded-full">
                      {t('common.soon', 'Soon')}
                    </span>
                  )}
                  
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                    <IconComponent className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="text-sm text-zinc-600">
                    {t(feature.descriptionKey)}
                  </p>
                </Card>
              </motion.div>
            )})}
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center">
            <Button
              size="lg"
              onClick={() => navigate('/sign-up')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-purple-200 hover:shadow-xl transition-all group"
            >
              {t('landing.b2c.cta', 'Start Practicing Free')}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-4 text-sm text-zinc-500">
              {t('landing.b2c.ctaSubtext', 'No credit card required • Free credits included')}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default LandingB2CFeatures
