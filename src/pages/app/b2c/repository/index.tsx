/**
 * Interview Repository Page
 * 
 * Unified interview history with advanced filtering, sorting, and analytics.
 * Displays all user interviews with the ability to filter by date, role,
 * seniority, status, and score range.
 * 
 * @module pages/app/b2c/repository
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DefaultLayout } from 'components/default-layout';
import { useDashboardData } from 'hooks/use-dashboard-data';
import { useAuthCheck } from 'hooks/use-auth-check';
import Loading from 'components/loading';
import PurpleButton from 'components/ui/purple-button';
import {
  Plus,
  ChevronRight,
  Calendar,
  Clock,
  Briefcase,
  Filter,
  X,
  Search,
  RefreshCw,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  Globe2
} from 'lucide-react';

// ========================================
// TYPES
// ========================================

type SortOption = 'newest' | 'oldest' | 'highestScore' | 'lowestScore';
type DateFilter = 'all' | '7days' | '30days' | '90days';
type StatusFilter = 'all' | 'COMPLETED' | 'PENDING' | 'IN_PROGRESS' | 'FAILED';

interface FilterState {
  dateRange: DateFilter;
  role: string;
  seniority: string;
  status: StatusFilter;
  minScore: number | null;
  maxScore: number | null;
  searchQuery: string;
}

// Normalized interview type for consistent UI rendering
interface NormalizedInterview {
  id: string;
  roleTitle: string;
  companyName: string;
  createdAt: string;
  callDuration: number | null;
  score: number | null;
  status: string;
  seniority: string | null;
  language: string | null;
  hasFeedback: boolean;
}

// ========================================
// NORMALIZER FUNCTION
// ========================================

/**
 * Normalize interview data from API to consistent UI model
 * Handles various field naming conventions from backend
 */
function normalizeInterview(raw: any): NormalizedInterview {
  // Dev-only diagnostic for first interview
  if (process.env.NODE_ENV === 'development' && !normalizeInterview._logged) {
    console.log('[InterviewRepository] Raw interview keys:', Object.keys(raw));
    console.log('[InterviewRepository] Normalized:', {
      roleTitle: raw.jobTitle || raw.position || raw.role || raw.title || '—',
      companyName: raw.companyName || raw.company || raw.targetCompany || '—',
    });
    normalizeInterview._logged = true;
  }

  return {
    id: raw.id,
    // Normalize role title - check multiple possible field names
    roleTitle: raw.jobTitle || raw.position || raw.role || raw.title || raw.metadata?.roleTitle || '',
    // Normalize company name - check multiple possible field names
    companyName: raw.companyName || raw.company || raw.targetCompany || raw.metadata?.companyName || '',
    createdAt: raw.createdAt,
    callDuration: raw.callDuration ?? raw.duration ?? null,
    score: raw.score ?? raw.overallScore ?? null,
    status: (raw.status || 'PENDING').toUpperCase(),
    seniority: raw.seniority || null,
    language: raw.language || null,
    hasFeedback: raw.hasFeedback ?? false,
  };
}
// Static flag for dev logging
normalizeInterview._logged = false;

// ========================================
// CONSTANTS
// ========================================

const SENIORITY_OPTIONS = [
  { value: '', label: 'All Levels' },
  { value: 'Intern', label: 'Intern' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Mid', label: 'Mid-Level' },
  { value: 'Senior', label: 'Senior' },
  { value: 'Staff', label: 'Staff' },
  { value: 'Principal', label: 'Principal' },
  { value: 'Manager', label: 'Manager' },
];

const DATE_FILTER_OPTIONS = [
  { value: 'all', labelKey: 'interviews.repository.filters.allTime' },
  { value: '7days', labelKey: 'interviews.repository.filters.last7Days' },
  { value: '30days', labelKey: 'interviews.repository.filters.last30Days' },
  { value: '90days', labelKey: 'interviews.repository.filters.last90Days' },
];

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'newest', labelKey: 'interviews.repository.sort.newest' },
  { value: 'oldest', labelKey: 'interviews.repository.sort.oldest' },
  { value: 'highestScore', labelKey: 'interviews.repository.sort.highestScore' },
  { value: 'lowestScore', labelKey: 'interviews.repository.sort.lowestScore' },
];

