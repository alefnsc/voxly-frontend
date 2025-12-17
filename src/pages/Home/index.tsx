'use client'

import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DefaultLayout } from 'components/default-layout'
import { useMediaQuery } from '@mantine/hooks'
import { useAuthCheck } from 'hooks/use-auth-check'
import { useDashboardData } from 'hooks/use-dashboard-data'
import { useUser } from '@clerk/clerk-react'
import Loading from 'components/loading'
import PurpleButton from 'components/ui/purple-button'
import StatsCard from 'components/ui/stats-card'
import { Plus, Coins, TrendingUp, DollarSign, MessageSquare, ChevronRight } from 'lucide-react'
import Interview from 'pages/Interview'
import InterviewReady from 'components/interview-ready'

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
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <TrendingUp className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-600 mb-2">No score data yet</p>
        <p className="text-sm text-gray-400">Complete interviews to track your progress</p>
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
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <DollarSign className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-600 mb-2">No spending data yet</p>
        <p className="text-sm text-gray-400">Purchase credits to see your history</p>
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

// ==========================================
// HOME PAGE COMPONENT
// ==========================================

export default function Home() {
  const isMobile = useMediaQuery('only screen and (max-width: 768px)')
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isSignedIn } = useUser()
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null)

  // Use shared dashboard data hook (with caching)
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refresh: refreshDashboard } = useDashboardData(5)
  const { stats, interviews, scoreData, spendingData } = dashboardData

  const { isLoading, userCredits } = useAuthCheck()

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

                <ChevronRight className="w-4 h-4" />
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
              <button onClick={() => refreshDashboard(true)} className="ml-2 underline hover:no-underline">Retry</button>
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
                  icon={<MessageSquare />}
                />
                <StatsCard
                  title="Average Score"
                  value={stats?.averageScore ? stats.averageScore : 0}
                  change={stats?.scoreChange}
                  icon={<TrendingUp />}
                />
                <StatsCard
                  title="Total Spent"
                  value={formatCurrency(stats?.totalSpent || 0)}
                  icon={<DollarSign />}
                />
                <StatsCard
                  title="Credits Remaining"
                  value={stats?.creditsRemaining ?? userCredits ?? 0}
                  icon={<Coins />}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Score Evolution */}
                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <TrendingUp className="w-5 h-5 text-voxly-purple" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Score Evolution</h3>
                  </div>
                  <div className="voxly-card">
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
                </div>
                {/* Monthly Spending */}
                <div>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <DollarSign className="w-5 h-5 text-voxly-purple" />
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Monthly Spending</h3>
                  </div>
                  <div className="voxly-card">
                    <div className="chart-container">
                      <SimpleBarChart
                        data={spendingData.map(d => ({ label: d.month, value: d.amount }))}
                        color="#5417C9"
                        height={200}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Interviews */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <MessageSquare className="w-5 h-5 text-voxly-purple" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Interviews</h3>
                </div>
                <div className="voxly-card">
                  {interviews.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <MessageSquare className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-600 mb-2">No interviews yet</p>
                      <p className="text-sm text-gray-400">Start your first interview to see your history here</p>
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
                            <p className="font-medium text-gray-900 truncate">{interview.jobTitle || interview.position}</p>
                            <p className="text-sm text-gray-500">{interview.companyName || interview.company}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDate(interview.createdAt)} • {interview.callDuration ? Math.floor(interview.callDuration / 1000 / 60) : interview.duration || 0} min</p>
                          </div>
                          <div className="flex items-center gap-3 mt-2 sm:mt-0">
                            <ScoreBadge score={interview.score ?? interview.overallScore} />
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Start New Interview CTA Section OR Credit Packages */}
          {(userCredits !== null && userCredits > 0) ? (
            <InterviewReady />
          ) : (
            <div id="credit-packages" className="mt-6 sm:mt-8">
              <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loading /></div>}>
                <CreditPackages onPurchaseComplete={() => refreshDashboard(true)} />
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
    <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50">
      <div className="page-container py-6 sm:py-8">
        {/* Notification banner */}
        {notification && (
          <div className={`mb-6 sm:mb-8 p-4 rounded-xl border shadow-sm ${notification.type === 'incompatibility' ? 'bg-purple-50 border-purple-200 text-purple-800' :
              notification.type === 'early_interruption' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="flex-1 text-sm sm:text-base font-medium">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Unlock Your Next <span className="text-voxly-purple">Opportunity</span>
            </h1>
            <p className="text-gray-600 mt-1">
              AI-powered interview preparation platform
            </p>
          </div>
        </div>

        {/* Hero Section - Logo + Mission */}
        <div className="voxly-card mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <img
              src="/Main.png"
              alt="Voxly"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain flex-shrink-0"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                Ace Every Interview
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Practice with our AI interviewer, get instant feedback, and build confidence.
                Each credit gives you one complete AI interview session with detailed feedback.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loading /></div>}>
          <BodyCopy isMobile={Boolean(isMobile)} />
        </Suspense>

        {/* Credit Packages Section */}
        <div id="form">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Coins className="w-5 h-5 text-voxly-purple" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Choose Your Package</h2>
          </div>
          <Suspense fallback={<div className="h-60 flex items-center justify-center"><Loading /></div>}>
            <CreditPackages />
          </Suspense>
        </div>
      </div>
    </DefaultLayout>
  )
}