'use client'

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from 'components/ui/button'
import { SUPPORTED_LANGUAGES } from './LandingMockData'
import { LandingHeroPromoBanner } from './LandingHeroPromoBanner'
import { HeroPreview } from './HeroPreview'
import { ArrowRight, Building2 } from 'lucide-react'

interface HeroProps {
    onDemoClick: () => void
}

export const Hero: React.FC<HeroProps> = ({ onDemoClick }) => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const prefersReducedMotion = useReducedMotion()

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: prefersReducedMotion ? 0 : 0.15,
                delayChildren: prefersReducedMotion ? 0 : 0.2,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: prefersReducedMotion ? 0.2 : 0.6, ease: 'easeOut' },
        },
    }

    const floatAnimation = prefersReducedMotion
        ? {}
        : {
            y: [0, -8, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
            },
        }

    return (
        <section className="relative min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-6rem)] flex items-center overflow-hidden py-8 sm:py-12 lg:py-16">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 via-white to-white -z-10" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-purple-100/40 to-transparent rounded-full blur-3xl -z-10" />

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16 items-center">
                    {/* Left: Copy */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-xl min-w-0 mx-auto lg:mx-0 text-center lg:text-left"
                    >

                        <motion.h1
                            variants={itemVariants}
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-tight"
                        >
                            {t('landing.hero.title')}{' '}
                            <span className="text-purple-600">{t('landing.hero.titleHighlight')}</span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="mt-3 sm:mt-5 text-base sm:text-lg md:text-xl text-zinc-600 leading-relaxed"
                        >
                            {t('landing.hero.description')}
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-5 sm:mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
                        >
                            <Button
                                size="lg"
                                onClick={() => navigate('/sign-up')}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-200 transition-all group min-h-[48px]"
                            >
                                {t('landing.hero.ctaStart')}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => {
                                    const el = document.getElementById('b2b-section')
                                    if (el) {
                                      const header = document.querySelector('[data-landing-header="true"]')
                                      const headerHeight = header?.getBoundingClientRect().height ?? 80
                                      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 8
                                      window.scrollTo({ top, behavior: 'smooth' })
                                    }
                                }}
                                className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold group min-h-[48px]"
                            >
                                <Building2 className="w-4 h-4 mr-2" />
                                {t('landing.hero.ctaOrganizations', 'For Organizations')}
                                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                                    {t('common.soon', 'Soon')}
                                </span>
                            </Button>
                        </motion.div>

                        {/* Language Badges */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-zinc-200"
                        >
                            <p className="text-xs font-medium text-zinc-500 mb-2 sm:mb-3">
                                {t('landing.hero.languagesLabel', 'Available in 7 languages')}
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                {SUPPORTED_LANGUAGES.map((lang) => (
                                    <span
                                        key={lang.code}
                                        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-zinc-200 rounded-full text-xs font-medium text-zinc-700 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                                    >
                                        <span className="text-sm sm:text-base">{lang.flag}</span>
                                        <span className="hidden sm:inline">{lang.name}</span>
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                    </motion.div>

                    {/* Right: Hero Visual */}
                    <motion.div
                        initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0.2 : 0.8, delay: prefersReducedMotion ? 0 : 0.4 }}
                        className="relative hidden sm:block"
                    >
                        <motion.div
                            animate={floatAnimation}
                            className="relative z-10"
                        >
                            {/* Premium Hero Preview Component */}
                            <HeroPreview
                                title={t('landing.hero.imageAlt', 'Vocaid Dashboard Preview')}
                            />

                            {/* Floating cards for visual interest */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                                className="hidden md:block absolute -bottom-4 lg:-bottom-6 left-2 lg:-left-6 bg-white rounded-xl shadow-lg p-3 lg:p-4 border border-zinc-100"
                            >
                                <div className="text-xl lg:text-2xl font-bold text-purple-600">{t('landing.hero.stats.faster', '3.2x')}</div>
                                <div className="text-[10px] lg:text-xs text-zinc-500">{t('landing.hero.stats.fasterLabel', 'Faster iteration')}</div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="hidden md:block absolute top-0 lg:-top-2 right-2 lg:-right-4 bg-white rounded-xl shadow-lg p-3 lg:p-4 border border-zinc-100"
                            >
                                <div className="text-xl lg:text-2xl font-bold text-zinc-900">7</div>
                                <div className="text-[10px] lg:text-xs text-zinc-500">{t('landing.hero.stats.languages', 'Languages')}</div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </div>
                <div className="mt-8 lg:mt-12">
                <LandingHeroPromoBanner/>
                </div>
            </div>
        </section>
    )
}

export default Hero
