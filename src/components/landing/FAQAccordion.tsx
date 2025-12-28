'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from 'components/ui/accordion'

export const FAQAccordion: React.FC = () => {
    const { t } = useTranslation()
    const prefersReducedMotion = useReducedMotion()
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const faqItems = [
        {
            question: t('landing.faq.items.whatIsVocaid.question'),
            answer: t('landing.faq.items.whatIsVocaid.answer'),
        },
        {
            question: t('landing.faq.items.howCreditsWork.question'),
            answer: t('landing.faq.items.howCreditsWork.answer'),
        },
        {
            question: t('landing.faq.items.multilingual.question'),
            answer: t('landing.faq.items.multilingual.answer'),
        },
        {
            question: t('landing.faq.items.resumeRepository.question'),
            answer: t('landing.faq.items.resumeRepository.answer'),
        },
        {
            question: t('landing.faq.items.linkedinImport.question'),
            answer: t('landing.faq.items.linkedinImport.answer'),
        },
        {
            question: t('landing.faq.items.privacy.question'),
            answer: t('landing.faq.items.privacy.answer'),
        },
        {
            question: t('landing.faq.items.support.question'),
            answer: t('landing.faq.items.support.answer'),
        },
        {
            question: t('landing.faq.items.rubrics.question'),
            answer: t('landing.faq.items.rubrics.answer'),
        },
    ]

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: prefersReducedMotion ? 0 : 0.05,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: prefersReducedMotion ? 0.2 : 0.4, ease: 'easeOut' },
        },
    }

    return (
        <section id="faq" className="py-12 sm:py-16 lg:py-24 bg-white scroll-mt-20 md:scroll-mt-24">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-8 sm:mb-12 lg:mb-16"
                    >

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                            <span className="text-zinc-900">{t('landing.faq.titleBlack')}</span>{' '}
                            <span className="text-purple-600">{t('landing.faq.titlePurple')}</span>
                        </h2>
                        <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2">
                            {t('landing.faq.subtitle')}
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Accordion type="single" collapsible className="w-full">
                            {faqItems.map((item, idx) => (
                                <AccordionItem key={idx} value={`item-${idx}`} className="border-zinc-200">
                                    <AccordionTrigger className="text-left text-base font-medium text-zinc-900 hover:text-purple-600">
                                        {item.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-zinc-600 leading-relaxed">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

export default FAQAccordion
