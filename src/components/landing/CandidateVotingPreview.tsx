/**
 * Candidate Voting Preview Component
 * 
 * A non-functional demo preview showing how multiple hiring stakeholders
 * collaborate to evaluate a candidate with evidence-based voting.
 * 
 * @module components/landing/CandidateVotingPreview
 */

'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Card } from 'components/ui/card'
import { 
  User, 
  Users, 
  Briefcase, 
  Code, 
  UserCheck, 
  Shield,
  Clock,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
} from 'lucide-react'

// Mock stakeholder data
const MOCK_STAKEHOLDERS = [
  { id: 'recruiter', role: 'Recruiter', icon: Users, vote: 'hire' as const },
  { id: 'hiring-manager', role: 'Hiring Manager', icon: Briefcase, vote: 'hire' as const },
  { id: 'tech-lead', role: 'Tech Lead', icon: Code, vote: 'maybe' as const },
  { id: 'peer', role: 'Peer', icon: UserCheck, vote: 'hire' as const },
  { id: 'hrbp', role: 'HRBP', icon: Shield, vote: 'hire' as const },
]

// Mock evidence notes
const MOCK_EVIDENCE = [
  { timestamp: '14:23', note: 'Strong technical depth on React architecture', category: 'Technical' },
  { timestamp: '18:45', note: 'Clear communication when explaining trade-offs', category: 'Communication' },
  { timestamp: '22:10', note: 'Demonstrated collaborative problem-solving approach', category: 'Culture Add' },
]

// Rubric categories
const RUBRIC_CATEGORIES = [
  { name: 'Communication', score: 4, maxScore: 5 },
  { name: 'Technical Depth', score: 4, maxScore: 5 },
  { name: 'Culture Add', score: 5, maxScore: 5 },
  { name: 'Problem Solving', score: 4, maxScore: 5 },
]

type VoteType = 'hire' | 'maybe' | 'no'

