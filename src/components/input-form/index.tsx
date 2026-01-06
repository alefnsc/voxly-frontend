import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'components/ui/button'
import { Textarea } from 'components/ui/textarea'
import { Input } from 'components/ui/input'
import { Coins, LogIn, Gift } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom';
import { Checkbox } from 'components/ui/checkbox';
import { useAuthCheck } from 'hooks/use-auth-check';
import { useLanguage } from 'hooks/use-language';
import CreditsModal from 'components/credits-modal';
import CreditPackages from 'components/credit-packages';

type InputFormProps = {
    isMobile: boolean;
    credits?: number;
}

type FieldName = 'companyName' | 'jobTitle' | 'jobDescription' | 'resume' | 'policy';
type FormErrors = Record<FieldName, string>;

interface FormValues {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    resume: string; // Base64 encoded resume content
    resumeFileName?: string;
    resumeMimeType?: string;
}

const InputForm: React.FC<InputFormProps> = ({ isMobile, credits }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentLanguage } = useLanguage();

    // Form state
    const [formValues, setFormValues] = useState<FormValues>({
        companyName: '',
        jobTitle: '',
        jobDescription: '',
        resume: '',
        resumeFileName: '',
        resumeMimeType: ''
    });
    const [fileName, setFileName] = useState('Upload your resume');
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({
        companyName: '',
        jobTitle: '', jobDescription: '', resume: '', policy: ''
    });
    const [isChecked, setIsChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Use our custom hook for auth and credits
    const {
        user,
        isLoading,
        userCredits,
        showCreditsModal,
        setShowCreditsModal,
        updateCredits,
        refreshCredits
    } = useAuthCheck();

    // User display name (from first-party auth user)
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    const displayName = (user?.fullName || `${firstName} ${lastName}`.trim() || user?.email || 'User').trim();

    // Use the credits prop if provided, otherwise use userCredits from the hook
    const availableCredits = credits !== undefined ? credits : userCredits;

    // Handle form field changes
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));

        // Clear error for this field if it exists
        if (errors[name as FieldName]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    }, [errors]);

    // Handle file change - reads file and converts to Base64
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, resume: 'Please upload a PDF or Word document' }));
                return;
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                setErrors(prev => ({ ...prev, resume: 'File size must be less than 5MB' }));
                return;
            }

            setFileName(file.name);
            setIsProcessingFile(true);

            // Read file as Base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
                const base64Data = result.split(',')[1];
                
                setFormValues(prev => ({
                    ...prev,
                    resume: base64Data,
                    resumeFileName: file.name,
                    resumeMimeType: file.type
                }));
                setIsProcessingFile(false);
                
                if (errors.resume) {
                    setErrors(prev => ({ ...prev, resume: '' }));
                }
            };
            reader.onerror = () => {
                setErrors(prev => ({ ...prev, resume: t('interview.errors.readFileFailed') }));
                setIsProcessingFile(false);
            };
            reader.readAsDataURL(file);
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

        // Validate user has name set (recommended)
        if (!firstName.trim() || !lastName.trim()) {
            newErrors.policy = 'Please add your first and last name in your account settings';
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

        // Find the first error
        const firstErrorField = Object.keys(newErrors).find(key => newErrors[key as FieldName]);
        if (firstErrorField) {
            return false;
        }

        return true;
    }, [formValues, isChecked, firstName, lastName]);

    // Handle form submission
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        if (availableCredits <= 0) {
            setShowCreditsModal(true);
            return;
        }

        setIsSubmitting(true);

        try {
            // Use a credit
            await updateCredits('use');

            // Generate validation token and set expiration (1 hour from now)
            const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const tokenExpiration = Date.now() + (60 * 60 * 1000); // 1 hour

            // Store validation token in localStorage
            localStorage.setItem('interviewValidationToken', interviewId);
            localStorage.setItem('tokenExpiration', tokenExpiration.toString());

            // Navigate to interview page with form data including interview_id
            navigate('/interview', {
                state: {
                    body: {
                        metadata: {
                            first_name: firstName,
                            last_name: lastName,
                            company_name: formValues.companyName,
                            job_title: formValues.jobTitle,
                            job_description: formValues.jobDescription,
                            interviewee_cv: formValues.resume, // Now contains Base64 encoded content
                            resume_file_name: formValues.resumeFileName,
                            resume_mime_type: formValues.resumeMimeType,
                            interview_id: interviewId,
                            preferred_language: currentLanguage
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error starting interview:', error);
            setIsSubmitting(false);
            // Show error in the policy field area since it's at the bottom
            setErrors(prev => ({ ...prev, policy: t('interview.errors.startFailed') }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validateForm, availableCredits, updateCredits, navigate, formValues, setShowCreditsModal]);

    // Show loading state
    if (isLoading) {
        return <div className="flex justify-center items-center h-40">{t('common.loading')}</div>;
    }

    // 1. Not authenticated: show login
    if (!user) {
        return (
            <div className='flex flex-col items-center justify-center lg:w-[40%] w-[80%] space-y-6 z-10'>
                <h1 className='flex text-3xl sm:text-4xl lg:text-6xl font-bold text-gradient bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 text-center'>Get Started</h1>
                <p className='flex text-lg sm:text-xl font-bold text-gray-700 text-center px-4'>Please sign in to start your AI-powered interview experience.</p>

                {/* Free Trial Banner */}
                 <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 via-violet-50 to-purple-50 border border-purple-100/50 rounded-lg px-4 py-2.5 text-purple-700">
                    <Gift className="w-6 h-6 text-purple-600" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                         Free Trial Available!
                        </span>
                        <span className="text-xs font-medium">
                            Claim 5 free interview credits after phone verification
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gray-50 rounded-xl gap-4 w-full border border-gray-200 shadow-sm">
                    <div className="flex flex-col items-center space-y-3 text-center">
                        <div className="p-3 bg-gray-800 rounded-full">
                            <LogIn className="h-8 w-8 text-white" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Authentication Required</h3>
                        <p className="text-sm text-gray-600 max-w-sm">
                            Sign in with your account to access AI mock interviews, track your progress, and get personalized feedback.
                        </p>
                    </div>
                    
                    <Link to="/sign-in">
                        <Button
                            variant="default"
                            className="flex items-center justify-center gap-2 px-8 py-6 w-full sm:w-auto mt-4 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
                            type="button"
                            aria-label="Sign in to continue"
                        >
                            <LogIn className="h-5 w-5" aria-hidden="true" />
                            <span>Sign In to Continue</span>
                        </Button>
                    </Link>
                    
                    <p className="text-xs text-gray-500 mt-2">
                        Secure authentication
                    </p>
                </div>
            </div>
        );
    }

    // 2. Authenticated with no credits: show payment options
    if (user && availableCredits === 0) {
        return (
            <div className='flex flex-col items-center justify-center w-full space-y-8 z-10'>
                
                <CreditPackages onPurchaseComplete={refreshCredits} />
            </div>
        );
    }

    // 3. Authenticated with credits: show input form
    if (user) {
        // Show the full form when user is logged in and has credits
        return (
            <form
                onSubmit={handleSubmit}
                data-testid="input-form"
                className='flex flex-col items-center justify-center lg:w-[40%] w-[80%] space-y-8 z-10'
            >
                <h1 className='flex text-4xl lg:text-6xl font-bold text-gradient bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700'>Discovery</h1>
                <p className='flex text-xl font-bold text-gray-700 text-center'>This information will tailor the interview experience to your specific scenario.</p>

                {/* Credits indicator */}
                <div className="flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-3 rounded-full shadow-lg border-2 border-purple-500">
                    <Coins className="mr-2 text-white w-5 h-5" />
                    <span className="font-bold text-white text-lg">{availableCredits} {availableCredits === 1 ? 'Credit' : 'Credits'} Available</span>
                </div>

                {/* Welcome message */}
                <div className="flex flex-col items-center justify-center bg-gray-50 px-6 py-4 rounded-lg border border-gray-200 w-full">
                    <p className="text-gray-600 text-sm">Interviewing as</p>
                    <p className="text-gray-900 font-semibold text-lg">{displayName}</p>
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <Input
                        type="text"
                        name="companyName"
                        placeholder="Company Name"
                        value={formValues.companyName}
                        onChange={handleChange}
                        className="text-lg lg:text-2xl text-gray-900"
                    />
                    {errors.companyName && (
                        <span className="text-red-500 text-sm">{errors.companyName}</span>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <Input
                        type="text"
                        name="jobTitle"
                        placeholder="Job Title"
                        value={formValues.jobTitle}
                        onChange={handleChange}
                        className="text-lg lg:text-2xl text-gray-900"
                    />
                    {errors.jobTitle && (
                        <span className="text-red-500 text-sm">{errors.jobTitle}</span>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <Textarea
                        name="jobDescription"
                        placeholder="Job Description (minimum 200 characters)"
                        rows={4}
                        value={formValues.jobDescription}
                        onChange={handleChange}
                        className="text-lg lg:text-2xl text-gray-900"
                    />
                    {errors.jobDescription && (
                        <span className="text-red-500 text-sm">{errors.jobDescription}</span>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        id="resume"
                        accept=".pdf"
                        data-testid="resume-upload"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label
                        htmlFor="resume"
                        className="flex items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors"
                    >
                        <span className="text-gray-400">{fileName}</span>
                    </label>
                    {errors.resume && (
                        <span className="text-red-500 text-sm">{errors.resume}</span>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center space-x-4">
                        <Checkbox
                            id="acceptPolicy"
                            checked={isChecked}
                            onCheckedChange={(checked) => setIsChecked(checked === true)}
                        />
                        <label htmlFor="acceptPolicy" className="text-md lg:text-lg">
                            I accept <a href="https://drive.google.com/file/d/1697V9WvT0jzGWQ4_YJQjW2lpD_fBJLah/view" className="text-purple-600 hover:underline">Privacy Policy</a> and <a href="https://drive.google.com/file/d/1KVWSGgYNaFFZ3OWQuPqB0puFzaWkRRbm/view?usp=sharing" className="text-purple-600 hover:underline">Terms of Use.</a>
                        </label>
                    </div>
                    {errors.policy && (
                        <span className="text-red-500 text-sm">{errors.policy}</span>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center mt-4 lg:mt-8">
                    <Button
                        type="submit"
                        className='p-7 lg:p-10 w-full'
                        size={isMobile ? 'icon' : 'default'}
                        disabled={isSubmitting || availableCredits <= 0}
                    >
                        <div className="flex items-center gap-x-2 text-xl lg:text-2xl xl:text-3xl font-bold">
                            {isSubmitting ? 'Processing...' : <span>Start Interview</span>}
                        </div>
                    </Button>
                </div>

                {/* Credits Modal */}
                <CreditsModal
                    isOpen={showCreditsModal}
                    onClose={() => setShowCreditsModal(false)}
                />
            </form>
        );
    }
};

export default InputForm;
