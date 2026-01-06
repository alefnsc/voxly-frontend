/**
 * Auth Shell Component
 * 
 * Shared layout wrapper for authentication pages.
 * Provides premium centered card design with subtle background treatment.
 * 
 * @module components/auth/AuthShell
 */

'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from 'lib/utils';
import { AuthLogoBlock } from './AuthLogoBlock';
import { AppFooter } from 'components/shared/AppFooter';

interface AuthShellProps {
  /** Form content to render inside the card */
  children: React.ReactNode;
  /** Optional class name for the shell container */
  className?: string;
  /** Whether to show the accent bar at top of card */
  showAccentBar?: boolean;
}

// Animation variants respecting reduced motion
const shellVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const AuthShell: React.FC<AuthShellProps> = ({
  children,
  className,
  showAccentBar = true,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div 
      className={cn(
        'min-h-screen w-full',
        'bg-white',
        // Subtle gradient background effect
        'bg-gradient-to-br from-zinc-50 via-white to-zinc-100',
        className
      )}
    >
      {/* Subtle texture overlay using CSS pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          className="w-full max-w-md"
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="visible"
          variants={shellVariants}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Logo Block - Centered above card */}
          <AuthLogoBlock className="mb-8" />
          
          {/* Main Card */}
          <div 
            className={cn(
              'relative',
              'bg-white',
              'border border-zinc-200',
              'rounded-2xl',
              'shadow-sm',
              'overflow-visible'
            )}
          >
            {/* Purple Accent Bar */}
            {showAccentBar && (
              <div className="absolute top-0 left-6 right-6">
                <div className="h-1 bg-purple-600 rounded-full" />
              </div>
            )}
            
            {/* Card Content */}
            <div className="p-6 sm:p-8 pt-8 sm:pt-10">
              {children}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <AppFooter variant="simple" className="relative z-10" />
    </div>
  );
};

export default AuthShell;
