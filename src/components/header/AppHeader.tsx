'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

import { Button } from 'components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'components/ui/dialog'

import { useUser } from 'contexts/AuthContext'
import { useAuthCheck } from 'hooks/use-auth-check'

import { BrandMark } from 'components/shared/Brand'
import { LanguageSelector } from 'components/language-selector'
import { AccountMenu } from 'components/account-menu'

import { NAV_CONFIG } from 'config/navigation'
import { FEATURES } from 'config/features'

import { BUY_CREDITS_LINK, isPathActive } from 'utils/routing'
import { cn } from 'lib/utils'

type HeaderMode = 'auto' | 'public' | 'app' | 'minimal'

interface AppHeaderProps {
  mode?: HeaderMode
  /**
   * Used for legacy TopBar compatibility.
   * When true, logo is shown on the left (e.g., legal pages).
   */
  showLogo?: boolean
  /**
   * When in app mode + signed in, AppHeader offsets itself for the desktop sidebar.
   * Use this to disable that offset for pages that intentionally have no sidebar.
   */
  disableSidebarOffset?: boolean
  /**
   * If provided, AppHeader will use this for app-mode mobile hamburger.
   * This enables LoggedLayout to control its own mobile drawer.
   */
  onMobileMenuToggle?: () => void
  /**
   * When using onMobileMenuToggle, this controls the hamburger icon state.
   */
  isMobileMenuOpen?: boolean
}

interface NavItem {
  labelKey: string
  path: string
  requiresAuth?: boolean
  disabled?: boolean
  comingSoon?: boolean
}

const landingSectionLinks: Array<{ labelKey: string; href: string }> = [
  { labelKey: 'landing.nav.product', href: '#product' },
  { labelKey: 'landing.nav.solutions', href: '#solutions' },
  { labelKey: 'landing.nav.integrations', href: '#integrations' },
  { labelKey: 'landing.nav.pricing', href: '#pricing' },
  { labelKey: 'landing.nav.faq', href: '#faq' },
]

const landingResourceLinks: NavItem[] = [{ labelKey: 'nav.about', path: '/about' }]

const getB2CNavItems = (): NavItem[] => {
  return NAV_CONFIG.filter((item) => item.requiredContext === 'b2c' && item.requiresAuth)
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      labelKey: item.labelKey,
      path: item.path,
      requiresAuth: item.requiresAuth,
    }))
}

