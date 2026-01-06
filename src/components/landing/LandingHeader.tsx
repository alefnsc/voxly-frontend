'use client'

import React from 'react'
import AppHeader from 'components/header'

interface LandingHeaderProps {
  onDemoClick?: () => void
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ onDemoClick }) => {
  // onDemoClick is intentionally ignored here; the consolidated header owns navigation.
  void onDemoClick
  return <AppHeader mode="public" />
}

export default LandingHeader
