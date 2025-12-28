/**
 * Landing Preview Tabs Component
 * 
 * Displays tabbed previews of the product with 5 sections:
 * 1. Personal Dashboard Preview
 * 2. Interview Flow Preview
 * 3. Resume Repository Preview
 * 4. B2B Recruiter Analytics Preview
 * 5. B2B HR Knowledge Hub Preview
 * 
 * All data is static/mock - no API calls.
 */

'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs'
import { Card } from 'components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import {
  MOCK_DASHBOARD,
  MOCK_INTERVIEW_FLOW,
  MOCK_RESUME_REPOSITORY,
  MOCK_RECRUITER_ANALYTICS,
  MOCK_HR_KNOWLEDGE_HUB,
  SUPPORTED_LANGUAGES,
} from './LandingMockData'
import {
  LayoutDashboard,
  Mic,
  FileText,
  BarChart3,
  Headphones,
  Star,
  ChevronRight,
  Check,
  Play,
  MessageSquare,
  Puzzle,
  Settings,
  Target,
  Sparkles,
  HeartPulse,
  Wallet,
  Users,
  type LucideIcon,
} from 'lucide-react'

// Map iconName strings to Lucide components
const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare,
  Puzzle,
  Settings,
  Target,
  Sparkles,
  FileText,
  HeartPulse,
  Wallet,
  Users,
}

