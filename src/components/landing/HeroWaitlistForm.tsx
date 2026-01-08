/**
 * Hero Waitlist Form
 * 
 * A premium-styled "Join the Business Platform Waitlist" form for the landing hero section.
 * Submits to the early-access leads API endpoint.
 * 
 * Features:
 * - Name, email, company name, company size tier, phone
 * - Two interest checkboxes (at least one required)
 * - Animated states with reduced motion support
 * - Success/error feedback
 * 
 * @module components/landing/HeroWaitlistForm
 */

'use client'

import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from 'components/ui/button'
import { Input } from 'components/ui/input'
import { Checkbox } from 'components/ui/checkbox'
import { PhoneInput } from 'components/ui/phone-input'
import apiService from 'services/APIService'
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Mail,
  User,
  Users,
  Briefcase,
  Headphones,
} from 'lucide-react'

interface HeroWaitlistFormProps {
  className?: string
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

// Company size tiers
const COMPANY_SIZE_TIERS = [
  { value: 'STARTUP', label: 'Startup (1-20)' },
  { value: 'SMALL', label: 'Small (21-200)' },
  { value: 'MEDIUM', label: 'Medium (201-10,000)' },
  { value: 'ENTERPRISE', label: 'Enterprise (10,001+)' },
] as const

type CompanySizeTier = typeof COMPANY_SIZE_TIERS[number]['value']

export const HeroWaitlistForm: React.FC<HeroWaitlistFormProps> = ({ className = '' }) => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  
  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companySizeTier, setCompanySizeTier] = useState<CompanySizeTier | ''>('')
  const [phone, setPhone] = useState('')
  const [phoneE164, setPhoneE164] = useState<string | undefined>()
  const [phoneValid, setPhoneValid] = useState<boolean | undefined>()
  const [interestRecruiting, setInterestRecruiting] = useState(false)
  const [interestEmployeeHub, setInterestEmployeeHub] = useState(false)
  
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handlePhoneChange = useCallback((value: string, e164?: string, isValid?: boolean) => {
    setPhone(value)
    setPhoneE164(e164)
    setPhoneValid(isValid)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!firstName.trim()) {
      setErrorMessage(t('landing.waitlist.errorFirstName', 'Please enter your first name'))
      setStatus('error')
      return
    }
    
    if (!lastName.trim()) {
      setErrorMessage(t('landing.waitlist.errorLastName', 'Please enter your last name'))
      setStatus('error')
      return
    }
    
    if (!email.trim() || !isValidEmail(email)) {
      setErrorMessage(t('landing.waitlist.errorEmail', 'Please enter a valid email address'))
      setStatus('error')
      return
    }
    
    // At least one interest required
    if (!interestRecruiting && !interestEmployeeHub) {
      setErrorMessage(t('landing.waitlist.errorInterest', 'Please select at least one area of interest'))
      setStatus('error')
      return
    }
    
    // Phone validation (optional but validated if present)
    if (phone.trim() && phoneValid === false) {
      setErrorMessage(t('landing.waitlist.errorPhone', 'Please enter a valid phone number'))
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    // Build interested modules array
    const interestedModules: string[] = []
    if (interestRecruiting) interestedModules.push('hr_recruiting_platform')
    if (interestEmployeeHub) interestedModules.push('employee_services_hub')

    try {
      await apiService.submitEarlyAccess({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        companyName: companyName.trim() || undefined,
        companySizeTier: companySizeTier || undefined,
        phoneE164: phoneE164 || undefined,
        interestedModules,
      })
      setStatus('success')
    } catch (err: any) {
      console.error('Waitlist submission error:', err)
      setErrorMessage(err.message || t('landing.waitlist.errorGeneric', 'Something went wrong. Please try again.'))
      setStatus('error')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.2 : 0.5, ease: 'easeOut' },
    },
  }

  // Success state
  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-white to-purple-50/50 border border-purple-200/60 shadow-xl shadow-purple-100/30 p-6 sm:p-8 ${className}`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-full blur-2xl -z-10" />
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">
            {t('landing.waitlist.successTitle', "You're on the list!")}
          </h3>
          <p className="text-sm text-zinc-600 leading-relaxed max-w-xs">
            {t('landing.waitlist.successMessage', "We'll notify you when early access is available. Check your inbox for confirmation.")}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50/30 to-white border border-purple-200/60 shadow-xl shadow-purple-100/30 ${className}`}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-100/60 to-transparent rounded-full blur-2xl -z-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-50/80 to-transparent rounded-full blur-xl -z-10" />
      
      {/* Header */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-purple-100/60">
        <h3 className="text-lg sm:text-xl font-bold text-zinc-900 text-center">
          {t('landing.waitlist.title', 'Join the Business Platform Waitlist')}
        </h3>
        <p className="mt-1 text-sm text-zinc-500 leading-relaxed text-center">
          {t('landing.waitlist.subtitle', 'Be the first to access our B2B solutions for hiring and employee development.')}
        </p>
      </div>
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
        {/* First Name + Last Name - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="waitlist-firstname" className="block text-sm font-medium text-zinc-700">
              {t('auth.firstName', 'First Name')} *
            </label>
            <Input
              id="waitlist-firstname"
              type="text"
              placeholder={t('landing.waitlist.firstNamePlaceholder', 'First name')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={status === 'submitting'}
              className="h-10 px-3 py-2"
              icon={<User className="w-4 h-4 text-zinc-400" />}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="waitlist-lastname" className="block text-sm font-medium text-zinc-700">
              {t('auth.lastName', 'Last Name')} *
            </label>
            <Input
              id="waitlist-lastname"
              type="text"
              placeholder={t('landing.waitlist.lastNamePlaceholder', 'Last name')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={status === 'submitting'}
              className="h-10 px-3 py-2"
              icon={<User className="w-4 h-4 text-zinc-400" />}
            />
          </div>
        </div>
        
        {/* Email field */}
        <div className="space-y-1.5">
          <label htmlFor="waitlist-email" className="block text-sm font-medium text-zinc-700">
            {t('landing.waitlist.emailLabel', 'Work Email')} *
          </label>
          <Input
            id="waitlist-email"
            type="email"
            placeholder={t('landing.waitlist.emailPlaceholder', 'you@company.com')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'submitting'}
            className="h-10 px-3 py-2"
            icon={<Mail className="w-4 h-4 text-zinc-400" />}
          />
        </div>
        
        {/* Company Name + Company Size - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="waitlist-company" className="block text-sm font-medium text-zinc-700">
              {t('landing.waitlist.companyLabel', 'Company Name')}
            </label>
            <Input
              id="waitlist-company"
              type="text"
              placeholder={t('landing.waitlist.companyPlaceholder', 'Your company')}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={status === 'submitting'}
              className="h-10 px-3 py-2"
              icon={<Building2 className="w-4 h-4 text-zinc-400" />}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="waitlist-size" className="block text-sm font-medium text-zinc-700">
              {t('landing.waitlist.sizeLabel', 'Company Size')}
            </label>
            <div className="relative">
              
              <select
                id="waitlist-size"
                value={companySizeTier}
                onChange={(e) => setCompanySizeTier(e.target.value as CompanySizeTier | '')}
                disabled={status === 'submitting'}
                className="w-full h-10 pl-10 pr-4 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              >
              <option value="">{t('landing.waitlist.sizePlaceholder', 'Select company size')}</option>
              {COMPANY_SIZE_TIERS.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
              </select>
              <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/* Phone field */}
        <div className="space-y-1.5">
          <label htmlFor="waitlist-phone" className="block text-sm font-medium text-zinc-700">
            {t('landing.waitlist.phoneLabel', 'Phone')} <span className="text-zinc-400 font-normal">({t('common.optional', 'optional')})</span>
          </label>
          <PhoneInput
            value={phone}
            onChange={handlePhoneChange}
            disabled={status === 'submitting'}
          />
        </div>
        
        {/* Interest Checkboxes - 2 columns */}
        <div className="pt-2 space-y-3">
          <label className="block text-sm font-medium text-zinc-700">
            {t('landing.waitlist.interestLabel', "I'm interested in")} *
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* HR Recruiting Platform */}
            <div 
              className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100 hover:border-purple-200 transition-colors cursor-pointer h-full"
              onClick={() => {
                if (status === 'submitting') return
                setInterestRecruiting(!interestRecruiting)
              }}
            >
              <Checkbox
                id="interest-recruiting"
                checked={interestRecruiting}
                onCheckedChange={(checked) => setInterestRecruiting(checked === true)}
                onClick={(e) => e.stopPropagation()}
                disabled={status === 'submitting'}
                className="mt-0.5 border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <div className="flex-1 min-w-0">
                <label 
                  htmlFor="interest-recruiting" 
                  className="block text-sm font-medium text-zinc-800 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Briefcase className="w-3.5 h-3.5 inline mr-1.5 text-purple-600" />
                  {t('landing.waitlist.interestRecruiting', 'HR Recruiting Platform')}
                </label>
                <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                  {t('landing.waitlist.interestRecruitingDesc', 'AI-powered candidate screening, consistent interviews, and evidence-based hiring decisions.')}
                </p>
              </div>
            </div>
            
            {/* Employee Services Hub */}
            <div 
              className="flex items-start gap-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100 hover:border-purple-200 transition-colors cursor-pointer h-full"
              onClick={() => {
                if (status === 'submitting') return
                setInterestEmployeeHub(!interestEmployeeHub)
              }}
            >
              <Checkbox
                id="interest-employee-hub"
                checked={interestEmployeeHub}
                onCheckedChange={(checked) => setInterestEmployeeHub(checked === true)}
                onClick={(e) => e.stopPropagation()}
                disabled={status === 'submitting'}
                className="mt-0.5 border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <div className="flex-1 min-w-0">
                <label 
                  htmlFor="interest-employee-hub" 
                  className="block text-sm font-medium text-zinc-800 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Headphones className="w-3.5 h-3.5 inline mr-1.5 text-purple-600" />
                  {t('landing.waitlist.interestEmployeeHub', 'Employee Services Hub')}
                </label>
                <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                  {t('landing.waitlist.interestEmployeeHubDesc', 'AI assistant for employee questions, onboarding, and internal knowledge base.')}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {status === 'error' && errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
        
        {/* Submit button */}
        <Button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-5 text-sm font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-200 transition-all group"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('landing.waitlist.submitting', 'Joining...')}
            </>
          ) : (
            <>
              {t('landing.waitlist.submit', 'Join Waitlist')}
              <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </Button>
        
        {/* Privacy note */}
        <p className="text-center text-xs text-zinc-400 pt-1">
          {t('landing.waitlist.privacy', "We respect your privacy. No spam, ever.")}
        </p>
      </form>
    </motion.div>
  )
}

export default HeroWaitlistForm
