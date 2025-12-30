/**
 * Analytics Filters Component
 * 
 * Reusable filter controls for analytics dashboards:
 * - Date range (Weekly, Monthly, Yearly)
 * - Role filter
 * - Resume filter
 * - Custom date range picker
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, ChevronDown, X, Filter } from 'lucide-react';

// ========================================
// TYPES
// ========================================

export type DateRangePeriod = 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface AnalyticsFiltersState {
  period: DateRangePeriod;
  startDate?: Date;
  endDate?: Date;
  role?: string;
  resumeId?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface AnalyticsFiltersProps {
  filters: AnalyticsFiltersState;
  onFiltersChange: (filters: AnalyticsFiltersState) => void;
  roles?: FilterOption[];
  resumes?: FilterOption[];
  showRoleFilter?: boolean;
  showResumeFilter?: boolean;
  className?: string;
}

// ========================================
// CONSTANTS
// ========================================

const PERIOD_OPTIONS: Array<{ value: DateRangePeriod; labelKey: string }> = [
  { value: 'weekly', labelKey: 'analyticsFilters.last7Days' },
  { value: 'monthly', labelKey: 'analyticsFilters.last30Days' },
  { value: 'yearly', labelKey: 'analyticsFilters.last12Months' },
];

// ========================================
// COMPONENT
// ========================================

export function AnalyticsFilters({
  filters,
  onFiltersChange,
  roles = [],
  resumes = [],
  showRoleFilter = true,
  showResumeFilter = false,
  className = '',
}: AnalyticsFiltersProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasActiveFilters = filters.role || filters.resumeId;
  const activeFilterCount = [filters.role, filters.resumeId].filter(Boolean).length;

  const handlePeriodChange = (period: DateRangePeriod) => {
    onFiltersChange({ ...filters, period });
  };

  const handleRoleChange = (role: string) => {
    onFiltersChange({ ...filters, role: role || undefined });
  };

  const handleResumeChange = (resumeId: string) => {
    onFiltersChange({ ...filters, resumeId: resumeId || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({
      period: filters.period,
      role: undefined,
      resumeId: undefined,
    });
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handlePeriodChange(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filters.period === option.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-gray-200" />

        {/* Filter Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            hasActiveFilters
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Filter className="h-4 w-4" />
          {t('analyticsFilters.filters')}
          {activeFilterCount > 0 && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
            {t('analyticsFilters.clear')}
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
          {/* Role Filter */}
          {showRoleFilter && roles.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('analyticsFilters.role')}
              </label>
              <select
                value={filters.role || ''}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('analyticsFilters.allRoles')}</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resume Filter */}
          {showResumeFilter && resumes.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('analyticsFilters.resume')}
              </label>
              <select
                value={filters.resumeId || ''}
                onChange={(e) => handleResumeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">{t('analyticsFilters.allResumes')}</option>
                {resumes.map((resume) => (
                  <option key={resume.value} value={resume.value}>
                    {resume.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range (for custom period) */}
          {filters.period === 'custom' && (
            <>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('analyticsFilters.startDate')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.startDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        startDate: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('analyticsFilters.endDate')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        endDate: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ========================================
// HOOKS
// ========================================

/**
 * Hook to manage analytics filter state
 */
export function useAnalyticsFilters(initialFilters?: Partial<AnalyticsFiltersState>) {
  const [filters, setFilters] = React.useState<AnalyticsFiltersState>({
    period: 'monthly',
    ...initialFilters,
  });

  const updateFilters = React.useCallback((newFilters: AnalyticsFiltersState) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters({ period: 'monthly' });
  }, []);

  // Calculate date range based on period
  const dateRange = React.useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (filters.period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = filters.startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = filters.endDate || now;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    dateRange,
  };
}

export default AnalyticsFilters;
