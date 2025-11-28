'use client'

import TopBar from 'components/top-bar'
import { cn } from 'lib/utils'
import React from 'react'

type DefaultLayoutProps = {
  children: React.ReactNode
  className?: string
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
  className
}: DefaultLayoutProps) => {
  const { bgClasses, otherClasses } = extractBgClasses(className);
  
  return (
    <div data-testid="root-container" className={cn("flex min-h-screen", bgClasses)}>
      <main data-testid="main-content" className="w-full min-h-screen">
        <TopBar />
        <div data-testid="content-wrapper" className="pb-0 min-h-[calc(100vh-64px)]">
          <div data-testid="content-container" className={cn('mx-auto container pt-6 min-h-[calc(100vh-64px)]', otherClasses)}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}