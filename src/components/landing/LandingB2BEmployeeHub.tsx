/**
 * Landing B2B Employee Hub Section
 * 
 * Displays the B2B Employee Service Hub features (coming soon).
 * Uses the two-tone title pattern (first word black, second word purple).
 */

'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Button } from 'components/ui/button'
import { Card } from 'components/ui/card'
import { B2B_HR_FEATURES, MOCK_HR_KNOWLEDGE_HUB } from './LandingMockData'
import { Headphones, Users, MessageCircle, Send, Brain, HandMetal, Zap, TrendingDown, Lock, FileText, HeartPulse, Wallet, type LucideIcon } from 'lucide-react'

// Map iconName strings to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  Brain,
  HandMetal,
  Zap,
  TrendingDown,
  Lock,
  FileText,
  HeartPulse,
  Wallet,
  Users,
}

interface LandingB2BEmployeeHubProps {
  onWaitlistClick?: () => void
}

export const LandingB2BEmployeeHub: React.FC<LandingB2BEmployeeHubProps> = ({ onWaitlistClick }) => {
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
    <section className="py-12 sm:py-16 lg:py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-0 w-1/4 h-1/2 bg-gradient-to-bl from-purple-50/50 to-transparent rounded-full blur-3xl -z-10" />
      
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
              <Headphones className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('landing.b2bEmployeeHub.badge', 'Coming Soon')}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4">
              {t('landing.b2bEmployeeHub.title', 'Employee')} <span className="text-purple-600">{t('landing.b2bEmployeeHub.titleHighlight', 'Service Hub')}</span>
            </h2>
            <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2">
              {t('landing.b2bEmployeeHub.subtitle', 'AI-powered HR support with org-tied knowledge base. Reduce ticket volume significantly with instant, accurate answers.')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Mock Chat Preview */}
            <motion.div variants={itemVariants} className="order-2 lg:order-1">
              <Card className="p-4 sm:p-6 border-zinc-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="font-semibold text-sm sm:text-base text-zinc-900">{t('landing.b2bEmployeeHub.chatTitle', 'HR Knowledge Hub')}</h3>
                  <span className="px-2 py-1 text-[10px] sm:text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                    {t('landing.b2bEmployeeHub.preview', 'Preview')}
                  </span>
                </div>

                {/* Categories Sidebar */}
                <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                  {MOCK_HR_KNOWLEDGE_HUB.categories.map((cat) => {
                    const IconComponent = ICON_MAP[cat.iconName]
                    return (
                      <div
                        key={cat.name}
                        className="shrink-0 px-3 sm:px-4 py-2 bg-zinc-50 rounded-lg border border-zinc-200 hover:border-purple-300 transition-colors cursor-pointer flex items-center min-h-[40px]"
                      >
                        {IconComponent && <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 mr-1.5 sm:mr-2" />}
                        <span className="text-xs sm:text-sm font-medium text-zinc-700 whitespace-nowrap">{cat.name}</span>
                        <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-zinc-400">({cat.count})</span>
                      </div>
                    )
                  })}
                </div>

                {/* Chat History */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {MOCK_HR_KNOWLEDGE_HUB.chatHistory.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                      transition={{ delay: 0.3 + index * 0.2 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white rounded-br-sm'
                            : 'bg-zinc-100 text-zinc-700 rounded-bl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input Mock */}
                <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <input
                    type="text"
                    placeholder={t('landing.b2bEmployeeHub.inputPlaceholder', 'Ask about policies, benefits, payroll...')}
                    disabled
                    className="flex-1 bg-transparent text-sm text-zinc-500 placeholder-zinc-400 outline-none cursor-not-allowed"
                  />
                  <Button size="sm" disabled className="shrink-0 bg-purple-600 text-white cursor-not-allowed">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Escalate Button */}
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" disabled className="text-zinc-500 cursor-not-allowed">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('landing.b2bEmployeeHub.escalate', 'Escalate to HR')}
                  </Button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t border-zinc-200">
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-purple-600">{MOCK_HR_KNOWLEDGE_HUB.stats.ticketsDeflected}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500">{t('landing.b2bEmployeeHub.stats.deflected', 'Tickets Deflected')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-zinc-900">{MOCK_HR_KNOWLEDGE_HUB.stats.avgResponseTime}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500">{t('landing.b2bEmployeeHub.stats.responseTime', 'Avg. Response')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-zinc-900">{MOCK_HR_KNOWLEDGE_HUB.stats.knowledgeArticles}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500">{t('landing.b2bEmployeeHub.stats.articles', 'Knowledge Articles')}</div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Features List */}
            <motion.div variants={containerVariants} className="space-y-3 sm:space-y-4 order-1 lg:order-2">
              {B2B_HR_FEATURES.map((feature) => {
                const IconComponent = ICON_MAP[feature.iconName]
                return (
                  <motion.div
                    key={feature.id}
                    variants={itemVariants}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-purple-200 hover:bg-white hover:shadow-md transition-all"
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

              {/* CTA */}
              <div className="pt-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onWaitlistClick}
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 py-6 text-base font-semibold"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {t('landing.b2bEmployeeHub.cta', 'Join Waitlist')}
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

export default LandingB2BEmployeeHub
