/**
 * Role Marketplace Preview Component
 * 
 * A non-functional demo preview showing how HR professionals can publish
 * interview-ready roles and accept external candidates.
 * 
 * @module components/landing/RoleMarketplacePreview
 */

'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Card } from 'components/ui/card'
import { Button } from 'components/ui/button'
import { 
  Search, 
  MapPin, 
  Building2, 
  Globe, 
  Briefcase,
  Filter,
  ChevronRight,
  Users,
  Clock,
} from 'lucide-react'

// Mock marketplace roles
const MOCK_ROLES = [
  {
    id: 'product-designer',
    title: 'Product Designer',
    company: 'TechCorp Inc.',
    location: 'São Paulo (BR)',
    seniority: 'Senior',
    salaryRange: 'Competitive',
    language: 'Portuguese',
    postedAgo: '2d ago',
  },
  {
    id: 'full-stack-engineer',
    title: 'Full-Stack Engineer',
    company: 'StartupXYZ',
    location: 'Austin (US)',
    seniority: 'Mid-Level',
    salaryRange: 'Competitive',
    language: 'English',
    postedAgo: '5d ago',
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    company: 'DataDriven Co.',
    location: 'Remote',
    seniority: 'Junior',
    salaryRange: 'Competitive',
    language: 'English',
    postedAgo: '1w ago',
  },
  {
    id: 'customer-success',
    title: 'Customer Success Lead',
    company: 'GrowthHub',
    location: 'Remote',
    seniority: 'Lead',
    salaryRange: 'Competitive',
    language: 'Spanish',
    postedAgo: '3d ago',
  },
]

// Filter options (display only)
const FILTER_OPTIONS = [
  { label: 'Role Title', icon: Briefcase },
  { label: 'Location', icon: MapPin },
  { label: 'Seniority', icon: Users },
  { label: 'Language', icon: Globe },
]

export const RoleMarketplacePreview: React.FC = () => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <Card className="p-4 sm:p-6 border-zinc-200 bg-white overflow-hidden h-full flex flex-col">
      {/* Preview Badge */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">
          {t('landing.hiringCollab.marketplace.title', 'Role Marketplace')}
        </h3>
        <span className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
          {t('common.preview', 'Preview')}
        </span>
      </div>

      {/* Search Bar (Disabled) */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t('landing.hiringCollab.marketplace.searchPlaceholder', 'Search roles...')}
            disabled
            aria-label={t('landing.hiringCollab.marketplace.searchPlaceholder', 'Search roles...')}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-500 placeholder-zinc-400 cursor-not-allowed"
          />
        </div>
      </motion.div>

      {/* Filter Pills (Disabled) */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-2 mb-4 sm:mb-6"
      >
        {FILTER_OPTIONS.map((filter, index) => {
          const IconComponent = filter.icon
          return (
            <button
              key={filter.label}
              type="button"
              disabled
              aria-label={`Filter by ${filter.label}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full text-xs text-zinc-500 cursor-not-allowed"
            >
              <IconComponent className="w-3 h-3" />
              {filter.label}
              <Filter className="w-3 h-3 ml-0.5" />
            </button>
          )
        })}
      </motion.div>

      {/* Role Cards Grid */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-6 overflow-y-auto max-h-[320px] sm:max-h-none">
        {MOCK_ROLES.map((role, index) => (
          <motion.div
            key={role.id}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 + index * 0.05 }}
            className="group p-3 sm:p-4 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-purple-200 hover:bg-white hover:shadow-md transition-all duration-200"
          >
            {/* Company & Posted */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs text-zinc-500 truncate">{role.company}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="w-3 h-3" />
                {role.postedAgo}
              </div>
            </div>

            {/* Title */}
            <h4 className="font-semibold text-zinc-900 text-sm mb-2 truncate group-hover:text-purple-700 transition-colors">
              {role.title}
            </h4>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 rounded text-[10px] text-zinc-600">
                <MapPin className="w-2.5 h-2.5" />
                {role.location}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 rounded text-[10px] text-zinc-600">
                <Users className="w-2.5 h-2.5" />
                {role.seniority}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded text-[10px] text-purple-600">
                <Globe className="w-2.5 h-2.5" />
                {role.language}
              </span>
            </div>

            {/* CTA */}
            <button
              type="button"
              disabled
              aria-label={t('landing.hiringCollab.marketplace.viewRole', 'View role')}
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg cursor-not-allowed opacity-75 group-hover:opacity-100 transition-opacity"
            >
              {t('landing.hiringCollab.marketplace.viewRole', 'View role')}
              <ChevronRight className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Value Prop */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.45 }}
        className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 mb-4"
      >
        <p className="text-xs text-zinc-600 text-center leading-relaxed">
          {t(
            'landing.hiringCollab.marketplace.valueProp',
            'Share interview-ready roles, enable structured screening, and accept external candidates.'
          )}
        </p>
      </motion.div>

      {/* Primary CTA */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        <Button
          size="sm"
          variant="outline"
          disabled
          aria-label={t('landing.hiringCollab.marketplace.publishCta', 'Publish a role')}
          className="w-full border-purple-200 text-purple-700 py-2.5 cursor-not-allowed"
        >
          <Briefcase className="w-4 h-4 mr-2" />
          {t('landing.hiringCollab.marketplace.publishCta', 'Publish a role')}
          {/* <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-600 rounded-full">
            {t('common.comingSoon', 'Coming soon')}
          </span> */}
        </Button>
      </motion.div>
    </Card>
  )
}

export default RoleMarketplacePreview
