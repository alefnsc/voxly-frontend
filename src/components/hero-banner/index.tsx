/**
 * Hero Banner Component
 * 
 * Enterprise HR Intelligence Hub hero section for the landing page.
 * High-contrast text emphasizing Recruitment Speed, Bias Reduction, Talent Analytics.
 * Clean aesthetic with typography-first design.
 * 
 * @module components/hero-banner
 */

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

// ========================================
// ANIMATION VARIANTS
// ========================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ========================================
// COMPONENT
// ========================================

export function HeroBanner() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const handleCTAClick = () => {
    if (isSignedIn) {
      navigate('/dashboard');
    }
  };

  return (
    <section 
      ref={ref}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-white"
    >
      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Decorative Elements - Minimalist geometric shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top right accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
        {/* Bottom left accent */}
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-zinc-100 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-600 text-sm font-medium border border-purple-100">
            {t('hero.badge', 'Enterprise HR Intelligence')}
          </span>
        </motion.div>

        {/* Main Headline - Enterprise HR Hub focus */}
        <motion.h1 
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="text-zinc-900">
            {t('hero.headline.part1', 'The Global HR')}
          </span>
          <br />
          <span className="text-purple-600">
            {t('hero.headline.part2', 'Intelligence Hub')}
          </span>
        </motion.h1>

        {/* Subheadline - Emphasize enterprise value */}
        <motion.p 
          variants={itemVariants}
          className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {t('hero.subheadline', 'Accelerate recruitment, reduce hiring bias, and unlock talent analytics. AI-powered interview intelligence for enterprise teams building the workforce of tomorrow.')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          {isSignedIn ? (
            <Button
              onClick={handleCTAClick}
              size="lg"
              className="group w-full sm:w-auto px-8 py-6 text-base font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all duration-200"
            >
              {t('hero.cta.dashboard', 'Go to Dashboard')}
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <Link to="/sign-up">
              <Button
                size="lg"
                className="group w-full sm:w-auto px-8 py-6 text-base font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl transition-all duration-200"
              >
                {t('hero.cta.start', 'Start Hiring Smarter')}
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          )}
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto px-8 py-6 text-base font-medium border-zinc-300 text-zinc-900 hover:bg-zinc-50 rounded-xl transition-all duration-200"
          >
            {t('hero.cta.learnMore', 'Learn More')}
          </Button>
        </motion.div>

        {/* Stats Row - Enterprise HR metrics */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-center"
        >
          <StatItem value="3x" label={t('hero.stats.speed', 'Faster Hiring')} />
          <div className="hidden sm:block w-px h-8 bg-zinc-200" />
          <StatItem value="40%" label={t('hero.stats.bias', 'Less Bias')} />
          <div className="hidden sm:block w-px h-8 bg-zinc-200" />
          <StatItem value="8+" label={t('hero.stats.languages', 'Languages')} />
        </motion.div>
      </motion.div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-zinc-200" />
    </section>
  );
}

// ========================================
// SUBCOMPONENTS
// ========================================

interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-bold text-zinc-900">{value}</div>
      <div className="text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

export default HeroBanner;
