/**
 * HeroPreview Component
 * 
 * A premium, product-realistic visual preview of the Vocaid platform.
 * Shows a composed 3-panel preview with dashboard, live interview, and scorecard.
 * Falls back to composed UI if the main image fails to load.
 * 
 * Features:
 * - Responsive sizing with proper text wrapping
 * - No text overlap at any breakpoint
 * - Smooth hover effects (respects reduced motion)
 * - Purple-first brand consistency
 * 
 * @module components/landing/HeroPreview
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { 
  Mic, 
  Play,
  FileText,
  Clock,
  Globe,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'

// ==========================================
// TYPES
// ==========================================

interface HeroPreviewProps {
  /** Path to the main preview image */
  imageSrc?: string
  /** Alt text for the image */
  title?: string
  /** Language label to display */
  preferredLanguageLabel?: string
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

/** SVG Sparkline Chart */
const SparklineChart: React.FC<{ className?: string }> = ({ className = '' }) => {
  const points = [12, 19, 14, 22, 18, 25, 21, 28, 24, 30, 27, 32]
  const max = Math.max(...points)
  const min = Math.min(...points)
  const height = 28
  const width = 64
  
  const pathData = points
    .map((point, i) => {
      const x = (i / (points.length - 1)) * width
      const y = height - ((point - min) / (max - min)) * height
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className={`flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
        fill="url(#sparklineGradient)"
      />
      <path
        d={pathData}
        fill="none"
        stroke="rgb(147, 51, 234)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Audio Visualizer Bars - Fixed height container */
const AudioVisualizer: React.FC<{ isAnimated: boolean }> = ({ isAnimated }) => {
  const bars = 12
  
  return (
    <div 
      className="flex items-end justify-center gap-0.5 h-8 sm:h-10"
      aria-hidden="true"
    >
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 25 + Math.sin(i * 0.7) * 55
        const animationDelay = `${i * 0.06}s`
        
        return (
          <div
            key={i}
            className={`w-1 rounded-full bg-gradient-to-t from-purple-600 to-purple-400 flex-shrink-0 ${
              isAnimated ? 'animate-audio-bar' : ''
            }`}
            style={{
              height: `${baseHeight}%`,
              animationDelay: isAnimated ? animationDelay : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

/** Dashboard Mini Card - Compact with no overlap */
const DashboardCard: React.FC = () => {
  const { t } = useTranslation()
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-zinc-200/60 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-800 truncate">
            {t('landing.heroPreview.dashboard', 'Dashboard')}
          </span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-zinc-400 flex-shrink-0 whitespace-nowrap">
          {t('landing.heroPreview.thisMonth', 'This month')}
        </span>
      </div>
      
      {/* KPIs - Compact grid */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
        <div className="bg-purple-50/60 rounded-lg p-1.5 sm:p-2 min-w-0">
          <div className="text-base sm:text-lg font-bold text-purple-700 leading-none">12</div>
          <div className="text-[9px] sm:text-[10px] text-zinc-500 leading-tight mt-0.5 truncate">
            {t('landing.heroPreview.sessions', 'Sessions')}
          </div>
        </div>
        <div className="bg-zinc-50 rounded-lg p-1.5 sm:p-2 min-w-0">
          <div className="text-base sm:text-lg font-bold text-zinc-700 leading-none">3</div>
          <div className="text-[9px] sm:text-[10px] text-zinc-500 leading-tight mt-0.5 truncate">
            {t('landing.heroPreview.roles', 'Roles')}
          </div>
        </div>
      </div>
      
      {/* Sparkline - Compact */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-shrink">
          <div className="text-[9px] sm:text-[10px] text-zinc-400 leading-tight truncate">
            {t('landing.heroPreview.trend', 'Trend')}
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-2.5 h-2.5 text-purple-500 flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium text-purple-600">+18%</span>
          </div>
        </div>
        <SparklineChart className="w-12 sm:w-16 h-6 sm:h-7" />
      </div>
    </div>
  )
}

/** Live Interview Card - Compact with fixed audio container */
const LiveInterviewCard: React.FC<{ 
  languageLabel: string
  isAnimated: boolean 
}> = ({ languageLabel, isAnimated }) => {
  const { t } = useTranslation()
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-zinc-200/60 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-800 truncate">
            {t('landing.heroPreview.interview', 'Interview')}
          </span>
        </div>
        {/* Recording pill - compact */}
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[9px] sm:text-[10px] font-medium flex-shrink-0 whitespace-nowrap">
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-500 animate-pulse flex-shrink-0" />
          {t('landing.heroPreview.live', 'Live')}
        </span>
      </div>
      
      {/* Audio Visualizer - Fixed height */}
      <div className="bg-gradient-to-r from-purple-50/80 to-zinc-50/80 rounded-lg p-2 sm:p-2.5 mb-2">
        <AudioVisualizer isAnimated={isAnimated} />
      </div>
      
      {/* Next Question - Compact with line clamp */}
      <div className="bg-zinc-50/80 rounded-lg p-1.5 sm:p-2 mb-2 min-w-0">
        <div className="text-[9px] sm:text-[10px] text-zinc-400 mb-0.5 truncate">
          {t('landing.heroPreview.next', 'Next:')}
        </div>
        <p className="text-[10px] sm:text-xs text-zinc-700 leading-snug line-clamp-2">
          {t('landing.heroPreview.question', '"Tell me about a challenge..."')}
        </p>
      </div>
      
      {/* Language Badge */}
      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-500 min-w-0">
        <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
        <span className="truncate">{languageLabel}</span>
      </div>
    </div>
  )
}

/** Scorecard Card - Compact rubrics */
const ScorecardCard: React.FC = () => {
  const { t } = useTranslation()
  
  const rubrics = [
    { name: t('landing.heroPreview.comm', 'Communication'), score: 85, time: '2:14' },
    { name: t('landing.heroPreview.problem', 'Problem Solving'), score: 72, time: '5:32' },
    { name: t('landing.heroPreview.fit', 'Role Fit'), score: 90, time: '8:45' },
  ]
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-zinc-200/60 p-2.5 sm:p-3 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-800 truncate">
            {t('landing.heroPreview.scorecard', 'Scorecard')}
          </span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-zinc-400 flex-shrink-0 whitespace-nowrap">
          {t('landing.heroPreview.evidence', 'Evidence')}
        </span>
      </div>
      
      {/* Rubric Rows - Compact */}
      <div className="space-y-1.5 mb-2">
        {rubrics.map((rubric, i) => (
          <div key={i} className="flex items-center gap-1.5 min-w-0">
            <span className="text-[9px] sm:text-[10px] text-zinc-600 w-16 sm:w-20 truncate flex-shrink-0">
              {rubric.name}
            </span>
            <div className="flex-1 h-1 sm:h-1.5 bg-zinc-100 rounded-full overflow-hidden min-w-0">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${rubric.score}%` }}
              />
            </div>
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-purple-50 text-purple-600 rounded text-[8px] sm:text-[9px] font-medium flex-shrink-0 whitespace-nowrap">
              <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              {rubric.time}
            </span>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-500 pt-1.5 border-t border-zinc-100 min-w-0">
        <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-500 flex-shrink-0" />
        <span className="truncate">{t('landing.heroPreview.evidenceIncl', 'Evidence included')}</span>
      </div>
    </div>
  )
}

