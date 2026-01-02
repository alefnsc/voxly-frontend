/**
 * GraphQL Queries for Vocaid
 * 
 * Centralized query definitions for Dashboard, Interviews, and Analytics.
 * 
 * @module lib/graphql/queries
 */

import { gql } from '@apollo/client';

// ----------------------------------------
// FRAGMENTS
// ----------------------------------------

/**
 * Dashboard KPIs fragment
 */
export const DASHBOARD_KPIS_FRAGMENT = gql`
  fragment DashboardKPIsFields on DashboardKPIs {
    totalInterviews
    completedInterviews
    averageScore
    scoreChange
    averageDurationMinutes
    totalSpent
    creditsRemaining
    interviewsThisMonth
    passRate
  }
`;

/**
 * Recent interview fragment
 */
export const RECENT_INTERVIEW_FRAGMENT = gql`
  fragment RecentInterviewFields on RecentInterview {
    id
    date
    roleTitle
    companyName
    seniority
    resumeTitle
    resumeId
    durationMinutes
    score
    status
  }
`;

/**
 * Score evolution fragment
 */
export const SCORE_EVOLUTION_FRAGMENT = gql`
  fragment ScoreEvolutionFields on ScoreEvolutionPoint {
    date
    score
    roleTitle
    seniority
  }
`;

// ----------------------------------------
// DASHBOARD QUERIES
// ----------------------------------------

/**
 * Get full dashboard data
 * 
 * Replaces multiple REST calls:
 * - GET /api/dashboard/candidate
 * - GET /api/dashboard/candidate/spending
 * - GET /api/analytics/dashboard
 */
export const GET_DASHBOARD_DATA = gql`
  ${DASHBOARD_KPIS_FRAGMENT}
  ${RECENT_INTERVIEW_FRAGMENT}
  ${SCORE_EVOLUTION_FRAGMENT}
  
  query GetDashboardData($filters: DashboardFilters) {
    dashboardData(filters: $filters) {
      kpis {
        ...DashboardKPIsFields
      }
      scoreEvolution {
        ...ScoreEvolutionFields
      }
      recentInterviews {
        ...RecentInterviewFields
      }
      resumes {
        id
        title
        fileName
        createdAt
        lastUsedAt
        interviewCount
        filteredInterviewCount
        isPrimary
        qualityScore
      }
      filterOptions {
        roleTitles
        seniorities
        resumes {
          id
          title
        }
      }
      filters {
        startDate
        endDate
        roleTitle
        seniority
        resumeId
      }
    }
  }
`;

// ----------------------------------------
// INTERVIEW QUERIES
// ----------------------------------------

/**
 * Get paginated list of interviews
 */
export const GET_INTERVIEWS = gql`
  query GetInterviews($pagination: PaginationInput, $filters: InterviewFilters) {
    interviews(pagination: $pagination, filters: $filters) {
      interviews {
        id
        jobTitle
        companyName
        status
        score
        callDuration
        createdAt
        endedAt
      }
      total
      page
      limit
      hasMore
    }
  }
`;

/**
 * Get complete interview details with all analytics
 * 
 * Single query replaces 4+ REST calls:
 * - GET /api/interviews/:id
 * - GET /api/analytics/interview/:id
 * - GET /api/analytics/transcript/:id
 * - GET /api/benchmarks/:roleTitle
 * - GET /api/analytics/recommendations/:id
 */
export const GET_INTERVIEW_DETAILS = gql`
  query GetInterviewDetails($id: ID!) {
    interviewDetails(id: $id) {
      interview {
        id
        jobTitle
        companyName
        jobDescription
        seniority
        language
        status
        score
        callDuration
        transcript
        feedbackText
        startedAt
        endedAt
        createdAt
        updatedAt
      }
      analytics {
        timelineData {
          timestamp
          confidence
          tone
          pace
        }
        softSkills {
          skills {
            name
            score
            maxScore
            feedback
          }
          overallCommunication
          overallTechnical
        }
        callDuration
        wpmAverage
        sentimentScore
      }
      transcript {
        id
        speaker
        content
        startTime
        endTime
        sentimentScore
        segmentIndex
      }
      benchmark {
        hasData
        message
        data {
          userScore
          globalAverage
          percentile
          roleTitle
          totalCandidates
          breakdown {
            communication {
              user
              average
            }
            problemSolving {
              user
              average
            }
            technicalDepth {
              user
              average
            }
            leadership {
              user
              average
            }
            adaptability {
              user
              average
            }
          }
        }
      }
      recommendations {
        topics {
          name
          priority
          resources
        }
        weakAreas {
          area
          suggestion
          score
        }
        generatedAt
      }
    }
  }
`;

// ----------------------------------------
// BENCHMARK QUERIES
// ----------------------------------------

/**
 * Get benchmark data for a specific role
 * 
 * Handles the "Top 10%" feature with proper fallback
 * when insufficient data exists.
 */
export const GET_BENCHMARK_BY_ROLE = gql`
  query GetBenchmarkByRole($roleTitle: String!, $userScore: Float) {
    benchmarkByRole(roleTitle: $roleTitle, userScore: $userScore) {
      hasData
      message
      data {
        userScore
        globalAverage
        percentile
        roleTitle
        totalCandidates
        breakdown {
          communication {
            user
            average
          }
          problemSolving {
            user
            average
          }
          technicalDepth {
            user
            average
          }
          leadership {
            user
            average
          }
          adaptability {
            user
            average
          }
        }
      }
    }
  }
`;

// ----------------------------------------
// MUTATIONS
// ----------------------------------------

/**
 * Force refresh dashboard data
 */
export const REFRESH_DASHBOARD = gql`
  ${DASHBOARD_KPIS_FRAGMENT}
  ${RECENT_INTERVIEW_FRAGMENT}
  ${SCORE_EVOLUTION_FRAGMENT}
  
  mutation RefreshDashboard {
    refreshDashboard {
      kpis {
        ...DashboardKPIsFields
      }
      scoreEvolution {
        ...ScoreEvolutionFields
      }
      recentInterviews {
        ...RecentInterviewFields
      }
      resumes {
        id
        title
        fileName
        interviewCount
      }
      filterOptions {
        roleTitles
        seniorities
        resumes {
          id
          title
        }
      }
      filters {
        startDate
        endDate
        roleTitle
        seniority
        resumeId
      }
    }
  }
`;
