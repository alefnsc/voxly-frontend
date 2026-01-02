/**
 * Mock Data Configuration
 * 
 * Provides mock data for development when the backend is unavailable.
 * Enable by setting REACT_APP_USE_MOCK_DATA=true in .env.local
 * 
 * This data matches the API response shapes exactly.
 * 
 * @module config/mockData
 */

// ============================================
// FEATURE FLAG
// ============================================

/**
 * Check if mock data mode is enabled
 */
export const isMockDataEnabled = (): boolean => {
  const flag = process.env.REACT_APP_USE_MOCK_DATA;
  return flag === 'true';
};

/**
 * Check if we should use mock data
 * (either enabled explicitly or backend is unreachable)
 */
export const shouldUseMockData = (): boolean => {
  return isMockDataEnabled();
};

// ============================================
// MOCK DASHBOARD DATA
// ============================================

export interface MockInterview {
  id: string;
  roleTitle: string;
  companyName: string;
  date: string;
  score: number;
  duration: number;
  seniority: string;
}

export interface MockScoreEvolution {
  date: string;
  score: number;
}

export interface MockDashboardData {
  recentInterviews: MockInterview[];
  kpis: {
    totalInterviews: number;
    averageScore: number;
    scoreChange: number;
    totalDuration: number;
  };
  scoreEvolution: MockScoreEvolution[];
  skillBreakdown: {
    skill: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  weeklyActivity: {
    day: string;
    interviews: number;
  }[];
}

/**
 * Generate realistic mock dashboard data
 */
export function getMockDashboardData(): MockDashboardData {
  const now = new Date();
  
  // Generate recent interviews
  const recentInterviews: MockInterview[] = [
    {
      id: 'mock-int-001',
      roleTitle: 'Senior Frontend Developer',
      companyName: 'TechCorp',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      score: 87,
      duration: 32,
      seniority: 'senior',
    },
    {
      id: 'mock-int-002',
      roleTitle: 'Full Stack Engineer',
      companyName: 'StartupXYZ',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      score: 82,
      duration: 28,
      seniority: 'mid',
    },
    {
      id: 'mock-int-003',
      roleTitle: 'Backend Developer',
      companyName: 'DataFlow Inc',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      score: 75,
      duration: 35,
      seniority: 'senior',
    },
    {
      id: 'mock-int-004',
      roleTitle: 'React Developer',
      companyName: 'WebAgency',
      date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      score: 79,
      duration: 25,
      seniority: 'mid',
    },
    {
      id: 'mock-int-005',
      roleTitle: 'Software Engineer',
      companyName: 'BigTech Co',
      date: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      score: 72,
      duration: 40,
      seniority: 'junior',
    },
  ];

  // Generate score evolution (last 7 data points)
  const scoreEvolution: MockScoreEvolution[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000);
    const baseScore = 70 + Math.floor(Math.random() * 15);
    // Add upward trend
    const trendBonus = Math.floor((6 - i) * 2);
    scoreEvolution.push({
      date: date.toISOString(),
      score: Math.min(100, baseScore + trendBonus),
    });
  }

  // Skill breakdown
  const skillBreakdown = [
    { skill: 'Technical Knowledge', score: 85, trend: 'up' as const },
    { skill: 'Communication', score: 78, trend: 'up' as const },
    { skill: 'Problem Solving', score: 82, trend: 'stable' as const },
    { skill: 'Cultural Fit', score: 88, trend: 'up' as const },
    { skill: 'Leadership', score: 72, trend: 'down' as const },
  ];

  // Weekly activity
  const weeklyActivity = [
    { day: 'Mon', interviews: 2 },
    { day: 'Tue', interviews: 1 },
    { day: 'Wed', interviews: 3 },
    { day: 'Thu', interviews: 0 },
    { day: 'Fri', interviews: 2 },
    { day: 'Sat', interviews: 1 },
    { day: 'Sun', interviews: 0 },
  ];

  return {
    recentInterviews,
    kpis: {
      totalInterviews: recentInterviews.length,
      averageScore: Math.round(
        recentInterviews.reduce((sum, i) => sum + i.score, 0) / recentInterviews.length
      ),
      scoreChange: 8, // +8% improvement
      totalDuration: recentInterviews.reduce((sum, i) => sum + i.duration, 0),
    },
    scoreEvolution,
    skillBreakdown,
    weeklyActivity,
  };
}

// ============================================
// MOCK WALLET DATA
// ============================================

export interface MockWalletData {
  data: {
    balance: number;
    lastPurchase?: string;
  };
}

export function getMockWalletData(): MockWalletData {
  return {
    data: {
      balance: 12,
      lastPurchase: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
}

// ============================================
// MOCK RESUMES DATA
// Matches ResumeListItem interface from APIService
// ============================================

export interface MockResume {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  version: number;
  qualityScore?: number;
  isPrimary: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export function getMockResumes(): MockResume[] {
  return [
    {
      id: 'mock-resume-001',
      title: 'John Doe Resume 2024',
      fileName: 'John_Doe_Resume_2024.pdf',
      fileSize: 245000,
      version: 1,
      qualityScore: 85,
      isPrimary: true,
      tags: ['software', 'engineering'],
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 3,
    },
    {
      id: 'mock-resume-002',
      title: 'John Doe Resume Tech',
      fileName: 'John_Doe_Resume_Tech.pdf',
      fileSize: 198000,
      version: 1,
      qualityScore: 78,
      isPrimary: false,
      tags: ['tech', 'frontend'],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 1,
    },
  ];
}

const mockDataExports = {
  isMockDataEnabled,
  shouldUseMockData,
  getMockDashboardData,
  getMockWalletData,
  getMockResumes,
};

export default mockDataExports;
