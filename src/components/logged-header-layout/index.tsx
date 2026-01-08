'use client'

import React from 'react'
import { Outlet } from 'react-router-dom'
import { AppHeader } from 'components/header'
import { AppFooter } from 'components/shared/AppFooter'
import { LayoutProvider } from 'components/default-layout'
import { HEADER_OFFSET_CLASSES } from 'config/layout'
import { cn } from 'lib/utils'
import { useUser } from 'contexts/AuthContext'
import CookieConsentBanner from 'components/cookie-consent/CookieConsentBanner'

export const LoggedHeaderLayout: React.FC = () => {
  const { isLoaded, isSignedIn } = useUser()

  // Keep parity with LoggedLayout: show a simple loading state while auth initializes.
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-purple-200 rounded-full" />
          <div className="w-32 h-4 bg-zinc-200 rounded" />
        </div>
      </div>
    )
  }

  // If not signed in, the route guards should handle redirects.
  // We still render children to avoid layout-level navigation side effects.
  if (!isSignedIn) {
    return <Outlet />
  }

  return (
    <LayoutProvider>
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <AppHeader mode="app" showLogo disableSidebarOffset />
        <div className={cn(HEADER_OFFSET_CLASSES.paddingTop, 'flex-1')}>
          <Outlet />
        </div>
        <AppFooter variant="app" />
        <CookieConsentBanner />
      </div>
    </LayoutProvider>
  )
}

export default LoggedHeaderLayout