export const LandingPreviewTabs: React.FC = () => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

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
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0.2 : 0.5, ease: 'easeOut' },
    },
  }

  const tabConfig = [
    { id: 'dashboard', label: t('landing.previewTabs.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { id: 'interview', label: t('landing.previewTabs.interview', 'Interview Flow'), icon: Mic },
    { id: 'resumes', label: t('landing.previewTabs.resumes', 'Resumes'), icon: FileText },
    { id: 'recruiter', label: t('landing.previewTabs.recruiter', 'Recruiter'), icon: BarChart3, comingSoon: true },
    { id: 'hr', label: t('landing.previewTabs.hr', 'HR Hub'), icon: Headphones, comingSoon: true },
  ]

  return (
    <section id="product-preview" className="py-12 sm:py-16 lg:py-24 bg-zinc-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Section Header */}
          <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full mb-3 sm:mb-4">
              {t('landing.previewTabs.badge', 'Product Preview')}
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-zinc-900 mb-3 sm:mb-4">
              {t('landing.previewTabs.title', 'See Vocaid in')} <span className="text-purple-600">{t('landing.previewTabs.titleHighlight', 'Action')}</span>
            </h2>
            <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto px-2">
              {t('landing.previewTabs.subtitle', 'Explore what you can do with Vocaid. From personal interview practice to enterprise recruiting.')}
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab List - horizontal scroll on mobile */}
              <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                <TabsList className="w-max sm:w-full flex justify-start sm:justify-center gap-2 bg-transparent mb-6 sm:mb-8">
                  {tabConfig.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[40px] data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-zinc-600 data-[state=inactive]:border data-[state=inactive]:border-zinc-200 data-[state=inactive]:hover:border-purple-300"
                    >
                      <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
                      <span className="hidden xs:inline">{tab.label}</span>
                      <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
                      {tab.comingSoon && (
                        <span className="ml-1.5 sm:ml-2 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[10px] bg-zinc-200 text-zinc-600 rounded-full data-[state=active]:bg-purple-500 data-[state=active]:text-purple-100">
                          Soon
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab Content Container */}
              <Card className="border-zinc-200 shadow-xl shadow-zinc-200/50 overflow-hidden bg-white">
                {/* Mock Browser Header - simplified on mobile */}
                <div className="bg-zinc-100 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 border-b border-zinc-200">
                  <div className="flex gap-1 sm:gap-1.5">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-400" />
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center overflow-hidden">
                    <div className="px-2 sm:px-4 py-1 bg-white rounded-md text-[10px] sm:text-xs text-zinc-500 border border-zinc-200 truncate max-w-[200px] sm:max-w-none">
                      vocaid.app/{activeTab === 'dashboard' ? 'app/b2c/dashboard' : activeTab === 'interview' ? 'app/b2c/interview/new' : activeTab === 'resumes' ? 'app/b2c/resumes' : activeTab === 'recruiter' ? 'app/b2b/analytics' : 'app/hr/knowledge'}
                    </div>
                  </div>
                </div>

                {/* Tab Panels */}
                <div className="p-3 sm:p-4 lg:p-6 min-h-[300px] sm:min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {/* Dashboard Tab */}
                    <TabsContent value="dashboard" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <DashboardPreview />
                      </motion.div>
                    </TabsContent>

                    {/* Interview Flow Tab */}
                    <TabsContent value="interview" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <InterviewFlowPreview />
                      </motion.div>
                    </TabsContent>

                    {/* Resumes Tab */}
                    <TabsContent value="resumes" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ResumeRepositoryPreview />
                      </motion.div>
                    </TabsContent>

                    {/* Recruiter Tab */}
                    <TabsContent value="recruiter" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <RecruiterAnalyticsPreview />
                      </motion.div>
                    </TabsContent>

                    {/* HR Hub Tab */}
                    <TabsContent value="hr" className="mt-0">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <HRKnowledgeHubPreview />
                      </motion.div>
                    </TabsContent>
                  </AnimatePresence>
                </div>
              </Card>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// =============================================
// Dashboard Preview Component
// =============================================
const DashboardPreview: React.FC = () => {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: Stats + Chart */}
      <div className="lg:col-span-2 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600">{MOCK_DASHBOARD.stats.totalInterviews}</div>
            <div className="text-xs text-zinc-500">Interviews</div>
          </div>
          <div className="p-4 bg-zinc-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-zinc-900">{MOCK_DASHBOARD.stats.avgScore}%</div>
            <div className="text-xs text-zinc-500">Avg Score</div>
          </div>
          <div className="p-4 bg-zinc-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-purple-600">{MOCK_DASHBOARD.stats.creditsRemaining}</div>
            <div className="text-xs text-zinc-500">Credits</div>
          </div>
          <div className="p-4 bg-zinc-50 rounded-xl text-center">
            <div className="text-2xl font-bold text-zinc-900">{MOCK_DASHBOARD.stats.resumesUploaded}</div>
            <div className="text-xs text-zinc-500">Resumes</div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="p-4 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Performance Trend</h4>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={MOCK_DASHBOARD.performanceTrend}>
              <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[50, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#9333ea" strokeWidth={2} dot={{ fill: '#9333ea', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Activity */}
        <div className="p-4 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Weekly Activity</h4>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={MOCK_DASHBOARD.weeklyActivity}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Bar dataKey="sessions" fill="#9333ea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Skills + Recent */}
      <div className="space-y-6">
        {/* Skill Breakdown */}
        <div className="p-4 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Skill Breakdown</h4>
          <div className="space-y-3">
            {MOCK_DASHBOARD.skillBreakdown.map((skill) => {
              const IconComponent = ICON_MAP[skill.iconName]
              return (
                <div key={skill.skill} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    {IconComponent && <IconComponent className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-600">{skill.skill}</span>
                      <span className="font-medium text-zinc-900">{skill.score}%</span>
                    </div>
                    <div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${skill.score}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Interviews */}
        <div className="p-4 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Recent Interviews</h4>
          <div className="space-y-3">
            {MOCK_DASHBOARD.recentInterviews.map((interview, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 truncate">{interview.role}</div>
                  <div className="text-xs text-zinc-500">{interview.company} • {interview.date}</div>
                </div>
                <div className="text-sm font-semibold text-purple-600">{interview.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================
// Interview Flow Preview Component
// =============================================
const InterviewFlowPreview: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {MOCK_INTERVIEW_FLOW.steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              step.completed ? 'bg-purple-600 text-white' : 'bg-zinc-100 text-zinc-500'
            }`}>
              {step.completed ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 flex items-center justify-center text-xs">{step.id}</span>}
              {step.label}
            </div>
            {index < MOCK_INTERVIEW_FLOW.steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-zinc-300" />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Setup Panel */}
        <div className="p-6 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Interview Setup</h4>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Target Role</label>
              <div className="p-3 bg-white rounded-lg border border-zinc-200 text-sm">{MOCK_INTERVIEW_FLOW.selectedRole}</div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Company</label>
              <div className="p-3 bg-white rounded-lg border border-zinc-200 text-sm">{MOCK_INTERVIEW_FLOW.selectedCompany}</div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Language</label>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.slice(0, 4).map((lang) => (
                  <span
                    key={lang.code}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      lang.name === 'English' ? 'bg-purple-600 text-white' : 'bg-white border border-zinc-200 text-zinc-600'
                    }`}
                  >
                    {lang.flag} {lang.name}
                  </span>
                ))}
                <span className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-xs text-zinc-500">+3 more</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Questions */}
        <div className="p-6 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Sample Questions</h4>
          <div className="space-y-3">
            {MOCK_INTERVIEW_FLOW.sampleQuestions.map((q, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-zinc-200">
                <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full mb-2 ${
                  q.type === 'behavioral' ? 'bg-purple-100 text-purple-700' :
                  q.type === 'technical' ? 'bg-zinc-200 text-zinc-700' :
                  'bg-purple-50 text-purple-600'
                }`}>
                  {q.type}
                </span>
                <p className="text-sm text-zinc-700">{q.question}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
            <Play className="w-4 h-4" />
            Start Interview
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// Resume Repository Preview Component
// =============================================
const ResumeRepositoryPreview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-700">Your Resumes ({MOCK_RESUME_REPOSITORY.stats.totalResumes})</h4>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">+ Upload Resume</button>
      </div>

      {/* Resume Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {MOCK_RESUME_REPOSITORY.resumes.map((resume) => (
          <div key={resume.id} className={`p-4 bg-zinc-50 rounded-xl border-2 ${resume.isPrimary ? 'border-purple-600' : 'border-transparent'}`}>
            <div className="flex items-start justify-between mb-3">
              <FileText className="w-8 h-8 text-purple-600" />
              {resume.isPrimary && (
                <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-purple-600 bg-purple-100 rounded-full">
                  <Star className="w-3 h-3" /> Primary
                </span>
              )}
            </div>
            <h5 className="font-medium text-zinc-900 text-sm mb-1 truncate">{resume.title}</h5>
            <p className="text-xs text-zinc-500 mb-3">Updated: {resume.lastUpdated}</p>
            
            {resume.usedIn.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-zinc-500 mb-1">Used in:</p>
                <div className="flex flex-wrap gap-1">
                  {resume.usedIn.slice(0, 2).map((use, i) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] bg-zinc-200 text-zinc-600 rounded-full truncate max-w-full">{use}</span>
                  ))}
                </div>
              </div>
            )}
            
            {resume.roleScore !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Match Score:</span>
                <span className="text-sm font-semibold text-purple-600">{resume.roleScore}%</span>
              </div>
            ) : (
              <span className="text-xs text-zinc-400 italic">Scoring coming soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================
// Recruiter Analytics Preview Component
// =============================================
const RecruiterAnalyticsPreview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="p-4 bg-zinc-100 rounded-xl text-center">
        <span className="inline-block px-3 py-1 text-xs font-semibold text-zinc-600 bg-zinc-200 rounded-full">
          🚧 B2B Recruiting Platform - Coming Soon
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="p-4 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Candidate Pipeline</h4>
          <div className="space-y-2">
            {MOCK_RECRUITER_ANALYTICS.candidatePipeline.map((stage, index) => {
              const maxCount = MOCK_RECRUITER_ANALYTICS.candidatePipeline[0].count
              const width = (stage.count / maxCount) * 100
              return (
                <div key={stage.stage} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-20 truncate">{stage.stage}</span>
                  <div className="flex-1 h-6 bg-zinc-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-xs font-medium text-white">{stage.count}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Candidates */}
        <div className="p-4 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Recent Candidates</h4>
          <div className="space-y-3">
            {MOCK_RECRUITER_ANALYTICS.recentCandidates.slice(0, 3).map((candidate, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-600">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900 truncate">{candidate.name}</div>
                  <div className="text-xs text-zinc-500">{candidate.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-purple-600">{candidate.score}%</div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    candidate.status === 'Recommended' ? 'bg-purple-100 text-purple-600' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {candidate.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================
// HR Knowledge Hub Preview Component
// =============================================
const HRKnowledgeHubPreview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="p-4 bg-zinc-100 rounded-xl text-center">
        <span className="inline-block px-3 py-1 text-xs font-semibold text-zinc-600 bg-zinc-200 rounded-full">
          🚧 B2B Employee Service Hub - Coming Soon
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Categories */}
        <div className="p-4 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">Knowledge Categories</h4>
          <div className="space-y-2">
            {MOCK_HR_KNOWLEDGE_HUB.categories.map((cat) => {
              const IconComponent = ICON_MAP[cat.iconName]
              return (
                <div key={cat.name} className="flex items-center gap-3 p-2 bg-white rounded-lg cursor-pointer hover:border-purple-300 border border-transparent transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    {IconComponent && <IconComponent className="w-4 h-4 text-purple-600" />}
                  </div>
                  <span className="text-sm text-zinc-700 flex-1">{cat.name}</span>
                  <span className="text-xs text-zinc-400">({cat.count})</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat Mock */}
        <div className="lg:col-span-2 p-4 bg-zinc-50 rounded-xl">
          <h4 className="text-sm font-medium text-zinc-700 mb-4">AI HR Assistant</h4>
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {MOCK_HR_KNOWLEDGE_HUB.chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-white border border-zinc-200 text-zinc-700 rounded-bl-sm'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-zinc-200">
            <input
              type="text"
              placeholder="Ask about policies, benefits, payroll..."
              disabled
              className="flex-1 bg-transparent text-sm text-zinc-400 outline-none cursor-not-allowed"
            />
            <button disabled className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm cursor-not-allowed opacity-50">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPreviewTabs
