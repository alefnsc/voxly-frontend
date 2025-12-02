'use client'

import { lazy, Suspense, useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DefaultLayout } from 'components/default-layout'
import { Separator } from 'components/ui/separator'
import { useMediaQuery } from '@mantine/hooks'
import { useAuthCheck } from 'hooks/use-auth-check'
import { useUser } from '@clerk/clerk-react'
import Loading from 'components/loading'
import PurpleButton from 'components/ui/purple-button'
import { Plus, Coins } from 'lucide-react'
import apiService, {
  DashboardStats,
  InterviewSummary,
  ScoreDataPoint,
  SpendingDataPoint
} from 'services/APIService'

// Lazy load components for better initial load performance
const BodyCopy = lazy(() => import('components/body-copy'))
const CreditPackages = lazy(() => import('components/credit-packages'))

// ==========================================
// DASHBOARD COMPONENTS (for logged-in users)
// ==========================================

interface SimpleLineChartProps {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({ data, color = '#5417C9', height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const minValue = Math.min(...data.map(d => d.value), 0)
  const range = maxValue - minValue || 1

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100
    const y = 100 - ((d.value - minValue) / range) * 100
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
        ))}
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
        <polygon fill={`${color}20`} points={`0,100 ${points} 100,100`} />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 100
          const y = 100 - ((d.value - minValue) / range) * 100
          return <circle key={i} cx={x} cy={y} r="2" fill={color} />
        })}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.slice(0, 6).map((d, i) => <span key={i}>{d.label}</span>)}
      </div>
    </div>
  )
}

interface SimpleBarChartProps {
  data: { label: string; value: number }[]
  color?: string
  height?: number
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, color = '#5417C9', height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="w-full flex flex-col" style={{ height }}>
      <div className="flex-1 flex items-end gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t transition-all hover:opacity-80"
              style={{
                height: `${(d.value / maxValue) * 100}%`,
                backgroundColor: color,
                minHeight: d.value > 0 ? '4px' : '0'
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-xs text-gray-500 truncate">{d.label}</span>
        ))}
      </div>
    </div>
  )
}

const ScoreBadge: React.FC<{ score: number | null }> = ({ score }) => {
  if (score === null) return <span className="score-badge bg-gray-100 text-gray-600">N/A</span>
  let badgeClass = 'score-badge-needs-improvement'
  if (score >= 80) badgeClass = 'score-badge-excellent'
  else if (score >= 60) badgeClass = 'score-badge-good'
  else if (score >= 40) badgeClass = 'score-badge-average'
  return <span className={`score-badge ${badgeClass}`}>{score}%</span>
}

const StatsCard: React.FC<{
  title: string; value: string | number; subtitle?: string; change?: number; icon: React.ReactNode
}> = ({ title, value, subtitle, change, icon }) => (
  <div className="voxly-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
    <div className="p-2 sm:p-3 bg-purple-100 rounded-xl flex-shrink-0 text-purple-600">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
      <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      {change !== undefined && (
        <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </p>
      )}
    </div>
  </div>
)

// ==========================================
// HOME PAGE COMPONENT
// ==========================================

