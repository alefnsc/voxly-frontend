import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PurpleButton from 'components/ui/purple-button';
import { Plus, ArrowRight } from 'lucide-react';

/**
 * Interview Ready CTA Component
 * 
 * Enterprise-styled call-to-action card with glass effect.
 * Typography-first design with purple-600 accent.
 */
const InterviewReady: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <div className="relative overflow-hidden p-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl text-white">
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      
      <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-2">
            {t('interview.ready.subtitle', 'Ready to practice?')}
          </p>
          <h3 className="text-2xl font-bold tracking-tight mb-2">
            {t('dashboard.startNewInterview', 'Start Your Next Interview')}
          </h3>
          <p className="text-purple-100">
            {t('home.features.personalized.description', 'AI-powered practice sessions to sharpen your skills.')}
          </p>
        </div>
        <PurpleButton
          variant="secondary"
          size="lg"
          onClick={() => navigate('/app/b2c/interview/new')}
          className="bg-white text-purple-600 hover:bg-zinc-100 border-0 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {t('interviews.startNew', 'Start Interview')}
          <ArrowRight className="w-4 h-4 ml-1" />
        </PurpleButton>
      </div>
    </div>
  );
};

export default InterviewReady;