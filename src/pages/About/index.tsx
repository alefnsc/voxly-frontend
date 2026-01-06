'use client'

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { FileText, Shield, Sparkles, Info } from 'lucide-react'
import InterviewReady from 'components/interview-ready'
import { TitleSplit } from 'components/ui/TitleSplit'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function About() {
  const { t } = useTranslation()

  const features = [
    { title: t('about.features.realistic.title'), desc: t('about.features.realistic.desc'), highlight: true },
    { title: t('about.features.analytics.title'), desc: t('about.features.analytics.desc') },
    { title: t('about.features.practice247.title'), desc: t('about.features.practice247.desc'), highlight: true },
    { title: t('about.features.feedback.title'), desc: t('about.features.feedback.desc') },
    { title: t('about.features.roleSpecific.title'), desc: t('about.features.roleSpecific.desc'), highlight: true },
    { title: t('about.features.payPerUse.title'), desc: t('about.features.payPerUse.desc') },
  ]
  
  return (
    <div className="min-h-screen bg-zinc-50">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 sm:mb-8"
          variants={itemVariants}
        >
          <div className="flex-1">
            <TitleSplit 
              i18nKey="about.title"
              subtitleKey="about.subtitle"
              as="h1"
              className="text-2xl sm:text-3xl"
              subtitleClassName="text-base mt-1"
            />
          </div>
        </motion.div>

        {/* Hero Section - Logo + Mission */}
        <motion.div 
          className="p-6 bg-white border border-zinc-200 rounded-xl mb-6 sm:mb-8"
          variants={itemVariants}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <img 
              src="/Main.png" 
              alt="Vocaid" 
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain flex-shrink-0"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900 mb-2">
                {t('about.mission.title')}
              </h2>
              <p className="text-zinc-600 text-sm sm:text-base">
                {t('about.mission.description')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div className="mb-6 sm:mb-8" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('about.whyVocaid')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="p-4 bg-white border border-zinc-200 rounded-xl flex flex-col items-center text-center hover:border-purple-300 transition-colors"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className={`w-2 h-2 rounded-full mb-3 ${feature.highlight ? 'bg-purple-600' : 'bg-zinc-300'}`} />
                <h3 className={`font-semibold text-sm mb-1 ${feature.highlight ? 'text-purple-600' : 'text-zinc-900'}`}>
                  {feature.title}
                </h3>
                <p className="text-xs text-zinc-500">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Legal Links Section */}
        <motion.div className="mb-6 sm:mb-8" variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Info className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">{t('about.legal')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link
              to="/privacy-policy"
              className="p-4 bg-white border border-zinc-200 rounded-xl flex items-center gap-4 hover:border-purple-300 transition-colors"
            >
              <div className="p-3 bg-purple-50 rounded-xl flex-shrink-0">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-zinc-900 text-sm sm:text-base">{t('nav.privacy')}</h3>
                <p className="text-xs sm:text-sm text-zinc-500">{t('about.privacyDesc')}</p>
              </div>
            </Link>
            <Link
              to="/terms-of-use"
              className="p-4 bg-white border border-zinc-200 rounded-xl flex items-center gap-4 hover:border-purple-300 transition-colors"
            >
              <div className="p-3 bg-purple-50 rounded-xl flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-zinc-900 text-sm sm:text-base">{t('nav.terms')}</h3>
                <p className="text-xs sm:text-sm text-zinc-500">{t('about.termsDesc')}</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants}>
          <InterviewReady />
        </motion.div>
      </motion.div>
    </div>
  )
}
