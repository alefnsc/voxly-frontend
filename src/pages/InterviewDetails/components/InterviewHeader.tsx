/**
 * Interview Header Component
 * 
 * Displays the page header with back navigation, title, and action buttons.
 * Uses role-aware back navigation.
 * 
 * @module pages/InterviewDetails/components/InterviewHeader
 */

'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download } from 'lucide-react';
import { useWorkspace } from 'contexts/WorkspaceContext';
import { b2cInterviewsList } from 'routes/b2cRoutes';
import { cn } from 'lib/utils';
import { TitleSplit } from 'components/ui/TitleSplit';

// ========================================
// TYPES
// ========================================

interface InterviewHeaderProps {
  /** Whether resume data is available for download */
  hasResumeData?: boolean;
  /** Whether feedback PDF is available for download */
  hasFeedbackPdf?: boolean;
  /** Handler for resume download */
  onDownloadResume?: () => void;
  /** Handler for feedback PDF download */
  onDownloadFeedback?: () => void;
  /** Additional className */
  className?: string;
}

// ========================================
// COMPONENT
// ========================================

export const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  hasResumeData = false,
  hasFeedbackPdf = false,
  onDownloadResume,
  onDownloadFeedback,
  className,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { userRole } = useWorkspace();

  /**
   * Role-aware back navigation
   * - Personal/Candidate: Go to B2C interviews list
   * - Employee: Go to employee placeholder (or fallback)
   * - Unknown: Safe fallback to B2C interviews
   */
  const handleBack = () => {
    // Determine destination based on user role
    let destination: string;
    
    switch (userRole) {
      case 'candidate':
      case 'admin':
        // Personal B2C users go to interviews list
        destination = b2cInterviewsList();
        break;
      case 'employee':
        // Employee portal - placeholder route or fallback
        destination = '/app/employee/interviews';
        break;
      case 'recruiter':
      case 'manager':
        // B2B users - placeholder route or fallback
        destination = '/app/b2b/interviews';
        break;
      default:
        // Safe fallback for unknown roles
        destination = b2cInterviewsList();
    }
    
    navigate(destination);
  };

  return (
    <div className={cn('flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6', className)}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={handleBack}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="w-5 h-5 text-zinc-600 hover:text-zinc-900 transition-colors" />
          </button>
          <TitleSplit 
            i18nKey="interviewDetails.title"
            subtitleKey="interviewDetails.subtitle"
            as="h1"
            className="text-2xl sm:text-3xl"
            containerClassName="flex flex-col gap-1"
            subtitleClassName="text-zinc-600"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Download Resume Button */}
        {hasResumeData && onDownloadResume && (
          <button
            onClick={onDownloadResume}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('interviewDetails.resume', 'Resume')}
          </button>
        )}

        {/* Download Feedback Button */}
        {hasFeedbackPdf && onDownloadFeedback && (
          <button
            onClick={onDownloadFeedback}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('interviewDetails.feedbackButton', 'Feedback PDF')}
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewHeader;
