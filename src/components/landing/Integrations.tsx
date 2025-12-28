'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from 'components/ui/card'

interface IntegrationFeature {
    title: string
    description: string
}

export const Integrations: React.FC = () => {
    const { t } = useTranslation()
    const prefersReducedMotion = useReducedMotion()
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: prefersReducedMotion ? 0 : 0.15,
            },
        },
    }

    const itemVariants = {
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: prefersReducedMotion ? 0.2 : 0.5, ease: 'easeOut' },
        },
    }

    const integrationFeatures = t('landing.integrations.features', { returnObjects: true }) as IntegrationFeature[]

    return (
        <section id="integrations" className="py-12 sm:py-16 lg:py-24 bg-white scroll-mt-20 md:scroll-mt-24">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <div className="text-center mb-8 sm:mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-8 sm:mb-12 lg:mb-16"
                        >

                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                                <span className="text-zinc-900">{t('landing.integrations.titleBlack')}</span>{' '}
                                <span className="text-purple-600">{t('landing.integrations.titlePurple')}</span>
                            </h2>
                            <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2">
                                {t('landing.integrations.subtitle')}
                            </p>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                        {/* Features List */}
                        <motion.div variants={itemVariants} className="space-y-6">
                            {integrationFeatures.map((feature, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <span className="text-sm font-bold text-purple-600">{idx + 1}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-900 mb-1">{feature.title}</h3>
                                        <p className="text-zinc-600 text-sm">{feature.description}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4">
                                <p className="text-sm text-zinc-500">
                                    {t('landing.integrations.tagline')}
                                </p>
                            </div>
                        </motion.div>

                        {/* Code Mock */}
                        <motion.div variants={itemVariants}>
                            <Card className="border-zinc-200 overflow-hidden">
                                <div className="bg-zinc-900 px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                    </div>
                                    <span className="text-xs text-zinc-400 font-mono ml-2">terminal</span>
                                </div>
                                <CardContent className="p-0">
                                    <div className="bg-zinc-950 p-3 sm:p-4 overflow-x-auto">
                                        <pre className="text-xs sm:text-sm font-mono">
                                            <code>
                                                <span className="text-zinc-500"># Install the SDK</span>{'\n'}
                                                <span className="text-emerald-400">npm</span>{' '}
                                                <span className="text-zinc-300">install</span>{' '}
                                                <span className="text-purple-400">@vocaid/connect</span>{'\n\n'}

                                                <span className="text-zinc-500"># Initialize in your app</span>{'\n'}
                                                <span className="text-blue-400">import</span>{' '}
                                                <span className="text-zinc-300">{'{'} VocaidInterview {'}'}</span>{' '}
                                                <span className="text-blue-400">from</span>{' '}
                                                <span className="text-amber-400">'@vocaid/connect'</span>{'\n\n'}

                                                <span className="text-zinc-500"># Webhook events you'll receive:</span>{'\n'}
                                                <span className="text-zinc-400">• interview.started</span>{'\n'}
                                                <span className="text-zinc-400">• interview.completed</span>{'\n'}
                                                <span className="text-zinc-400">• scorecard.generated</span>{'\n'}
                                                <span className="text-zinc-400">• candidate.evaluated</span>
                                            </code>
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <span className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                                    {t('landing.integrations.badges.typescript')}
                                </span>
                                <span className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                                    {t('landing.integrations.badges.restApi')}
                                </span>
                                <span className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                                    {t('landing.integrations.badges.webhooks')}
                                </span>
                                <span className="px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-medium rounded-full">
                                    {t('landing.integrations.badges.openapi')}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Integrations
