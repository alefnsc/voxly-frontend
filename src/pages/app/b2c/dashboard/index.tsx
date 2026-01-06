/**
 * B2C Dashboard - Interview Practice & Performance
 * 
 * Personal workspace for candidates to:
 * - View their credit balance (from real API)
 * - Start new practice interviews
 * - See recent interview history (from real API)
 * - Track performance trends
 * - View resume count (from real API)
 * - Skill breakdown analysis
 * - Weekly activity tracking
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from 'contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  History,
  ChevronRight,
  ChevronLeft,
  Target,
  Loader2,
  Clock,
  BarChart3,
  Minus,
  Upload,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import {
  MobileStartInterviewButton,
  DesktopStartInterviewButton,
  StartInterviewButton,
} from '../../../../components/start-interview-button';
import { PhoneVerificationCard } from './PhoneVerificationCard';
// SetPasswordModal removed - password is now set during onboarding for OAuth users
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useResumesQuery } from '../../../../hooks/queries/useResumeQueries';
import { useGraphQLQuery } from '../../../../hooks/queries/useGraphQLQuery';
import apiService, { PhoneVerificationStatus } from '../../../../services/APIService';
import { BUY_CREDITS_LINK } from 'utils/routing';

// Period filter options for performance trend chart
export type PeriodFilter = '1W' | '1M' | '6M' | 'ALL';

const PERIOD_OPTIONS: { value: PeriodFilter; labelKey: string; days: number | null }[] = [
  { value: '1W', labelKey: 'dashboard.periods.1w', days: 7 },
  { value: '1M', labelKey: 'dashboard.periods.1m', days: 30 },
  { value: '6M', labelKey: 'dashboard.periods.6m', days: 180 },
  { value: 'ALL', labelKey: 'dashboard.periods.all', days: null },
];

/**
 * Get start date for a period filter
 */
