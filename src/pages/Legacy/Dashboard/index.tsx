'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useTranslation } from 'react-i18next'
import { DefaultLayout } from 'components/default-layout'
import Loading from 'components/loading'
import { useDashboardData } from 'hooks/use-dashboard-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Filter, RefreshCw } from 'lucide-react'

// Seniority level keys for translation
const SENIORITY_KEYS = ['all', 'intern', 'junior', 'mid', 'senior', 'staff', 'principal'] as const;

// Score badge component with landing-page styling
const ScoreBadge: React.FC<{ score: number | null }> = ({ score }) => {
  if (score === null) {
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-100 text-zinc-600">N/A</span>
  }

  let colorClass = 'bg-zinc-100 text-zinc-700'
  if (score >= 90) colorClass = 'bg-purple-100 text-purple-700'
  else if (score >= 80) colorClass = 'bg-purple-50 text-purple-600'
  else if (score >= 70) colorClass = 'bg-zinc-100 text-zinc-600'
  else if (score >= 60) colorClass = 'bg-amber-50 text-amber-700'
  else colorClass = 'bg-red-50 text-red-600'

  return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClass}`}>{score}%</span>
}

// Stats card component with landing-page styling
const StatsCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  change?: number
  changeText?: string
  icon: React.ReactNode
}> = ({ title, value, subtitle, change, changeText, icon }) => (
  <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
        {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
        {change !== undefined && (
          <p className={`text-xs font-medium mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% {changeText}
          </p>
        )}
      </div>
      <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
        {icon}
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  
  // Filter state
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [seniorityFilter, setSeniorityFilter] = useState<string>('all')
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  
  // Use shared dashboard data hook (with caching)
  const { data, isLoading, error, refresh } = useDashboardData(5)
  const { stats, interviews, scoreData, spendingData } = data

  // Extract unique roles from interviews
  useEffect(() => {
    if (interviews && interviews.length > 0) {
      const roles = Array.from(new Set(interviews.map(i => i.position).filter(Boolean)))
      setAvailableRoles(roles as string[])
    }
  }, [interviews])

  // Filter interviews based on selected filters
  const filteredInterviews = useMemo(() => {
    if (!interviews) return []
    return interviews.filter(interview => {
      const matchesRole = roleFilter === 'all' || interview.position === roleFilter
      const matchesSeniority = seniorityFilter === 'all' || interview.seniority === seniorityFilter
      return matchesRole && matchesSeniority
    })
  }, [interviews, roleFilter, seniorityFilter])

  // Filter score data based on selected filters
  const filteredScoreData = useMemo(() => {
    if (!scoreData || !interviews) return scoreData
    
    // Get filtered interview IDs
    const filteredIds = new Set(filteredInterviews.map(i => i.id))
    
    // Filter score data to only include filtered interviews
    // Note: scoreData may be aggregated, so we recalculate if needed
    if (roleFilter === 'all' && seniorityFilter === 'all') {
      return scoreData
    }
    
    // For filtered view, recalculate scores from filtered interviews
    return filteredInterviews
      .slice(-10) // Last 10 interviews
      .map((interview, index) => ({
        name: `#${index + 1}`,
        score: interview.overallScore || 0
      }))
  }, [scoreData, interviews, filteredInterviews, roleFilter, seniorityFilter])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/')  // Not signed in - go to landing
      return
    }
  }, [isLoaded, isSignedIn, navigate])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (!isLoaded || isLoading) {
    return <Loading />
  }

  return (
    <DefaultLayout>
      <div className="page-container py-6 sm:py-8">
        {/* Header with Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
              {t('dashboard.welcome', { name: user?.firstName || t('common.there') })}
            </h1>
            <p className="text-zinc-600 mt-1">
              {t('dashboard.welcomeSubtitle')}
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-500">{t('common.filters')}:</span>
            </div>
            
            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px] bg-white text-sm">
                <SelectValue placeholder={t('dashboard.filters.allRoles')} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">{t('dashboard.filters.allRoles')}</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Seniority Filter */}
            <Select value={seniorityFilter} onValueChange={setSeniorityFilter}>
              <SelectTrigger className="w-[160px] bg-white text-sm">
                <SelectValue placeholder={t('seniority.all')} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {SENIORITY_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {t(`seniority.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Refresh Button */}
            <button
              onClick={() => refresh(true)}
              disabled={isLoading}
              className="p-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              title={t('common.refreshData')}
            >
              <RefreshCw className={`w-4 h-4 text-zinc-500 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button
              onClick={() => refresh(true)}
              className="ml-2 underline hover:no-underline"
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        )}

        {/* Stats Grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title={t('dashboard.stats.totalInterviews')}
            value={stats?.totalInterviews || 0}
            subtitle={`${stats?.interviewsThisMonth || 0} ${t('dashboard.stats.thisMonth')}`}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />
          <StatsCard
            title={t('dashboard.stats.averageScore')}
            value={stats?.averageScore ? `${stats.averageScore}%` : 'N/A'}
            change={stats?.scoreChange}
            changeText={t('dashboard.fromLastMonth')}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <StatsCard
            title={t('dashboard.stats.totalSpent')}
            value={formatCurrency(stats?.totalSpent || 0)}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title={t('dashboard.stats.creditsRemaining')}
            value={stats?.creditsRemaining || 0}
            icon={
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            }
          />
        </div> */}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Score Evolution Chart */}
          <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900 mb-4">{t('dashboard.charts.scoreEvolution')}</h3>
            <div style={{ height: 200 }}>
              {filteredScoreData && filteredScoreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={filteredScoreData.map(d => ({
                      date: d.date ? new Date(d.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }) : d.name,
                      score: d.score
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#a1a1aa' }}
                      itemStyle={{ color: '#ffffff' }}
                      formatter={(value: number) => [`${value}%`, t('dashboard.tooltips.score')]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#7c3aed" 
                      strokeWidth={2}
                      dot={{ fill: '#7c3aed', r: 3 }}
                      activeDot={{ r: 5, fill: '#7c3aed' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  {t('dashboard.charts.noScoreData')}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Spending Chart */}
          <div className="p-6 bg-white border border-zinc-200 rounded-xl shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900 mb-4">{t('dashboard.charts.monthlySpending')}</h3>
            <div style={{ height: 200 }}>
              {spendingData && spendingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 11, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#71717a' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#a1a1aa' }}
                      itemStyle={{ color: '#ffffff' }}
                      formatter={(value: number) => [formatCurrency(value), t('dashboard.tooltips.spent')]}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#7c3aed" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-400">
                  {t('dashboard.charts.noSpendingData')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Interviews */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              {t('dashboard.recentInterviews')}
              {(roleFilter !== 'all' || seniorityFilter !== 'all') && (
                <span className="text-sm font-normal text-zinc-400 ml-2">
                  ({filteredInterviews.length} of {interviews.length})
                </span>
              )}
            </h3>
            <button
              onClick={() => navigate('/interviews')}
              className="text-sm text-purple-600 hover:underline"
            >
              {t('dashboard.viewAll')}
            </button>
          </div>

          {filteredInterviews.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-zinc-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-zinc-600 mb-4">
                {interviews.length === 0 ? t('dashboard.noInterviews') : t('dashboard.noFilteredResults')}
              </p>
              {interviews.length === 0 && (
                <button
                  onClick={() => navigate('/app/b2c/interview/new')}
                  className="btn-Vocaid"
                >
                  {t('interviews.startFirst')}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredInterviews.map((interview) => (
                <div
                  key={interview.id}
                  className="interview-list-item"
                  onClick={() => navigate(`/interview/${interview.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/interview/${interview.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">
                      {interview.position}
                      {interview.seniority && (
                        <span className="ml-2 text-xs font-normal text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                          {t(`interviewSetup.form.seniorityLevels.${interview.seniority}`, interview.seniority)}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-zinc-500">{interview.company}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {formatDate(interview.createdAt)} • {interview.duration} min
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    <ScoreBadge score={interview.overallScore} />
                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  )
}
