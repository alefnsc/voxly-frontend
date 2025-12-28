/**
 * Landing Hiring Collaboration Preview Section
 * 
 * A new landing page section that previews two upcoming B2B capabilities:
 * - Candidate Voting: Multi-stakeholder collaborative evaluation
 * - Role Marketplace: Publishing and discovering interview-ready roles
 * 
 * Section title follows the "first word black, second word purple" pattern.
 * 
 * @module components/landing/LandingHiringCollaborationPreview
 */

'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { CandidateVotingPreview } from './CandidateVotingPreview'
import { RoleMarketplacePreview } from './RoleMarketplacePreview'
import { 
  Users, 
  Shield,
  ClipboardCheck,
  MessageSquare,
} from 'lucide-react'

// Value propositions for the section
const VALUE_PROPS = [
  { id: 'Audit', icon: Shield, labelKey: 'landing.hiringCollab.values.auditability' },
  { id: 'Consistency', icon: ClipboardCheck, labelKey: 'landing.hiringCollab.values.consistency' },
  { id: 'Collaboration', icon: Users, labelKey: 'landing.hiringCollab.values.collaboration' },
  { id: 'Compliance', icon: MessageSquare, labelKey: 'landing.hiringCollab.values.compliance' },
]

export const LandingHiringCollaborationPreview: React.FC = () => {
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
    <section 
      id="hiring-collaboration" 
      className="py-12 sm:py-16 lg:py-24 bg-white relative overflow-hidden"
      aria-labelledby="hiring-collab-title"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-gradient-to-bl from-purple-50/50 to-transparent rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/3 bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full blur-3xl -z-10" />
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 
              id="hiring-collab-title"
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4"
            >
              {t('landing.hiringCollab.title', 'Hiring Decisions,')}{' '}
              <span className="text-purple-600">{t('landing.hiringCollab.titleHighlight', 'Aligned.')}</span>
            </h2>
            <p className="text-base sm:text-lg text-zinc-600 max-w-3xl mx-auto px-2 leading-relaxed">
              {t(
                'landing.hiringCollab.subtitle',
                'Bring your entire hiring committee together. Structured rubrics, evidence-based scoring, and multi-stakeholder voting ensure fair, consistent, and auditable decisions.'
              )}
            </p>
          </motion.div>

          {/* Value Props Pills */}
          <motion.div 
            variants={itemVariants} 
            className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12"
          >
            {VALUE_PROPS.map((prop) => {
              const IconComponent = prop.icon
              return (
                <div
                  key={prop.id}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-zinc-50 border border-zinc-200 rounded-full text-xs sm:text-sm text-zinc-700"
                >
                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                  {t(prop.labelKey, prop.id)}
                </div>
              )
            })}
          </motion.div>

          {/* Two-Column Preview Layout */}
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
          >
            {/* Candidate Voting Preview */}
            <motion.div variants={itemVariants} className="flex">
              <CandidateVotingPreview />
            </motion.div>

            {/* Role Marketplace Preview */}
            <motion.div variants={itemVariants} className="flex">
              <RoleMarketplacePreview />
            </motion.div>
          </motion.div>

          {/* Coming Soon Notice */}
          <motion.div 
            variants={itemVariants}
            className="mt-8 sm:mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm text-purple-700 font-medium">
                {t('landing.hiringCollab.comingSoonNote', 'These features are in development. Join the waitlist for early access.')}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default LandingHiringCollaborationPreview