const getB2BNavItems = (): NavItem[] => {
  return NAV_CONFIG.filter((item) => item.requiredContext === 'b2b' && item.requiresAuth)
    .sort((a, b) => a.order - b.order)
    .slice(0, 3)
    .map((item) => ({
      labelKey: item.labelKey,
      path: item.path,
      requiresAuth: item.requiresAuth,
      disabled: !FEATURES.B2B_RECRUITER_PLATFORM_ENABLED,
      comingSoon: !FEATURES.B2B_RECRUITER_PLATFORM_ENABLED,
    }))
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  mode = 'auto',
  showLogo = false,
  disableSidebarOffset = false,
  onMobileMenuToggle,
  isMobileMenuOpen,
}) => {
  const { user, isSignedIn } = useUser()
  const { userCredits } = useAuthCheck()
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const [isScrolled, setIsScrolled] = useState(false)
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false)

  const effectiveMode: Exclude<HeaderMode, 'auto'> = useMemo(() => {
    if (mode !== 'auto') return mode

    // Signed-in experience should default to the app header.
    if (isSignedIn) return 'app'

    // If the route is part of the app area (or account), treat as app header.
    if (location.pathname.startsWith('/app') || location.pathname.startsWith('/account')) {
      return 'app'
    }

    // Otherwise: public header.
    return 'public'
  }, [mode, isSignedIn, location.pathname])

  const usesExternalMobileMenu = effectiveMode === 'app' && typeof onMobileMenuToggle === 'function'

  const isAppSignedIn = effectiveMode === 'app' && isSignedIn

  const mobileMenuOpen = usesExternalMobileMenu ? !!isMobileMenuOpen : internalMobileMenuOpen

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Close internal menu on navigation
    if (!usesExternalMobileMenu) setInternalMobileMenuOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const checkIsActivePath = useCallback(
    (path: string) => {
      return isPathActive(location.pathname, path)
    },
    [location.pathname]
  )

  const scrollToSection = useCallback(
    (href: string) => {
      if (location.pathname === '/') {
        const element = document.querySelector(href)
        if (element) element.scrollIntoView({ behavior: 'smooth' })
      } else {
        navigate('/', { state: { scrollTo: href }, replace: false })
      }

      if (!usesExternalMobileMenu) setInternalMobileMenuOpen(false)
    },
    [location.pathname, navigate, usesExternalMobileMenu]
  )

  const toggleMobileMenu = useCallback(() => {
    if (usesExternalMobileMenu) {
      onMobileMenuToggle?.()
      return
    }
    setInternalMobileMenuOpen((prev) => !prev)
  }, [usesExternalMobileMenu, onMobileMenuToggle])

  const closeInternalMobileMenu = useCallback(() => {
    if (!usesExternalMobileMenu) setInternalMobileMenuOpen(false)
  }, [usesExternalMobileMenu])

  const logoLink = isSignedIn ? '/app/b2c/dashboard' : '/'
  const hideLogoOnDesktop = effectiveMode === 'app' && isSignedIn && !showLogo

  const showPublicDesktopNav = effectiveMode === 'public'
  const showAppDesktopActions = isAppSignedIn

  // Minimal mode: centered logo, no nav.
  if (effectiveMode === 'minimal') {
    return (
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-zinc-100'
            : 'bg-white'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-center h-20 md:h-24">
            <Link to={logoLink} className="shrink-0" aria-label="Vocaid Home">
              <BrandMark size="xl" linkToHome={false} />
            </Link>
          </div>
        </nav>
      </motion.header>
    )
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          // Option A:
          // - Public: fixed full-width header.
          // - Logged app: fixed header that starts AFTER the desktop sidebar (no overlap).
          'fixed top-0 z-50 transition-all duration-300',
          isAppSignedIn && !disableSidebarOffset
            ? 'left-0 right-0 lg:left-[260px] lg:right-0'
            : 'left-0 right-0',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-zinc-100'
            : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo */}
            <Link
              to={logoLink}
              className={cn('shrink-0', hideLogoOnDesktop && 'md:hidden')}
              aria-label="Vocaid Home"
            >
              <BrandMark size="xl" linkToHome={false} />
            </Link>

            {/* Desktop Navigation (Public) */}
            {showPublicDesktopNav && (
              <div className="hidden md:flex items-center gap-8">
                {landingSectionLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    {t(link.labelKey)}
                  </button>
                ))}
                {landingResourceLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      'text-sm font-medium transition-colors',
                      checkIsActivePath(link.path)
                        ? 'text-zinc-900'
                        : 'text-zinc-600 hover:text-zinc-900'
                    )}
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </div>
            )}

            {/* Desktop Actions */}
            <div className={cn('hidden md:flex items-center gap-3', hideLogoOnDesktop && 'ml-auto')}>
              {showAppDesktopActions ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={BUY_CREDITS_LINK}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-full hover:border-purple-300 transition-colors"
                  >
                    <span className="text-xs text-purple-600 font-medium">{t('nav.credits')}</span>
                    <span className="text-sm font-semibold text-zinc-900">{userCredits ?? 0}</span>
                    <span className="text-xs text-purple-600 font-medium">•</span>
                    <span className="text-xs text-purple-600 font-medium">
                      {t('account.sections.creditsPurchase', 'Buy Credits')}
                    </span>
                  </Link>
                  <div className="pl-2 border-l border-zinc-200">
                    <AccountMenu variant="desktop" />
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Mobile: Hamburger */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-sm font-medium text-zinc-700 hover:text-zinc-900 px-3 py-2 rounded-md hover:bg-zinc-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={mobileMenuOpen ? t('landing.nav.closeMenu', 'Close menu') : t('landing.nav.menu', 'Menu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Internal Mobile Menu (public + non-LoggedLayout app contexts) */}
      {!usesExternalMobileMenu && (
        <Dialog open={internalMobileMenuOpen} onOpenChange={setInternalMobileMenuOpen}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>
                <BrandMark size="md" linkToHome={false} />
              </DialogTitle>
            </DialogHeader>

            {effectiveMode === 'public' ? (
              <div className="flex flex-col gap-1 py-4">
                {landingSectionLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="text-left px-4 py-3.5 text-base font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors min-h-[48px]"
                  >
                    {t(link.labelKey)}
                  </button>
                ))}

                <Link
                  to="/about"
                  onClick={closeInternalMobileMenu}
                  className={cn(
                    'text-left px-4 py-3.5 text-base font-medium rounded-lg transition-colors min-h-[48px] flex items-center',
                    checkIsActivePath('/about')
                      ? 'text-zinc-900 bg-zinc-50'
                      : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50'
                  )}
                >
                  {t('nav.about')}
                </Link>

                <div className="h-px bg-zinc-200 my-2" />

                <button
                  onClick={() => {
                    setInternalMobileMenuOpen(false)
                    navigate('/sign-in')
                  }}
                  className="text-left px-4 py-3.5 text-base font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors min-h-[48px]"
                >
                  {t('common.login')}
                </button>

                <Button
                  onClick={() => {
                    setInternalMobileMenuOpen(false)
                    navigate('/sign-up')
                  }}
                  className="mx-4 mt-2 bg-purple-600 hover:bg-purple-700 text-white min-h-[48px]"
                >
                  {t('common.signUp')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col py-2">
                {/* Signed-in app menu */}
                {user ? (
                  <div className="border-b border-zinc-200 p-5">
                    <AccountMenu variant="mobile" />
                    <Link
                      to={BUY_CREDITS_LINK}
                      onClick={closeInternalMobileMenu}
                      className="mt-4 flex items-center justify-between px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-purple-300 transition-colors"
                    >
                      <span className="text-sm text-zinc-500">{t('dashboard.stats.creditsRemaining')}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-zinc-900">{userCredits ?? 0}</span>
                        <span className="text-xs text-purple-600 font-medium">
                          {t('account.sections.creditsPurchase', 'Buy Credits')}
                        </span>
                      </div>
                    </Link>
                  </div>
                ) : (
                  <div className="border-b border-zinc-200 p-5 space-y-3">
                    <p className="text-sm text-zinc-600">
                      {t('common.signInPrompt', 'Sign in to access all features')}
                    </p>
                    <Link
                      to="/sign-in"
                      className={cn(
                        'block w-full px-4 py-3 text-center text-base font-medium rounded-xl transition-colors',
                        'text-zinc-900 bg-zinc-100 hover:bg-zinc-200',
                        'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'
                      )}
                      onClick={closeInternalMobileMenu}
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      to="/sign-up"
                      className={cn(
                        'block w-full px-4 py-3 text-center text-base font-medium rounded-xl transition-colors',
                        'text-white bg-zinc-900 hover:bg-zinc-800',
                        'focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2'
                      )}
                      onClick={closeInternalMobileMenu}
                    >
                      {t('auth.createAccount', 'Sign up')}
                    </Link>
                  </div>
                )}

                <div className="flex-1 py-4 overflow-y-auto">
                  {isSignedIn ? (
                    <>
                      <div className="mb-4">
                        <p className="px-6 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                          {t('platform.b2c.title', 'Interview Practice')}
                        </p>
                        {getB2CNavItems().map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              'block px-6 py-3 text-base font-medium transition-colors',
                              checkIsActivePath(item.path)
                                ? 'text-purple-600 bg-purple-50'
                                : 'text-zinc-700 hover:bg-zinc-50'
                            )}
                            onClick={closeInternalMobileMenu}
                          >
                            {t(item.labelKey)}
                          </Link>
                        ))}
                      </div>

                      <div className="mb-4">
                        <p className="px-6 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                          {t('platform.b2b.title', 'For Recruiters')}
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                            {t('common.comingSoon', 'Coming Soon')}
                          </span>
                        </p>
                        {getB2BNavItems().map((item) => (
                          <div
                            key={item.path}
                            className="flex items-center justify-between px-6 py-3 text-base font-medium text-zinc-400 cursor-not-allowed"
                            aria-disabled="true"
                          >
                            <span>{t(item.labelKey)}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded">
                              Soon
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-zinc-200 pt-4">
                        <p className="px-6 mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                          {t('common.more', 'Resources')}
                        </p>
                        {landingResourceLinks.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              'block px-6 py-3 text-base font-medium transition-colors',
                              checkIsActivePath(item.path)
                                ? 'text-purple-600 bg-purple-50'
                                : 'text-zinc-700 hover:bg-zinc-50'
                            )}
                            onClick={closeInternalMobileMenu}
                          >
                            {t(item.labelKey)}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="px-6 py-4 text-sm text-zinc-600">
                      {t('common.signInPrompt', 'Sign in to access all features')}
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-200 p-4">
                  <p className="px-2 mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                    {t('language.select')}
                  </p>
                  <LanguageSelector variant="horizontal" className="justify-center" />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

export default AppHeader