function getStartDateForPeriod(period: PeriodFilter): Date | null {
  if (period === 'ALL') return null;
  const now = new Date();
  const days = PERIOD_OPTIONS.find(p => p.value === period)?.days ?? 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Get the Monday 00:00:00.000 of the week containing the given date (local time)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // JavaScript: Sunday = 0, Monday = 1, etc.
  // We want Monday as start of week, so subtract (day === 0 ? 6 : day - 1) days
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the Sunday 23:59:59.999 of the week containing the given date (local time)
 */
function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Format week range for display (e.g., "Dec 16 - Dec 22")
 */
function formatWeekRange(weekStart: Date, i18nLang: string): string {
  const weekEnd = getWeekEnd(weekStart);
  const startStr = weekStart.toLocaleDateString(i18nLang, { month: 'short', day: 'numeric' });
  const endStr = weekEnd.toLocaleDateString(i18nLang, { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function B2CDashboard() {
  const { user } = useUser();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const firstName = user?.firstName || t('common.there');

  const [phoneStatus, setPhoneStatus] = useState<PhoneVerificationStatus | null>(null);
  const [trialStatus, setTrialStatus] = useState<{
    status: string;
    message?: string;
    data?: {
      trialCreditsClaimed: boolean;
      trialCreditsAmount: number;
      trialCreditsClaimedAt: string | null;
      currentBalance: number;
      canClaim: boolean;
      blockedReason: string | null;
    };
  } | null>(null);
  const [isLoadingTrialStatus, setIsLoadingTrialStatus] = useState(true);

  // Password requirement check removed - password is now set during onboarding for OAuth users

  // Period filter state for performance chart only
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('1M');

  // Role filter state for Skill Breakdown card only
  // 'all' = all roles, 'practice' = interviews with no role, otherwise exact roleTitle match
  const [skillRoleFilter, setSkillRoleFilter] = useState<string>('all');

  // Week navigation state for Weekly Activity widget
  // Default to current week (Monday 00:00:00.000 local time)
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => getWeekStart(new Date()));


  // Week navigation handlers
  const goToPreviousWeek = () => {
    setWeekStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setWeekStartDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  // Check if we're on the current week (disable "next" button if so)
  const isCurrentWeek = useMemo(() => {
    const currentWeekStart = getWeekStart(new Date());
    return weekStartDate.getTime() === currentWeekStart.getTime();
  }, [weekStartDate]);

  // Fetch real data from APIs with week filter for Weekly Activity
  const { data: resumes, isLoading: isLoadingResumes } = useResumesQuery();
  
  // Main dashboard query (for performance chart and other data)
  const { data: dashboardData, isLoading: isLoadingDashboard, refetch } = useGraphQLQuery();
  
  // Separate query for weekly activity with date filtering
  const weekEndDate = useMemo(() => getWeekEnd(weekStartDate), [weekStartDate]);
  const { data: weeklyDashboardData, isLoading: isLoadingWeeklyData } = useGraphQLQuery({
    filters: {
      startDate: weekStartDate.toISOString(),
      endDate: weekEndDate.toISOString(),
    },
  });

  const resumeCount = resumes?.length ?? 0;
  const recentInterviews = React.useMemo(
    () => dashboardData?.recentInterviews ?? [],
    [dashboardData?.recentInterviews]
  );
  // Use kpis.totalInterviews for accurate count (source of truth from backend)
  const totalInterviewCount = dashboardData?.kpis?.totalInterviews ?? 0;
  const averageScore = dashboardData?.kpis?.averageScore ?? 0;
  // Score change is derived from scoreEvolution if available
  const scoreChange = React.useMemo(() => {
    const scoreEvolution = dashboardData?.scoreEvolution ?? [];
    if (scoreEvolution.length < 2) return 0;
    const recent = scoreEvolution[scoreEvolution.length - 1]?.score ?? 0;
    const previous = scoreEvolution[scoreEvolution.length - 2]?.score ?? 0;
    return Math.round(recent - previous);
  }, [dashboardData?.scoreEvolution]);

  useEffect(() => {
    const loadPhoneStatus = async () => {
      if (!user?.id) return;
      try {
        const status = await apiService.getPhoneStatus();
        setPhoneStatus(status);
      } catch {
        // Non-blocking; phone CTA will stay hidden if status can't be loaded
      }
    };
    loadPhoneStatus();
  }, [user?.id]);

  useEffect(() => {
    const loadTrialStatus = async () => {
      if (!user?.id) return;
      setIsLoadingTrialStatus(true);
      try {
        const status = await apiService.getTrialStatus();
        setTrialStatus(status);
      } catch {
        // Non-blocking; keep CTA hidden until we can confirm eligibility/claim state
        setTrialStatus(null);
      } finally {
        setIsLoadingTrialStatus(false);
      }
    };

    loadTrialStatus();
  }, [user?.id]);

  const refreshPhoneAndTrialStatus = async () => {
    if (!user?.id) return;
    try {
      const [newPhoneStatus, newTrialStatus] = await Promise.all([
        apiService.getPhoneStatus(),
        apiService.getTrialStatus(),
      ]);
      setPhoneStatus(newPhoneStatus);
      setTrialStatus(newTrialStatus);
      // Also refresh dashboard stats (credits shown here come from dashboard query)
      refetch();
    } catch {
      // Non-blocking
    }
  };

  // Keep the phone CTA visible until backend confirms trial credits are claimed.
  // If trial status can't be loaded, keep it hidden to avoid incorrect prompting.
  const shouldShowPhoneCreditsCTA =
    !isLoadingTrialStatus && trialStatus?.data?.trialCreditsClaimed === false;

  // Build performance trend from score evolution data with period filtering
  const performanceData = useMemo(() => {
    let scoreEvolution = dashboardData?.scoreEvolution ?? [];
    if (!scoreEvolution || scoreEvolution.length === 0) {
      return [];
    }
    
    // Filter by selected period
    if (periodFilter !== 'ALL') {
      const periodStartDate = getStartDateForPeriod(periodFilter);
      if (periodStartDate) {
        scoreEvolution = scoreEvolution.filter(
          (point) => new Date(point.date) >= periodStartDate
        );
      }
    }
    
    // Format data for chart
    return scoreEvolution
      .map((point) => ({
        date: new Date(point.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }),
        score: point.score,
      }));
  }, [dashboardData?.scoreEvolution, i18n.language, periodFilter]);

  // Role options for Skill Breakdown filter dropdown
  const skillRoleOptions = React.useMemo(() => {
    const roleTitles = dashboardData?.filterOptions?.roleTitles ?? [];
    return [
      { value: 'all', label: t('dashboard.filters.allRoles', 'All roles') },
      ...roleTitles.map((role) => ({ value: role, label: role })),
    ];
  }, [dashboardData?.filterOptions?.roleTitles, t]);

  // Filter interviews for Skill Breakdown based on selected role
  const skillFilteredInterviews = React.useMemo(() => {
    if (skillRoleFilter === 'all') {
      return recentInterviews;
    }
    // Exact match for specific role
    return recentInterviews.filter(
      (interview) => interview.roleTitle === skillRoleFilter
    );
  }, [recentInterviews, skillRoleFilter]);

  // Calculate skill breakdown from filtered interview data (simulated for now)
  const skillBreakdown = React.useMemo((): Array<{ skill: string; score: number; trend: 'up' | 'down' | 'stable' }> => {
    if (skillFilteredInterviews.length === 0) return [];
    // Calculate average score from filtered interviews
    const scores = skillFilteredInterviews
      .map((i) => i.score)
      .filter((s): s is number => s !== null && s !== undefined);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0;
    // In production, this would come from the API
    return [
      { skill: t('dashboard.skills.technical', 'Technical'), score: Math.min(100, avgScore + 5), trend: 'up' },
      { skill: t('dashboard.skills.communication', 'Communication'), score: Math.max(0, avgScore - 5), trend: 'stable' },
      { skill: t('dashboard.skills.problemSolving', 'Problem Solving'), score: avgScore, trend: 'up' },
    ];
  }, [skillFilteredInterviews, t]);

  // Weekly activity data from backend (filtered by selected week)
  const weeklyActivity = React.useMemo(() => {
    // Use the filtered dashboard data for the selected week
    const backendActivity = weeklyDashboardData?.weeklyActivity;
    if (backendActivity && backendActivity.length > 0) {
      // Transform backend data to chart format
      return backendActivity.map((bucket) => ({
        day: t(`days.${bucket.day.toLowerCase()}`, bucket.day),
        interviews: bucket.count,
      }));
    }
    // Fallback: empty data for all days
    const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
    return DAY_KEYS.map((key) => ({ day: t(`days.${key}`), interviews: 0 }));
  }, [weeklyDashboardData?.weeklyActivity, t]);

  // Weekly total duration from backend (in milliseconds, convert to minutes for display)
  // Uses kpis.totalDurationMs which is calculated for the filtered date range,
  // or falls back to summing weeklyActivity buckets
  const weeklyTotalDurationMinutes = React.useMemo(() => {
    // First try kpis.totalDurationMs (more accurate, from filtered interviews)
    const totalMs = weeklyDashboardData?.kpis?.totalDurationMs;
    if (totalMs && totalMs > 0) {
      return Math.round(totalMs / 60000);
    }
    // Fallback: sum from weeklyActivity buckets
    const backendActivity = weeklyDashboardData?.weeklyActivity;
    if (backendActivity && backendActivity.length > 0) {
      const sumMs = backendActivity.reduce((sum, bucket) => sum + (bucket.durationMs || 0), 0);
      if (sumMs > 0) {
        return Math.round(sumMs / 60000);
      }
    }
    return 0;
  }, [weeklyDashboardData?.kpis?.totalDurationMs, weeklyDashboardData?.weeklyActivity]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Password modal removed - password is now set during onboarding for OAuth users */}

      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4 sm:space-y-6 lg:space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4">


            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 truncate">
                  {t('dashboard.welcome', 'Welcome back,')} <span className="text-purple-600">{' '}{firstName}!</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {t('dashboard.readyToPractice')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Refresh Button */}
                <button
                  onClick={() => refetch()}
                  disabled={isLoadingDashboard}
                  className="p-2.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title={t('common.refreshData', 'Refresh data')}
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoadingDashboard ? 'animate-spin' : ''}`} />
                </button>
                {/* Mobile: CTA first for priority */}
                <MobileStartInterviewButton breakpoint="sm" />
                {/* Desktop: CTA in header */}
                <DesktopStartInterviewButton breakpoint="sm" />
              </div>
            </div>
          </motion.div>

          {/* Stats Grid - 2 columns on small mobile, 3 on desktop */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Total Interviews */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <History className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{t('dashboard.stats.interviews')}</p>
                  {isLoadingDashboard ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 animate-spin" />
                  ) : (
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalInterviewCount}</p>
                  )}
                </div>
              </div>
              <Link
                to="/app/b2c/interviews"
                className="mt-2 sm:mt-3 text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <span className="truncate">{t('dashboard.viewAll')}</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              </Link>
            </div>

            {/* Average Score */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{t('dashboard.stats.avgScore')}</p>
                  {isLoadingDashboard ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 animate-spin" />
                  ) : (
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{averageScore}%</p>
                  )}
                </div>
              </div>
              {scoreChange !== 0 && (
                <p className={`mt-2 sm:mt-3 text-xs sm:text-sm font-medium flex items-center gap-1 ${scoreChange > 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                  {scoreChange > 0 && <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />}
                  {scoreChange > 0 ? '+' : ''}{scoreChange}% <span className="hidden sm:inline">{t('dashboard.stats.thisMonth')}</span>
                </p>
              )}
            </div>

            {/* Resumes */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{t('dashboard.stats.resumes')}</p>
                  {isLoadingResumes ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 animate-spin" />
                  ) : (
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{resumeCount}</p>
                  )}
                </div>
              </div>
              <Link
                to="/app/b2c/resume-library"
                className="mt-2 sm:mt-3 text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <span className="truncate">{t('common.edit')}</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              </Link>
            </div>
          </motion.div>

          {/* On mobile: Quick Actions first (most important), then charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Quick Actions - Shows first on mobile */}
            <motion.div variants={itemVariants} className="order-1 lg:order-2 bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm overflow-visible">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('dashboard.quickActions.title')}</h2>

              <div className="space-y-2 sm:space-y-3">
                {shouldShowPhoneCreditsCTA && (
                  <PhoneVerificationCard onVerified={refreshPhoneAndTrialStatus} />
                )}

                <button
                  type="button"
                  onClick={() => navigate(BUY_CREDITS_LINK)}
                  className="flex w-full items-center gap-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors min-h-[60px]"
                >
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="font-medium text-purple-900 text-sm sm:text-base">
                      {t('dashboard.quickActions.buyCredits', 'Buy Credits')}
                    </p>
                    <p className="text-xs sm:text-sm text-purple-700 truncate">
                      {t('dashboard.quickActions.buyCreditsDesc', 'Top up your interview credits')}
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Performance Trend - Below Quick Actions on mobile */}
            <motion.div variants={itemVariants} className="order-2 lg:order-1 lg:col-span-2 bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('dashboard.charts.performanceTrend')}</h2>
                
                {/* Period Filter Tabs - Investment Chart Style */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPeriodFilter(option.value)}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                        periodFilter === option.value
                          ? 'bg-white text-purple-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {t(option.labelKey, option.value)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-48 sm:h-64">
                {isLoadingDashboard ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                  </div>
                ) : performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#6b7280" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#6b7280" width={30} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        dot={{ fill: '#7c3aed', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5, fill: '#7c3aed' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Target className="h-8 w-8 sm:h-10 sm:w-10 mb-2" />
                    <p className="text-xs sm:text-sm text-center px-4">{t('dashboard.charts.noData', 'Complete interviews to see your performance trend')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* New Widgets Row: Skill Breakdown, Weekly Activity, Uploaded Resumes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Skill Breakdown */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('dashboard.widgets.skillBreakdown', 'Skill Breakdown')}</h2>
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              
              {/* Role Filter Dropdown - Same styling container as Performance Trend */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1 mb-4">
                <select
                  value={skillRoleFilter}
                  onChange={(e) => setSkillRoleFilter(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md bg-white text-purple-700 shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  aria-label={t('dashboard.filters.selectRole', 'Select role')}
                >
                  {skillRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {isLoadingDashboard ? (
                <div className="h-32 sm:h-40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 animate-spin" />
                </div>
              ) : skillBreakdown.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {skillBreakdown.map((skill) => (
                    <div key={skill.skill}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">{skill.skill}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs sm:text-sm font-bold text-gray-900">{skill.score}%</span>
                          {skill.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {skill.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                          {skill.trend === 'stable' && <Minus className="h-3 w-3 text-gray-400" />}
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2">
                        <div
                          className="bg-purple-600 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 sm:h-40 flex flex-col items-center justify-center text-gray-400">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                  <p className="text-xs sm:text-sm text-center">{t('dashboard.widgets.noSkillData', 'Complete interviews to see skill analysis')}</p>
                </div>
              )}
            </motion.div>

            {/* Weekly Activity */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('dashboard.widgets.weeklyActivity', 'Weekly Activity')}</h2>
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={goToPreviousWeek}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={t('dashboard.widgets.previousWeek', 'Previous week')}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <span className="text-xs sm:text-sm text-gray-600 font-medium">
                  {formatWeekRange(weekStartDate, i18n.language)}
                </span>
                <button
                  onClick={goToNextWeek}
                  disabled={isCurrentWeek}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={t('dashboard.widgets.nextWeek', 'Next week')}
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              {isLoadingWeeklyData ? (
                <div className="h-32 sm:h-40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 animate-spin" />
                </div>
              ) : (
                <div className="h-32 sm:h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivity}>
                      <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#6b7280" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 9 }} stroke="#6b7280" width={20} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                        formatter={(value: number) => [`${value} interview${value !== 1 ? 's' : ''}`, '']}
                      />
                      <Bar
                        dataKey="interviews"
                        fill="#7c3aed"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-500">{t('dashboard.widgets.totalTime', 'Total time')}</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  {weeklyTotalDurationMinutes > 0 ? `${weeklyTotalDurationMinutes} min` : '0 min'}
                </span>
              </div>
            </motion.div>

            {/* Uploaded Resumes Mini */}
            <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-1 bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('dashboard.widgets.uploadedResumes', 'Your Resumes')}</h2>
                <Link
                  to="/app/b2c/resume-library"
                  className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </div>
              {isLoadingResumes ? (
                <div className="h-32 sm:h-40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 animate-spin" />
                </div>
              ) : resumes && resumes.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {resumes.slice(0, 3).map((resume: { id: string; fileName: string; createdAt?: string; title?: string }) => (
                    <div
                      key={resume.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                          {resume.title || resume.fileName || 'Resume'}
                        </p>
                        {resume.createdAt && (
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {resumes.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{resumes.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center">
                  <div className="p-3 bg-purple-50 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-500 text-center mb-3">
                    {t('dashboard.widgets.noResumes', 'No resumes uploaded yet')}
                  </p>
                  <Link
                    to="/app/b2c/resume-library"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    {t('dashboard.widgets.uploadFirst', 'Upload your first resume')}
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Recent Interviews */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">{t('dashboard.recentInterviews')}</h2>
              <Link
                to="/app/b2c/interviews"
                className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </div>

            {isLoadingDashboard ? (
              <div className="text-center py-8 sm:py-12">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-4 animate-spin" />
                <p className="text-sm text-gray-500">{t('common.loading', 'Loading...')}</p>
              </div>
            ) : recentInterviews.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <History className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-500">{t('dashboard.noInterviews')}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('dashboard.noInterviewsHint')}</p>
                <div className="mt-4">
                  <StartInterviewButton />
                </div>
              </div>
            ) : (
              <>
                {/* Mobile: Card-based layout */}
                <div className="sm:hidden space-y-3">
                  {recentInterviews.slice(0, 5).map((interview) => (
                    <Link
                      key={interview.id}
                      to={`/interview/${interview.id}`}
                      className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{interview.roleTitle || 'Practice'}</p>
                          <p className="text-sm text-gray-600 truncate">{interview.companyName || 'Practice'}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(interview.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${(interview.score ?? 0) >= 80
                                ? 'bg-purple-100 text-purple-800'
                                : (interview.score ?? 0) >= 60
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {interview.score ?? 0}%
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.table.role')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.table.company')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.table.date')}</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.table.score')}</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInterviews.slice(0, 5).map((interview) => (
                        <tr key={interview.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">{interview.roleTitle || 'Practice'}</td>
                          <td className="py-3 px-4 text-gray-600">{interview.companyName || 'Practice'}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(interview.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${(interview.score ?? 0) >= 80
                                  ? 'bg-purple-100 text-purple-800'
                                  : (interview.score ?? 0) >= 60
                                    ? 'bg-purple-50 text-purple-700'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {interview.score ?? 0}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/interview/${interview.id}`}
                              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                            >
                              {t('dashboard.table.view', 'View')}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>

        </motion.div>
      </div>

    </div>
  );
}