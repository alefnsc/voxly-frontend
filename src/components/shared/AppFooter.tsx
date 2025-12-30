/**
 * AppFooter Component
 * 
 * Single source of truth for the application footer.
 * Used across all layouts (landing, app shell, auth pages).
 * 
 * Variants:
 * - 'full': Complete footer with navigation links (landing/marketing)
 * - 'simple': Minimal footer with copyright only (auth pages)
 * - 'app': Footer for authenticated app pages (adjusts for sidebar)
 */

'use client'

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { BrandLockup, CopyrightNotice, BRAND } from './Brand';

// ============================================
// FOOTER LINKS CONFIG
// ============================================

const footerLinks = {
  product: [
    { label: 'Features', href: '#product' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Integrations', href: '#integrations' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  company: [
    { label: 'About', href: '/about' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Use', href: '/terms-of-use' },
  ],
};

// ============================================
// TYPES
// ============================================

type FooterVariant = 'full' | 'simple' | 'app';

interface AppFooterProps {
  variant?: FooterVariant;
  className?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AppFooter({ variant = 'full', className = '' }: AppFooterProps) {
  const { isSignedIn } = useUser();

  // Simple footer for auth pages
  if (variant === 'simple') {
    return <SimpleFooter className={className} />;
  }

  // App footer for authenticated users (adjusts for sidebar)
  if (variant === 'app') {
    return <AppShellFooter isSignedIn={isSignedIn} className={className} />;
  }

  // Full footer for landing/marketing pages
  return <FullFooter className={className} />;
}

// ============================================
// FULL FOOTER (Landing/Marketing)
// ============================================

function FullFooter({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  
  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className={`bg-white border-t border-zinc-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <BrandLockup size="md" linkToHome />
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              {t('appFooter.description')}
            </p>
            <CopyrightNotice className="text-xs" />
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
              {t('appFooter.product')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('#') ? (
                    <button
                      onClick={() => scrollToSection(link.href)}
                      className="text-sm text-zinc-600 hover:text-purple-600 transition-colors"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-zinc-600 hover:text-purple-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-zinc-600 hover:text-purple-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-zinc-600 hover:text-purple-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-500">
            {t('appFooter.tagline')}
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-xs text-zinc-500 hover:text-purple-600">
              {t('appFooter.privacy')}
            </Link>
            <Link to="/terms-of-use" className="text-xs text-zinc-500 hover:text-purple-600">
              {t('appFooter.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// SIMPLE FOOTER (Auth Pages)
// ============================================

function SimpleFooter({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  
  return (
    <footer className={`py-6 text-center ${className}`}>
      <CopyrightNotice className="text-xs" />
      <div className="mt-2 flex justify-center gap-4">
        <Link to="/privacy-policy" className="text-xs text-zinc-500 hover:text-purple-600">
          {t('appFooter.privacyPolicy')}
        </Link>
        <Link to="/terms-of-use" className="text-xs text-zinc-500 hover:text-purple-600">
          {t('appFooter.termsOfUse')}
        </Link>
      </div>
    </footer>
  );
}

// ============================================
// APP SHELL FOOTER (Authenticated Pages)
// Uses same layout as landing page footer for consistency
// ============================================

function AppShellFooter({ isSignedIn, className = '' }: { isSignedIn?: boolean; className?: string }) {
  const { t } = useTranslation();
  
  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Footer spans full width - no sidebar offset needed since it's inside the main content area
  // which already has the sidebar offset applied
  return (
    <footer 
      className={`
        bg-white border-t border-zinc-200
        w-full
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand & Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <BrandLockup size="md" linkToHome />
            </div>
            <p className="text-sm text-zinc-600 mb-4">
              {t('appFooter.description')}
            </p>
            <CopyrightNotice className="text-xs" />
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
              {t('appFooter.company')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-zinc-600 hover:text-purple-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">
              {t('appFooter.legal')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-zinc-600 hover:text-purple-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-500">
            {t('appFooter.tagline')}
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-xs text-zinc-500 hover:text-purple-600">
              {t('appFooter.privacy')}
            </Link>
            <Link to="/terms-of-use" className="text-xs text-zinc-500 hover:text-purple-600">
              {t('appFooter.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
