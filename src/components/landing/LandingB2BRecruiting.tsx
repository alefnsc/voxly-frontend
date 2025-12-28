/**
 * Landing B2B Recruiting Section
 * 
 * Displays the B2B Recruiter Platform features (coming soon).
 * Uses the two-tone title pattern (first word black, second word purple).
 */

'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Button } from 'components/ui/button'
import { Card } from 'components/ui/card'
import { B2B_RECRUITER_FEATURES, MOCK_RECRUITER_ANALYTICS } from './LandingMockData'
import { Building2, Users, BarChart3, CheckCircle, ClipboardList, Target, TrendingUp, Globe, type LucideIcon } from 'lucide-react'

// Map iconName strings to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  CheckCircle,
  ClipboardList,
  Target,
  BarChart3,
  TrendingUp,
  Globe,
}

interface LandingB2BRecruitingProps {
  onWaitlistClick?: () => void
}

export const LandingB2BRecruiting: React.FC<LandingB2BRecruitingProps> = ({ onWaitlistClick }) => {
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
    <section id="b2b-section" className="py-12 sm:py-16 lg:py-24 bg-zinc-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full blur-3xl -z-10" />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12 lg:mb-16">
            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-zinc-600 bg-zinc-200 rounded-full mb-4 sm:mb-6">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('landing.b2bRecruiting.badge', 'Coming Soon')}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4">
              {t('landing.b2bRecruiting.title', 'Recruiting')} <span className="text-purple-600">{t('landing.b2bRecruiting.titleHighlight', 'Platform')}</span>
            </h2>
            <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2">
              {t('landing.b2bRecruiting.subtitle', 'Consistent, auditable interviews at scale. Evaluate candidates fairly with configurable rubrics and evidence-based scorecards.')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Features List */}
            <motion.div variants={containerVariants} className="space-y-3 sm:space-y-4 order-2 lg:order-1">
              {B2B_RECRUITER_FEATURES.map((feature, index) => {
                const IconComponent = ICON_MAP[feature.iconName]
                return (
                  <motion.div
                    key={feature.id}
                    variants={itemVariants}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-zinc-200 hover:border-purple-200 hover:shadow-md transition-all"
                  >
                    <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      {IconComponent && <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-zinc-900 mb-0.5 sm:mb-1">{feature.title}</h3>
                      <p className="text-xs sm:text-sm text-zinc-600">{feature.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>

            {/* Mock Analytics Preview */}
            <motion.div variants={itemVariants}>
              <Card className="p-6 border-zinc-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-zinc-900">{t('landing.b2bRecruiting.analyticsTitle', 'Recruiter Analytics')}</h3>
                  <span className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                    {t('landing.b2bRecruiting.preview', 'Preview')}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-zinc-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{MOCK_RECRUITER_ANALYTICS.totalInterviewsThisMonth}</div>
                    <div className="text-xs text-zinc-500">{t('landing.b2bRecruiting.stats.interviews', 'Interviews')}</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-50 rounded-lg">
                    <div className="text-2xl font-bold text-zinc-900">{MOCK_RECRUITER_ANALYTICS.avgTimeToHire}</div>
                    <div className="text-xs text-zinc-500">{t('landing.b2bRecruiting.stats.timeToHire', 'Avg. Time to Hire')}</div>
                  </div>
                  <div className="text-center p-3 bg-zinc-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-xs text-zinc-500">{t('landing.b2bRecruiting.stats.rubric', 'Rubric Configured')}</div>
                  </div>
                </div>

                {/* Pipeline Funnel */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-zinc-700 mb-3">{t('landing.b2bRecruiting.pipeline', 'Candidate Pipeline')}</h4>
                  <div className="space-y-2">
                    {MOCK_RECRUITER_ANALYTICS.candidatePipeline.map((stage, index) => {
                      const maxCount = MOCK_RECRUITER_ANALYTICS.candidatePipeline[0].count
                      const width = (stage.count / maxCount) * 100
                      return (
                        <div key={stage.stage} className="flex items-center gap-3">
                          <span className="text-xs text-zinc-500 w-24 truncate">{stage.stage}</span>
                          <div className="flex-1 h-6 bg-zinc-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={inView ? { width: `${width}%` } : { width: 0 }}
                              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-end pr-2"
                            >
                              <span className="text-xs font-medium text-white">{stage.count}</span>
                            </motion.div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Evidence Timestamps Sample */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-700 mb-3">{t('landing.b2bRecruiting.evidence', 'Evidence Timestamps')}</h4>
                  <div className="space-y-2">
                    {MOCK_RECRUITER_ANALYTICS.evidenceTimestamps.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg text-xs">
                        <span className="px-2 py-1 bg-purple-100 text-purple-600 rounded font-mono">{item.timestamp}</span>
                        <span className="text-zinc-600 flex-1 truncate">{item.evidence}</span>
                        <span className="font-semibold text-zinc-900">{item.score}/5</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* CTA */}
              <div className="mt-6 text-center">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onWaitlistClick}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 px-8 py-6 text-base font-semibold"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t('landing.b2bRecruiting.cta', 'Join Waitlist')}
                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-600 rounded-full">
                    {t('common.soon', 'Soon')}
                  </span>
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default LandingB2BRecruiting
