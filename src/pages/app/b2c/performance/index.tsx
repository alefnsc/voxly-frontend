/**
 * B2C Performance Page
 * 
 * Consolidated performance view for candidates:
 * - Interview KPIs (total, avg score, total duration)
 * - Resume quality scores
 * - Embedded Performance Chat assistant
 * 
 * @module pages/app/b2c/performance
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from 'contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ChevronRight,
  FileText,
  Loader2,
  MessageCircle,
  TrendingUp,
} from 'lucide-react';
import PerformanceChat from '../../../../components/performance-chat';
import { useResumesQuery } from '../../../../hooks/queries/useResumeQueries';
import { usePerformanceGoalQuery, usePerformanceSummaryQuery, useUpdatePerformanceGoal } from '../../../../hooks/queries/usePerformanceQueries';
import { B2C_ROUTES } from '../../../../routes/b2cRoutes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Skeleton } from '../../../../components/ui/skeleton';
import type { PerformanceRange } from '../../../../services/APIService';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function B2CPerformance() {
  const { isSignedIn } = useUser();
  const { t } = useTranslation();

  const [range, setRange] = useState<PerformanceRange>('1M');
  const [goalInterviewsDraft, setGoalInterviewsDraft] = useState<string>('');
  const [goalMinutesDraft, setGoalMinutesDraft] = useState<string>('');

  const summaryQuery = usePerformanceSummaryQuery({ range });
  const goalQuery = usePerformanceGoalQuery();

  const { data: summary, isLoading: isLoadingSummary, isError: isSummaryError } = summaryQuery;
  const { data: goal, isLoading: isLoadingGoal, isError: isGoalError } = goalQuery;
  const updateGoal = useUpdatePerformanceGoal();
  const { data: resumes, isLoading: isLoadingResumes } = useResumesQuery();

  // Compute resume stats
  const resumeStats = useMemo(() => {
    if (!resumes || resumes.length === 0) {
      return { count: 0, avgQuality: null, hasScores: false };
    }
    const scores = resumes
      .map((r: any) => r.qualityScore)
      .filter((s: number | undefined | null): s is number => s != null);
    const avgQuality = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : null;
    return { count: resumes.length, avgQuality, hasScores: scores.length > 0 };
  }, [resumes]);

  const isLoading = isLoadingSummary || isLoadingGoal || isLoadingResumes;
  const isInitialLoading = isLoadingSummary || isLoadingGoal;
  const hasNoInterviewsInRange = !!summary && summary.totals.completedInterviews === 0;

  const interviewGoalValue = useMemo(() => {
    if (goalInterviewsDraft.trim()) {
      const parsed = Number(goalInterviewsDraft);
      if (Number.isFinite(parsed)) return parsed;
    }
    return goal?.weeklyInterviewGoal ?? null;
  }, [goal?.weeklyInterviewGoal, goalInterviewsDraft]);

  const minutesGoalValue = useMemo(() => {
    if (goalMinutesDraft.trim()) {
      const parsed = Number(goalMinutesDraft);
      if (Number.isFinite(parsed)) return parsed;
    }
    return goal?.weeklyMinutesGoal ?? null;
  }, [goal?.weeklyMinutesGoal, goalMinutesDraft]);

  const interviewGoalProgress = useMemo(() => {
    if (!summary || !interviewGoalValue) return null;
    const pct = Math.min(100, Math.round((summary.totals.thisWeekInterviews / interviewGoalValue) * 100));
    return {
      pct,
      current: summary.totals.thisWeekInterviews,
      target: interviewGoalValue,
    };
  }, [interviewGoalValue, summary]);

  const minutesGoalProgress = useMemo(() => {
    if (!summary || !minutesGoalValue) return null;
    const pct = Math.min(100, Math.round((summary.totals.thisWeekMinutes / minutesGoalValue) * 100));
    return {
      pct,
      current: summary.totals.thisWeekMinutes,
      target: minutesGoalValue,
    };
  }, [minutesGoalValue, summary]);

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-10">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-base">{t('performance.signedOut.title', 'Sign in required')}</CardTitle>
            <CardDescription>
              {t('performance.signedOut.subtitle', 'Please sign in to view your performance insights.')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-zinc-50"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Header */}
        <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" variants={itemVariants}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
              {t('performance.title', 'Performance')}
            </h1>
            <p className="text-sm sm:text-base text-zinc-500 mt-1">
              {t('performance.subtitle', 'A deep dive into your interview momentum, consistency, and communication signals')}
            </p>
          </div>

          <Tabs value={range} onValueChange={(v) => setRange(v as PerformanceRange)}>
            <TabsList>
              <TabsTrigger value="1W">{t('performance.range.1w', '1W')}</TabsTrigger>
              <TabsTrigger value="1M">{t('performance.range.1m', '1M')}</TabsTrigger>
              <TabsTrigger value="6M">{t('performance.range.6m', '6M')}</TabsTrigger>
              <TabsTrigger value="ALL">{t('performance.range.all', 'ALL')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {(isSummaryError || isGoalError) && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {t('performance.loadError.title', 'Could not load performance data')}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {t('performance.loadError.subtitle', 'Please try again in a moment.')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    summaryQuery.refetch();
                    goalQuery.refetch();
                  }}
                >
                  {t('common.retry', 'Retry')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {!isInitialLoading && !isSummaryError && hasNoInterviewsInRange && (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {t('performance.empty.title', 'No interviews in this range yet')}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {t('performance.empty.subtitle', 'Complete a practice interview to unlock momentum, velocity, and communication signals.')}
                  </p>
                </div>
                <Button asChild className="bg-purple-600 hover:bg-purple-700">
                  <Link to={B2C_ROUTES.INTERVIEW_NEW}>{t('performance.empty.cta', 'Start practice')}</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Hero: Composite index */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 text-white bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-white text-xl">{t('performance.composite.title', 'Composite Performance Index')}</CardTitle>
                  <CardDescription className="text-white/80">
                    {t('performance.composite.subtitle', 'A blended score: results + momentum + consistency + communication')}
                  </CardDescription>
                </div>
                <div className="h-10 w-10 rounded-lg bg-white/15 flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <BarChart3 className="h-5 w-5" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="rounded-xl bg-white/10 border border-white/15 p-4">
                  <p className="text-sm text-white/80">{t('performance.composite.score', 'Composite')}</p>
                  {isLoadingSummary ? (
                    <Skeleton className="mt-2 h-9 w-24 bg-white/20" />
                  ) : (
                    <p className="text-3xl font-bold tracking-tight">
                      {summary?.composite?.score != null ? `${Math.round(summary.composite.score)}%` : '—'}
                    </p>
                  )}
                  <p className="text-xs text-white/70 mt-1">
                    {t('performance.composite.note', 'Updated from your completed interviews in the selected range')}
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 border border-white/15 p-4">
                  <p className="text-sm text-white/80">{t('performance.momentum.title', 'Momentum (last 12)')}</p>
                  <div className="h-16 mt-2">
                    {isLoadingSummary ? (
                      <Skeleton className="h-full w-full bg-white/20" />
                    ) : summary?.recentScores?.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.recentScores}>
                          <Tooltip
                            cursor={false}
                            contentStyle={{
                              borderRadius: 12,
                              borderColor: 'rgba(255,255,255,0.15)',
                              backgroundColor: 'rgba(24,24,27,0.85)',
                              color: 'white',
                            }}
                            labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                            formatter={(value: any) => [`${value}%`, t('performance.score', 'Score')]}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="rgba(255,255,255,0.9)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full rounded-lg bg-white/10 flex items-center justify-center text-sm text-white/70">
                        {t('performance.noData', 'No data yet')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-white/10 border border-white/15 p-4">
                  <p className="text-sm text-white/80">{t('performance.components.title', 'Index components')}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {isLoadingSummary ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full bg-white/20" />
                        <Skeleton className="h-4 w-11/12 bg-white/20" />
                        <Skeleton className="h-4 w-10/12 bg-white/20" />
                        <Skeleton className="h-4 w-9/12 bg-white/20" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">{t('performance.components.results', 'Results')}</span>
                          <span className="font-medium">{summary?.composite?.components?.score != null ? `${Math.round(summary.composite.components.score)}%` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">{t('performance.components.velocity', 'Velocity')}</span>
                          <span className="font-medium">{summary?.composite?.components?.velocity != null ? `${Math.round(summary.composite.components.velocity)}%` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">{t('performance.components.consistency', 'Consistency')}</span>
                          <span className="font-medium">{summary?.composite?.components?.consistency != null ? `${Math.round(summary.composite.components.consistency)}%` : '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">{t('performance.components.communication', 'Communication')}</span>
                          <span className="font-medium">{summary?.composite?.components?.communication != null ? `${Math.round(summary.composite.components.communication)}%` : '—'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Core cards + Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div className="lg:col-span-1 space-y-4" variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('performance.goal.title', 'Weekly goal')}</CardTitle>
                <CardDescription>
                  {t('performance.goal.subtitle', 'Persisted across devices. Track weekly consistency, not just totals.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-600">{t('performance.goal.interviews', 'Interviews')}</p>
                      {isInitialLoading ? (
                        <Skeleton className="mt-2 h-8 w-28" />
                      ) : (
                        <p className="text-2xl font-bold text-zinc-900">
                          {interviewGoalProgress ? `${interviewGoalProgress.current}/${interviewGoalProgress.target}` : '—'}
                        </p>
                      )}
                    </div>
                    <div className="w-28 sm:w-32">
                      {isInitialLoading ? (
                        <Skeleton className="h-2 w-full" />
                      ) : (
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${interviewGoalProgress?.pct ?? 0}%` }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-zinc-500 mt-1">
                        {interviewGoalProgress ? `${interviewGoalProgress.pct}%` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-600">{t('performance.goal.minutesLabel', 'Minutes')}</p>
                      {isInitialLoading ? (
                        <Skeleton className="mt-2 h-8 w-28" />
                      ) : (
                        <p className="text-2xl font-bold text-zinc-900">
                          {minutesGoalProgress ? `${minutesGoalProgress.current}/${minutesGoalProgress.target}` : '—'}
                        </p>
                      )}
                    </div>
                    <div className="w-28 sm:w-32">
                      {isInitialLoading ? (
                        <Skeleton className="h-2 w-full" />
                      ) : (
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${minutesGoalProgress?.pct ?? 0}%` }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-zinc-500 mt-1">
                        {minutesGoalProgress ? `${minutesGoalProgress.pct}%` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    inputMode="numeric"
                    value={goalInterviewsDraft}
                    onChange={(e) => setGoalInterviewsDraft(e.target.value)}
                    placeholder={String(goal?.weeklyInterviewGoal ?? 3)}
                    className="px-3 py-2"
                    disabled={isLoadingGoal || updateGoal.isPending}
                  />
                  <Input
                    type="number"
                    min={5}
                    max={600}
                    inputMode="numeric"
                    value={goalMinutesDraft}
                    onChange={(e) => setGoalMinutesDraft(e.target.value)}
                    placeholder={String(goal?.weeklyMinutesGoal ?? 60)}
                    className="px-3 py-2"
                    disabled={isLoadingGoal || updateGoal.isPending}
                  />
                </div>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={
                    updateGoal.isPending ||
                    isLoadingGoal ||
                    !interviewGoalValue ||
                    !minutesGoalValue ||
                    Number(interviewGoalValue) < 1 ||
                    Number(minutesGoalValue) < 1
                  }
                  onClick={() => {
                    if (!interviewGoalValue || !minutesGoalValue) return;
                    updateGoal.mutate({
                      weeklyInterviewGoal: Number(interviewGoalValue),
                      weeklyMinutesGoal: Number(minutesGoalValue),
                    });
                    setGoalInterviewsDraft('');
                    setGoalMinutesDraft('');
                  }}
                >
                  {updateGoal.isPending ? t('common.saving', 'Saving…') : t('common.save', 'Save goals')}
                </Button>

                <div className="text-xs text-zinc-500">
                  {isLoadingSummary ? (
                    <Skeleton className="h-4 w-40" />
                  ) : (
                    t('performance.goal.streak', 'Current streak: {{weeks}} weeks', { weeks: summary?.totals?.currentWeekStreak ?? 0 })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('performance.signals.title', 'Performance signals')}</CardTitle>
                <CardDescription>
                  {t('performance.signals.subtitle', 'New measurements focused on how you improve—not just what you scored.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-600">{t('performance.velocity.title', 'Improvement velocity')}</p>
                    {isLoadingSummary ? (
                      <Skeleton className="mt-2 h-7 w-28" />
                    ) : (
                      <p className="text-xl font-bold text-zinc-900">
                        {summary?.velocity ? `${summary.velocity.pointsPerWeek > 0 ? '+' : ''}${summary.velocity.pointsPerWeek}/wk` : '—'}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">
                      {t('performance.velocity.desc', 'Slope of your scores over time (range-based)')}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-xs text-zinc-500">{t('performance.consistency.title', 'Consistency')}</p>
                    {isLoadingSummary ? (
                      <Skeleton className="mt-2 h-6 w-16" />
                    ) : (
                      <p className="text-lg font-semibold text-zinc-900">
                        {summary?.consistencyScore != null ? `${Math.round(summary.consistencyScore)}%` : '—'}
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-xs text-zinc-500">{t('performance.communication.title', 'Communication')}</p>
                    {isLoadingSummary ? (
                      <>
                        <Skeleton className="mt-2 h-6 w-16" />
                        <Skeleton className="mt-2 h-4 w-20" />
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-zinc-900">
                          {summary?.communication?.score != null ? `${Math.round(summary.communication.score)}%` : '—'}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {summary?.communication?.paceWpm != null
                            ? t('performance.communication.pace', '{{wpm}} WPM', { wpm: summary.communication.paceWpm })
                            : ''}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3">
                  <p className="text-xs text-zinc-500">{t('performance.breakdown.title', 'Skill signal averages')}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[11px] text-zinc-500">{t('performance.breakdown.technical', 'Technical')}</p>
                      {isLoadingSummary ? (
                        <Skeleton className="mt-2 h-5 w-14" />
                      ) : (
                        <p className="text-sm font-semibold text-zinc-900">{summary?.breakdown?.technical != null ? `${Math.round(summary.breakdown.technical)}%` : '—'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">{t('performance.breakdown.communication', 'Comms')}</p>
                      {isLoadingSummary ? (
                        <Skeleton className="mt-2 h-5 w-14" />
                      ) : (
                        <p className="text-sm font-semibold text-zinc-900">{summary?.breakdown?.communication != null ? `${Math.round(summary.breakdown.communication)}%` : '—'}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-zinc-500">{t('performance.breakdown.confidence', 'Confidence')}</p>
                      {isLoadingSummary ? (
                        <Skeleton className="mt-2 h-5 w-14" />
                      ) : (
                        <p className="text-sm font-semibold text-zinc-900">{summary?.breakdown?.confidence != null ? `${Math.round(summary.breakdown.confidence)}%` : '—'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('performance.assets.title', 'Practice assets')}</CardTitle>
                <CardDescription>{t('performance.assets.subtitle', 'Keep your resume and practice flow aligned.')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{t('performance.assets.resumeQuality', 'Resume quality')}</p>
                      <p className="text-xs text-zinc-500">
                        {resumeStats.count > 0
                          ? t('performance.assets.resumeCount', '{{count}} resumes', { count: resumeStats.count })
                          : t('performance.assets.noResumes', 'No resumes uploaded yet')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isLoadingResumes ? (
                      <Skeleton className="ml-auto h-6 w-12" />
                    ) : (
                      <p className="text-lg font-semibold text-zinc-900">
                        {resumeStats.hasScores ? `${resumeStats.avgQuality}%` : '—'}
                      </p>
                    )}
                    <Link
                      to={B2C_ROUTES.RESUMES}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
                    >
                      {t('performance.viewResumes', 'View resumes')}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to={B2C_ROUTES.INTERVIEWS}
                    className="rounded-lg border border-zinc-200 bg-white p-3 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-xs text-zinc-500">{t('performance.actions.interviews', 'Practice')}</p>
                    <p className="text-sm font-medium text-zinc-900">{t('nav.interviews', 'Interviews')}</p>
                  </Link>
                  <Link
                    to={B2C_ROUTES.DASHBOARD}
                    className="rounded-lg border border-zinc-200 bg-white p-3 hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-xs text-zinc-500">{t('performance.actions.overview', 'Quick view')}</p>
                    <p className="text-sm font-medium text-zinc-900">{t('nav.dashboard', 'Dashboard')}</p>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="lg:col-span-2"
            variants={itemVariants}
          >
            <Card className="overflow-hidden min-h-[560px] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{t('performance.chat.title', 'AI Performance Analyst')}</CardTitle>
                    <CardDescription>
                      {t('performance.chat.subtitle', 'Ask about weak spots, role-specific tips, or what to practice next.')}
                    </CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex-1">
                <div className="h-full min-h-[460px] rounded-xl border border-zinc-200 overflow-hidden">
                  <PerformanceChat isOpen={true} variant="embedded" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
