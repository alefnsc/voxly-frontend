'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from 'contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import Loading from 'components/loading'
import PurpleButton from 'components/ui/purple-button'
import StatsCard from 'components/ui/stats-card'
import apiService, { InterviewDetail } from 'services/APIService'
import { useWorkspace } from 'contexts/WorkspaceContext'
import { b2cInterviewsList } from 'routes/b2cRoutes'
import {
  AnalysisDashboard,
  TranscriptViewer,
  ComparativeBenchmark,
  LearningPath,
  type TimelineDataPoint,
  type SoftSkillsData,
  type TranscriptSegment,
  type BenchmarkData,
  type LearningPathData
} from 'components/analytics'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  MessageSquare,
  FileText,
  Target,
  Mic,
  Award,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react'
import { TitleSplit } from '../../components/ui/TitleSplit'
import { RecordingSection } from './components'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

// Format duration from milliseconds to mm:ss
const formatDuration = (ms: number | null | undefined): string => {
  if (!ms || ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Score progress bar with purple theme (handles null scores gracefully)
const ScoreBar: React.FC<{ label: string; score: number | null; icon: React.ReactNode }> = ({ label, score, icon }) => {
  // Don't render if score is null
  if (score === null) return null
  
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-50 rounded-lg">
            {icon}
          </div>
          <span className="text-sm font-medium text-zinc-700">{label}</span>
        </div>
        <span className="text-sm font-bold text-purple-600">{Math.round(score)}%</span>
      </div>
      <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-700 ease-out bg-purple-600"
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}

// Feedback list item
const FeedbackItem: React.FC<{ text: string; colorClass: string }> = ({ text, colorClass }) => (
  <li className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${colorClass}`} />
    <span className="text-zinc-700 text-sm sm:text-base">{text}</span>
  </li>
)

export default function InterviewDetails() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { userRole } = useWorkspace()

  const [isLoading, setIsLoading] = useState(true)
  const [interview, setInterview] = useState<InterviewDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Analytics state
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([])
  const [softSkills, setSoftSkills] = useState<SoftSkillsData | null>(null)
  const [callDuration, setCallDuration] = useState<number>(0)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [benchmark, setBenchmark] = useState<BenchmarkData | null>(null)
  const [learningPathData, setLearningPathData] = useState<LearningPathData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [transcriptRefreshing, setTranscriptRefreshing] = useState(false)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)

  /**
   * Role-aware back navigation
   * - Personal/Candidate: Go to B2C interviews list
   * - Employee: Go to employee placeholder (or fallback)
   * - Unknown: Safe fallback to B2C interviews
   */
  const handleBackNavigation = useCallback(() => {
    let destination: string;
    
    switch (userRole) {
      case 'candidate':
      case 'admin':
        destination = b2cInterviewsList();
        break;
      case 'employee':
        destination = '/app/employee/interviews';
        break;
      case 'recruiter':
      case 'manager':
        destination = '/app/b2b/interviews';
        break;
      default:
        destination = b2cInterviewsList();
    }
    
    navigate(destination);
  }, [userRole, navigate]);

  /**
   * Manually refresh transcript from Retell
   * Called when transcript wasn't persisted during interview completion
   */
  const handleRefreshTranscript = useCallback(async () => {
    if (!user?.id || !id) return;
    
    setTranscriptRefreshing(true);
    setTranscriptError(null);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || ''}/api/interviews/${id}/transcript/refresh`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to refresh transcript: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success' && data.data?.segments) {
        // Map backend segments to frontend TranscriptSegment format
        const mappedSegments: TranscriptSegment[] = data.data.segments.map((seg: any, index: number) => ({
          id: seg.id || `segment-${index}`,
          speaker: seg.speaker,
          content: seg.content,
          startTime: seg.startTime,
          endTime: seg.endTime,
          sentimentScore: seg.sentimentScore
        }));
        setTranscript(mappedSegments);
      }
    } catch (err: any) {
      console.error('Failed to refresh transcript:', err);
      setTranscriptError(err.message || t('interviewDetails.transcriptRefreshError'));
    } finally {
      setTranscriptRefreshing(false);
    }
  }, [user?.id, id, t]);

  const fetchInterviewDetails = useCallback(async () => {
    if (!user?.id || !id) return

    setIsLoading(true)
    setError(null)

    try {
      const details = await apiService.getInterviewDetails(id, user.id)
      setInterview(details)
    } catch (err) {
      console.error('Failed to fetch interview details:', err)
      setError(t('interviewDetails.loadError'))
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, id, t])

  // Fetch analytics data after interview details are loaded
  const fetchAnalyticsData = useCallback(async () => {
    if (!user?.id || !id || !interview) return
    
    setAnalyticsLoading(true)
    
    try {
      // Fetch all analytics data in parallel
      const [analyticsRes, transcriptRes, benchmarkRes, recommendationsRes] = await Promise.allSettled([
        fetch(`${process.env.REACT_APP_API_URL || ''}/api/interviews/${id}/analytics`, {
          credentials: 'include'
        }),
        fetch(`${process.env.REACT_APP_API_URL || ''}/api/interviews/${id}/transcript`, {
          credentials: 'include'
        }),
        interview.jobTitle ? fetch(`${process.env.REACT_APP_API_URL || ''}/api/benchmarks/${encodeURIComponent(interview.jobTitle)}`, {
          credentials: 'include'
        }) : Promise.reject('No job title'),
        fetch(`${process.env.REACT_APP_API_URL || ''}/api/interviews/${id}/recommendations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      ])
      
      // Process analytics response
      if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
        const data = await analyticsRes.value.json()
        if (data.status === 'success' && data.data) {
          if (data.data.timelineData) setTimelineData(data.data.timelineData)
          if (data.data.softSkills) setSoftSkills(data.data.softSkills)
          if (data.data.callDuration) setCallDuration(data.data.callDuration)
        }
      }
      
      // Process transcript response
      if (transcriptRes.status === 'fulfilled' && transcriptRes.value.ok) {
        const data = await transcriptRes.value.json()
        if (data.status === 'success' && data.data.segments) {
          setTranscript(data.data.segments)
        }
      }
      
      // Process benchmark response
      if (benchmarkRes.status === 'fulfilled' && benchmarkRes.value.ok) {
        const data = await benchmarkRes.value.json()
        if (data.status === 'success') {
          setBenchmark(data.data)
        }
      }
      
      // Process recommendations response
      if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value.ok) {
        const data = await recommendationsRes.value.json()
        if (data.status === 'success' && data.data) {
          setLearningPathData(data.data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [user?.id, id, interview])

  // Handle transcript segment click to seek audio
  const handleSeek = useCallback((timestamp: number) => {
    setCurrentTime(timestamp)
    if (audioRef.current) {
      audioRef.current.currentTime = timestamp
      audioRef.current.play()
    }
  }, [])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/')
      return
    }

    if (isLoaded && isSignedIn && user?.id && id) {
      fetchInterviewDetails()
    }
  }, [isLoaded, isSignedIn, user?.id, id, navigate, fetchInterviewDetails])

  // Fetch analytics data when interview is loaded and completed
  useEffect(() => {
    if (interview && interview.status === 'COMPLETED') {
      fetchAnalyticsData()
    }
  }, [interview, fetchAnalyticsData])

  // Format date for display (includes year)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get performance label with semantic score colors
  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return { text: t('interviewDetails.performance.excellent'), color: 'text-emerald-600' }
    if (score >= 60) return { text: t('interviewDetails.performance.good'), color: 'text-amber-600' }
    if (score >= 40) return { text: t('interviewDetails.performance.average'), color: 'text-yellow-600' }
    return { text: t('interviewDetails.performance.needs'), color: 'text-red-600' }
  }

  // Download resume
  const handleDownloadResume = () => {
    if (!interview?.resumeData || !interview?.resumeFileName) return

    try {
      // Decode base64 and create blob
      const byteCharacters = atob(interview.resumeData)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: interview.resumeMimeType || 'application/pdf' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = interview.resumeFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download resume:', err)
    }
  }

  // Download feedback PDF
  const handleDownloadFeedback = () => {
    if (!interview?.feedbackPdf) return

    try {
      // Decode base64 and create blob
      const byteCharacters = atob(interview.feedbackPdf)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Interview_Feedback_${interview.jobTitle || 'Report'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download feedback:', err)
    }
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loading />
          </div>
        </div>
      </div>
    )
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="p-6 bg-white border border-zinc-200 rounded-xl text-center py-12">
            <AlertTriangle className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-900 mb-2">
              {error || t('interviewDetails.notFound')}
            </h2>
            <p className="text-zinc-600 mb-6">
              {t('interviewDetails.notFoundDesc')}
            </p>
            <PurpleButton
              variant="primary"
              size="lg"
              onClick={handleBackNavigation}
            >
              <ArrowLeft className="w-5 h-5" />
              {t('interviewDetails.backToDashboard')}
            </PurpleButton>
          </div>
        </div>
      </div>
    )
  }

  const performance = interview.feedback ? getPerformanceLabel(interview.feedback.overallScore) :
    interview.score ? getPerformanceLabel(interview.score) : null

  // Get display values (use correct backend field names)
  const displayPosition = interview.jobTitle || interview.position || 'N/A'
  const displayCompany = interview.companyName || interview.company || 'N/A'
  const displayDuration = formatDuration(interview.callDuration)
  // Overall score comes from Interview.score only (no fallback)
  const displayScore = interview.score
  return (
    <div className="min-h-screen bg-zinc-50">
      <motion.div 
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="flex flex-col gap-4 mb-4 sm:mb-6 lg:mb-8" variants={itemVariants}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={handleBackNavigation} 
                className="p-2 -ml-2 hover:bg-zinc-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-600" />
              </button>
              <TitleSplit 
                i18nKey="interviewDetails.title"
                subtitleKey="interviewDetails.subtitle"
                as="h1"
                className="text-xl sm:text-2xl lg:text-3xl"
                containerClassName="flex flex-col gap-1"
                subtitleClassName="text-sm sm:text-base text-zinc-600"
              />
            </div>
          </div>

          {/* Status Badge and Download Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-10 sm:ml-0">
            {/* Download Resume Button */}
            {interview.resumeData && (
              <button
                onClick={handleDownloadResume}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors min-h-[40px]"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('interviewDetails.resume')}</span>
                <span className="sm:hidden">Resume</span>
              </button>
            )}

            {/* Download Feedback Button */}
            {interview.feedbackPdf && (
              <button
                onClick={handleDownloadFeedback}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm font-medium transition-colors min-h-[40px]"
              >
                <Download className="w-4 h-4" />
                {t('interviewDetails.feedbackButton')}
              </button>
            )}

          </div>
        </motion.div>

        {/* Interview Info Stats */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8"
          variants={itemVariants}
        >
          <StatsCard
            title={t('interviewDetails.stats.position')}
            value={displayPosition}
            icon={<Briefcase />}
            size="small"
          />
          <StatsCard
            title={t('interviewDetails.stats.company')}
            value={displayCompany}
            icon={<Building2 />}
            size="small"
          />
          <StatsCard
            title={t('interviewDetails.stats.date')}
            value={formatDate(interview.createdAt)}
            icon={<Calendar />}
            size="small"
          />
          <StatsCard
            title={t('interviewDetails.stats.duration')}
            value={displayDuration}
            icon={<Clock />}
          />
          <StatsCard
            title={t('interviewDetails.stats.score')}
            value={displayScore !== null ? displayScore : 'N/A'}
            icon={<Award />}
          />
        </motion.div>

        {/* Score and Breakdown Section */}
        {interview.feedback && (
          <>
            {/* Overall Score Section */}
            <motion.div className="mb-6 sm:mb-8" variants={itemVariants}>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Award className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('interviewDetails.performanceScore')}</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Overall Score Card */}
                <div className="p-6 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center py-8">
                  <div className="relative w-36 h-36 mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#e4e4e7"
                        strokeWidth="12"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#9333ea"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(interview.feedback.overallScore / 100) * 352} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-zinc-900">{interview.feedback.overallScore}</span>
                      <span className="text-sm text-zinc-500">{t('interviewDetails.outOf100')}</span>
                    </div>
                  </div>
                  <p className={`font-semibold ${performance?.color}`}>
                    {performance?.text}
                  </p>
                </div>

                {/* Score Breakdown Card */}
                <div className="p-6 bg-white border border-zinc-200 rounded-xl lg:col-span-2">
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-zinc-900">{t('interviewDetails.scoreBreakdown')}</h3>
                  </div>
                  <ScoreBar
                    label={t('interviewDetails.scores.content')}
                    score={interview.feedback.contentScore}
                    icon={<FileText className="w-4 h-4 text-purple-600" />}
                  />
                  <ScoreBar
                    label={t('interviewDetails.scores.communication')}
                    score={interview.feedback.communicationScore}
                    icon={<MessageSquare className="w-4 h-4 text-purple-600" />}
                  />
                  <ScoreBar
                    label={t('interviewDetails.scores.confidence')}
                    score={interview.feedback.confidenceScore}
                    icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
                  />
                  <ScoreBar
                    label={t('interviewDetails.scores.technical')}
                    score={interview.feedback.technicalScore}
                    icon={<Target className="w-4 h-4 text-purple-600" />}
                  />

                  {/* Score Explanation */}
                  <div className="mt-6 pt-4 border-t border-zinc-100">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      <span className="font-medium text-zinc-600">{t('interviewDetails.scoreExplanation.title')}</span> {t('interviewDetails.scoreExplanation.desc')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Summary Section */}
            <motion.div className="mb-6 sm:mb-8" variants={itemVariants}>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Mic className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('interviewDetails.summary')}</h2>
              </div>
              <div className="p-6 bg-white border border-zinc-200 rounded-xl">
                <p className="text-zinc-700 leading-relaxed">{interview.feedback.summary}</p>
              </div>
            </motion.div>

            {/* Recording Section */}
            {id && (
              <div className="mb-6 sm:mb-8">
                <RecordingSection interviewId={id} />
              </div>
            )}

            {/* Feedback Sections Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-18 sm:mb-20"
              variants={itemVariants}
            >
              {/* Strengths */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('interviewDetails.sections.strengths')}</h2>
                </div>
                <div className="p-6 bg-white border border-zinc-200 rounded-xl h-full">
                  {interview.feedback.strengths.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">{t('interviewDetails.noStrengths')}</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {interview.feedback.strengths.map((item, index) => (
                        <FeedbackItem key={index} text={item} colorClass="bg-purple-600" />
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Areas for Improvement */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <AlertTriangle className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('interviewDetails.sections.improvements')}</h2>
                </div>
                <div className="p-6 bg-white border border-zinc-200 rounded-xl h-full">
                  {interview.feedback.improvements.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertTriangle className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">{t('interviewDetails.noImprovements')}</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {interview.feedback.improvements.map((item, index) => (
                        <FeedbackItem key={index} text={item} colorClass="bg-purple-600" />
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('interviewDetails.sections.recommendations')}</h2>
                </div>
                <div className="p-6 bg-white border border-zinc-200 rounded-xl h-full">
                  {interview.feedback.recommendations.length === 0 ? (
                    <div className="text-center py-6">
                      <Lightbulb className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">{t('interviewDetails.noRecommendations')}</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {interview.feedback.recommendations.map((item, index) => (
                        <FeedbackItem key={index} text={item} colorClass="bg-purple-600" />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Advanced Analytics Section */}
            {(softSkills || transcript.length > 0 || benchmark || learningPathData) && (
              <motion.div 
                className="mt-8 pt-8 border-t border-zinc-200"
                variants={itemVariants}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6">
                  {t('interviewDetails.analytics.title')} <span className="text-purple-600">{t('interviewDetails.analytics.highlight')}</span>
                </h2>
                
                {/* Analysis Dashboard - Radar + Timeline */}
                {softSkills && (
                  <div className="mb-6 sm:mb-8">
                    <AnalysisDashboard 
                      timelineData={timelineData}
                      softSkills={softSkills}
                      callDuration={callDuration}
                    />
                  </div>
                )}

                {/* Two Column Layout for Transcript and Benchmark */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
                  {/* Transcript Viewer or Empty State */}
                  {transcript.length > 0 ? (
                    <TranscriptViewer
                      segments={transcript}
                      currentTime={currentTime}
                      onSeek={handleSeek}
                    />
                  ) : interview.status === 'COMPLETED' ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-zinc-900">{t('interviewDetails.transcript.title')}</h3>
                      </div>
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <p className="text-zinc-600 mb-2">{t('interviewDetails.transcript.notAvailable')}</p>
                        <p className="text-sm text-zinc-400 mb-4">{t('interviewDetails.transcript.refreshHint')}</p>
                        {transcriptError && (
                          <p className="text-sm text-red-500 mb-4">{transcriptError}</p>
                        )}
                        <button
                          onClick={handleRefreshTranscript}
                          disabled={transcriptRefreshing}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className={`w-4 h-4 ${transcriptRefreshing ? 'animate-spin' : ''}`} />
                          {transcriptRefreshing ? t('interviewDetails.transcript.refreshing') : t('interviewDetails.transcript.refreshButton')}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Comparative Benchmark */}
                  {benchmark && (
                    <ComparativeBenchmark
                      data={benchmark}
                    />
                  )}
                </div>

                {/* Learning Path - Full Width */}
                {learningPathData && (
                  <div className="mb-6 sm:mb-8">
                    <LearningPath data={learningPathData} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Analytics Loading State */}
            {analyticsLoading && (
              <motion.div 
                className="mt-8 pt-8 border-t border-zinc-200"
                variants={itemVariants}
              >
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-500">{t('interviewDetails.loadingAnalytics')}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* No Feedback Message */}
        {!interview.feedback && (
          <motion.div className="mb-6 sm:mb-8" variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">Performance Feedback</h2>
            </div>
            <div className="p-6 bg-white border border-zinc-200 rounded-xl text-center py-12">
              <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-600 mb-2">
                {interview.status === 'IN_PROGRESS'
                  ? 'Feedback will be available once the interview is completed.'
                  : 'No feedback available for this interview.'}
              </p>
              <p className="text-sm text-zinc-400">
                {interview.status === 'IN_PROGRESS'
                  ? 'Please complete your interview session to receive AI-generated feedback.'
                  : 'This interview may have ended early or encountered an issue.'}
              </p>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  )
}
