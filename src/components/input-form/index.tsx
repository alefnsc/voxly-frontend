import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from 'components/ui/button'
import { Textarea } from 'components/ui/textarea'
import { Input } from 'components/ui/input'
import { Coins, LogIn } from 'lucide-react'
import pdfToText from "react-pdftotext";
import { useNavigate } from 'react-router-dom';
import { Checkbox } from 'components/ui/checkbox';
import { useAuthCheck } from 'hooks/use-auth-check';
import CreditsModal from 'components/credits-modal';
import { SignInButton } from '@clerk/clerk-react';
import CreditPackages from 'components/credit-packages';

type InputFormProps = {
    isMobile: boolean;
    credits?: number;
}

type FieldName = 'companyName' | 'jobTitle' | 'jobDescription' | 'resume' | 'policy';
type FormErrors = Record<FieldName, string>;
type FormValues = Omit<FormErrors, 'policy'>;

const InputForm: React.FC<InputFormProps> = ({ isMobile, credits }) => {
    const navigate = useNavigate();

    // Form state - firstName and lastName come from Clerk
    const [formValues, setFormValues] = useState<FormValues>({
        companyName: '',
        jobTitle: '',
        jobDescription: '',
        resume: ''
    });
    const [fileName, setFileName] = useState('Upload your resume');
    const [errors, setErrors] = useState<FormErrors>({
        companyName: '',
        jobTitle: '', jobDescription: '', resume: '', policy: ''
    });
    const [firstError, setFirstError] = useState('');
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

    // Get user's name from Clerk
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';

    // Debug logging
    console.log('🔍 InputForm Debug:', {
        user: user?.id,
        firstName,
        lastName,
        isLoading,
        userCredits
    });

    // Use the credits prop if provided, otherwise use userCredits from the hook
    const availableCredits = credits !== undefined ? credits : userCredits;

    // Handle form field changes
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ ...prev, [name]: value }));

        // Clear error for this field if it exists
        if (errors[name as FieldName]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
            setFirstError('');
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
                setFirstError('');
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

        // Validate Clerk user has name set
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

        // Find the first error
        const firstErrorField = Object.keys(newErrors).find(key => newErrors[key as FieldName]);
        if (firstErrorField) {
            setFirstError(newErrors[firstErrorField as FieldName]);
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
            // Use firstName and lastName from Clerk session
            navigate('/interview', {
                state: {
                    body: {
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
            // Show error in the policy field area since it's at the bottom
            setErrors(prev => ({ ...prev, policy: 'Failed to start interview. Please try again.' }));
        }
    }, [validateForm, availableCredits, updateCredits, navigate, formValues, setShowCreditsModal]);

    // Show loading state
    if (isLoading) {
        return <div className="flex justify-center items-center h-40">Loading...</div>;
    }

    // 1. Not authenticated: show login
    if (!user) {
        return (
            <div className='flex flex-col items-center justify-center lg:w-[40%] w-[80%] space-y-6 z-10'>
                <h1 className='flex text-3xl sm:text-4xl lg:text-6xl font-bold text-gradient bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 text-center'>Get Started</h1>
                <p className='flex text-lg sm:text-xl font-bold text-gray-700 text-center px-4'>Please sign in to start your AI-powered interview experience.</p>

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
                    
                    <SignInButton 
                        mode="modal"
                        forceRedirectUrl='/'
                    >
                        <Button
                            variant="default"
                            className="flex items-center justify-center gap-2 px-8 py-6 w-full sm:w-auto mt-4 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
                            type="button"
                            aria-label="Sign in to continue"
                        >
                            <LogIn className="h-5 w-5" aria-hidden="true" />
                            <span>Sign In to Continue</span>
                        </Button>
                    </SignInButton>
                    
                    <p className="text-xs text-gray-500 mt-2">
                        Powered by Clerk - Secure authentication
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

                {/* Welcome message with user name from Clerk */}
                <div className="flex flex-col items-center justify-center bg-gray-50 px-6 py-4 rounded-lg border border-gray-200 w-full">
                    <p className="text-gray-600 text-sm">Interviewing as</p>
                    <p className="text-gray-900 font-semibold text-lg">{firstName} {lastName}</p>
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
                            I accept <a href="https://docs.google.com/document/d/1u-kOOKMET0PpfQETzgl484watytsuooRJ2mKMvo5T9U/" className="text-purple-600 hover:underline">Privacy Policy</a> and <a href="https://docs.google.com/document/d/1JoUUjBiQvavP1FjJHdJqDWFHJamzSkje2CekivAzCcM" className="text-purple-600 hover:underline">Terms of Use.</a>
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