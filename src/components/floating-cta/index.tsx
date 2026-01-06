/**
 * Floating CTA Component
 * 
 * Fixed bottom CTA bar that appears on scroll for conversion optimization.
 * Only shows for non-authenticated users on landing page.
 * 
 * @module components/floating-cta
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { ArrowRight, X, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';

// ========================================
// COMPONENT
// ========================================

interface FloatingCTAProps {
  scrollThreshold?: number;
  hideOnFooter?: boolean;
}

export function FloatingCTA({ 
  scrollThreshold = 500, 
  hideOnFooter = true 
}: FloatingCTAProps) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Don't show for signed-in users
    if (isSignedIn) return;

    // Check if previously dismissed this session
    if (sessionStorage.getItem('floating-cta-dismissed')) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show after threshold
      const shouldShow = scrollY > scrollThreshold;
      
      // Hide when near footer
      const nearFooter = hideOnFooter && (scrollY + windowHeight > documentHeight - 200);
      
      setIsVisible(shouldShow && !nearFooter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSignedIn, scrollThreshold, hideOnFooter]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('floating-cta-dismissed', 'true');
  };

  // Don't render for signed-in users or if dismissed
  if (isSignedIn || isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30 
          }}
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:px-6 md:pb-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-2xl border border-zinc-200 shadow-2xl shadow-zinc-900/10 p-4 md:p-5">
              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Icon */}
                <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>

                {/* Text */}
                <div className="flex-1 text-center sm:text-left pr-8">
                  <h4 className="font-semibold text-zinc-900">
                    {t('floatingCta.title', 'Ready to transform your hiring?')}
                  </h4>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {t('floatingCta.subtitle', 'Start interviewing candidates in minutes, not days.')}
                  </p>
                </div>

                {/* CTA Button */}
                <Link to="/sign-in">
                  <Button
                    size="lg"
                    className="group w-full sm:w-auto px-6 py-3 text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all duration-200"
                  >
                    {t('floatingCta.button', 'Get Started Free')}
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingCTA;
