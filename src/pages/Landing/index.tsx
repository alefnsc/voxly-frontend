'use client'

import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useLocation } from 'react-router-dom'
import {
  Hero,
  PlatformShowcase,
  Integrations,
  FAQAccordion,
  FinalCTA,
  LandingB2CFeatures,
  LandingB2BRecruiting,
  LandingB2BEmployeeHub,
  LandingTrust,
  LandingPreviewTabs,
  DashboardPreviewTabs,
  LandingHiringCollaborationPreview,
} from 'components/landing'
import { FREE_TRIAL_CREDITS } from 'config/credits'
import { HEADER_OFFSET_CLASSES } from 'config/layout'

export const Landing: React.FC = () => {
  const location = useLocation()

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (!scrollTo) return

    // Defer so the DOM is ready after navigation.
    requestAnimationFrame(() => {
      const element = document.querySelector(scrollTo)
      if (element) element.scrollIntoView({ behavior: 'smooth' })
      // Clear state so refresh/back doesn’t re-scroll.
      window.history.replaceState({}, document.title)
    })
  }, [location.state])

  const scrollToWaitlistForm = () => {
    const element = document.getElementById('business-waitlist')
    if (element) {
      const headerOffset = 96 // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - headerOffset,
        behavior: 'smooth',
      })
    }
  }

  const handleDemoClick = () => {
    scrollToWaitlistForm()
  }

  const creditsText = FREE_TRIAL_CREDITS === 1 ? '1 Free Credit' : `${FREE_TRIAL_CREDITS} Free Credits`

  return (
    <>
      <Helmet>
        <title>Vocaid - AI Interview Practice, Recruiting & HR Hub | {creditsText}</title>
        <meta
          name="description"
          content={`Three platforms, one mission: turn interviews into measurable progress. Practice interviews with AI, evaluate candidates consistently, and empower employees. Start free with ${FREE_TRIAL_CREDITS} credit${FREE_TRIAL_CREDITS !== 1 ? 's' : ''}.`}
        />
        <meta
          name="keywords"
          content="AI interviews, interview practice, mock interviews, hiring platform, HR automation, employee service, recruiting, talent acquisition, career coaching"
        />
        <meta property="og:title" content="Vocaid - AI Interview Practice & Recruiting Platform" />
        <meta
          property="og:description"
          content={`Practice interviews with AI, evaluate candidates consistently, and empower employees. Start free with ${FREE_TRIAL_CREDITS} credit${FREE_TRIAL_CREDITS !== 1 ? 's' : ''}.`}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Vocaid - AI Interview Practice & Recruiting Platform" />
        <meta
          name="twitter:description"
          content={`Practice interviews with AI, evaluate candidates consistently, and empower employees. Start free with ${FREE_TRIAL_CREDITS} credit${FREE_TRIAL_CREDITS !== 1 ? 's' : ''}.`}
        />
      </Helmet>

      <div className="min-h-screen bg-white overflow-x-hidden">
        <main>
          {/* Hero with language badges and dual CTAs */}
          <Hero onDemoClick={handleDemoClick} />
          
          {/* Interactive 5-tab product preview - #product anchor */}
          <div id="product" className={HEADER_OFFSET_CLASSES.scrollMarginTop}>

          <PlatformShowcase />
            <LandingPreviewTabs />
          </div>
          
          {/* Solutions section - B2C + B2B features - #solutions anchor */}
          <div id="solutions" className={HEADER_OFFSET_CLASSES.scrollMarginTop}>
            {/* B2C Personal Interview Practice features */}
            <LandingB2CFeatures />
            
            {/* B2B Sections with anchor for navigation */}
            <div id="organizations">
              {/* Also add b2b-section id for Hero scroll target compatibility */}
              <div id="b2b-section" className={HEADER_OFFSET_CLASSES.scrollMarginTop} />
              <LandingB2BRecruiting onWaitlistClick={scrollToWaitlistForm} />
              <LandingB2BEmployeeHub onWaitlistClick={scrollToWaitlistForm} />
            </div>
          </div>
          
          {/* NEW: Hiring Collaboration Preview (Candidate Voting + Role Marketplace) */}
          <LandingHiringCollaborationPreview />
          
          {/* Trust/Security section */}
          <LandingTrust />
          
                      {/* Platform showcase and integrations - #integrations anchor */}
          <div id="integrations" className={HEADER_OFFSET_CLASSES.scrollMarginTop}>
            <Integrations />
          </div>
          
          {/* Dashboard preview with API key demo and analytics charts */}
          <DashboardPreviewTabs />
          
          {/* FAQ Section - #faq anchor */}
          <div id="faq" className={HEADER_OFFSET_CLASSES.scrollMarginTop}>
            <FAQAccordion />
          </div>
          
          <FinalCTA onDemoClick={handleDemoClick} />
        </main>
      </div>
    </>
  )
}

export default Landing
