'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { DefaultLayout } from 'components/default-layout'
import Loading from 'components/loading'
import apiService, { InterviewDetail } from 'services/APIService'
import { ArrowLeft } from 'lucide-react'

// Score badge component
const ScoreBadge: React.FC<{ score: number | null; size?: 'sm' | 'lg' }> = ({ score, size = 'sm' }) => {
  if (score === null) {
    return <span className={`score-badge bg-gray-100 text-gray-600 ${size === 'lg' ? 'text-lg px-4 py-2' : ''}`}>N/A</span>
  }

  let badgeClass = 'score-badge-needs-improvement'
  if (score >= 80) badgeClass = 'score-badge-excellent'
  else if (score >= 60) badgeClass = 'score-badge-good'
  else if (score >= 40) badgeClass = 'score-badge-average'

  return (
    <span className={`score-badge ${badgeClass} ${size === 'lg' ? 'text-lg px-4 py-2' : ''}`}>
      {score}%
    </span>
  )
}

// Score progress bar component
const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  let color = 'bg-red-500'
  if (score >= 80) color = 'bg-green-500'
  else if (score >= 60) color = 'bg-blue-500'
  else if (score >= 40) color = 'bg-yellow-500'

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-700">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// Feedback section component
const FeedbackSection: React.FC<{ 
  title: string; 
  items: string[]; 
  icon: React.ReactNode;
  colorClass: string 
}> = ({ title, items, icon, colorClass }) => (
  <div className="voxly-card">
    <div className="flex items-center gap-2 mb-4">
      <div className={`p-2 rounded-lg ${colorClass}`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    {items.length === 0 ? (
      <p className="text-gray-500 italic">No {title.toLowerCase()} recorded</p>
    ) : (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorClass.replace('bg-opacity-10', '').replace('text-', 'bg-')}`} />
            <span className="text-gray-700">{item}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isLoaded || isLoading) {
    return <Loading />
  }

  if (error || !interview) {
    return (
      <DefaultLayout className="bg-gray-50">
        <div className="page-container py-6 sm:py-8">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Interview not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the interview you're looking for.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-voxly"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DefaultLayout>
    )
  }

  return (
    <DefaultLayout className="bg-gray-50">
      <div className="page-container py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Interview <span className="text-voxly-purple">Details</span>
              </h1>
              <p className="text-gray-600">
                {interview.position} at {interview.company}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(interview.createdAt)} • {interview.duration} minutes
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ScoreBadge score={interview.overallScore} size="lg" />
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                interview.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {interview.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Score and Breakdown */}
        {interview.feedback && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Overall Score Card */}
              <div className="voxly-card lg:col-span-1 flex flex-col items-center justify-center text-center py-8">
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Overall Score</p>
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90">
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
                  <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-900">
                    {interview.feedback.overallScore}%
                  </span>
                </div>
                <p className="text-gray-600">
                  {interview.feedback.overallScore >= 80 ? 'Excellent Performance!' :
                   interview.feedback.overallScore >= 60 ? 'Good Performance' :
                   interview.feedback.overallScore >= 40 ? 'Average Performance' :
                   'Needs Improvement'}
                </p>
              </div>

              {/* Score Breakdown Card */}
              <div className="voxly-card lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Score Breakdown</h3>
                <ScoreBar label="Content Quality" score={interview.feedback.contentScore} />
                <ScoreBar label="Communication" score={interview.feedback.communicationScore} />
                <ScoreBar label="Confidence" score={interview.feedback.confidenceScore} />
                <ScoreBar label="Technical Knowledge" score={interview.feedback.technicalScore} />
              </div>
            </div>

            {/* Summary */}
            <div className="voxly-card mb-6 sm:mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
              <p className="text-gray-700 leading-relaxed">{interview.feedback.summary}</p>
            </div>

            {/* Feedback Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <FeedbackSection
                title="Strengths"
                items={interview.feedback.strengths}
                colorClass="bg-green-100 text-green-600"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
              <FeedbackSection
                title="Areas for Improvement"
                items={interview.feedback.improvements}
                colorClass="bg-yellow-100 text-yellow-600"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />
              <FeedbackSection
                title="Recommendations"
                items={interview.feedback.recommendations}
                colorClass="bg-purple-100 text-purple-600"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                }
              />
            </div>
          </>
        )}

        {/* No feedback message */}
        {!interview.feedback && (
          <div className="voxly-card text-center py-12 mb-6 sm:mb-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-600">
              {interview.status === 'in_progress' 
                ? 'Feedback will be available once the interview is completed.'
                : 'No feedback available for this interview.'}
            </p>
          </div>
        )}

        {/* Interview Reference */}
        <div className="voxly-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Reference</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Interview ID</p>
              <p className="font-mono text-gray-700">{interview.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Retell Call ID</p>
              <p className="font-mono text-gray-700">{interview.retellCallId}</p>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}