// ========================================
// HELPER COMPONENTS
// ========================================

const ScoreBadge: React.FC<{ score: number | null }> = ({ score }) => {
  if (score === null || score === undefined) {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-zinc-100 text-zinc-600">
        N/A
      </span>
    );
  }
  
  // Semantic colors for scores: green (excellent), amber (good), red (needs work)
  // These indicate performance quality, not brand colors
  let badgeClass = 'bg-red-100 text-red-700';
  if (score >= 80) badgeClass = 'bg-emerald-100 text-emerald-700';
  else if (score >= 60) badgeClass = 'bg-amber-100 text-amber-700';
  else if (score >= 40) badgeClass = 'bg-amber-100 text-amber-700';
  
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badgeClass}`}>
      {Math.round(score)}%
    </span>
  );
};

// Note: StatusBadge is defined for future use in interview cards
const _StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  
  // Keep semantic colors for status (completed=green, pending=amber, failed=red)
  // These are functional status indicators, not brand colors
  const config = {
    COMPLETED: { icon: CheckCircle, class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PENDING: { icon: Clock, class: 'bg-amber-50 text-amber-700 border-amber-200' },
    IN_PROGRESS: { icon: Loader2, class: 'bg-purple-50 text-purple-700 border-purple-200' },
    FAILED: { icon: AlertCircle, class: 'bg-red-50 text-red-700 border-red-200' },
  }[status] || { icon: Clock, class: 'bg-zinc-50 text-zinc-600 border-zinc-200' };
  
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border ${config.class}`}>
      <Icon className={`w-3 h-3 ${status === 'IN_PROGRESS' ? 'animate-spin' : ''}`} />
      {t(`interviews.repository.status.${status.toLowerCase().replace('_', '')}`, status)}
    </span>
  );
};

interface FilterPillProps {
  label: string;
  onRemove: () => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ label, onRemove }) => (
  <motion.span
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.9, opacity: 0 }}
    className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
  >
    {label}
    <button
      onClick={onRemove}
      className="p-0.5 hover:bg-purple-100 rounded-full transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </motion.span>
);

// ========================================
// MAIN COMPONENT
// ========================================

