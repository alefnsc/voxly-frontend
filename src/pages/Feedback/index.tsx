'use client';
import jsPDF from "jspdf";
import { useLocation, useNavigate } from 'react-router-dom';
import { DefaultLayout } from 'components/default-layout'
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useUser } from 'contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import APIService from "services/APIService";
import ScoreDisplay from 'components/score-display';
import { Card } from "components/ui/card";
import { Button } from "components/ui/button";
import { Separator } from "components/ui/separator";
import TextBox from "components/ui/text-box";
import { TitleSplit } from 'components/ui/TitleSplit';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, RotateCcw, Home, BookOpen, Target, MessageCircle } from 'lucide-react';
import InterviewBreadcrumbs from 'components/interview-breadcrumbs';
import { useInterviewFlow } from 'hooks/use-interview-flow';
import PurpleButton from 'components/ui/purple-button';
import { 
  StructuredFeedback, 
  FeedbackApiResponse, 
  hasStructuredFeedback,
  CompetencyScore,
  StudyPlanItem,
  CommunicationAnalysis
} from 'types/feedback';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

// Skeleton component for loading states
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// Section skeleton component
const SectionSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
    ))}
  </div>
);

// Score skeleton with circular progress indicator
const ScoreSkeleton = () => (
  <div className="flex flex-col items-center space-y-3">
    <Skeleton className="w-32 h-32 rounded-full" />
    <Skeleton className="h-6 w-24" />
  </div>
);

/**
 * Generate PDF report and return as base64 string
 */
function generateFeedbackPdf(params: {
  candidateName: string;
  score: number;
  summary: string;
  feedback: string;
  jobDescription: string;
}): string {
  const { candidateName, score, summary, feedback, jobDescription } = params;
  const doc = new jsPDF();
  let y = 20;
  const pageHeight = 280;
  const margin = 15;
  const maxWidth = doc.internal.pageSize.getWidth() - (margin * 2);
  const lineHeight = 6;

  const initializePage = () => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight) {
      doc.addPage();
      initializePage();
      y = 20;
    }
  };

  const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [55, 65, 81]) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkPageBreak(lineHeight);
      doc.text(line, margin, y);
      y += lineHeight;
    });
  };

  const addSection = (title: string, content: string) => {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(88, 28, 135);
    doc.text(title, margin, y);
    y += 8;
    
    const cleanContent = content
      .replace(/^##?\s*/gm, '')
      .replace(/^\*\*(.+?)\*\*/gm, '$1')
      .replace(/^\*(.+?)\*/gm, '$1')
      .trim();
    
    addText(cleanContent, 11, false, [55, 65, 81]);
    y += 6;
  };

  initializePage();

  // Title
  doc.setTextColor(88, 28, 135);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Interview Feedback Report", margin, y);
  y += 12;

  // Candidate info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text(`Candidate: ${candidateName}`, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(`Score: ${score}%`, margin, y);
  y += 12;

  if (summary) addSection("Summary", summary);
  if (feedback) addSection("Detailed Feedback", feedback);
  if (jobDescription) addSection("Job Description", jobDescription);

  // Return as base64 (without data URL prefix)
  return doc.output('datauristring').split(',')[1];
}

const Feedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useTranslation();
  const state = location.state;
  const { setStage, resetFlow } = useInterviewFlow();

  // Set stage to feedback on mount and invalidate dashboard cache
  useEffect(() => {
    setStage('feedback');
    // Invalidate interview caches so dashboard shows updated data
    if (user?.id) {
      APIService.invalidateInterviewCaches(user.id);
    }
  }, [setStage, user?.id]);

  // Progressive loading states - each section loads independently
  const [scoreLoading, setScoreLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [studyPlanLoading, setStudyPlanLoading] = useState(true);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Context data (available immediately from state)
  const [jobDescription, setJobDescription] = useState('');
  const [candidateName, setCandidateName] = useState('');
  
  // Processed data
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  
  // Structured feedback state (v2.0)
  const [competencies, setCompetencies] = useState<CompetencyScore[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);
  const [communication, setCommunication] = useState<CommunicationAnalysis | null>(null);
  const [feedbackVersion, setFeedbackVersion] = useState<'1.0' | '2.0'>('1.0');
  
  // Polling state
  const [processingStatus, setProcessingStatus] = useState<'pending' | 'processing' | 'partial' | 'completed'>('pending');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedPolling = useRef(false);
  
  // Set context data immediately from state
  useEffect(() => {
    if (state?.metadata) {
      setCandidateName(state.metadata.first_name || 'Candidate');
      setJobDescription(state.metadata.job_description || 'No job description available');
    }
  }, [state]);

  // Fetch feedback when status indicates data is ready
  const fetchFeedback = useCallback(async () => {
    if (!state?.call_id) return;
    
    try {
      const seniority = state?.metadata?.seniority || 'mid';
      const language = state?.metadata?.preferred_language || 'en';
      
      const response = await APIService.getFeedback(state.call_id, {
        structured: true,
        seniority: seniority as any,
        language: language as any
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response');
      }

      const json: FeedbackApiResponse = await response.json();
      
      if (!response.ok) {
        // Don't throw, just log - data may still be processing
        console.log('Feedback not ready yet:', json.message);
        return false;
      }
      
      setFeedbackVersion(json.version || '1.0');
      
      if (hasStructuredFeedback(json) && json.structured_feedback) {
        const sf = json.structured_feedback;
        setScore(sf.overallScore);
        setSummary(sf.executiveSummary);
        setCompetencies(sf.competencies);
        setCommunication(sf.communication);
        
        const feedbackParts = [];
        if (sf.strengths?.length) {
          feedbackParts.push('## 💪 Strengths\n' + sf.strengths.map(s => 
            `- **${s.title}**: ${s.evidence}`
          ).join('\n'));
        }
        if (sf.improvements?.length) {
          feedbackParts.push('## 📈 Areas for Improvement\n' + sf.improvements.map(i => 
            `- **${i.title}**: ${i.howToImprove}`
          ).join('\n'));
        }
        if (sf.highlights?.length) {
          const positives = sf.highlights.filter(h => h.type === 'positive');
          const negatives = sf.highlights.filter(h => h.type === 'negative');
          if (positives.length) {
            feedbackParts.push('## ✨ Best Moments\n' + positives.map(h => 
              `> "${h.quote}"\n\n_${h.analysis}_`
            ).join('\n\n'));
          }
          if (negatives.length) {
            feedbackParts.push('## ⚠️ Areas to Revisit\n' + negatives.map(h => 
              `> "${h.quote}"\n\n_${h.analysis}_`
            ).join('\n\n'));
          }
        }
        setFeedback(feedbackParts.join('\n\n'));
        
        // Set study plan if present
        if (sf.studyPlan?.length) {
          setStudyPlan(sf.studyPlan);
          setStudyPlanLoading(false);
        }
        
        setScoreLoading(false);
        setFeedbackLoading(false);
        return true;
      } else if (json.feedback) {
        // Legacy v1.0 format
        setSummary(json.feedback.detailed_feedback || '');
        const percentageScore = json.feedback.overall_rating ? json.feedback.overall_rating * 20 : 0;
        setScore(percentageScore);
        
        const feedbackParts = [];
        if (json.feedback.strengths?.length) {
          feedbackParts.push('## Strengths\n' + json.feedback.strengths.map((s: string) => `- ${s}`).join('\n'));
        }
        if (json.feedback.areas_for_improvement?.length) {
          feedbackParts.push('## Areas for Improvement\n' + json.feedback.areas_for_improvement.map((a: string) => `- ${a}`).join('\n'));
        }
        if (json.feedback.recommendations?.length) {
          feedbackParts.push('## Recommendations\n' + json.feedback.recommendations.map((r: string) => `- ${r}`).join('\n'));
        }
        setFeedback(feedbackParts.join('\n\n') || json.feedback.detailed_feedback || '');
        
        setScoreLoading(false);
        setFeedbackLoading(false);
        return true;
      }
      
      return false;
    } catch (err: any) {
      console.error("Failed to fetch feedback:", err);
      return false;
    }
  }, [state]);

  // Poll for processing status
  const pollStatus = useCallback(async () => {
    if (!state?.interview_id || !user?.id) return;
    
    try {
      const status = await APIService.getPostCallStatus(state.interview_id, user.id);
      setProcessingStatus(status.processingStatus);
      
      // Update score immediately if available
      if (status.overallScore !== null && scoreLoading) {
        setScore(status.overallScore);
        setScoreLoading(false);
      }
      
      // Fetch full feedback data when available
      if ((status.hasFeedback || status.hasMetrics) && feedbackLoading) {
        await fetchFeedback();
      }
      
      // Study plan loaded separately from metrics
      if (status.hasStudyPlan && studyPlanLoading) {
        // Feedback fetch includes study plan
        await fetchFeedback();
      }
      
      // Stop polling when all data is ready
      if (status.processingStatus === 'completed') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err: any) {
      console.error("Status poll failed:", err);
    }
  }, [state?.interview_id, user?.id, scoreLoading, feedbackLoading, studyPlanLoading, fetchFeedback]);

  // Start polling on mount
  useEffect(() => {
    if (!state?.interview_id || !user?.id || hasStartedPolling.current) return;
    
    if (!state?.call_id) {
      setError(t('feedback.noData'));
      setScoreLoading(false);
      setFeedbackLoading(false);
      setStudyPlanLoading(false);
      return;
    }
    
    hasStartedPolling.current = true;
    
    // Initial poll immediately
    pollStatus();
    
    // Then poll every 2 seconds with exponential backoff
    let pollInterval = 2000;
    const maxInterval = 10000;
    
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        pollStatus();
        
        // Increase interval up to max
        if (pollInterval < maxInterval) {
          pollInterval = Math.min(pollInterval * 1.5, maxInterval);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = setInterval(pollStatus, pollInterval);
          }
        }
      }, pollInterval);
    };
    
    startPolling();
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [state?.interview_id, state?.call_id, user?.id, pollStatus, t]);

  // Handlers
  const handleDownloadTranscript = useCallback(() => {
    const pdfBase64 = generateFeedbackPdf({
      candidateName,
      score,
      summary,
      feedback,
      jobDescription
    });
    
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${candidateName.replace(/\s+/g, '_')}_feedback_report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, [candidateName, score, summary, feedback, jobDescription]);

  const handleRetryInterview = useCallback(() => {
    resetFlow();
    navigate('/interview-setup');
  }, [navigate, resetFlow]);

  const handleBackToDashboard = useCallback(() => {
    resetFlow();
    navigate('/');
  }, [navigate, resetFlow]);

  const handleScoreChange = useCallback((newScore: number) => {
    console.log('Score updated:', newScore);
  }, []);

  const getResultText = useCallback(() => {
    if (score >= 80) return t('feedback.results.outstanding');
    if (score >= 60) return t('feedback.results.great');
    if (score >= 40) return t('feedback.results.good');
    if (score >= 20) return t('feedback.results.room');
    return t('feedback.results.keep');
  }, [score, t]);

  // Error state
  if (error) {
    return (
      <DefaultLayout className="flex flex-col items-center justify-center bg-zinc-50 min-h-screen">
        <Card className="max-w-md p-8 text-center bg-white border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('feedback.error.title')}</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={handleRetryInterview}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {t('feedback.error.returnHome')}
          </Button>
        </Card>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="flex flex-col overflow-hidden items-center bg-zinc-50 min-h-screen py-6 sm:py-10">
      {/* Breadcrumbs */}
      <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 mb-6">
        <InterviewBreadcrumbs
          currentStage="feedback"
          showBackArrow={true}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="xl:w-[80%] lg:w-[90%] w-[95%] flex flex-col max-w-5xl"
      >
        <Card className="flex flex-col p-4 sm:p-6 md:p-8 relative items-center justify-center mb-12 shadow-lg bg-white border border-gray-200">
          {/* Header - Shows immediately */}
          <motion.div variants={itemVariants}>
            <TitleSplit 
              i18nKey="feedback.title"
              subtitleKey="feedback.subtitle"
              as="h1"
              className="text-3xl sm:text-4xl lg:text-5xl mt-4 sm:mt-6 mb-2"
              containerClassName="flex flex-col items-center gap-2"
              subtitleClassName="text-base sm:text-lg text-zinc-600 text-center"
            />
          </motion.div>

          {/* Candidate Name - Shows immediately from state */}
          <motion.p 
            className='text-lg sm:text-xl font-medium text-purple-600 mb-2'
            variants={itemVariants}
          >
            {candidateName}
          </motion.p>

          {/* Result Message - Shows skeleton until score loaded */}
          <motion.p 
            className='text-base sm:text-lg text-gray-600 mb-4'
            variants={itemVariants}
          >
            {scoreLoading ? <Skeleton className="h-6 w-48 mx-auto" /> : getResultText()}
          </motion.p>

          {/* Score Display - Progressive loading */}
          <motion.div className="w-full max-w-md mb-6 px-4" variants={itemVariants}>
            {scoreLoading ? (
              <ScoreSkeleton />
            ) : (
              <ScoreDisplay score={score} onScoreChange={handleScoreChange} size="lg" />
            )}
          </motion.div>

          <Separator className="bg-gray-200 mb-6" />

          {/* Content Sections */}
          <motion.div 
            className="flex flex-col items-center space-y-6 w-full"
            variants={itemVariants}
          >
            {/* Summary Section */}
            <div className="w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
                {t('feedback.sections.summary')}
              </h2>
              <TextBox>
                {feedbackLoading ? (
                  <SectionSkeleton lines={4} />
                ) : (
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-gray prose-sm sm:prose-base max-w-none
                      prose-headings:text-gray-800 prose-headings:font-semibold
                    prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-li:text-gray-600
                    prose-strong:text-gray-800"
                >
                  {summary || t('feedback.noSummary')}
                </Markdown>
              )}
            </TextBox>
          </div>

          {/* Feedback Section */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
              {t('feedback.sections.detailed')}
            </h2>
            <TextBox>
              {feedbackLoading ? (
                <SectionSkeleton lines={6} />
              ) : (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-gray prose-sm sm:prose-base max-w-none
                    prose-headings:text-gray-800 prose-headings:font-semibold
                    prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-li:text-gray-600
                    prose-strong:text-gray-800"
                >
                  {feedback || t('feedback.noFeedback')}
                </Markdown>
              )}
            </TextBox>
          </div>

          <Separator className="bg-gray-200" />

          {/* Competencies Section (v2.0 only) */}
          {feedbackVersion === '2.0' && (
            <div className="w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <Target className="w-5 h-5 text-purple-500 mr-3" />
                {t('feedback.sections.competencies', 'Competency Breakdown')}
              </h2>
              {feedbackLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-2 w-full mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : competencies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {competencies.map((comp, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{comp.name}</span>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          comp.score >= 4 ? 'bg-green-100 text-green-700' :
                          comp.score >= 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {comp.score.toFixed(1)}/5
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            comp.score >= 4 ? 'bg-green-500' :
                            comp.score >= 3 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(comp.score / 5) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600">{comp.evidence}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Communication Analysis (v2.0 only) */}
          {feedbackVersion === '2.0' && (
            <div className="w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <MessageCircle className="w-5 h-5 text-purple-500 mr-3" />
                {t('feedback.sections.communication', 'Communication Analysis')}
              </h2>
              {feedbackLoading ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="h-8 w-12 mx-auto mb-2" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : communication ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{communication.overallScore}/5</div>
                      <div className="text-xs text-gray-500">{t('feedback.communication.overall', 'Overall')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{communication.pace.wpm}</div>
                      <div className="text-xs text-gray-500">{t('feedback.communication.wpm', 'Words/min')}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        communication.fillerWords.frequency === 'none' || communication.fillerWords.frequency === 'low' 
                          ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {communication.fillerWords.count}
                      </div>
                      <div className="text-xs text-gray-500">{t('feedback.communication.fillers', 'Filler words')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">{communication.clarity.score}/5</div>
                      <div className="text-xs text-gray-500">{t('feedback.communication.clarity', 'Clarity')}</div>
                    </div>
                  </div>
                  {communication.structure.usedFrameworks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-sm text-gray-600">{t('feedback.communication.frameworks', 'Frameworks used')}:</span>
                      {communication.structure.usedFrameworks.map((fw, idx) => (
                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {fw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Study Plan - Progressive loading */}
          {feedbackVersion === '2.0' && (
            <div className="w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
                <BookOpen className="w-5 h-5 text-purple-500 mr-3" />
                {t('feedback.sections.studyPlan', 'Personalized Study Plan')}
              </h2>
              {studyPlanLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : studyPlan.length > 0 ? (
                <div className="space-y-3">
                  {studyPlan.sort((a, b) => a.priority - b.priority).map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            item.priority === 1 ? 'bg-red-100 text-red-700' :
                            item.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {item.priority}
                          </span>
                          {item.topic}
                        </h3>
                        <span className="text-xs text-gray-500">
                          ~{item.estimatedHours}h
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.rationale}</p>
                      {item.exercises.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">{t('feedback.studyPlan.exercises', 'Suggested exercises')}:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {item.exercises.slice(0, 3).map((ex, exIdx) => (
                              <li key={exIdx}>{ex}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          <Separator className="bg-gray-200" />

          {/* Job Description Section - Shows immediately from state */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-2 h-6 bg-gray-400 rounded-full mr-3"></span>
              {t('feedback.sections.jobDescription')}
            </h2>
            <TextBox className="bg-gray-100">
              <p className="text-gray-600 whitespace-pre-wrap">{jobDescription}</p>
            </TextBox>
          </div>

          {/* Action Buttons - Disable download until data loaded */}
          <div className="flex flex-col sm:flex-row justify-center w-full items-center gap-3 sm:gap-4 pt-4">
            <Button
              className="w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownloadTranscript}
              disabled={feedbackLoading}
              aria-label={t('feedback.buttons.downloadAria')}
            >
              <Download className="w-4 h-4" />
              {t('feedback.buttons.download')}
            </Button>
            <Button
              className="w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 font-medium border-gray-300 text-gray-700 hover:bg-gray-100"
              variant="outline"
              onClick={handleRetryInterview}
              aria-label={t('feedback.buttons.newInterviewAria')}
            >
              <RotateCcw className="w-4 h-4" />
              {t('feedback.buttons.newInterview')}
            </Button>
          </div>
          
          {/* Processing status indicator */}
          {processingStatus !== 'completed' && (
            <div className="text-center text-sm text-gray-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              {processingStatus === 'pending' && t('feedback.processing.pending', 'Waiting for interview data...')}
              {processingStatus === 'processing' && t('feedback.processing.analyzing', 'Analyzing your interview...')}
              {processingStatus === 'partial' && t('feedback.processing.loading', 'Loading additional insights...')}
            </div>
          )}
          </motion.div>
        </Card>
      </motion.div>
      <PurpleButton
        variant="outline"
        size="md"
        onClick={handleBackToDashboard}
        className="w-full sm:w-auto mt-4"
      >
        <Home className="w-4 h-4" />
        {t('feedback.buttons.backToDashboard')}
      </PurpleButton>
    </DefaultLayout>
  );
}

export default Feedback;