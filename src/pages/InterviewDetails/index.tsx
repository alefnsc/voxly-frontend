'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { DefaultLayout } from 'components/default-layout'
import Loading from 'components/loading'
import ContactButton from 'components/contact-button'
import PurpleButton from 'components/ui/purple-button'
import StatsCard from 'components/ui/stats-card'
import apiService, { InterviewDetail } from 'services/APIService'
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
  Hash,
  Plus,
  ChevronRight,
  Download
} from 'lucide-react'
import InterviewReady from 'components/interview-ready'

// Format duration from milliseconds to mm:ss
const formatDuration = (ms: number | null | undefined): string => {
  if (!ms || ms <= 0) return '0:00'
  const totalSeconds = Math.floor(ms / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Score progress bar with dark purple theme
const ScoreBar: React.FC<{ label: string; score: number; icon: React.ReactNode }> = ({ label, score, icon }) => {
  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            {icon}
          </div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-bold text-purple-700">{Math.round(score)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-purple-700 to-purple-500"
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
    <span className="text-gray-700 text-sm sm:text-base">{text}</span>
  </li>
)

export default function InterviewDetails() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoaded, isSignedIn } = useUser()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [interview, setInterview] = useState<InterviewDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchInterviewDetails = useCallback(async () => {
    if (!user?.id || !id) return

    setIsLoading(true)
    setError(null)

    try {
      const details = await apiService.getInterviewDetails(id, user.id)
      setInterview(details)
    } catch (err) {
      console.error('Failed to fetch interview details:', err)
      setError('Failed to load interview details. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, id])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/')
      return
    }

    if (isLoaded && isSignedIn && user?.id && id) {
      fetchInterviewDetails()
    }
  }, [isLoaded, isSignedIn, user?.id, id, navigate, fetchInterviewDetails])

  // Format date for display (includes year)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get performance label
  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return { text: 'Excellent Performance!', color: 'text-green-600' }
    if (score >= 60) return { text: 'Good Performance', color: 'text-blue-600' }
    if (score >= 40) return { text: 'Average Performance', color: 'text-yellow-600' }
    return { text: 'Needs Improvement', color: 'text-red-600' }
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
      <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading />
        </div>
      </DefaultLayout>
    )
  }

  if (error || !interview) {
    return (
      <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50">
        <div className="page-container py-6 sm:py-8">
          <div className="voxly-card text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Interview not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the interview you're looking for.
            </p>
            <PurpleButton
              variant="primary"
              size="lg"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </PurpleButton>
          </div>
        </div>
        <ContactButton />
      </DefaultLayout>
    )
  }

  const performance = interview.feedback ? getPerformanceLabel(interview.feedback.overallScore) :
    interview.score ? getPerformanceLabel(interview.score) : null

  // Get display values (use correct backend field names)
  const displayPosition = interview.jobTitle || interview.position || 'N/A'
  const displayCompany = interview.companyName || interview.company || 'N/A'
  const displayDuration = formatDuration(interview.callDuration)
  const displayScore = interview.score ?? interview.feedback?.overallScore ?? null

  return (
    <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50">
      <div className="page-container py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <ArrowLeft onClick={() => navigate('/')} className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Interview <span className="text-voxly-purple">Details</span>
              </h1>
            </div>
            <p className="text-gray-600 mt-1">
              Review your interview performance and feedback
            </p>
          </div>

          {/* Status Badge and Download Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Download Resume Button */}
            {interview.resumeData && (
              <button
                onClick={handleDownloadResume}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Resume
              </button>
            )}

            {/* Download Feedback Button */}
            {interview.feedbackPdf && (
              <button
                onClick={handleDownloadFeedback}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Feedback
              </button>
            )}

          </div>
        </div>

        {/* Interview Info Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatsCard
            title="Position"
            value={displayPosition}
            icon={<Briefcase />}
            size="small"
          />
          <StatsCard
            title="Company"
            value={displayCompany}
            icon={<Building2 />}
            size="small"
          />
          <StatsCard
            title="Date"
            value={formatDate(interview.createdAt)}
            icon={<Calendar />}
            size="small"
          />
          <StatsCard
            title="Duration"
            value={displayDuration}
            icon={<Clock />}
          />
          <StatsCard
            title="Score"
            value={displayScore !== null ? displayScore : 'N/A'}
            icon={<Award />}
          />
        </div>

        {/* Score and Breakdown Section */}
        {interview.feedback && (
          <>
            {/* Overall Score Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Award className="w-5 h-5 text-voxly-purple" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Performance Score</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Overall Score Card */}
                <div className="voxly-card flex flex-col items-center justify-center text-center py-8">
                  <div className="relative w-36 h-36 mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#5417C9"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${(interview.feedback.overallScore / 100) * 352} 352`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-gray-900">{interview.feedback.overallScore}</span>
                      <span className="text-sm text-gray-500">out of 100</span>
                    </div>
                  </div>
                  <p className={`font-semibold ${performance?.color}`}>
                    {performance?.text}
                  </p>
                </div>

                {/* Score Breakdown Card */}
                <div className="voxly-card lg:col-span-2">
                  <div className="flex items-center gap-2 mb-5">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Score Breakdown</h3>
                  </div>
                  <ScoreBar
                    label="Content Quality"
                    score={interview.feedback.contentScore}
                    icon={<FileText className="w-4 h-4 text-purple-600" />}
                  />
                  <ScoreBar
                    label="Communication"
                    score={interview.feedback.communicationScore}
                    icon={<MessageSquare className="w-4 h-4 text-purple-600" />}
                  />
                  <ScoreBar
                    label="Confidence"
                    score={interview.feedback.confidenceScore}
                    icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
                  />
                  <ScoreBar
                    label="Technical Knowledge"
                    score={interview.feedback.technicalScore}
                    icon={<Target className="w-4 h-4 text-purple-600" />}
                  />

                  {/* Score Explanation */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      <span className="font-medium text-gray-600">How we calculate your score:</span> Our AI analyzes your interview responses across four key dimensions—content quality, communication skills, confidence level, and technical knowledge. Each category is rated on a 0–100% scale based on industry standards and best practices. The overall score is a weighted average reflecting your comprehensive interview performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Mic className="w-5 h-5 text-voxly-purple" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Interview Summary</h2>
              </div>
              <div className="voxly-card">
                <p className="text-gray-700 leading-relaxed">{interview.feedback.summary}</p>
              </div>
            </div>

            {/* Feedback Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-18 sm:mb-20">
              {/* Strengths */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <CheckCircle className="w-5 h-5 text-voxly-purple" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Strengths</h2>
                </div>
                <div className="voxly-card h-full">
                  {interview.feedback.strengths.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No strengths recorded</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {interview.feedback.strengths.map((item, index) => (
                        <FeedbackItem key={index} text={item} colorClass="bg-voxly-purple" />
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Areas for Improvement */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <AlertTriangle className="w-5 h-5 text-voxly-purple" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Improvements</h2>
                </div>
                <div className="voxly-card h-full">
                  {interview.feedback.improvements.length === 0 ? (
                    <div className="text-center py-6">
                      <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No improvements needed</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {interview.feedback.improvements.map((item, index) => (
                        <FeedbackItem key={index} text={item} colorClass="bg-voxly-purple" />
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Lightbulb className="w-5 h-5 text-voxly-purple" />
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recommendations</h2>
                </div>
                <div className="voxly-card h-full">
                  {interview.feedback.recommendations.length === 0 ? (
                    <div className="text-center py-6">
                      <Lightbulb className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No recommendations</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {interview.feedback.recommendations.map((item, index) => (
                        <FeedbackItem key={index} text={item} colorClass="bg-voxly-purple" />
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* No Feedback Message */}
        {!interview.feedback && (
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <BarChart3 className="w-5 h-5 text-voxly-purple" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Performance Feedback</h2>
            </div>
            <div className="voxly-card text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {interview.status === 'IN_PROGRESS'
                  ? 'Feedback will be available once the interview is completed.'
                  : 'No feedback available for this interview.'}
              </p>
              <p className="text-sm text-gray-400">
                {interview.status === 'IN_PROGRESS'
                  ? 'Please complete your interview session to receive AI-generated feedback.'
                  : 'This interview may have ended early or encountered an issue.'}
              </p>
            </div>
          </div>
        )}

        {/* CTA Section */}
       <InterviewReady />
      </div>
      <ContactButton />
    </DefaultLayout>
  )
}