export default function InterviewRepository() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isSignedIn, isLoaded } = useUser();
  const { userCredits } = useAuthCheck();
  
  // Fetch all interviews (larger limit for repository view)
  const { data: dashboardData, isLoading: dashboardLoading, refresh } = useDashboardData(100);
  const { interviews: rawInterviews } = dashboardData;
  
  // Normalize interviews for consistent field access
  const interviews = useMemo(() => rawInterviews.map(normalizeInterview), [rawInterviews]);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    role: '',
    seniority: '',
    status: 'all',
    minScore: null,
    maxScore: null,
    searchQuery: '',
  });
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Extract unique roles from interviews for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    interviews.forEach(i => {
      if (i.roleTitle) roles.add(i.roleTitle);
    });
    return Array.from(roles).sort();
  }, [interviews]);
  
  // Filter interviews
  const filteredInterviews = useMemo(() => {
    let result = [...interviews];
    
    // Date filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = filters.dateRange === '7days' ? 7 : filters.dateRange === '30days' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      result = result.filter(i => new Date(i.createdAt) >= cutoff);
    }
    
    // Role filter
    if (filters.role) {
      result = result.filter(i => i.roleTitle === filters.role);
    }
    
    // Seniority filter
    if (filters.seniority) {
      result = result.filter(i => i.seniority === filters.seniority);
    }
    
    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(i => i.status === filters.status);
    }
    
    // Score filter
    if (filters.minScore !== null) {
      result = result.filter(i => {
        const score = i.score;
        return score !== null && score >= filters.minScore!;
      });
    }
    if (filters.maxScore !== null) {
      result = result.filter(i => {
        const score = i.score;
        return score !== null && score <= filters.maxScore!;
      });
    }
    
    // Search query
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(i =>
        i.roleTitle?.toLowerCase().includes(query) ||
        i.companyName?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      const scoreA = a.score ?? 0;
      const scoreB = b.score ?? 0;
      
      switch (sortBy) {
        case 'newest': return dateB - dateA;
        case 'oldest': return dateA - dateB;
        case 'highestScore': return scoreB - scoreA;
        case 'lowestScore': return scoreA - scoreB;
        default: return dateB - dateA;
      }
    });
    
    return result;
  }, [interviews, filters, sortBy]);
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange !== 'all') count++;
    if (filters.role) count++;
    if (filters.seniority) count++;
    if (filters.status !== 'all') count++;
    if (filters.minScore !== null || filters.maxScore !== null) count++;
    if (filters.searchQuery.trim()) count++;
    return count;
  }, [filters]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const completedInterviews = filteredInterviews.filter(i => i.status === 'COMPLETED');
    const scores = completedInterviews
      .map(i => i.score)
      .filter((s): s is number => s !== null && s !== undefined);
    
    const totalDuration = filteredInterviews.reduce((acc, i) => {
      const duration = i.callDuration ?? 0;
      return acc + (typeof duration === 'number' ? duration : 0);
    }, 0);
    
    return {
      total: filteredInterviews.length,
      avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      totalTime: Math.round(totalDuration / 1000 / 60), // Convert to minutes
    };
  }, [filteredInterviews]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: 'all',
      role: '',
      seniority: '',
      status: 'all',
      minScore: null,
      maxScore: null,
      searchQuery: '',
    });
  }, []);
  
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh(true);
    setIsRefreshing(false);
  }, [refresh]);
  
  // Format helpers
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '0 min';
    const mins = Math.floor(ms / 1000 / 60);
    return `${mins} min`;
  };
  
  // Check if recently completed (within 24h)
  const isRecentInterview = (createdAt: string): boolean => {
    const interviewDate = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - interviewDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };
  
  // Redirect if not authenticated
  if (isLoaded && !isSignedIn) {
    navigate('/');
    return null;
  }
  
  if (!isLoaded || dashboardLoading) {
    return (
      <DefaultLayout className="flex flex-col overflow-hidden bg-white">
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="flex flex-col overflow-hidden bg-zinc-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          {/* Mobile: CTA first */}
          {userCredits !== null && userCredits > 0 && (
            <div className="flex lg:hidden">
              <PurpleButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/interview-setup')}
                className="w-full justify-center"
              >
                <Plus className="w-5 h-5" />
                {t('interviews.startNew')}
              </PurpleButton>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900">
                {t('interviews.repository.title')} <span className="text-purple-600">{t('interviews.repository.titleHighlight')}</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 mt-1">
                {t('interviews.repository.subtitle')}
              </p>
            </div>
            
            {/* Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-white rounded-lg border border-zinc-200 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                title={t('common.refreshData')}
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {userCredits !== null && userCredits > 0 && (
                <PurpleButton
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/interview-setup')}
                >
                  <Plus className="w-5 h-5" />
                  {t('interviews.startNew')}
                </PurpleButton>
              )}
            </div>
          </div>
        </div>
        
        {/* Stats Summary - 3 columns on all screen sizes */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg flex-shrink-0">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-zinc-500 truncate">{t('interviews.repository.stats.total')}</p>
                <p className="text-lg sm:text-2xl font-bold text-zinc-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg flex-shrink-0">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-zinc-500 truncate">{t('interviews.repository.stats.avgScore')}</p>
                <p className="text-lg sm:text-2xl font-bold text-zinc-900">
                  {stats.avgScore !== null ? `${stats.avgScore}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-zinc-500 truncate">{t('interviews.repository.stats.totalTime')}</p>
                <p className="text-lg sm:text-2xl font-bold text-zinc-900">{stats.totalTime} min</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filters Bar */}
        <div className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={filters.searchQuery}
                onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px]"
              />
            </div>
            
            {/* Quick Filters - Scrollable on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
              {/* Date Filter */}
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value as DateFilter }))}
                className="flex-shrink-0 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
              >
                {DATE_FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                ))}
              </select>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-shrink-0 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                ))}
              </select>
              
              {/* More Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  showFilters || activeFilterCount > 0
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.filters')}</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              
              {/* Mobile Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-shrink-0 lg:hidden p-2.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px]"
                title={t('common.refreshData')}
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex-shrink-0 px-3 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 transition-colors whitespace-nowrap min-h-[44px]"
                >
                  {t('interviews.repository.filters.clearFilters')}
                </button>
              )}
            </div>
          </div>
          
          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Role Filter */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                      {t('interviews.repository.filters.role')}
                    </label>
                    <select
                      value={filters.role}
                      onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    >
                      <option value="">{t('dashboard.filters.allRoles')}</option>
                      {uniqueRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Seniority Filter */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                      {t('interviews.repository.filters.seniority')}
                    </label>
                    <select
                      value={filters.seniority}
                      onChange={(e) => setFilters(f => ({ ...f, seniority: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    >
                      {SENIORITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                      {t('interviews.repository.filters.status')}
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as StatusFilter }))}
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                    >
                      <option value="all">{t('interviews.repository.filters.all')}</option>
                      <option value="COMPLETED">{t('interviews.repository.status.completed')}</option>
                      <option value="PENDING">{t('interviews.repository.status.pending')}</option>
                      <option value="IN_PROGRESS">{t('interviews.repository.status.inProgress')}</option>
                    </select>
                  </div>
                  
                  {/* Score Range */}
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                      {t('interviews.repository.filters.score')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Min"
                        value={filters.minScore ?? ''}
                        onChange={(e) => setFilters(f => ({ 
                          ...f, 
                          minScore: e.target.value ? Number(e.target.value) : null 
                        }))}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                      />
                      <span className="text-zinc-400 flex-shrink-0">-</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Max"
                        value={filters.maxScore ?? ''}
                        onChange={(e) => setFilters(f => ({ 
                          ...f, 
                          maxScore: e.target.value ? Number(e.target.value) : null 
                        }))}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Active Filter Pills */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-zinc-100"
              >
                {filters.dateRange !== 'all' && (
                  <FilterPill
                    label={t(DATE_FILTER_OPTIONS.find(o => o.value === filters.dateRange)?.labelKey || '')}
                    onRemove={() => setFilters(f => ({ ...f, dateRange: 'all' }))}
                  />
                )}
                {filters.role && (
                  <FilterPill
                    label={filters.role}
                    onRemove={() => setFilters(f => ({ ...f, role: '' }))}
                  />
                )}
                {filters.seniority && (
                  <FilterPill
                    label={filters.seniority}
                    onRemove={() => setFilters(f => ({ ...f, seniority: '' }))}
                  />
                )}
                {filters.status !== 'all' && (
                  <FilterPill
                    label={t(`interviews.repository.status.${filters.status.toLowerCase().replace('_', '')}`)}
                    onRemove={() => setFilters(f => ({ ...f, status: 'all' }))}
                  />
                )}
                {(filters.minScore !== null || filters.maxScore !== null) && (
                  <FilterPill
                    label={`Score: ${filters.minScore ?? 0}% - ${filters.maxScore ?? 100}%`}
                    onRemove={() => setFilters(f => ({ ...f, minScore: null, maxScore: null }))}
                  />
                )}
                {filters.searchQuery.trim() && (
                  <FilterPill
                    label={`"${filters.searchQuery}"`}
                    onRemove={() => setFilters(f => ({ ...f, searchQuery: '' }))}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Interview List */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {filteredInterviews.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4 sm:px-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 rounded-full bg-purple-50 flex items-center justify-center">
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 mb-2">
                {activeFilterCount > 0 
                  ? t('interviews.repository.empty.title')
                  : t('interviews.repository.empty.noInterviews')
                }
              </h3>
              <p className="text-sm sm:text-base text-zinc-500 mb-4 sm:mb-6 max-w-md mx-auto">
                {activeFilterCount > 0
                  ? t('interviews.repository.empty.description')
                  : t('interviews.repository.empty.startFirst')
                }
              </p>
              {activeFilterCount > 0 ? (
                <PurpleButton variant="outline" onClick={clearFilters}>
                  {t('interviews.repository.filters.clearFilters')}
                </PurpleButton>
              ) : userCredits !== null && userCredits > 0 ? (
                <PurpleButton variant="primary" onClick={() => navigate('/interview-setup')}>
                  <Plus className="w-4 h-4" />
                  {t('interviews.startFirst')}
                </PurpleButton>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {/* Table Header - Desktop only */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-3 bg-zinc-50 text-xs font-medium uppercase tracking-wider text-zinc-500">
                <div className="col-span-4">{t('interviews.positionAndCompany')}</div>
                <div className="col-span-2">{t('interviews.repository.card.seniority')}</div>
                <div className="col-span-2">{t('interviews.date')}</div>
                <div className="col-span-1">{t('interviews.duration')}</div>
                <div className="col-span-2">{t('interviews.score')}</div>
                <div className="col-span-1"></div>
              </div>

              {/* Interview Items */}
              {filteredInterviews.map((interview, index) => (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group cursor-pointer hover:bg-zinc-50 transition-colors active:bg-zinc-100"
                  onClick={() => navigate(`/interview/${interview.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/interview/${interview.id}`)}
                >
                  {/* Mobile Card Layout */}
                  <div className="lg:hidden p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-zinc-900">
                            {interview.roleTitle || t('interviews.repository.noRole', '—')}
                          </p>
                          {isRecentInterview(interview.createdAt) && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                              {t('interviews.new')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-zinc-500 mt-1">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{interview.companyName || t('interviews.repository.noCompany', '—')}</span>
                        </div>
                      </div>
                      <ScoreBadge score={interview.score} />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="px-2 py-0.5 bg-zinc-100 rounded font-medium">
                          {interview.seniority || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(interview.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(interview.callDuration)}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-purple-600 transition-colors flex-shrink-0" />
                    </div>
                  </div>
                  
                  {/* Desktop Table Row */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4">
                    {/* Position & Company */}
                    <div className="col-span-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-zinc-900 truncate">
                            {interview.roleTitle || t('interviews.repository.noRole', '—')}
                          </p>
                          {isRecentInterview(interview.createdAt) && (
                            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                              {t('interviews.new')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="truncate">{interview.companyName || t('interviews.repository.noCompany', '—')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Seniority */}
                    <div className="col-span-2 flex items-center gap-2 text-sm text-zinc-600">
                      <span className="px-2 py-0.5 bg-zinc-100 rounded text-xs font-medium">
                        {interview.seniority || 'N/A'}
                      </span>
                      {interview.language && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 rounded text-xs">
                          <Globe2 className="w-3 h-3" />
                          {interview.language}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="col-span-2 flex items-center text-sm text-zinc-600">
                      {formatDate(interview.createdAt)}
                    </div>

                    {/* Duration */}
                    <div className="col-span-1 flex items-center text-sm text-zinc-600">
                      {formatDuration(interview.callDuration)}
                    </div>

                    {/* Score */}
                    <div className="col-span-2 flex items-center gap-2">
                      <ScoreBadge score={interview.score} />
                      {interview.hasFeedback && (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="col-span-1 flex items-center justify-end">
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-purple-600 transition-colors" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Results Count */}
        {filteredInterviews.length > 0 && (
          <p className="text-center text-sm text-zinc-500 mt-4">
            Showing {filteredInterviews.length} of {interviews.length} interviews
          </p>
        )}
      </div>
    </DefaultLayout>
  );
}
