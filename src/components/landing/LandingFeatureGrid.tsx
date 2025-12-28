'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'

interface Feature {
  id: string
  title: string
  description: string
  bullets: string[]
  accent: string
}

const featureConfigs = [
  { id: 'employee-hub', accent: 'from-purple-500 to-purple-600' },
  { id: 'recruiter-platform', accent: 'from-zinc-700 to-zinc-900' },
]

export const LandingFeatureGrid: React.FC = () => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  const features: Feature[] = featureConfigs.map((config) => ({
    ...config,
    title: t(`landing.featureGrid.features.${config.id}.title`),
    description: t(`landing.featureGrid.features.${config.id}.description`),
    bullets: t(`landing.featureGrid.features.${config.id}.bullets`, { returnObjects: true }) as string[],
  }))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.2 : 0.6, ease: 'easeOut' },
    },
  }

  return (
    <section id="product" className="py-24 bg-white scroll-mt-20 md:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-16"
        >
          <motion.span
            variants={itemVariants}
            className="inline-block px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full mb-4"
          >
            {t('landing.featureGrid.badge')}
          </motion.span>
          <motion.h2
            variants={itemVariants}
            className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4"
          >
            {t('landing.featureGrid.title')}
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-lg text-zinc-600 max-w-2xl mx-auto"
          >
            {t('landing.featureGrid.subtitle')}
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 gap-8"
        >
          {features.map((feature) => (
            <motion.div key={feature.id} variants={itemVariants}>
              <Card className="h-full border-zinc-200 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300 group">
                <CardHeader className="pb-4">
                  <div className={`w-12 h-1 rounded-full bg-gradient-to-r ${feature.accent} mb-4 group-hover:w-16 transition-all duration-300`} />
                  <CardTitle className="text-xl font-bold text-zinc-900">
                    {feature.title}
                  </CardTitle>
                  <p className="text-zinc-600 mt-2">
                    {feature.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feature.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-zinc-700">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default LandingFeatureGrid
