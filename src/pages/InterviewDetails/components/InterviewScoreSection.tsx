/**
 * Interview Score Section Component
 * 
 * Displays overall score and score breakdown with progress bars.
 * 
 * @module pages/InterviewDetails/components/InterviewScoreSection
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Award, BarChart3, FileText, MessageSquare, TrendingUp, Target } from 'lucide-react';

// ========================================
// TYPES
// ========================================

interface FeedbackScores {
  overallScore: number;
  contentScore: number | null;
  communicationScore: number | null;
  confidenceScore: number | null;
  technicalScore: number | null;
}

interface InterviewScoreSectionProps {
  feedback: FeedbackScores;
}

// ========================================
// HELPER COMPONENTS
// ========================================

const ScoreBar: React.FC<{ label: string; score: number | null; icon: React.ReactNode }> = ({ label, score, icon }) => {
  // Don't render if score is null
  if (score === null) return null;
  
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
  );
};

// ========================================
// COMPONENT
// ========================================

export const InterviewScoreSection: React.FC<InterviewScoreSectionProps> = ({ feedback }) => {
  const { t } = useTranslation();

  // Get performance label based on score
  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return { text: t('interviewDetails.performance.excellent', 'Excellent'), color: 'text-purple-600' };
    if (score >= 60) return { text: t('interviewDetails.performance.good', 'Good'), color: 'text-purple-500' };
    if (score >= 40) return { text: t('interviewDetails.performance.average', 'Average'), color: 'text-zinc-600' };
    return { text: t('interviewDetails.performance.needs', 'Needs Improvement'), color: 'text-zinc-500' };
  };

  const performance = getPerformanceLabel(feedback.overallScore);

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Award className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
          {t('interviewDetails.performanceScore', 'Performance Score')}
        </h2>
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
                strokeDasharray={`${(feedback.overallScore / 100) * 352} 352`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-zinc-900">{feedback.overallScore}</span>
              <span className="text-sm text-zinc-500">{t('interviewDetails.outOf100', 'out of 100')}</span>
            </div>
          </div>
          <p className={`font-semibold ${performance.color}`}>
            {performance.text}
          </p>
        </div>

        {/* Score Breakdown Card */}
        <div className="p-6 bg-white border border-zinc-200 rounded-xl lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-zinc-900">
              {t('interviewDetails.scoreBreakdown', 'Score Breakdown')}
            </h3>
          </div>
          <ScoreBar
            label={t('interviewDetails.scores.content', 'Content Quality')}
            score={feedback.contentScore}
            icon={<FileText className="w-4 h-4 text-purple-600" />}
          />
          <ScoreBar
            label={t('interviewDetails.scores.communication', 'Communication')}
            score={feedback.communicationScore}
            icon={<MessageSquare className="w-4 h-4 text-purple-600" />}
          />
          <ScoreBar
            label={t('interviewDetails.scores.confidence', 'Confidence')}
            score={feedback.confidenceScore}
            icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
          />
          <ScoreBar
            label={t('interviewDetails.scores.technical', 'Technical Skills')}
            score={feedback.technicalScore}
            icon={<Target className="w-4 h-4 text-purple-600" />}
          />

          {/* Score Explanation */}
          <div className="mt-6 pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500 leading-relaxed">
              <span className="font-medium text-zinc-600">
                {t('interviewDetails.scoreExplanation.title', 'How we score:')}
              </span>{' '}
              {t('interviewDetails.scoreExplanation.desc', 'Scores are based on AI analysis of your responses, communication clarity, and technical accuracy.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScoreSection;
