/**
 * AnalysisDashboard Component
 * Advanced post-interview analytics with Sentiment Timeline and Soft Skills Radar Chart
 * 
 * Design: Vocaid system (grayscale + purple-600, typography-driven, no icons)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ========================================
// TYPES
// ========================================

export interface TimelineDataPoint {
  timestamp: number; // seconds from start
  confidence: number; // 0-100
  tone: number; // 0-100 (positive sentiment)
  pace: number; // words per minute normalized to 0-100
}

export interface SoftSkillsData {
  communication: number; // 0-100
  problemSolving: number; // 0-100
  technicalDepth: number; // 0-100
  leadership: number; // 0-100
  adaptability: number; // 0-100
}

interface AnalysisDashboardProps {
  timelineData: TimelineDataPoint[];
  softSkills: SoftSkillsData;
  callDuration?: number; // in seconds
}

// ========================================
// SENTIMENT & PACE TIMELINE COMPONENT
// ========================================

type TFunction = ReturnType<typeof useTranslation>['t'];

const SentimentTimeline: React.FC<{ data: TimelineDataPoint[]; duration: number; t: TFunction }> = ({ 
  data, 
  duration,
  t
}) => {
  const chartHeight = 200;
  
  // Normalize data points to chart coordinates
  const normalizedData = useMemo(() => {
    if (data.length === 0) return { confidence: '', tone: '', pace: '' };
    
    const createPath = (key: keyof TimelineDataPoint) => {
      if (key === 'timestamp') return '';
      return data
        .map((point, i) => {
          const x = (point.timestamp / duration) * 100;
          const y = 100 - point[key];
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');
    };
    
    return {
      confidence: createPath('confidence'),
      tone: createPath('tone'),
      pace: createPath('pace')
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, duration]);

  // Format time for axis labels
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate time axis labels
  const timeLabels = useMemo(() => {
    const labels = [];
    const interval = Math.max(60, Math.floor(duration / 5)); // At least 1 minute intervals
    for (let t = 0; t <= duration; t += interval) {
      labels.push({ time: t, label: formatTime(t), x: (t / duration) * 100 });
    }
    return labels;
  }, [duration]);

  if (data.length === 0) {
    return (
      <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl">
        <h3 className="text-lg font-bold text-zinc-900 mb-4">{t('analytics.sentimentTimeline.title')}</h3>
        <div className="text-center py-12">
          <p className="text-zinc-500 font-medium">{t('analytics.sentimentTimeline.noData')}</p>
          <p className="text-sm text-zinc-400 mt-1">{t('analytics.sentimentTimeline.noDataDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl"
    >
      <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('analytics.sentimentTimeline.title')}</h3>
      <p className="text-sm text-zinc-500 mb-6">{t('analytics.sentimentTimeline.description')}</p>
      
      {/* Chart Container */}
      <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-5 pointer-events-none">
          {[100, 75, 50, 25, 0].map((value) => (
            <div key={value} className="flex items-center w-full">
              <span className="text-xs font-mono text-zinc-400 w-8 text-right pr-2">{value}</span>
              <div className="flex-1 border-t border-zinc-200" />
            </div>
          ))}
        </div>
        
        {/* SVG Chart */}
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pl-10 pr-4 py-5"
          style={{ overflow: 'visible' }}
        >
          {/* Confidence Line (Primary - Purple) */}
          <motion.path
            d={normalizedData.confidence}
            fill="none"
            stroke="#9333ea"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
          
          {/* Tone Line (Secondary - Gray 600) */}
          <motion.path
            d={normalizedData.tone}
            fill="none"
            stroke="#52525b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="4 2"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
          />
          
          {/* Pace Line (Tertiary - Gray 400) */}
          <motion.path
            d={normalizedData.pace}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.4 }}
          />
        </svg>
        
        {/* X-axis time labels */}
        <div className="absolute bottom-0 left-10 right-4 flex justify-between">
          {timeLabels.map(({ time, label }) => (
            <span key={time} className="text-xs font-mono text-zinc-400">{label}</span>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-purple-600 rounded-full" />
          <span className="text-sm font-medium text-zinc-700">{t('analytics.sentimentTimeline.legend.confidence')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-zinc-600 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #52525b 0, #52525b 4px, transparent 4px, transparent 6px)' }} />
          <span className="text-sm font-medium text-zinc-700">{t('analytics.sentimentTimeline.legend.tone')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-zinc-400 rounded-full" />
          <span className="text-sm font-medium text-zinc-700">{t('analytics.sentimentTimeline.legend.pace')}</span>
        </div>
      </div>
    </motion.div>
  );
};

// ========================================
// SOFT SKILLS RADAR CHART COMPONENT
// ========================================

const SKILL_KEYS = ['communication', 'problemSolving', 'technicalDepth', 'leadership', 'adaptability'] as const;

const SoftSkillsRadar: React.FC<{ skills: SoftSkillsData; t: TFunction }> = ({ skills, t }) => {
  
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 100;
  const levels = 4;
  
  // Calculate polygon points for the skill values
  const skillPoints = useMemo(() => {
    const angleStep = (2 * Math.PI) / SKILL_KEYS.length;
    const startAngle = -Math.PI / 2; // Start from top
    
    return SKILL_KEYS.map((key, i) => {
      const angle = startAngle + i * angleStep;
      const value = skills[key] / 100;
      const radius = value * maxRadius;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        labelX: centerX + (maxRadius + 25) * Math.cos(angle),
        labelY: centerY + (maxRadius + 25) * Math.sin(angle),
        label: t(`analytics.softSkills.skills.${key}`),
        key,
        value: skills[key]
      };
    });
  }, [skills, t]);
  
  // Create polygon path
  const polygonPath = skillPoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ') + ' Z';
  
  // Create grid lines
  const gridPaths = useMemo(() => {
    const paths = [];
    const angleStep = (2 * Math.PI) / SKILL_KEYS.length;
    const startAngle = -Math.PI / 2;
    
    // Concentric pentagons
    for (let level = 1; level <= levels; level++) {
      const radius = (level / levels) * maxRadius;
      const points = SKILL_KEYS.map((_, i) => {
        const angle = startAngle + i * angleStep;
        return `${i === 0 ? 'M' : 'L'} ${centerX + radius * Math.cos(angle)} ${centerY + radius * Math.sin(angle)}`;
      }).join(' ') + ' Z';
      paths.push({ path: points, level });
    }
    
    // Radial lines from center
    const radialLines = SKILL_KEYS.map((_, i) => {
      const angle = startAngle + i * angleStep;
      return {
        x1: centerX,
        y1: centerY,
        x2: centerX + maxRadius * Math.cos(angle),
        y2: centerY + maxRadius * Math.sin(angle)
      };
    });
    
    return { polygons: paths, radials: radialLines };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
      className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl"
    >
      <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('analytics.softSkills.title')}</h3>
      <p className="text-sm text-zinc-500 mb-6">{t('analytics.softSkills.description')}</p>
      
      <div className="flex justify-center">
        <svg viewBox="0 0 300 300" className="w-full max-w-[300px]">
          {/* Grid - Concentric pentagons */}
          {gridPaths.polygons.map(({ path, level }) => (
            <path
              key={level}
              d={path}
              fill="none"
              stroke="#e4e4e7"
              strokeWidth="1"
            />
          ))}
          
          {/* Grid - Radial lines */}
          {gridPaths.radials.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#e4e4e7"
              strokeWidth="1"
            />
          ))}
          
          {/* Skill area fill */}
          <motion.path
            d={polygonPath}
            fill="rgba(147, 51, 234, 0.2)"
            stroke="#9333ea"
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          />
          
          {/* Skill points */}
          {skillPoints.map((point, i) => (
            <motion.circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#9333ea"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
            />
          ))}
          
          {/* Labels */}
          {skillPoints.map((point, i) => (
            <text
              key={i}
              x={point.labelX}
              y={point.labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium fill-zinc-700"
              style={{ fontSize: '11px' }}
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
      
      {/* Skill scores list */}
      <div className="mt-6 pt-4 border-t border-zinc-200 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SKILL_KEYS.map((key) => (
          <div key={key} className="text-center">
            <p className="text-2xl font-bold text-purple-600">{skills[key]}</p>
            <p className="text-xs text-zinc-500 mt-1">{t(`analytics.softSkills.skills.${key}`)}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ========================================
// MAIN ANALYSIS DASHBOARD COMPONENT
// ========================================

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  timelineData,
  softSkills,
  callDuration = 600 // default 10 minutes
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="mb-2">
        <h2 className="text-xl font-bold text-zinc-900">{t('analytics.advancedAnalytics.title')}</h2>
        <p className="text-sm text-zinc-500 mt-1">{t('analytics.advancedAnalytics.description')}</p>
      </div>
      
      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentTimeline data={timelineData} duration={callDuration} t={t} />
        <SoftSkillsRadar skills={softSkills} t={t} />
      </div>
    </div>
  );
};

export default AnalysisDashboard;
