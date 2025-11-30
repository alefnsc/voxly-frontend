import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DefaultLayout } from 'components/default-layout';
import { CheckCircle, ArrowRight } from 'lucide-react';

const ContactThankYou: React.FC = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

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
    }, 5000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimeout);
    };
  }, [navigate]);

  return (
    <DefaultLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-bounce-slow">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>

          {/* Thank You Message */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Thank You!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8">
            Your message has been sent successfully. We appreciate your feedback and will get back to you soon.
          </p>

          {/* Countdown */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 sm:p-6 mb-6">
            <p className="text-purple-700 font-medium text-sm sm:text-base">
              Redirecting to home page in{' '}
              <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-lg">
                {countdown}
              </span>{' '}
              seconds
            </p>
          </div>

          {/* Manual Redirect Button */}
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-700 via-purple-600 to-violet-600 hover:from-purple-800 hover:via-purple-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation"
          >
            <span>Go to Home Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CSS for animation */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </DefaultLayout>
  );
};

export default ContactThankYou;
