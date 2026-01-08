/**
 * Platform Showcase Component
 * 
 * Displays the three Vocaid platforms with proper iconography:
 * - B2C: Interview Practice & Performance (LIVE)
 * - B2B: Recruiter Interview Platform (Coming Soon)
 * - HR: Employee Hub (Coming Soon)
 */

'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from 'components/ui/button'
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import {
  User,
  Users,
  Building2,
  Mic,
  FileText,
  BarChart3,
  Globe,
  History,
  ClipboardCheck,
  Timer,
  Shield,
  Puzzle,
  MessageSquare,
  Workflow,
  Lock,
  Zap,
} from 'lucide-react'

// Mock data for charts
const MOCK_PERFORMANCE_DATA = [
  { week: 'W1', score: 65 },
  { week: 'W2', score: 72 },
  { week: 'W3', score: 68 },
  { week: 'W4', score: 78 },
  { week: 'W5', score: 82 },
]

const MOCK_CANDIDATES = [
  { name: 'Sarah Chen', role: 'Software Engineer', score: 92, status: 'Recommended' },
  { name: 'Marcus Johnson', role: 'Product Manager', score: 78, status: 'Under Review' },
  { name: 'Ana Silva', role: 'Data Analyst', score: 85, status: 'Recommended' },
]

export const PlatformShowcase: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  
  // Scroll to hero waitlist form instead of opening modal
  const scrollToWaitlistForm = () => {
    const el = document.getElementById('business-waitlist')
    if (el) {
      const header = document.querySelector('[data-landing-header="true"]')
      const headerHeight = header?.getBoundingClientRect().height ?? 80
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

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

  // B2C Features with icons
  const b2cFeatures = [
    { icon: Mic, text: t('landing.platformShowcase.b2c.features.aiPractice') },
    { icon: FileText, text: t('landing.platformShowcase.b2c.features.resumeRepo') },
    { icon: BarChart3, text: t('landing.platformShowcase.b2c.features.dashboard') },
    { icon: Globe, text: t('landing.platformShowcase.b2c.features.multilingual') },
    { icon: History, text: t('landing.platformShowcase.b2c.features.history') },
  ]

  // B2B Features with icons
  const b2bFeatures = [
    { icon: ClipboardCheck, text: t('landing.platformShowcase.b2b.features.rubrics') },
    { icon: Timer, text: t('landing.platformShowcase.b2b.features.evidence') },
    { icon: BarChart3, text: t('landing.platformShowcase.b2b.features.analytics') },
    { icon: Puzzle, text: t('landing.platformShowcase.b2b.features.dynamic') },
    { icon: Shield, text: t('landing.platformShowcase.b2b.features.audit') },
  ]

  // HR Features with icons
  const hrFeatures = [
    { icon: MessageSquare, text: t('landing.platformShowcase.hr.features.rag') },
    { icon: Workflow, text: t('landing.platformShowcase.hr.features.escalation') },
    { icon: Zap, text: t('landing.platformShowcase.hr.features.automation') },
    { icon: Lock, text: t('landing.platformShowcase.hr.features.tenant') },
    { icon: Shield, text: t('landing.platformShowcase.hr.features.compliance') },
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-zinc-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            <span className="text-zinc-900">{t('landing.platformShowcase.titleBlack')}</span>{' '}
            <span className="text-purple-600">{t('landing.platformShowcase.titlePurple')}</span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2">
            {t('landing.platformShowcase.subtitle')}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {/* B2C: Interview Practice - First on mobile, Center on desktop - LIVE */}
          <motion.div
            variants={itemVariants}
            className="order-first lg:order-2 bg-white rounded-2xl shadow-xl border-2 border-purple-600 overflow-hidden group hover:shadow-2xl transition-shadow"
          >
            <div className="bg-purple-600 text-white text-center py-1.5 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {t('landing.platformShowcase.liveBadge')}
            </div>
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{t('landing.platformShowcase.b2c.forLabel')}</p>
                  <h3 className="font-bold text-zinc-900">{t('landing.platformShowcase.b2c.title')}</h3>
                </div>
              </div>
              <p className="text-zinc-600 text-sm font-medium">
                {t('landing.platformShowcase.b2c.description')}
              </p>
              
              {/* Feature bullets */}
              <ul className="mt-4 space-y-2">
                {b2cFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                    <feature.icon className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock Dashboard Preview */}
            <div className="p-4 bg-zinc-50">
              <div className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-500">{t('landing.platformShowcase.b2c.performanceTrend')}</span>
                  <span className="text-xs text-purple-600 font-medium">{t('landing.platformShowcase.b2c.improvement')}</span>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_PERFORMANCE_DATA}>
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={{ fill: '#7c3aed', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">12</p>
                    <p className="text-xs text-zinc-500">{t('landing.platformShowcase.b2c.stats.interviews')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">82%</p>
                    <p className="text-xs text-zinc-500">{t('landing.platformShowcase.b2c.stats.avgScore')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">3</p>
                    <p className="text-xs text-zinc-500">{t('landing.platformShowcase.b2c.stats.resumes')}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-3 flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                  <span className="text-purple-700 font-medium">{t('landing.platformShowcase.b2c.actions.startPractice')}</span>
                </div>
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded-lg text-xs">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                  <span className="text-zinc-600">{t('landing.platformShowcase.b2c.actions.uploadResume')}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100">
              <Button
                size="sm"
                onClick={() => navigate('/sign-up')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t('landing.platformShowcase.b2c.cta')} <span className="ml-1">→</span>
              </Button>
            </div>
          </motion.div>

          {/* B2B: Recruiter Platform - Second on mobile, First on desktop - COMING SOON */}
          <motion.div
            variants={itemVariants}
            className="order-2 lg:order-1 bg-white rounded-2xl shadow-lg border border-zinc-200 overflow-hidden group hover:shadow-xl transition-shadow"
          >
            <div className="bg-purple-100 text-purple-700 text-center py-1.5 text-xs font-semibold uppercase tracking-wide">
              {t('landing.platformShowcase.comingSoonBadge')}
            </div>
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{t('landing.platformShowcase.b2b.forLabel')}</p>
                  <h3 className="font-bold text-zinc-900">{t('landing.platformShowcase.b2b.title')}</h3>
                </div>
              </div>
              <p className="text-zinc-600 text-sm font-medium">
                {t('landing.platformShowcase.b2b.description')}
              </p>

              {/* Feature bullets */}
              <ul className="mt-4 space-y-2">
                {b2bFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                    <feature.icon className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock Dashboard Preview */}
            <div className="p-4 bg-zinc-50">
              <div className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-500">{t('landing.platformShowcase.b2b.candidatePipeline')}</span>
                  <span className="text-xs text-purple-600 font-medium">{t('landing.platformShowcase.b2b.thisWeek')}</span>
                </div>

                {/* Candidate List */}
                <div className="space-y-2">
                  {MOCK_CANDIDATES.map((candidate, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-medium">
                          {candidate.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-900">{candidate.name}</p>
                          <p className="text-[10px] text-zinc-500">{candidate.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-zinc-900">{candidate.score}%</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          candidate.status === 'Recommended' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {candidate.status === 'Recommended' ? t('landing.platformShowcase.b2b.recommended') : t('landing.platformShowcase.b2b.underReview')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-3 flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg text-xs">
                  <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                  <span className="text-purple-700 font-medium">{t('landing.platformShowcase.b2b.actions.interviewKits')}</span>
                </div>
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-zinc-100 rounded-lg text-xs">
                  <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0" />
                  <span className="text-zinc-600">{t('landing.platformShowcase.b2b.actions.analytics')}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100">
              <Button
                size="sm"
                variant="outline"
                onClick={scrollToWaitlistForm}
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {t('landing.platformShowcase.b2b.cta')} <span className="ml-1">→</span>
              </Button>
            </div>
          </motion.div>

          {/* HR: Employee Hub - Third on both mobile and desktop - COMING SOON */}
          <motion.div
            variants={itemVariants}
            className="order-3 lg:order-3 bg-white rounded-2xl shadow-lg border border-zinc-200 overflow-hidden group hover:shadow-xl transition-shadow"
          >
            <div className="bg-purple-100 text-purple-700 text-center py-1.5 text-xs font-semibold uppercase tracking-wide">
              {t('landing.platformShowcase.comingSoonBadge')}
            </div>
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">{t('landing.platformShowcase.hr.forLabel')}</p>
                  <h3 className="font-bold text-zinc-900">{t('landing.platformShowcase.hr.title')}</h3>
                </div>
              </div>
              <p className="text-zinc-600 text-sm font-medium">
                {t('landing.platformShowcase.hr.description')}
              </p>

              {/* Feature bullets */}
              <ul className="mt-4 space-y-2">
                {hrFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                    <feature.icon className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock Dashboard Preview */}
            <div className="p-4 bg-zinc-50">
              <div className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-500">{t('landing.platformShowcase.hr.recentQueries')}</span>
                  <span className="text-xs text-purple-600 font-medium">{t('landing.platformShowcase.hr.resolved')}</span>
                </div>

                {/* Query List */}
                <div className="space-y-2">
                  {(t('landing.platformShowcase.hr.mockQueries', { returnObjects: true }) as string[]).map((query, i) => (
                    <div key={i} className="flex items-center gap-2 py-2 border-b border-zinc-50 last:border-0">
                      <span className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-xs text-zinc-700">{query}</span>
                    </div>
                  ))}
                </div>

                {/* Stats - removed specific numbers */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-100">
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">—</p>
                    <p className="text-xs text-zinc-500">{t('landing.platformShowcase.hr.stats.ticketsDeflected')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-zinc-900">—</p>
                    <p className="text-xs text-zinc-500">{t('landing.platformShowcase.hr.stats.avgResponse')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100">
              <Button
                size="sm"
                variant="outline"
                onClick={scrollToWaitlistForm}
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {t('landing.platformShowcase.hr.cta')} <span className="ml-1">→</span>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default PlatformShowcase