/** Composed Preview (fallback UI) - Responsive grid */
const ComposedPreview: React.FC<{ 
  languageLabel: string
  isAnimated: boolean 
}> = ({ languageLabel, isAnimated }) => {
  const { t } = useTranslation()
  
  return (
    <div className="relative w-full h-full min-w-0 overflow-hidden">
      {/* Background with mesh gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 via-white to-zinc-50 rounded-xl" />
      <div 
        className="absolute inset-0 opacity-20 rounded-xl"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 40%)`
        }}
        aria-hidden="true"
      />
      
      {/* Content */}
      <div className="relative h-full flex flex-col p-2.5 sm:p-4">
        {/* Top Badge - Compact */}
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
            <span className="text-[10px] sm:text-xs font-medium text-purple-700 truncate">
              {t('landing.heroPreview.preview', 'Preview')}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600 text-white rounded-full text-[9px] sm:text-[10px] font-semibold shadow-sm flex-shrink-0 whitespace-nowrap">
            <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" aria-hidden="true" />
            {t('landing.heroPreview.beta', 'Beta')}
          </span>
        </div>
        
        {/* Cards Grid - Responsive with flex-grow */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 min-w-0 overflow-hidden">
          <div className="min-w-0">
            <DashboardCard />
          </div>
          <div className="min-w-0">
            <LiveInterviewCard 
              languageLabel={languageLabel} 
              isAnimated={isAnimated} 
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1 min-w-0">
            <ScorecardCard />
          </div>
        </div>
        
        {/* Bottom info strip - Compact */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2 sm:mt-3 pt-2 border-t border-purple-100/40">
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-500">
            <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{t('landing.heroPreview.langs', '7 languages')}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-500">
            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{t('landing.heroPreview.rubrics', 'Rubrics')}</span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-zinc-500">
            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-400 flex-shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">{t('landing.heroPreview.insights', 'Insights')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export const HeroPreview: React.FC<HeroPreviewProps> = ({
  imageSrc = '',
  title = 'Vocaid Dashboard Preview',
  preferredLanguageLabel,
}) => {
  const { i18n } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  // Determine language label - shorter for compact display
  const languageLabel = preferredLanguageLabel || 
    (i18n.language === 'pt' ? 'Português' : 
     i18n.language === 'es' ? 'Español' : 
     i18n.language === 'fr' ? 'Français' :
     i18n.language === 'de' ? 'Deutsch' :
     i18n.language === 'it' ? 'Italiano' :
     i18n.language === 'ja' ? '日本語' :
     'English')

  // Preload image
  useEffect(() => {
    if (!imageSrc) {
      setImageFailed(true)
      return
    }

    const img = new Image()
    img.onload = () => {
      setImageLoaded(true)
      setImageFailed(false)
    }
    img.onerror = () => {
      setImageLoaded(false)
      setImageFailed(true)
    }
    img.src = imageSrc
  }, [imageSrc])

  const isAnimated = !prefersReducedMotion

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: isAnimated ? 0.5 : 0.2, delay: isAnimated ? 0.2 : 0 }}
      className={`relative group w-full max-w-full min-w-0 ${
        isAnimated ? 'hover:-translate-y-1 transition-transform duration-300 ease-out' : ''
      }`}
    >
      {/* Outer glow on hover */}
      <div 
        className={`absolute -inset-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 rounded-2xl blur-xl transition-opacity duration-500 ${
          isAnimated ? 'opacity-0 group-hover:opacity-15' : 'opacity-0'
        }`}
        aria-hidden="true"
      />
      
      {/* Main container with gradient border */}
      <div className={`relative rounded-2xl bg-gradient-to-r from-purple-400 via-purple-600 to-purple-400 p-[2px] shadow-lg transition-shadow duration-300 ${
        isAnimated ? 'group-hover:shadow-xl group-hover:shadow-purple-200/50' : ''
      }`}>
        {/* Inner container */}
        <div className="relative rounded-[14px] bg-gradient-to-br from-white via-zinc-50 to-purple-50/20 overflow-hidden">
          {/* Aspect ratio wrapper - responsive */}
          <div className="aspect-[4/3] sm:aspect-[16/11] lg:aspect-[16/10]">
            {/* Show image if loaded successfully */}
            {imageLoaded && !imageFailed ? (
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              /* Show composed preview as fallback */
              <ComposedPreview 
                languageLabel={languageLabel}
                isAnimated={isAnimated}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* CSS for audio bar animation */}
      <style>{`
        @keyframes audioBar {
          0%, 100% {
            transform: scaleY(0.35);
          }
          50% {
            transform: scaleY(1);
          }
        }
        
        .animate-audio-bar {
          animation: audioBar 0.9s ease-in-out infinite;
          transform-origin: bottom;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-audio-bar {
            animation: none;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.div>
  )
}

export default HeroPreview
