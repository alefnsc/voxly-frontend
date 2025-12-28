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
    <section id="faq" className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <div className="text-center mb-8 sm:mb-12">
            <motion.span
              variants={itemVariants}
              className="inline-block px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full mb-3 sm:mb-4"
            >
              {t('landing.faq.badge')}
            </motion.span>
            <motion.h2
              variants={itemVariants}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4"
            >
              {t('landing.faq.title')}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-zinc-600 px-2"
            >
              {t('landing.faq.subtitle')}
            </motion.p>
          </div>

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
