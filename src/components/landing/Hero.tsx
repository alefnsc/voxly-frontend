'use client'

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from 'components/ui/button'
import { SUPPORTED_LANGUAGES } from './LandingMockData'
// Promo banner removed: import { LandingHeroPromoBanner } from './LandingHeroPromoBanner'
import { HeroPreview } from './HeroPreview'
import { HeroWaitlistForm } from './HeroWaitlistForm'
import { ArrowRight, Building2, Globe } from 'lucide-react'

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

    // Split languages into three columns: 3 + 2 + 2
    const languagesCol1 = SUPPORTED_LANGUAGES.slice(0, 3)
    const languagesCol2 = SUPPORTED_LANGUAGES.slice(3, 5)
    const languagesCol3 = SUPPORTED_LANGUAGES.slice(5, 7)

    return (
        <section className="relative min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-6rem)] flex items-center overflow-hidden py-8 sm:py-12 lg:py-16">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 via-white to-white -z-10" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-purple-100/40 to-transparent rounded-full blur-3xl -z-10" />

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
                    {/* Left: Copy + Preview + CTAs + Languages */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="max-w-xl min-w-0 mx-auto lg:mx-0 text-center lg:text-left"
                    >
                        {/* Headline */}
                        <motion.h1
                            variants={itemVariants}
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-tight"
                        >
                            {t('landing.hero.title')}{' '}
                            <span className="text-purple-600">{t('landing.hero.titleHighlight')}</span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="mt-3 sm:mt-5 text-md sm:text-lg md:text-xl text-zinc-600 leading-relaxed"
                        >
                            {t('landing.hero.description')}
                        </motion.p>

                        {/* Hero Preview - Now in left column */}
                        {/* <motion.div
                            variants={itemVariants}
                            className="mt-6 sm:mt-8"
                        >
                            <HeroPreview
                                title={t('landing.hero.imageAlt', 'Vocaid Dashboard Preview')}
                            />
                        </motion.div> */}

                        {/* CTAs */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
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
                                {t('landing.hero.ctaOrganizations', 'Business Solutions')}
                            </Button>
                        </motion.div>

                        {/* Languages - 2-column bullet list (no flags) */}
                        <motion.div
                            variants={itemVariants}
                            className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-zinc-200"
                        >
                            <div className="flex flex-row items-center space-x-2 mb-4 justify-center lg:justify-start font-medium">
                                <span className="whitespace-nowrap text-zinc-700">{t('landing.hero.languagesLabel', 'Available in 7 languages')}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 max-w-md mx-auto lg:mx-0">
                                {/* Column 1: 3 items */}
                                <ul className="space-y-1.5">
                                    {languagesCol1.map((lang) => (
                                        <li
                                            key={lang.code}
                                            className="flex items-center gap-2 text-sm text-zinc-700"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                            {lang.name}
                                        </li>
                                    ))}
                                </ul>
                                {/* Column 2: 2 items */}
                                <ul className="space-y-1.5">
                                    {languagesCol2.map((lang) => (
                                        <li
                                            key={lang.code}
                                            className="flex items-center gap-2 text-sm text-zinc-700"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                            {lang.name}
                                        </li>
                                    ))}
                                </ul>
                                {/* Column 3: 2 items */}
                                <ul className="space-y-1.5">
                                    {languagesCol3.map((lang) => (
                                        <li
                                            key={lang.code}
                                            className="flex items-center gap-2 text-sm text-zinc-700"
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                            {lang.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right: Waitlist Form */}
                    <motion.div
                        id="business-waitlist"
                        initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: prefersReducedMotion ? 0.2 : 0.8, delay: prefersReducedMotion ? 0 : 0.4 }}
                        className="relative lg:sticky lg:top-24 scroll-mt-24"
                    >
                        <HeroWaitlistForm />
                    </motion.div>
                </div>

                {/* Promo Banner - REMOVED */}
                {/* 
                <div className="mt-8 lg:mt-12">
                    <LandingHeroPromoBanner />
                </div>
                */}
            </div>
        </section>
    )
}

export default Hero