export const CandidateVotingPreview: React.FC = () => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  
  // Local state for interactive demo (preview only)
  const [votes, setVotes] = useState<Record<string, VoteType>>(
    Object.fromEntries(MOCK_STAKEHOLDERS.map(s => [s.id, s.vote]))
  )

  const handleVoteChange = (stakeholderId: string, newVote: VoteType) => {
    setVotes(prev => ({ ...prev, [stakeholderId]: newVote }))
  }

  // Calculate vote summary
  const voteSummary = Object.values(votes).reduce(
    (acc, vote) => {
      acc[vote]++
      return acc
    },
    { hire: 0, maybe: 0, no: 0 }
  )

  const recommendation = voteSummary.hire >= 3 ? 'Hire' : voteSummary.no >= 3 ? 'No Hire' : 'Review'

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <Card className="p-4 sm:p-6 border-zinc-200 bg-white overflow-hidden h-full">
      {/* Preview Badge */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="font-semibold text-zinc-900 text-sm sm:text-base">
          {t('landing.hiringCollab.voting.title', 'Collaborative Candidate Review')}
        </h3>
        <span className="px-2 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
          {t('common.preview', 'Preview')}
        </span>
      </div>

      {/* Candidate Card */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="p-3 sm:p-4 bg-zinc-50 rounded-xl border border-zinc-200 mb-4 sm:mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-zinc-900 text-sm sm:text-base truncate">
              {t('landing.hiringCollab.voting.candidateName', 'Candidate Name')}
            </h4>
            <p className="text-xs sm:text-sm text-zinc-500 truncate">
              {t('landing.hiringCollab.voting.candidateRole', 'Senior Frontend Engineer')}
            </p>
          </div>
          <span className="shrink-0 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-full border border-purple-200">
            {t('landing.hiringCollab.voting.stage', 'Panel Review')}
          </span>
        </div>
      </motion.div>

      {/* Stakeholder Voting Panel */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          {t('landing.hiringCollab.voting.stakeholdersTitle', 'Stakeholder Votes')}
        </h4>
        <div className="space-y-2">
          {MOCK_STAKEHOLDERS.map((stakeholder, index) => {
            const IconComponent = stakeholder.icon
            const currentVote = votes[stakeholder.id]
            
            return (
              <motion.div
                key={stakeholder.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.15 + index * 0.05 }}
                className="flex items-center justify-between p-2 sm:p-3 bg-zinc-50 rounded-lg border border-zinc-200"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <IconComponent className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-zinc-700 truncate">
                    {t(`landing.hiringCollab.voting.roles.${stakeholder.id}`, stakeholder.role)}
                  </span>
                </div>
                
                {/* Vote Chips */}
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleVoteChange(stakeholder.id, 'hire')}
                    aria-label={t('landing.hiringCollab.voting.voteHire', 'Vote Hire')}
                    className={`p-1.5 rounded-md transition-all duration-200 ${
                      currentVote === 'hire'
                        ? 'bg-purple-100 text-purple-600 scale-110'
                        : 'bg-zinc-100 text-zinc-400 hover:bg-purple-50 hover:text-purple-500'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoteChange(stakeholder.id, 'maybe')}
                    aria-label={t('landing.hiringCollab.voting.voteMaybe', 'Vote Maybe')}
                    className={`p-1.5 rounded-md transition-all duration-200 ${
                      currentVote === 'maybe'
                        ? 'bg-amber-100 text-amber-600 scale-110'
                        : 'bg-zinc-100 text-zinc-400 hover:bg-amber-50 hover:text-amber-500'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoteChange(stakeholder.id, 'no')}
                    aria-label={t('landing.hiringCollab.voting.voteNo', 'Vote No')}
                    className={`p-1.5 rounded-md transition-all duration-200 ${
                      currentVote === 'no'
                        ? 'bg-red-100 text-red-600 scale-110'
                        : 'bg-zinc-100 text-zinc-400 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Evidence Notes */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          {t('landing.hiringCollab.voting.evidenceTitle', 'Evidence Timestamps')}
        </h4>
        <div className="space-y-2">
          {MOCK_EVIDENCE.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4 + index * 0.05 }}
              className="flex items-start gap-2 p-2 bg-zinc-50 rounded-lg text-xs"
            >
              <span className="shrink-0 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded font-mono">
                {item.timestamp}
              </span>
              <span className="text-zinc-600 flex-1 min-w-0">{item.note}</span>
              <span className="shrink-0 px-1.5 py-0.5 bg-zinc-200 text-zinc-600 rounded text-[10px]">
                {item.category}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rubric Categories */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          {t('landing.hiringCollab.voting.rubricTitle', 'Rubric Scores')}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {RUBRIC_CATEGORIES.map((category, index) => (
            <motion.div
              key={category.name}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.5 + index * 0.05 }}
              className="p-2 bg-zinc-50 rounded-lg border border-zinc-200"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-600">{category.name}</span>
                <span className="text-xs font-semibold text-purple-600">
                  {category.score}/{category.maxScore}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Vote Summary Strip */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6 }}
        className="p-3 sm:p-4 bg-purple-50 rounded-xl border border-purple-200"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs sm:text-sm">
              <ThumbsUp className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-purple-700">{voteSummary.hire}</span>
              <span className="text-zinc-500">{t('landing.hiringCollab.voting.hire', 'Hire')}</span>
            </span>
            <span className="flex items-center gap-1 text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-amber-600">{voteSummary.maybe}</span>
              <span className="text-zinc-500">{t('landing.hiringCollab.voting.maybe', 'Maybe')}</span>
            </span>
            <span className="flex items-center gap-1 text-xs sm:text-sm">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              <span className="font-semibold text-red-600">{voteSummary.no}</span>
              <span className="text-zinc-500">{t('landing.hiringCollab.voting.no', 'No')}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-600" />
            <span className="text-xs sm:text-sm font-semibold text-purple-700">
              {t('landing.hiringCollab.voting.recommend', 'Recommend')}: {recommendation}
            </span>
          </div>
        </div>
      </motion.div>
    </Card>
  )
}

export default CandidateVotingPreview
