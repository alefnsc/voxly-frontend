'use client'

import TopBar from 'components/top-bar'
import Sidebar from 'components/sidebar'
import { cn } from 'lib/utils'
import React, { createContext, useContext } from 'react'
import { useUser } from 'contexts/AuthContext'

// ========================================
// LAYOUT CONTEXT
// ========================================

/**
 * Context to detect if we're inside a layout wrapper.
 * Used to prevent double layout rendering when pages
 * use DefaultLayout but are also inside LoggedLayout.
 */
const LayoutContext = createContext<{ hasParentLayout: boolean }>({ hasParentLayout: false });

/**
 * Hook to check if we're inside a layout context
 */
export const useLayoutContext = () => useContext(LayoutContext);

/**
 * Mark that a layout is providing context (used by LoggedLayout)
 */
export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <LayoutContext.Provider value={{ hasParentLayout: true }}>
    {children}
  </LayoutContext.Provider>
);

// ========================================
// TYPES
// ========================================

type DefaultLayoutProps = {
  children: React.ReactNode
  className?: string
  /** Whether user has a recent interview (for pulse indicator) */
  hasRecentInterview?: boolean
  /** Hide sidebar even when authenticated (e.g., during active interview) */
  hideSidebar?: boolean
}

// Extract background-related classes to apply to outer container
const extractBgClasses = (className: string = ''): { bgClasses: string; otherClasses: string } => {
  const classes = className.split(' ');
  const bgClasses: string[] = [];
  const otherClasses: string[] = [];
  
  classes.forEach(cls => {
    if (cls.startsWith('bg-') || cls.startsWith('from-') || cls.startsWith('via-') || cls.startsWith('to-')) {
      bgClasses.push(cls);
    } else {
      otherClasses.push(cls);
    }
  });
  
  return {
    bgClasses: bgClasses.join(' '),
    otherClasses: otherClasses.join(' ')
  };
};

export const DefaultLayout = ({
  children,
  className,
  hasRecentInterview = false,
  hideSidebar = false,
}: DefaultLayoutProps) => {
  const { bgClasses, otherClasses } = extractBgClasses(className);
  const { isSignedIn } = useUser();
  const { hasParentLayout } = useLayoutContext();
  
  // If we're inside LoggedLayout, just render children with styling
  // This prevents double layout rendering
  if (hasParentLayout) {
    return (
      <div className={cn(bgClasses, otherClasses, 'min-h-[calc(100vh-180px)]')}>
        {children}
      </div>
    );
  }
  
  // Show sidebar layout for authenticated users (unless explicitly hidden)
  const showSidebar = isSignedIn && !hideSidebar;
  
  return (
    <div data-testid="root-container" className={cn("flex min-h-[100dvh]", bgClasses)}>
      {/* Sidebar - only for authenticated users on lg+ screens */}
      {showSidebar && <Sidebar hasRecentInterview={hasRecentInterview} />}
      
      <main 
        data-testid="main-content" 
        className={cn(
          "w-full min-h-[100dvh] flex flex-col",
          showSidebar && "lg:ml-[260px]"
        )}
      >
        <TopBar />
        <div 
          data-testid="content-wrapper" 
          className={cn(
            "flex-1 min-h-0",
            // Add bottom padding on mobile for bottom nav + iOS safe area
            showSidebar && "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
          )}
        >
          <div data-testid="content-container" className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6', otherClasses)}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}