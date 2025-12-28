'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from 'components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'components/ui/dialog'
import { BrandMark } from '../shared/Brand'
import { cn } from 'lib/utils'

interface LandingHeaderProps {
  onDemoClick?: () => void
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onDemoClick }) => {
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const navLinks = [
    { label: t('landing.nav.product', 'Product'), href: '#product' },
    { label: t('landing.nav.solutions', 'Solutions'), href: '#solutions' },
    { label: t('landing.nav.integrations', 'Integrations'), href: '#integrations' },
    { label: t('landing.nav.pricing', 'Pricing'), href: '#pricing' },
    { label: t('landing.nav.faq', 'FAQ'), href: '#faq' },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /**
   * Scroll to section with header offset compensation
   * Uses data-landing-header attribute to find header height dynamically
   */
  const scrollToSection = useCallback((href: string, closeMobileMenu = true) => {
    // Close mobile menu first if needed
    if (closeMobileMenu) {
      setMobileMenuOpen(false)
    }

    // Small delay to allow menu close animation
    const performScroll = () => {
      const element = document.querySelector(href)
      if (!element) {
        console.warn(`Section ${href} not found`)
        return
      }

      // Get header height dynamically
      const header = document.querySelector('[data-landing-header="true"]')
      const headerHeight = header?.getBoundingClientRect().height ?? 80

      // Calculate target scroll position with offset
      const elementTop = element.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementTop - headerHeight - 8 // 8px extra padding

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      // Update URL hash without triggering scroll
      window.history.replaceState(null, '', href)
    }

    // If mobile menu was open, wait for it to close
    if (closeMobileMenu && mobileMenuOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(performScroll)
      })
    } else {
      performScroll()
    }
  }, [mobileMenuOpen])

  // Handle direct hash navigation on page load
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      // Wait for DOM to be ready
      const timer = setTimeout(() => {
        scrollToSection(hash, false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [scrollToSection])

  return (
    <>
      <motion.header
        data-landing-header="true"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-zinc-100'
            : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <Link to="/" className="shrink-0" aria-label="Vocaid Home">
              <BrandMark size="xl" linkToHome={false} />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/sign-in')}
                className="text-zinc-700 hover:text-zinc-900"
              >
                {t('common.login')}
              </Button>
              <Button
                onClick={() => navigate('/sign-up')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t('common.signUp')}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 px-3 py-2 rounded-md hover:bg-zinc-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('landing.nav.menu')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu Dialog */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>
              <BrandMark size="md" linkToHome={false} />
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="text-left px-4 py-3.5 text-base font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors min-h-[48px]"
              >
                {link.label}
              </button>
            ))}
            <div className="h-px bg-zinc-200 my-2" />
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/sign-in')
              }}
              className="text-left px-4 py-3.5 text-base font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors min-h-[48px]"
            >
              {t('common.login')}
            </button>
            <Button
              onClick={() => {
                setMobileMenuOpen(false)
                navigate('/sign-up')
              }}
              className="mx-4 mt-2 bg-purple-600 hover:bg-purple-700 text-white min-h-[48px]"
            >
              {t('common.signUp')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default LandingHeader
