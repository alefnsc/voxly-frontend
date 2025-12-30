/**
 * BetaFeedbackFab
 * 
 * Floating Action Button for beta feedback.
 * Shows a prominent bug icon button that opens the feedback modal.
 * 
 * Only visible when REACT_APP_CLOSED_BETA_FEEDBACK=true
 * Hidden during active interviews to avoid blocking audio UI.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquarePlus } from 'lucide-react';
import { cn } from 'lib/utils';
import { isClosedBetaFeedbackEnabled } from 'config/featureFlags';
import BetaFeedbackChatModal from './BetaFeedbackChatModal';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Pages where the FAB should be hidden (e.g., during active interview)
const HIDDEN_PATHS = [
  '/interview',      // Active interview (would block audio UI)
  '/sign-in',
  '/sign-up',
  '/sso-callback',
];

// ============================================================================
// COMPONENT
// ============================================================================

const BetaFeedbackFab: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check if FAB should be visible
  const shouldHide = 
    !isClosedBetaFeedbackEnabled() ||
    HIDDEN_PATHS.some(path => 
      location.pathname === path || 
      location.pathname.startsWith(path + '/')
    );

  // Open modal handler
  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  // Close modal handler
  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <div
        className="fixed bottom-4 right-4 z-[9990] flex flex-col items-end gap-2
          sm:bottom-6 sm:right-6"
      >
        {/* Main FAB Button */}
        <button
          onClick={handleOpen}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            'group relative flex items-center justify-center',
            'w-14 h-14 sm:w-auto sm:h-auto',
            'sm:px-5 sm:py-3',
            'bg-gradient-to-r from-purple-600 to-purple-700',
            'hover:from-purple-700 hover:to-purple-800',
            'text-white text-sm font-semibold',
            'rounded-full',
            'shadow-lg shadow-purple-600/30',
            'hover:shadow-xl hover:shadow-purple-600/40',
            'transition-all duration-300 ease-out',
            'transform hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
          )}
          aria-label={t('betaFeedback.fabLabel', 'Send Feedback')}
          aria-haspopup="dialog"
        >
          <MessageSquarePlus className={cn(
            'w-6 h-6 sm:w-5 sm:h-5',
            'transition-transform duration-300',
            isHovered && 'rotate-12'
          )} />
          <span className="hidden sm:inline sm:ml-2">
            {t('betaFeedback.fabText', 'Feedback')}
          </span>
          
          {/* Mobile tooltip on hover */}
          <span className={cn(
            'sm:hidden absolute right-full mr-3 px-3 py-1.5',
            'bg-zinc-900 text-white text-xs font-medium rounded-lg',
            'whitespace-nowrap shadow-lg',
            'opacity-0 translate-x-2 pointer-events-none',
            'transition-all duration-200',
            isHovered && 'opacity-100 translate-x-0'
          )}>
            {t('betaFeedback.fabText', 'Feedback')}
            <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full border-8 border-transparent border-l-zinc-900" />
          </span>
        </button>
      </div>

      {/* Feedback Modal */}
      <BetaFeedbackChatModal
        isOpen={isModalOpen}
        onClose={handleClose}
      />
    </>
  );
};

export default BetaFeedbackFab;
