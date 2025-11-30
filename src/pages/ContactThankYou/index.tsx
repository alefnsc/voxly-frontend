import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DefaultLayout } from 'components/default-layout';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';

const ContactThankYou: React.FC = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Countdown timer
        const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Redirect after 5 seconds
        const redirectTimeout = setTimeout(() => {
            navigate('/');
        }, 10000);

        return () => {
            clearInterval(countdownInterval);
            clearTimeout(redirectTimeout);
        };
    }, [navigate]);

    return (
        <DefaultLayout>
            <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">

                {/* Thank You Card - matching credit-packages card style */}
                <div className="max-w-md mx-auto">
                    <div className="relative p-4 sm:p-6 lg:p-8 flex flex-col border border-gray-200 shadow-lg shadow-purple-200/50 rounded-lg bg-white hover:border-purple-300 transition-all duration-300">
                        {/* Icon - matching credit-packages icon style */}
                        <div className="flex justify-center mb-3 sm:mb-4 mt-2">
                            <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="text-center p-0 mb-3 sm:mb-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                               Thank You!
                            </h2>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Your message has been sent successfully. We'll get back to you soon.
                            </p>
                        </div>

                        {/* Countdown */}
                        <div className="text-center mb-4 sm:mb-6">
                            <div className="flex items-baseline justify-center">
                                <span className="text-4xl sm:text-5xl font-extrabold text-gray-900">
                                    {countdown}
                                </span>
                            </div>
                            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                                Redirecting to home...
                            </p>
                        </div>

                        {/* Button - matching credit-packages purchase button style */}
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 ease-out flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 text-white hover:from-purple-800 hover:via-purple-700 hover:to-violet-700 shadow-purple-500/30"
                        >
                            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Go to Home Now</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Footer Info - matching credit-packages style */}
                <div className="mt-8 sm:mt-12 text-center px-2">
                    <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-50 rounded-full">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-purple-700 font-medium text-sm sm:text-base">
                            We typically respond within 5 business days
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                        Your feedback helps us improve Voxly AI
                    </p>
                </div>
            </div>
        </DefaultLayout>
    );
};

export default ContactThankYou;
