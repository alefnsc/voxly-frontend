'use client';
import jsPDF from "jspdf";
import { useLocation, useNavigate } from 'react-router-dom';
import { DefaultLayout } from 'components/default-layout'
import { useEffect, useState, useCallback, useRef } from 'react';
import APIService from "services/APIService";
import Loading from 'components/loading';
import StarRating from 'components/star-rate/StarRating';
import { Card } from "components/ui/card";
import { Button } from "components/ui/button";
import { Separator } from "components/ui/separator";
import TextBox from "components/ui/text-box";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, RotateCcw } from 'lucide-react';

const Feedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('3');
  const [rating, setRating] = useState(0);
  
  // Prevent double fetching
  const hasFetched = useRef(false);

  const fetchFeedback = useCallback(async () => {
    if (!state?.call_id || hasFetched.current) {
      if (!state?.call_id) {
        setError('No interview data found. Please complete an interview first.');
        setIsLoading(false);
      }
      return;
    }

    hasFetched.current = true;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await APIService.getFeedback(state.call_id);
      
      // Check content type to avoid parsing HTML as JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Received non-JSON response:', contentType);
        throw new Error('Server returned an invalid response. The backend may not be running or accessible.');
      }
      
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `Error: ${json.status}`);
      }

      // Set metadata from state
      setCandidateName(state?.metadata?.first_name || 'Candidate');
      setJobDescription(state?.metadata?.job_description || 'No job description available');
      
      // Set feedback data - handle different response structures
      if (json.feedback) {
        setSummary(json.feedback.detailed_feedback || json.summary || '');
        setScore(String(json.feedback.overall_rating || 3));
        
        // Format feedback from structured data
        const feedbackParts = [];
        if (json.feedback.strengths?.length) {
          feedbackParts.push('## Strengths\n' + json.feedback.strengths.map(s => `- ${s}`).join('\n'));
        }
        if (json.feedback.areas_for_improvement?.length) {
          feedbackParts.push('## Areas for Improvement\n' + json.feedback.areas_for_improvement.map(a => `- ${a}`).join('\n'));
        }
        if (json.feedback.recommendations?.length) {
          feedbackParts.push('## Recommendations\n' + json.feedback.recommendations.map(r => `- ${r}`).join('\n'));
        }
        setFeedback(feedbackParts.join('\n\n') || json.feedback.detailed_feedback || '');
      } else {
        setSummary(json.summary || 'No summary available');
        setFeedback(json.feedback_text || 'No detailed feedback available');
        setScore(String(json.score || 3));
      }
      
    } catch (err: any) {
      console.error("Failed to fetch feedback:", err);
      setError(err.message || 'Failed to load feedback. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [state]);

  useEffect(() => {
    fetchFeedback();
    
    // Cleanup function
    return () => {
      hasFetched.current = false;
    };
  }, [fetchFeedback]);

  const handleDownloadTranscript = useCallback(() => {
    const doc = new jsPDF();
    let y = 10;
    const pageHeight = 280;
    const margin = 15;
    const maxWidth = doc.internal.pageSize.getWidth() - (margin * 2);
  
    const initializePage = () => {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
      doc.setTextColor(55, 65, 81); // gray-700
    };
  
    const addText = (text: string, yPos: number, fontSize: number, isBold: boolean = false, color: number[] = [55, 65, 81]) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (y + 10 > pageHeight) {
          doc.addPage();
          initializePage();
          y = 10;
        }
        doc.text(line, margin, y);
        y += fontSize * 0.5;
      });
      return y;
    };
  
    initializePage();
  
    // Title
    doc.setTextColor(88, 28, 135); // purple-800
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Interview Feedback Report", margin, y);
    y += 15;
  
    // Candidate info
    addText(`Candidate: ${candidateName}`, y, 14, true, [31, 41, 55]);
    y += 10;
    addText(`Rating: ${rating}/5 stars`, y, 12, false, [107, 114, 128]);
    y += 15;
  
    // Summary section
    addText("Summary", y, 16, true, [88, 28, 135]);
    y += 8;
    addText(summary.replace(/[#*]/g, ''), y, 11);
    y += 10;
  
    // Feedback section
    addText("Detailed Feedback", y, 16, true, [88, 28, 135]);
    y += 8;
    addText(feedback.replace(/[#*-]/g, ''), y, 11);
    y += 10;
  
    // Job Description
    addText("Job Description", y, 16, true, [88, 28, 135]);
    y += 8;
    addText(jobDescription, y, 11);
  
    doc.save(`${candidateName.replace(/\s+/g, '_')}_feedback_report.pdf`);
  }, [candidateName, rating, summary, feedback, jobDescription]);

  const handleRetryInterview = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleRatingChange = useCallback((newRating: number) => {
    setRating(newRating);
  }, []);

  const getResultText = useCallback(() => {
    const messages: Record<number, string> = {
      5: 'Outstanding Performance!',
      4: 'Great Job!',
      3: 'Good Effort, Keep Improving!',
      2: 'Room for Growth',
      1: 'Keep Practicing!'
    };
    return messages[rating] || 'Your Interview Results';
  }, [rating]);

  // Loading state
  if (isLoading) {
    return <Loading />;
  }

  // Error state
  if (error) {
    return (
      <DefaultLayout className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
        <Card className="max-w-md p-8 text-center bg-white border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Feedback</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={handleRetryInterview}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Return Home
          </Button>
        </Card>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="flex flex-col overflow-hidden items-center bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen py-6 sm:py-10">
      <Card className="xl:w-[80%] lg:w-[90%] w-[95%] flex flex-col p-4 sm:p-6 md:p-8 relative items-center justify-center mb-12 max-w-5xl shadow-lg bg-white border border-gray-200">
        {/* Header */}
        <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-4 sm:mt-6 mb-2'>
          Interview Feedback
        </h1>
        
        {/* Candidate Name */}
        <p className='text-lg sm:text-xl font-medium text-purple-600 mb-2'>
          {candidateName}
        </p>
        
        {/* Result Message */}
        <p className='text-base sm:text-lg text-gray-600 mb-4'>
          {getResultText()}
        </p>
        
        {/* Star Rating */}
        <div className="flex justify-center items-center w-full mb-6">
          <StarRating score={score} onRatingChange={handleRatingChange} />
        </div>
        
        <Separator className="bg-gray-200 mb-6" />
        
        {/* Content Sections */}
        <div className="flex flex-col items-center space-y-6 w-full">
          {/* Summary Section */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
              Summary
            </h2>
            <TextBox>
              <Markdown 
                remarkPlugins={[remarkGfm]} 
                className="prose prose-gray prose-sm sm:prose-base max-w-none
                  prose-headings:text-gray-800 prose-headings:font-semibold
                  prose-p:text-gray-600 prose-p:leading-relaxed
                  prose-li:text-gray-600
                  prose-strong:text-gray-800"
              >
                {summary || 'No summary available'}
              </Markdown>
            </TextBox>
          </div>

          {/* Feedback Section */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-2 h-6 bg-purple-500 rounded-full mr-3"></span>
              Detailed Feedback
            </h2>
            <TextBox>
              <Markdown 
                remarkPlugins={[remarkGfm]} 
                className="prose prose-gray prose-sm sm:prose-base max-w-none
                  prose-headings:text-gray-800 prose-headings:font-semibold
                  prose-p:text-gray-600 prose-p:leading-relaxed
                  prose-li:text-gray-600
                  prose-strong:text-gray-800"
              >
                {feedback || 'No detailed feedback available'}
              </Markdown>
            </TextBox>
          </div>

          <Separator className="bg-gray-200" />
          
          {/* Job Description Section */}
          <div className="w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-2 h-6 bg-gray-400 rounded-full mr-3"></span>
              Job Description
            </h2>
            <TextBox className="bg-gray-100">
              <p className="text-gray-600 whitespace-pre-wrap">{jobDescription}</p>
            </TextBox>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center w-full items-center gap-3 sm:gap-4 pt-4">
            <Button 
              className="w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all" 
              onClick={handleDownloadTranscript}
              aria-label="Download transcript as PDF"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </Button>
            <Button 
              className="w-full sm:w-auto px-6 py-3 flex items-center justify-center gap-2 font-medium border-gray-300 text-gray-700 hover:bg-gray-100" 
              variant="outline" 
              onClick={handleRetryInterview}
              aria-label="Start new interview"
            >
              <RotateCcw className="w-4 h-4" />
              New Interview
            </Button>
          </div>
        </div>
      </Card>
    </DefaultLayout>
  );
}

export default Feedback;