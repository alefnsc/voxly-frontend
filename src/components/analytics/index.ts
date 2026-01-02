/**
 * Analytics Components Index
 * Exports all analytics-related components for InterviewDetails page
 */

// Import types for use in this file
import type { TimelineDataPoint, SoftSkillsData } from './AnalysisDashboard';
import type { TranscriptSegment } from './TranscriptViewer';
import type { BenchmarkData } from './ComparativeBenchmark';
import type { StudyTopic, WeakArea, LearningPathData } from './LearningPath';

// Export components
export { default as AnalysisDashboard } from './AnalysisDashboard';
export { default as TranscriptViewer } from './TranscriptViewer';
export { default as ComparativeBenchmark } from './ComparativeBenchmark';
export { default as LearningPath } from './LearningPath';

// Re-export types
export type { TimelineDataPoint, SoftSkillsData };
export type { TranscriptSegment };
export type { BenchmarkData };
export type { StudyTopic, WeakArea, LearningPathData };

// Convenience type aliases for InterviewDetails page usage
export interface AnalyticsData {
  timelineData: TimelineDataPoint[];
  softSkills: SoftSkillsData;
  callDuration?: number;
}

export interface Recommendation {
  id: string;
  topic: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  resources?: string[];
  estimatedTime?: string;
}

// ========================================
// NEW: Reusable Charts & Filters
// ========================================

// Charts
export {
  PerformanceLineChart,
  PerformanceAreaChart,
  ScoreDistributionChart,
  CompetencyRadarChart,
  ComparisonLineChart,
} from './Charts';

export type { ChartDataPoint, ChartConfig } from './Charts';

// Filters
export {
  AnalyticsFilters,
  useAnalyticsFilters,
} from './AnalyticsFilters';

export type {
  AnalyticsFiltersState,
  AnalyticsFiltersProps,
  DateRangePeriod,
  FilterOption,
} from './AnalyticsFilters';
