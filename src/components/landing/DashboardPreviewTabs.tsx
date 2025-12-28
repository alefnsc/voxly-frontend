'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import {
    LineChart,
    Line,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts'

// Mock API key for demo
const MOCK_API_KEY = 'voc_live_sk_7f8d9e2a1b4c3d5e6f7a8b9c0d1e2f3a'
const MASKED_API_KEY = 'voc_live_••••••••••••••••••••••••'

// Mock data for the dashboard preview - Uses translation keys for localization
const getPipelineData = (t: (key: string) => string) => [
    { name: t('landing.dashboardPreview.sampleData.candidate1'), stage: t('landing.dashboardPreview.stages.technical'), fitScore: 92, lastUpdated: t('landing.dashboardPreview.sampleData.timeAgo2h') },
    { name: t('landing.dashboardPreview.sampleData.candidate2'), stage: t('landing.dashboardPreview.stages.finalRound'), fitScore: 88, lastUpdated: t('landing.dashboardPreview.sampleData.timeAgo5h') },
    { name: t('landing.dashboardPreview.sampleData.candidate3'), stage: t('landing.dashboardPreview.stages.hrScreen'), fitScore: 76, lastUpdated: t('landing.dashboardPreview.sampleData.timeAgo1d') },
    { name: t('landing.dashboardPreview.sampleData.candidate4'), stage: t('landing.dashboardPreview.stages.offerExtended'), fitScore: 95, lastUpdated: t('landing.dashboardPreview.sampleData.timeAgo3h') },
    { name: t('landing.dashboardPreview.sampleData.candidate5'), stage: t('landing.dashboardPreview.stages.technical'), fitScore: 81, lastUpdated: t('landing.dashboardPreview.sampleData.timeAgo6h') },
]

const completionData = [
    { date: 'Mon', rate: 72 },
    { date: 'Tue', rate: 78 },
    { date: 'Wed', rate: 85 },
    { date: 'Thu', rate: 82 },
    { date: 'Fri', rate: 91 },
    { date: 'Sat', rate: 88 },
    { date: 'Sun', rate: 94 },
]

const getCompetencyData = (t: (key: string) => string) => [
    { skill: t('landing.dashboardPreview.skills.problemSolving'), score: 85, fullMark: 100 },
    { skill: t('landing.dashboardPreview.skills.communication'), score: 78, fullMark: 100 },
    { skill: t('landing.dashboardPreview.skills.technicalDepth'), score: 92, fullMark: 100 },
    { skill: t('landing.dashboardPreview.skills.leadership'), score: 70, fullMark: 100 },
    { skill: t('landing.dashboardPreview.skills.collaboration'), score: 88, fullMark: 100 },
    { skill: t('landing.dashboardPreview.skills.adaptability'), score: 75, fullMark: 100 },
]

const getScorecardEvidence = (t: (key: string) => string) => [
    {
        competency: t('landing.dashboardPreview.skills.problemSolving'),
        score: 4.5,
        evidence: [
            { text: t('landing.dashboardPreview.evidence.debugging'), timestamp: '3:42' },
            { text: t('landing.dashboardPreview.evidence.solutions'), timestamp: '8:15' },
        ],
    },
    {
        competency: t('landing.dashboardPreview.skills.technicalDepth'),
        score: 4.8,
        evidence: [
            { text: t('landing.dashboardPreview.evidence.systemDesign'), timestamp: '12:30' },
            { text: t('landing.dashboardPreview.evidence.distributedSystems'), timestamp: '18:45' },
        ],
    },
    {
        competency: t('landing.dashboardPreview.skills.communication'),
        score: 4.2,
        evidence: [
            { text: t('landing.dashboardPreview.evidence.articulation'), timestamp: '5:20' },
            { text: t('landing.dashboardPreview.evidence.clarifying'), timestamp: '9:55' },
        ],
    },
]

const webhookEvents = [
    { event: 'interview.completed', status: 'delivered', count: 1247 },
    { event: 'scorecard.generated', status: 'delivered', count: 1198 },
    { event: 'candidate.evaluated', status: 'delivered', count: 1156 },
    { event: 'webhook.retry', status: 'retry', count: 23 },
]

const FitScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    let colorClass = 'bg-zinc-100 text-zinc-700'
    if (score >= 90) colorClass = 'bg-purple-100 text-purple-700'
    else if (score >= 80) colorClass = 'bg-purple-50 text-purple-600'
    else if (score >= 70) colorClass = 'bg-zinc-100 text-zinc-600'

    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
            {score}%
        </span>
    )
}

const StageBadge: React.FC<{ stage: string }> = ({ stage }) => {
    // Brand-consistent colors: purple and zinc tones only
    // Map stages by position in pipeline (earlier = lighter)
    const getStageColor = (s: string): string => {
        const stageLower = s.toLowerCase()
        if (stageLower.includes('hr') || stageLower.includes('screen')) return 'bg-zinc-100 text-zinc-700'
        if (stageLower.includes('technical')) return 'bg-purple-100 text-purple-700'
        if (stageLower.includes('final')) return 'bg-purple-200 text-purple-800'
        if (stageLower.includes('offer')) return 'bg-purple-600 text-white'
        return 'bg-zinc-100 text-zinc-700'
    }

    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStageColor(stage)}`}>
            {stage}
        </span>
    )
}

export const DashboardPreviewTabs: React.FC = () => {
    const { t } = useTranslation()
    const prefersReducedMotion = useReducedMotion()
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    })

    // API key reveal/copy state
    const [isKeyRevealed, setIsKeyRevealed] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    const handleCopyKey = async () => {
        try {
            await navigator.clipboard.writeText(MOCK_API_KEY)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const toggleReveal = () => {
        setIsKeyRevealed(!isKeyRevealed)
    }

    // Get localized data
    const pipelineData = getPipelineData(t)
    const competencyData = getCompetencyData(t)
    const scorecardEvidence = getScorecardEvidence(t)

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: prefersReducedMotion ? 0 : 0.1,
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

    const floatAnimation = prefersReducedMotion
        ? {}
        : {
            y: [0, -4, 0],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
            },
        }

    return (
        <section id="solutions" className="py-12 sm:py-16 lg:py-24 bg-zinc-50 scroll-mt-20 md:scroll-mt-24">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    ref={ref}
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                    className="text-center mb-8 sm:mb-10 lg:mb-12"
                >

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-8 sm:mb-12 lg:mb-16"
                    >

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                            <span className="text-zinc-900">{t('landing.dashboardPreview.titleBlack')}</span>{' '}
                            <span className="text-purple-600">{t('landing.dashboardPreview.titlePurple')}</span>
                        </h2>
                        <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2">
                            {t('landing.dashboardPreview.subtitle')}
                        </p>
                    </motion.div>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <motion.div animate={floatAnimation}>
                        <Card className="border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden">
                            <div className="bg-zinc-900 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
                                <div className="flex gap-1 sm:gap-1.5">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500" />
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500" />
                                </div>
                                <div className="flex-1 text-center overflow-hidden">
                                    <span className="text-[10px] sm:text-xs text-zinc-400 font-mono truncate">dashboard.vocaid.com</span>
                                </div>
                            </div>

                            <Tabs defaultValue="pipeline" className="w-full">
                                <div className="border-b border-zinc-200 bg-white px-3 sm:px-4 lg:px-6 py-3 sm:py-4 overflow-x-auto -mx-px scrollbar-hide">
                                    <TabsList className="w-max sm:w-auto justify-start whitespace-nowrap gap-1">
                                        <TabsTrigger value="pipeline" className="text-[11px] sm:text-xs lg:text-sm min-h-[36px] px-2 sm:px-3">{t('landing.dashboardPreview.tabs.pipeline')}</TabsTrigger>
                                        <TabsTrigger value="scorecard" className="text-[11px] sm:text-xs lg:text-sm min-h-[36px] px-2 sm:px-3">{t('landing.dashboardPreview.tabs.scorecard')}</TabsTrigger>
                                        <TabsTrigger value="developer" className="text-[11px] sm:text-xs lg:text-sm min-h-[36px] px-2 sm:px-3">{t('landing.dashboardPreview.tabs.developer')}</TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Pipeline Tab */}
                                <TabsContent value="pipeline" className="m-0">
                                    <div className="p-3 sm:p-4 lg:p-6 bg-white">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                                            {/* Table */}
                                            <div className="lg:col-span-2">
                                                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                                                    <div className="bg-zinc-50 px-3 sm:px-4 py-2 sm:py-3 border-b border-zinc-200">
                                                        <h3 className="font-semibold text-sm sm:text-base text-zinc-900">{t('landing.dashboardPreview.pipeline.activeCandidates')}</h3>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full min-w-[500px]">
                                                            <thead className="bg-zinc-50 border-b border-zinc-200">
                                                                <tr>
                                                                    <th className="px-3 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-zinc-600 uppercase whitespace-nowrap">{t('landing.dashboardPreview.pipeline.tableHeaders.name')}</th>
                                                                    <th className="px-3 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-zinc-600 uppercase whitespace-nowrap">{t('landing.dashboardPreview.pipeline.tableHeaders.stage')}</th>
                                                                    <th className="px-3 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-zinc-600 uppercase whitespace-nowrap">{t('landing.dashboardPreview.pipeline.tableHeaders.fitScore')}</th>
                                                                    <th className="px-3 sm:px-4 py-3 text-left text-[10px] sm:text-xs font-semibold text-zinc-600 uppercase whitespace-nowrap">{t('landing.dashboardPreview.pipeline.tableHeaders.updated')}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-zinc-100">
                                                                {pipelineData.map((candidate, idx) => (
                                                                    <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                                                                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-zinc-900 whitespace-nowrap">{candidate.name}</td>
                                                                        <td className="px-3 sm:px-4 py-3"><StageBadge stage={candidate.stage} /></td>
                                                                        <td className="px-3 sm:px-4 py-3"><FitScoreBadge score={candidate.fitScore} /></td>
                                                                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-zinc-500 whitespace-nowrap">{candidate.lastUpdated}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Completion Chart */}
                                            <div>
                                                <Card className="border-zinc-200 h-full">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-base font-semibold text-zinc-900">{t('landing.dashboardPreview.pipeline.completionRate')}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ResponsiveContainer width="100%" height={180}>
                                                            <LineChart data={completionData}>
                                                                <XAxis
                                                                    dataKey="date"
                                                                    tick={{ fontSize: 11, fill: '#71717a' }}
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                />
                                                                <YAxis
                                                                    tick={{ fontSize: 11, fill: '#71717a' }}
                                                                    axisLine={false}
                                                                    tickLine={false}
                                                                    domain={[60, 100]}
                                                                />
                                                                <Tooltip
                                                                    contentStyle={{
                                                                        backgroundColor: '#18181b',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        fontSize: '12px',
                                                                    }}
                                                                    labelStyle={{ color: '#a1a1aa' }}
                                                                    itemStyle={{ color: '#ffffff' }}
                                                                />
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="rate"
                                                                    stroke="#7c3aed"
                                                                    strokeWidth={2}
                                                                    dot={{ fill: '#7c3aed', r: 3 }}
                                                                    activeDot={{ r: 5, fill: '#7c3aed' }}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Scorecard Tab */}
                                <TabsContent value="scorecard" className="m-0">
                                    <div className="p-4 sm:p-6 bg-white">
                                        <div className="grid lg:grid-cols-3 gap-6">
                                            {/* Evidence Cards */}
                                            <div className="lg:col-span-2 space-y-4">
                                                {scorecardEvidence.map((item, idx) => (
                                                    <Card key={idx} className="border-zinc-200">
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className="text-base font-semibold text-zinc-900">
                                                                    {item.competency}
                                                                </CardTitle>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lg font-bold text-purple-600">{item.score}</span>
                                                                    <span className="text-xs text-zinc-500">/5</span>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            <ul className="space-y-2">
                                                                {item.evidence.map((ev, evIdx) => (
                                                                    <li key={evIdx} className="flex items-start gap-3 text-sm">
                                                                        <span className="shrink-0 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded font-mono text-xs">
                                                                            {ev.timestamp}
                                                                        </span>
                                                                        <span className="text-zinc-700">{ev.text}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>

                                            {/* Radar Chart */}
                                            <div className="hidden sm:block">
                                                <Card className="border-zinc-200 h-full">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-base font-semibold text-zinc-900">{t('landing.dashboardPreview.scorecard.competencyOverview')}</CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <ResponsiveContainer width="100%" height={250}>
                                                            <RadarChart data={competencyData} outerRadius="70%">
                                                                <PolarGrid stroke="#e4e4e7" />
                                                                <PolarAngleAxis
                                                                    dataKey="skill"
                                                                    tick={{ fontSize: 9, fill: '#71717a' }}
                                                                    tickLine={false}
                                                                />
                                                                <PolarRadiusAxis
                                                                    angle={30}
                                                                    domain={[0, 100]}
                                                                    tick={{ fontSize: 9, fill: '#71717a' }}
                                                                />
                                                                <Radar
                                                                    name="Score"
                                                                    dataKey="score"
                                                                    stroke="#7c3aed"
                                                                    fill="#7c3aed"
                                                                    fillOpacity={0.2}
                                                                    strokeWidth={2}
                                                                />
                                                            </RadarChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Developer Tab */}
                                <TabsContent value="developer" className="m-0">
                                    <div className="p-4 sm:p-6 bg-white">
                                        <div className="grid lg:grid-cols-2 gap-6">
                                            {/* API Key Card */}
                                            <Card className="border-zinc-200">
                                                <CardHeader>
                                                    <CardTitle className="text-base font-semibold text-zinc-900">{t('landing.dashboardPreview.developer.apiCredentials')}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div>
                                                        <label className="text-xs font-medium text-zinc-500 uppercase">{t('landing.dashboardPreview.developer.apiKey')}</label>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <code className="flex-1 px-3 py-2 bg-zinc-100 rounded-md text-sm font-mono text-zinc-700 truncate">
                                                                {isKeyRevealed ? MOCK_API_KEY : MASKED_API_KEY}
                                                            </code>
                                                            <button
                                                                onClick={toggleReveal}
                                                                className="shrink-0 p-2 text-zinc-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                                                                title={isKeyRevealed ? t('landing.dashboardPreview.developer.hide') : t('landing.dashboardPreview.developer.reveal')}
                                                            >
                                                                {isKeyRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={handleCopyKey}
                                                                className={`shrink-0 p-2 rounded-md transition-colors ${isCopied
                                                                        ? 'bg-purple-100 text-purple-700'
                                                                        : 'text-zinc-600 hover:text-purple-600 hover:bg-purple-50'
                                                                    }`}
                                                                title={isCopied ? t('landing.dashboardPreview.developer.copied') : t('landing.dashboardPreview.developer.copy')}
                                                            >
                                                                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                            </button>
                                                        </div>
                                                        {isCopied && (
                                                            <p className="mt-1 text-xs text-purple-600 font-medium">
                                                                {t('landing.dashboardPreview.developer.copied', 'Copied to clipboard!')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-zinc-500 uppercase">{t('landing.dashboardPreview.developer.environment')}</label>
                                                        <div className="mt-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-md text-sm font-medium inline-block">
                                                            {t('landing.dashboardPreview.developer.production')}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* Webhook Status */}
                                            <Card className="border-zinc-200">
                                                <CardHeader>
                                                    <CardTitle className="text-base font-semibold text-zinc-900">{t('landing.dashboardPreview.developer.webhookStatus')}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        {webhookEvents.map((event, idx) => (
                                                            <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                                                                <code className="text-sm font-mono text-zinc-700">{event.event}</code>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-sm text-zinc-500">{event.count.toLocaleString()}</span>
                                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${event.status === 'delivered'
                                                                            ? 'bg-purple-100 text-purple-700'
                                                                            : 'bg-zinc-100 text-zinc-600'
                                                                        }`}>
                                                                        {event.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

export default DashboardPreviewTabs
