/**
 * How It Works Component
 * 
 * Step-by-step visualization of the interview process.
 * Clean timeline design with animations.
 * Enterprise HR Hub focus.
 * 
 * @module components/how-it-works
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  Mic, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';

// ========================================
// ANIMATION VARIANTS
// ========================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const lineVariants = {
  hidden: { scaleY: 0 },
  visible: {
    scaleY: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// ========================================
// STEP DATA
// ========================================

interface Step {
  id: string;
  number: string;
  titleKey: string;
  descriptionKey: string;
  defaultTitle: string;
  defaultDescription: string;
  icon: React.ReactNode;
  accent?: boolean;
}

const steps: Step[] = [
  {
    id: 'upload',
    number: '01',
    titleKey: 'howItWorks.steps.upload.title',
    descriptionKey: 'howItWorks.steps.upload.description',
    defaultTitle: 'Upload Job & Resume',
    defaultDescription: 'Add the job description and candidate resume. Our AI analyzes role requirements and tailors questions.',
    icon: <FileText className="w-6 h-6" />,
  },
  {
    id: 'interview',
    number: '02',
    titleKey: 'howItWorks.steps.interview.title',
    descriptionKey: 'howItWorks.steps.interview.description',
    defaultTitle: 'AI-Powered Interview',
    defaultDescription: 'Candidates engage in a natural voice conversation with our AI interviewer, available 24/7 in 8+ languages.',
    icon: <Mic className="w-6 h-6" />,
    accent: true,
  },
  {
    id: 'analysis',
    number: '03',
    titleKey: 'howItWorks.steps.analysis.title',
    descriptionKey: 'howItWorks.steps.analysis.description',
    defaultTitle: 'Real-Time Analysis',
    defaultDescription: 'Get instant scorecards with detailed metrics on communication, technical skills, and cultural fit.',
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    id: 'decision',
    number: '04',
    titleKey: 'howItWorks.steps.decision.title',
    descriptionKey: 'howItWorks.steps.decision.description',
    defaultTitle: 'Make Better Decisions',
    defaultDescription: 'Compare candidates objectively with standardized evaluations. Reduce bias, hire faster.',
    icon: <CheckCircle2 className="w-6 h-6" />,
    accent: true,
  },
];

// ========================================
// COMPONENT
// ========================================

export function HowItWorks() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section 
      ref={ref}
      className="py-20 md:py-28 bg-white relative overflow-hidden"
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-purple-100/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-sm font-medium text-purple-600 bg-purple-50 rounded-full border border-purple-100">
            <Sparkles className="w-4 h-4" />
            {t('howItWorks.badge', 'Simple Process')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
            {t('howItWorks.title', 'How It Works')}
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle', 'From job posting to hiring decision in four simple steps. Our AI handles the screening so you can focus on the best candidates.')}
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              variants={stepVariants}
              className="relative"
            >
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <motion.div
                  variants={lineVariants}
                  className="hidden lg:block absolute top-12 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-0.5 bg-gradient-to-r from-purple-200 to-zinc-200 origin-left"
                />
              )}

              {/* Step card */}
              <div className={`
                relative p-6 rounded-2xl border transition-all duration-300 h-full
                ${step.accent 
                  ? 'bg-purple-50/50 border-purple-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50' 
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100/50'
                }
              `}>
                {/* Step number */}
                <div className={`
                  inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4
                  ${step.accent 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-zinc-100 text-zinc-600'
                  }
                `}>
                  {step.icon}
                </div>

                {/* Step number badge */}
                <div className="absolute top-4 right-4">
                  <span className={`
                    text-sm font-bold
                    ${step.accent ? 'text-purple-400' : 'text-zinc-300'}
                  `}>
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                  {t(step.titleKey, step.defaultTitle)}
                </h3>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  {t(step.descriptionKey, step.defaultDescription)}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            {isSignedIn ? (
              <Button
                onClick={() => navigate('/interview-setup')}
                size="lg"
                className="group px-8 py-6 text-base font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all duration-200"
              >
                {t('howItWorks.cta.start', 'Start an Interview')}
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Link to="/sign-up">
                <Button
                  size="lg"
                  className="group px-8 py-6 text-base font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all duration-200"
                >
                  {t('howItWorks.cta.getStarted', 'Get Started Free')}
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            )}
            <span className="text-sm text-zinc-500">
              {t('howItWorks.cta.noCreditCard', 'No credit card required')}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default HowItWorks;
