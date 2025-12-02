'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { DefaultLayout } from 'components/default-layout';
import { useInterviewFlow } from 'hooks/use-interview-flow';
import InterviewBreadcrumbs from 'components/interview-breadcrumbs';
import Loading from 'components/loading';
import { useAuthCheck } from 'hooks/use-auth-check';
import CreditsModal from 'components/credits-modal';
import { Input } from 'components/ui/input';
import { Textarea } from 'components/ui/textarea';
import { Checkbox } from 'components/ui/checkbox';
import PurpleButton from 'components/ui/purple-button';
import { Upload, User, Briefcase, FileText, Building2, ArrowLeft } from 'lucide-react';

type FieldName = 'companyName' | 'jobTitle' | 'jobDescription' | 'resume' | 'policy';
type FormErrors = Record<FieldName, string>;
type FormValues = Omit<FormErrors, 'policy'>;

const InterviewSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const { setStage, startInterview, isInFlow, resetFlow } = useInterviewFlow();
  
  // Form state
  const [formValues, setFormValues] = useState<FormValues>({
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    resume: ''
  });
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({
    companyName: '',
    jobTitle: '',
    jobDescription: '',
    resume: '',
    policy: ''
  });
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth and credits
  const {
    isLoading,
    userCredits,
    showCreditsModal,
    setShowCreditsModal,
    updateCredits
  } = useAuthCheck();

  // Get user's name from Clerk
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';

  // Initialize interview flow if not already started
  useEffect(() => {
    if (!isInFlow) {
      startInterview();
    }
    setStage('details');
  }, [isInFlow, startInterview, setStage]);

  // Redirect to home if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/');
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Handle form field changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    if (errors[name as FieldName]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Handle file change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFormValues(prev => ({ ...prev, resume: file.name }));
      if (errors.resume) {
        setErrors(prev => ({ ...prev, resume: '' }));
      }
    }
  }, [errors.resume]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {
      companyName: '',
      jobTitle: '',
      jobDescription: '',
      resume: '',
      policy: ''
    };

    if (!firstName.trim()) {
      newErrors.policy = 'Please set your first name in your Clerk profile';
    }
    if (!lastName.trim()) {
      newErrors.policy = 'Please set your last name in your Clerk profile';
    }
    if (!formValues.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formValues.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    if (!formValues.jobDescription.trim()) {
      newErrors.jobDescription = 'Job description is required';
    } else if (formValues.jobDescription.trim().length < 200) {
      newErrors.jobDescription = `Job description must be at least 200 characters (current: ${formValues.jobDescription.trim().length})`;
    }
    if (!formValues.resume) {
      newErrors.resume = 'Resume is required';
    }
    if (!isChecked) {
      newErrors.policy = 'You must accept the privacy policy and terms of use';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  }, [formValues, isChecked, firstName, lastName]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if ((userCredits ?? 0) <= 0) {
      setShowCreditsModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCredits('use');

      const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const tokenExpiration = Date.now() + (60 * 60 * 1000);

      localStorage.setItem('interviewValidationToken', interviewId);
      localStorage.setItem('tokenExpiration', tokenExpiration.toString());

      navigate('/interview', {
        state: {
          body: {
            userId: user?.id,
            metadata: {
              first_name: firstName,
              last_name: lastName,
              company_name: formValues.companyName,
              job_title: formValues.jobTitle,
              job_description: formValues.jobDescription,
              interviewee_cv: formValues.resume,
              interview_id: interviewId
            }
          }
        }
      });
    } catch (error) {
      console.error('Error starting interview:', error);
      setIsSubmitting(false);
      setErrors(prev => ({ ...prev, policy: 'Failed to start interview. Please try again.' }));
    }
  }, [validateForm, userCredits, updateCredits, navigate, formValues, firstName, lastName, user?.id, setShowCreditsModal]);

  if (!isLoaded || !isSignedIn || isLoading) {
    return <Loading />;
  }

  return (
    <DefaultLayout className="flex flex-col overflow-hidden bg-gray-50 min-h-screen">
      <div className="page-container py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => {
              resetFlow();
              navigate('/');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Breadcrumbs */}
        <InterviewBreadcrumbs 
          currentStage="details" 
          showBackArrow={false}
          className="mb-6"
        />

        {/* Main Content - Centered */}
        <div className="max-w-2xl mx-auto">

          {/* User Info Card */}
          <div className="voxly-card mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Interviewing as</p>
                <p className="text-lg font-semibold text-gray-900">{firstName} {lastName}</p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="voxly-card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Company Name
                </label>
                <Input
                  type="text"
                  name="companyName"
                  placeholder="e.g., Google, Microsoft, Startup Inc."
                  value={formValues.companyName}
                  onChange={handleChange}
                  className="w-full"
                />
                {errors.companyName && (
                  <p className="text-red-500 text-sm">{errors.companyName}</p>
                )}
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  Job Title
                </label>
                <Input
                  type="text"
                  name="jobTitle"
                  placeholder="e.g., Senior Software Engineer, Product Manager"
                  value={formValues.jobTitle}
                  onChange={handleChange}
                  className="w-full"
                />
                {errors.jobTitle && (
                  <p className="text-red-500 text-sm">{errors.jobTitle}</p>
                )}
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Job Description
                </label>
                <Textarea
                  name="jobDescription"
                  placeholder="Paste the job description here (minimum 200 characters). This helps our AI tailor the interview questions to the specific role."
                  rows={6}
                  value={formValues.jobDescription}
                  onChange={handleChange}
                  className="w-full resize-none"
                />
                <div className="flex justify-between text-xs">
                  <span className={formValues.jobDescription.length < 200 ? 'text-amber-600' : 'text-green-600'}>
                    {formValues.jobDescription.length}/200 characters minimum
                  </span>
                </div>
                {errors.jobDescription && (
                  <p className="text-red-500 text-sm">{errors.jobDescription}</p>
                )}
              </div>

              {/* Resume Upload */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Upload className="w-4 h-4 text-purple-600" />
                  Resume (PDF)
                </label>
                <input
                  type="file"
                  id="resume"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="resume"
                  className={`flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
                    fileName 
                      ? 'border-purple-300 bg-purple-50' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                >
                  <Upload className={`w-5 h-5 ${fileName ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={fileName ? 'text-purple-700 font-medium' : 'text-gray-500'}>
                    {fileName || 'Click to upload your resume'}
                  </span>
                </label>
                {errors.resume && (
                  <p className="text-red-500 text-sm">{errors.resume}</p>
                )}
              </div>

              {/* Privacy Policy Checkbox */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acceptPolicy"
                    checked={isChecked}
                    onCheckedChange={(checked) => setIsChecked(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="acceptPolicy" className="text-sm text-gray-600 leading-relaxed">
                    I accept the{' '}
                    <a 
                      href="https://drive.google.com/file/d/1697V9WvT0jzGWQ4_YJQjW2lpD_fBJLah/view" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline"
                    >
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a 
                      href="https://drive.google.com/file/d/1KVWSGgYNaFFZ3OWQuPqB0puFzaWkRRbm/view?usp=sharing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 underline"
                    >
                      Terms of Use
                    </a>
                  </label>
                </div>
                {errors.policy && (
                  <p className="text-red-500 text-sm">{errors.policy}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <PurpleButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting || (userCredits ?? 0) <= 0}
                  className="w-full py-4 text-lg font-semibold"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Start Interview'
                  )}
                </PurpleButton>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Your interview will be conducted by our AI interviewer and typically lasts 10-15 minutes.
          </p>

          {/* Back to Dashboard Button - Bottom */}
          <div className="flex justify-center mt-8 mb-4">
            <button
              onClick={() => {
                resetFlow();
                navigate('/');
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Credits Modal */}
      <CreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
      />
    </DefaultLayout>
  );
};

export default InterviewSetup;
