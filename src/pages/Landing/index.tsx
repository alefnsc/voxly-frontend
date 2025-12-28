'use client'

import React, { useState } from 'react'
import { Helmet } from 'react-helmet'
import {
  LandingHeader,
  Hero,
  PlatformShowcase,
  Integrations,
  FAQAccordion,
  DemoModal,
  FinalCTA,
  LandingB2CFeatures,
  LandingB2BRecruiting,
  LandingB2BEmployeeHub,
  LandingTrust,
  LandingPreviewTabs,
  DashboardPreviewTabs,
  WaitlistModal,
} from 'components/landing'
import type { WaitlistModule } from 'components/landing/WaitlistModal'
import { PricingSection } from 'components/landing/pricing'
import { FREE_TRIAL_CREDITS } from 'config/credits'

export const Landing: React.FC = () => {
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [preselectedModule, setPreselectedModule] = useState<WaitlistModule | undefined>()

  const handleDemoClick = () => {
    setDemoModalOpen(true)
  }

  const handleWaitlistClick = (module: WaitlistModule) => {
    setPreselectedModule(module)
    setWaitlistOpen(true)
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

      <div className="min-h-screen bg-white">
        <LandingHeader onDemoClick={handleDemoClick} />
        
        <main>
          {/* Hero with language badges and dual CTAs */}
          <Hero onDemoClick={handleDemoClick} />
          
          {/* Interactive 5-tab product preview */}
          <LandingPreviewTabs />
          
          {/* B2C Personal Interview Practice features */}
          <LandingB2CFeatures />
          
          {/* B2B Sections with anchor for navigation */}
          <div id="organizations">
            <LandingB2BRecruiting onWaitlistClick={() => handleWaitlistClick('recruiter_platform')} />
            <LandingB2BEmployeeHub onWaitlistClick={() => handleWaitlistClick('employee_hub')} />
          </div>
          
          {/* Trust/Security section */}
          <LandingTrust />
          
          {/* Platform showcase and integrations */}
          <PlatformShowcase />
          <Integrations />
          
          {/* Dashboard preview with API key demo and analytics charts */}
          <DashboardPreviewTabs />
          
          {/* New segmented Pricing Section (B2C / B2B / HR tabs) */}
          <PricingSection onDemoClick={handleDemoClick} />
          
          <FAQAccordion />
          <FinalCTA onDemoClick={handleDemoClick} />
        </main>
        
        <DemoModal open={demoModalOpen} onOpenChange={setDemoModalOpen} />
        <WaitlistModal
          open={waitlistOpen}
          onOpenChange={setWaitlistOpen}
          preselectedModule={preselectedModule}
        />
      </div>
    </>
  )
}

export default Landing