export default function Home() {
  const isMobile = useMediaQuery('only screen and (max-width: 768px)')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isSignedIn } = useUser()
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)
  
  // Dashboard state
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [interviews, setInterviews] = useState<InterviewSummary[]>([])
  const [scoreData, setScoreData] = useState<ScoreDataPoint[]>([])
  const [spendingData, setSpendingData] = useState<SpendingDataPoint[]>([])
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  
  const { isLoading, userCredits } = useAuthCheck()

  // Fetch dashboard data for logged-in users
  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return
    setDashboardLoading(true)
    setDashboardError(null)

    try {
      const [statsResult, interviewsResult, scoreResult, spendingResult] = await Promise.allSettled([
        apiService.getDashboardStats(user.id),
        apiService.getUserInterviews(user.id, 1, 5),
        apiService.getScoreEvolution(user.id, 6),
        apiService.getSpendingHistory(user.id, 6)
      ])

      if (statsResult.status === 'fulfilled') setStats(statsResult.value)
      if (interviewsResult.status === 'fulfilled') setInterviews(interviewsResult.value.interviews)
      if (scoreResult.status === 'fulfilled') setScoreData(scoreResult.value)
      if (spendingResult.status === 'fulfilled') setSpendingData(spendingResult.value)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setDashboardError('Failed to load dashboard data.')
    } finally {
      setDashboardLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchDashboardData()
    }
  }, [isSignedIn, user?.id, fetchDashboardData])

  // Check for navigation state (e.g., from incompatibility redirect)
  useEffect(() => {
    if (location.state?.message) {
      setNotification({ message: location.state.message, type: location.state.type || 'info' })
      window.history.replaceState({}, document.title)
      const timer = setTimeout(() => setNotification(null), 10000)
      return () => clearTimeout(timer)
    }
  }, [location.state])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  if (isLoading) {
    return <Loading />
  }

  // ==========================================
  // LOGGED-IN USER: SHOW DASHBOARD
  // ==========================================
  if (isSignedIn) {
    return (
      <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50">
        <div className="page-container py-6 sm:py-8">
          {/* Header with Start Interview Button */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
            {/* Left Column - Welcome Message */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-voxly-purple">{user?.firstName || 'there'}</span>!
              </h1>
              <p className="text-gray-600 mt-1">
                Here's an overview of your interview practice progress.
              </p>
            </div>
            
            {/* Right Column - CTA or No Credits Banner */}
            {(userCredits !== null && userCredits > 0) ? (
              <PurpleButton
                variant="primary"
                size="lg"
                onClick={() => navigate('/interview-setup')}
                className="w-full sm:w-auto"
              >
                <Plus className="w-5 h-5" />
                Start New Interview
              </PurpleButton>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Coins className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">Out of credits</p>
                  <p className="text-xs text-gray-600">Purchase to continue practicing</p>
                </div>
                <PurpleButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const creditsSection = document.getElementById('credit-packages');
                    if (creditsSection) creditsSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Buy Credits
                </PurpleButton>
              </div>
            )}
          </div>

          {dashboardError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {dashboardError}
              <button onClick={fetchDashboardData} className="ml-2 underline hover:no-underline">Retry</button>
            </div>
          )}

          {dashboardLoading ? (
            <div className="flex justify-center py-12"><Loading /></div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <StatsCard
                  title="Total Interviews"
                  value={stats?.totalInterviews || 0}
                  subtitle={`${stats?.interviewsThisMonth || 0} this month`}
                  icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                />
                <StatsCard
                  title="Average Score"
                  value={stats?.averageScore ? `${stats.averageScore}%` : 'N/A'}
                  change={stats?.scoreChange}
                  icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                />
                <StatsCard
                  title="Total Spent"
                  value={formatCurrency(stats?.totalSpent || 0)}
                  icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatsCard
                  title="Credits Remaining"
                  value={stats?.creditsRemaining ?? userCredits ?? 0}
                  icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="voxly-card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Evolution</h3>
                  <div className="chart-container">
                    <SimpleLineChart
                      data={scoreData.map(d => ({
                        label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        value: d.score
                      }))}
                      color="#5417C9"
                      height={200}
                    />
                  </div>
                </div>
                <div className="voxly-card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Spending</h3>
                  <div className="chart-container">
                    <SimpleBarChart
                      data={spendingData.map(d => ({ label: d.month, value: d.amount }))}
                      color="#5417C9"
                      height={200}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Interviews */}
              <div className="voxly-card mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Interviews</h3>
                </div>
                {interviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 mb-4">No interviews yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {interviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="interview-list-item"
                        onClick={() => navigate(`/interview/${interview.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/interview/${interview.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{interview.position}</p>
                          <p className="text-sm text-gray-500">{interview.company}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(interview.createdAt)} • {interview.duration} min</p>
                        </div>
                        <div className="flex items-center gap-3 mt-2 sm:mt-0">
                          <ScoreBadge score={interview.overallScore} />
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Start New Interview CTA Section OR Credit Packages */}
          {(userCredits !== null && userCredits > 0) ? (
            <div className="voxly-card bg-voxly-gradient text-white">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">Ready for another practice session?</h3>
                  <p className="text-purple-100 mt-1">Start a new interview to keep improving your skills.</p>
                </div>
                <PurpleButton
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate('/interview-setup')}
                  className="bg-white text-voxly-purple hover:bg-gray-100 border-0"
                >
                  <Plus className="w-5 h-5" />
                  Start Interview
                </PurpleButton>
              </div>
            </div>
          ) : (
            <div id="credit-packages" className="mt-6 sm:mt-8">
              <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loading /></div>}>
                <CreditPackages onPurchaseComplete={fetchDashboardData} />
              </Suspense>
            </div>
          )}
        </div>
      </DefaultLayout>
    )
  }

  // ==========================================
  // NOT LOGGED IN: SHOW LANDING PAGE
  // ==========================================
  return (
    <>
      <DefaultLayout className="flex flex-col overflow-hidden items-center bg-white">
        {/* Notification banner */}
        {notification && (
          <div className="w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto mt-4 md:mt-6 lg:mt-8 px-4 sm:px-6 lg:px-8 xl:px-12">
            <div className={`p-4 md:p-5 lg:p-6 rounded-lg lg:rounded-xl border shadow-sm ${
              notification.type === 'incompatibility' ? 'bg-purple-50 border-purple-200 text-purple-800' :
              notification.type === 'early_interruption' ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-start gap-3 md:gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm md:text-base lg:text-lg font-medium">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main hero section */}
        <div className="mt-8 md:mt-12 lg:mt-16 xl:mt-20 2xl:mt-24 relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10 lg:gap-16 xl:gap-24 2xl:gap-32 w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pb-8 md:pb-12 lg:pb-16">
          {isMobile && (
            <div className="flex flex-col w-full items-center">
              <img src='/Main.png' alt="Voxly Interview" className="w-[65%] max-w-[280px]" />
            </div>
          )}

          <Suspense fallback={<div className="h-40 lg:h-60 flex items-center justify-center text-gray-600">Loading content...</div>}>
            <BodyCopy isMobile={Boolean(isMobile)} />
          </Suspense>

          {!isMobile && (
            <div className="flex flex-col h-full overflow-hidden w-full md:w-[50%] lg:w-[45%] items-center justify-center">
              <img src='/Main.png' alt="Voxly Interview" className="w-full max-w-[480px] lg:max-w-[600px] xl:max-w-[700px] 2xl:max-w-[800px]" />
            </div>
          )}
        </div>
      </DefaultLayout>
      <Separator className="my-0" />
      <div id="form" className="relative flex flex-col w-full items-center justify-center m-auto py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <Suspense fallback={<div className="h-40 lg:h-60 flex items-center justify-center text-gray-600">Loading packages...</div>}>
            <CreditPackages />
          </Suspense>
        </div>
      </div>
    </>
  )
}