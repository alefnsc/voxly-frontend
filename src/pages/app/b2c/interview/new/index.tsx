/**
 * B2C New Interview Page - Setup Interview Details
 * 
 * Form to configure new AI-powered practice interview:
 * - Role/Job Title (required)
 * - Seniority Level (required)
 * - Target Company (required)
 * - Job Description (required, min 50 chars)
 * - Interview Language (dropdown, defaults to user preference)
 * - Job Location (searchable dropdown, filtered by language)
 * - Resume (required, with inline upload option)
 * 
 * @module pages/app/b2c/interview/new
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  Building2,
  FileText,
  Globe2,
  MapPin,
  FileUp,
  AlertCircle,
  Loader2,
  ArrowRight,
  Upload,
  Check,
  ChevronDown,
  Search,
} from 'lucide-react';
import { DefaultLayout } from 'components/default-layout';
import InterviewBreadcrumbs from 'components/interview-breadcrumbs';
import { useInterviewFlow } from 'hooks/use-interview-flow';
import { useLanguage } from 'hooks/use-language';
import { useResumesQuery, useUploadResumeMutation } from 'hooks/queries/useResumeQueries';
import { useWalletBalanceQuery } from 'hooks/queries/useWalletQueries';
import {
  INTERVIEW_LANGUAGES,
  getAllCountries,
  type InterviewLanguageCode,
} from 'lib/geo/languageCountries';
import { cn } from 'lib/utils';
import apiService from 'services/APIService';

// Seniority levels
const SENIORITY_LEVELS = [
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
] as const;

interface FormData {
  jobTitle: string;
  seniority: string;
  company: string;
  jobDescription: string;
  language: InterviewLanguageCode;
  country: string;
  resumeId: string;
}

interface FormErrors {
  jobTitle?: string;
  seniority?: string;
  company?: string;
  jobDescription?: string;
  language?: string;
  country?: string;
  resumeId?: string;
}

// ============================================
// DROPDOWN COMPONENTS
// ============================================

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SimpleDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const SimpleDropdown: React.FC<SimpleDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selected = options.find(o => o.value === value);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border transition-all text-left min-h-[48px]',
          error
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200',
          disabled && 'opacity-50 cursor-not-allowed',
          'focus:outline-none focus:ring-2'
        )}
      >
        <span className={cn('flex-1 truncate', !selected && 'text-gray-400')}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.icon}
              {selected.label}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 py-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 transition-colors min-h-[48px]',
                  value === option.value && 'bg-purple-50 text-purple-700'
                )}
              >
                {option.icon}
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500">{option.description}</div>
                  )}
                </div>
                {value === option.value && <Check className="w-4 h-4 text-purple-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SearchableDropdownProps extends Omit<SimpleDropdownProps, 'options'> {
  options: DropdownOption[];
  searchPlaceholder?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Search...',
  error,
  disabled,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const selected = options.find(o => o.value === value);
  
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(lower));
  }, [options, search]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border transition-all text-left min-h-[48px]',
          error
            ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-200 bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200',
          disabled && 'opacity-50 cursor-not-allowed',
          'focus:outline-none focus:ring-2'
        )}
      >
        <span className={cn('flex-1 truncate', !selected && 'text-gray-400')}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.icon}
              {selected.label}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown className={cn('w-5 h-5 text-gray-400 transition-transform flex-shrink-0', isOpen && 'rotate-180')} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Search input */}
            <div className="p-2 sm:p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                />
              </div>
            </div>
            
            {/* Options list */}
            <div className="max-h-56 overflow-y-auto py-2">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No results found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-purple-50 transition-colors',
                      value === option.value && 'bg-purple-50 text-purple-700'
                    )}
                  >
                    {option.icon}
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                    </div>
                    {value === option.value && <Check className="w-4 h-4 text-purple-600" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const B2CNewInterviewPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { currentLanguage } = useLanguage();
  const { setStage, setMetadata } = useInterviewFlow();
  
  // Queries
  const { data: resumes, isLoading: isLoadingResumes } = useResumesQuery();
  const { data: walletBalance } = useWalletBalanceQuery();
  const uploadResumeMutation = useUploadResumeMutation();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    jobTitle: '',
    seniority: '',
    company: '',
    jobDescription: '',
    language: (currentLanguage?.split('-')[0] as InterviewLanguageCode) || 'en',
    country: '',
    resumeId: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Set stage on mount
  useEffect(() => {
    setStage('details');
  }, [setStage]);
  
  // Get all countries for job location
  const availableCountries = useMemo(() => {
    return getAllCountries();
  }, []);
  
  // Country dropdown options
  const countryOptions: DropdownOption[] = useMemo(() => {
    return availableCountries.map((country) => ({
      value: country.code,
      label: country.name,
      icon: <span className="text-lg">{country.flag}</span>,
    }));
  }, [availableCountries]);
  
  // Language dropdown options
  const languageOptions: DropdownOption[] = useMemo(() => {
    return INTERVIEW_LANGUAGES.map((lang) => ({
      value: lang.code,
      label: lang.name,
      icon: <span className="text-lg">{lang.flag}</span>,
      description: lang.nativeName,
    }));
  }, []);
  
  // Seniority dropdown options
  const seniorityOptions: DropdownOption[] = useMemo(() => {
    return SENIORITY_LEVELS.map((level) => ({
      value: level.value,
      label: t(`interview.seniority.${level.value}`, level.label),
    }));
  }, [t]);
  
  // Resume dropdown options
  const resumeOptions: DropdownOption[] = useMemo(() => {
    const options: DropdownOption[] = [];
    
    // Add upload option first
    options.push({
      value: '__upload__',
      label: t('interview.uploadNewResume', '+ Upload new resume'),
      icon: <Upload className="w-4 h-4" />,
    });
    
    // Add existing resumes
    if (resumes && resumes.length > 0) {
      resumes.forEach((resume: any) => {
        options.push({
          value: resume.id,
          label: resume.title || resume.fileName || 'Resume',
          icon: <FileText className="w-4 h-4" />,
        });
      });
    }
    
    return options;
  }, [resumes, t]);
  
  // Handle form field changes
  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setSubmitError(null);
  }, [errors]);
  
  // Handle resume selection
  const handleResumeSelect = useCallback((value: string) => {
    if (value === '__upload__') {
      // Trigger file input
      fileInputRef.current?.click();
    } else {
      handleChange('resumeId', value);
    }
  }, [handleChange]);
  
  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, resumeId: t('interview.invalidFileType', 'Please upload a PDF or Word document') }));
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, resumeId: t('interview.fileTooLarge', 'File must be less than 10MB') }));
      return;
    }
    
    setIsUploading(true);
    setUploadedFile(file);
    
    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Upload resume
      const response = await uploadResumeMutation.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        base64Data,
        title: file.name.replace(/\.[^/.]+$/, ''),
      });
      
      // Select the newly uploaded resume
      if (response?.data?.id) {
        handleChange('resumeId', response.data.id);
      }
    } catch (error) {
      console.error('Failed to upload resume:', error);
      setErrors(prev => ({ ...prev, resumeId: t('interview.uploadFailed', 'Failed to upload resume. Please try again.') }));
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [uploadResumeMutation, handleChange, t]);
  
  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = t('interview.errors.jobTitleRequired', 'Job title is required');
    }
    
    if (!formData.seniority) {
      newErrors.seniority = t('interview.errors.seniorityRequired', 'Seniority level is required');
    }
    
    if (!formData.company.trim()) {
      newErrors.company = t('interview.errors.companyRequired', 'Target company is required');
    }
    
    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = t('interview.errors.jobDescriptionRequired', 'Job description is required');
    } else if (formData.jobDescription.trim().length < 50) {
      newErrors.jobDescription = t('interview.errors.jobDescriptionTooShort', 'Job description must be at least 50 characters');
    }
    
    if (!formData.language) {
      newErrors.language = t('interview.errors.languageRequired', 'Interview language is required');
    }
    
    if (!formData.country) {
      newErrors.country = t('interview.errors.countryRequired', 'Job location is required');
    }
    
    if (!formData.resumeId) {
      newErrors.resumeId = t('interview.errors.resumeRequired', 'Please select or upload a resume');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user?.id) return;
    
    // Check wallet balance
    const balance = walletBalance?.data?.balance ?? 0;
    if (balance < 1) {
      setSubmitError(t('interview.errors.insufficientCredits', 'You need at least 1 credit to start an interview'));
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Get resume data for the interview
      const selectedResume = resumes?.find((r: any) => r.id === formData.resumeId);
      
      // Create interview
      const interview = await apiService.createInterview(user.id, {
        jobTitle: formData.jobTitle.trim(),
        seniority: formData.seniority,
        companyName: formData.company.trim(),
        jobDescription: formData.jobDescription.trim(),
        language: formData.language,
        resumeFileName: selectedResume?.fileName,
      });
      
      if (interview?.id) {
        // Store interview data in flow context
        setMetadata({
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          companyName: formData.company,
          jobTitle: formData.jobTitle,
          jobDescription: formData.jobDescription,
        });
        
        // Navigate to interview page
        navigate(`/app/b2c/interview/${interview.id}`);
      } else {
        throw new Error('Failed to create interview');
      }
    } catch (error: any) {
      console.error('Failed to create interview:', error);
      setSubmitError(
        error?.message || t('interview.errors.createFailed', 'Failed to create interview. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, user, walletBalance, resumes, validateForm, setMetadata, navigate, t]);

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
          {/* Breadcrumbs */}
          <InterviewBreadcrumbs
            currentStage="details"
            showBackArrow
            className="mb-4 sm:mb-8"
          />
          
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {t('interview.newInterview.title', 'Set Up Your Interview')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t('interview.newInterview.subtitle', 'Configure your practice interview details')}
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Job Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4" />
                {t('interview.jobTitle', 'Job Title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                placeholder={t('interview.jobTitlePlaceholder', 'e.g., Software Engineer')}
                className={cn(
                  'w-full px-4 py-3 sm:py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 min-h-[48px]',
                  errors.jobTitle
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200'
                )}
              />
              {errors.jobTitle && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.jobTitle}
                </p>
              )}
            </div>
            
            {/* Seniority Level */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="w-4 h-4" />
                {t('interview.seniority.label', 'Seniority Level')} <span className="text-red-500">*</span>
              </label>
              <SimpleDropdown
                options={seniorityOptions}
                value={formData.seniority}
                onChange={(value) => handleChange('seniority', value)}
                placeholder={t('interview.seniority.placeholder', 'Select seniority level')}
                error={errors.seniority}
              />
              {errors.seniority && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.seniority}
                </p>
              )}
            </div>
            
            {/* Target Company */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4" />
                {t('interview.targetCompany', 'Target Company')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder={t('interview.targetCompanyPlaceholder', 'e.g., Google, Amazon, Microsoft')}
                className={cn(
                  'w-full px-4 py-3 sm:py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 min-h-[48px]',
                  errors.company
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200'
                )}
              />
              {errors.company && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.company}
                </p>
              )}
            </div>
            
            {/* Job Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                {t('interview.jobDescription', 'Job Description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.jobDescription}
                onChange={(e) => handleChange('jobDescription', e.target.value)}
                placeholder={t('interview.jobDescriptionPlaceholder', 'Paste the job description here (minimum 50 characters)...')}
                rows={6}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 resize-none',
                  errors.jobDescription
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-200 bg-white hover:border-purple-300 focus:border-purple-500 focus:ring-purple-200'
                )}
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.jobDescription ? (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.jobDescription}
                  </p>
                ) : (
                  <span />
                )}
                <span className={cn(
                  'text-xs',
                  formData.jobDescription.length < 50 ? 'text-gray-400' : 'text-green-600'
                )}>
                  {formData.jobDescription.length}/50 {t('interview.minChars', 'min chars')}
                </span>
              </div>
            </div>
            
            {/* Interview Language */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Globe2 className="w-4 h-4" />
                {t('interview.language', 'Interview Language')} <span className="text-red-500">*</span>
              </label>
              <SimpleDropdown
                options={languageOptions}
                value={formData.language}
                onChange={(value) => handleChange('language', value)}
                placeholder={t('interview.languagePlaceholder', 'Select interview language')}
                error={errors.language}
              />
              {errors.language && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.language}
                </p>
              )}
            </div>
            
            {/* Job Location */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                {t('interview.jobLocation', 'Job Location')} <span className="text-red-500">*</span>
              </label>
              <SearchableDropdown
                options={countryOptions}
                value={formData.country}
                onChange={(value) => handleChange('country', value)}
                placeholder={t('interview.jobLocationPlaceholder', 'Select job location')}
                searchPlaceholder={t('interview.searchCountry', 'Search countries...')}
                error={errors.country}
                disabled={!formData.language}
              />
              {!formData.language && (
                <p className="mt-1 text-xs text-gray-500">
                  {t('interview.selectLanguageFirst', 'Please select a language first')}
                </p>
              )}
              {errors.country && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.country}
                </p>
              )}
            </div>
            
            {/* Resume Selection */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileUp className="w-4 h-4" />
                {t('interview.resume', 'Resume')} <span className="text-red-500">*</span>
              </label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {isUploading ? (
                <div className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-purple-50 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-purple-700">
                    {t('interview.uploadingResume', 'Uploading')} {uploadedFile?.name}...
                  </span>
                </div>
              ) : (
                <SimpleDropdown
                  options={resumeOptions}
                  value={formData.resumeId}
                  onChange={handleResumeSelect}
                  placeholder={
                    isLoadingResumes
                      ? t('interview.loadingResumes', 'Loading resumes...')
                      : t('interview.selectResume', 'Select or upload a resume')
                  }
                  error={errors.resumeId}
                  disabled={isLoadingResumes}
                />
              )}
              
              {errors.resumeId && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.resumeId}
                </p>
              )}
            </div>
            
            {/* Submit Error */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">{t('interview.errors.title', 'Error')}</p>
                  <p className="text-red-600 text-sm">{submitError}</p>
                </div>
              </motion.div>
            )}
            
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2',
                  isSubmitting
                    ? 'bg-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98] shadow-lg shadow-purple-200'
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('interview.starting', 'Starting Interview...')}
                  </>
                ) : (
                  <>
                    {t('interview.startInterview', 'Start Interview')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
            
            {/* Credits Info */}
            <div className="text-center text-sm text-gray-500">
              {t('interview.creditsInfo', 'This interview will use 1 credit.')}
              {walletBalance?.data?.balance !== undefined && (
                <span className="ml-1">
                  {t('interview.currentBalance', 'Current balance:')} <strong>{walletBalance.data.balance}</strong>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default B2CNewInterviewPage;
