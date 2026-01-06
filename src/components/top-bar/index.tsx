'use client'

import React from 'react'
import AppHeader from 'components/header'

interface TopBarProps {
  /**
   * Variant for different page contexts
   * - 'default': White background with full navigation
   * - 'minimal': Gray background with logo only (for consent/onboarding pages)
   */
  variant?: 'default' | 'minimal'
  /**
   * Whether to show the logo on the left side
   * - true: Show logo (useful for legal pages without sidebar)
   * - false: Hide logo (default behavior)
   */
  showLogo?: boolean
}

const TopBar: React.FC<TopBarProps> = ({ variant = 'default', showLogo = false }) => {
  return <AppHeader mode={variant === 'minimal' ? 'minimal' : 'auto'} showLogo={showLogo} />
}

export default TopBar