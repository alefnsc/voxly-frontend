/**
 * Landing Page Mock Data
 * 
 * Static data for simulated product previews.
 * No API calls - purely front-end demonstration.
 */

// Supported languages (the 7 app-compatible languages)
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
] as const;

// Personal Dashboard Preview Data
export const MOCK_DASHBOARD = {
  performanceTrend: [
    { week: 'W1', score: 62 },
    { week: 'W2', score: 68 },
    { week: 'W3', score: 71 },
    { week: 'W4', score: 75 },
    { week: 'W5', score: 82 },
    { week: 'W6', score: 85 },
  ],
  weeklyActivity: [
    { day: 'Mon', sessions: 2 },
    { day: 'Tue', sessions: 1 },
    { day: 'Wed', sessions: 3 },
    { day: 'Thu', sessions: 0 },
    { day: 'Fri', sessions: 2 },
    { day: 'Sat', sessions: 1 },
    { day: 'Sun', sessions: 0 },
  ],
  skillBreakdown: [
    { skill: 'Communication', score: 82, iconName: 'MessageSquare' },
    { skill: 'Problem Solving', score: 78, iconName: 'Puzzle' },
    { skill: 'Technical Depth', score: 85, iconName: 'Settings' },
    { skill: 'Leadership', score: 71, iconName: 'Target' },
    { skill: 'Clarity', score: 88, iconName: 'Sparkles' },
  ],
  recentInterviews: [
    { role: 'Software Engineer', company: 'TechCorp', date: 'Dec 20', score: 85 },
    { role: 'Product Manager', company: 'StartupXYZ', date: 'Dec 18', score: 78 },
    { role: 'Data Analyst', company: 'DataInc', date: 'Dec 15', score: 82 },
  ],
  stats: {
    totalInterviews: 14,
    avgScore: 79,
    creditsRemaining: 5,
    resumesUploaded: 3,
  },
};

// Interview Flow Preview Data
export const MOCK_INTERVIEW_FLOW = {
  steps: [
    { id: 1, label: 'Role', completed: true },
    { id: 2, label: 'Company', completed: true },
    { id: 3, label: 'Language', completed: true },
    { id: 4, label: 'Resume', completed: false },
    { id: 5, label: 'Start', completed: false },
  ],
  sampleQuestions: [
    { type: 'behavioral', question: 'Tell me about yourself and your experience.' },
    { type: 'situational', question: 'Describe a challenging project you led.' },
    { type: 'technical', question: 'Walk me through your problem-solving approach.' },
    { type: 'behavioral', question: 'How do you handle tight deadlines?' },
  ],
  selectedRole: 'Software Engineer',
  selectedCompany: 'Tech Company',
  selectedLanguage: 'English',
};

// Resume Repository Preview Data
export const MOCK_RESUME_REPOSITORY = {
  resumes: [
    {
      id: '1',
      title: 'Software Engineer Resume',
      lastUpdated: 'Dec 22, 2024',
      isPrimary: true,
      usedIn: ['Software Engineer @ TechCorp', 'Backend Dev @ StartupXYZ'],
      roleScore: 92,
    },
    {
      id: '2',
      title: 'Product Manager Resume',
      lastUpdated: 'Dec 15, 2024',
      isPrimary: false,
      usedIn: ['Product Manager @ DataInc'],
      roleScore: 78,
    },
    {
      id: '3',
      title: 'Data Analyst Resume',
      lastUpdated: 'Dec 10, 2024',
      isPrimary: false,
      usedIn: [],
      roleScore: null, // Scoring coming soon
    },
  ],
  stats: {
    totalResumes: 3,
    primaryResume: 'Software Engineer Resume',
  },
};

// B2B Recruiter Analytics Preview Data
export const MOCK_RECRUITER_ANALYTICS = {
  candidatePipeline: [
    { stage: 'Applied', count: 156 },
    { stage: 'Phone Screen', count: 89 },
    { stage: 'Technical', count: 45 },
    { stage: 'Final Round', count: 18 },
    { stage: 'Offer', count: 8 },
  ],
  scoreDistribution: [
    { range: '0-20', count: 5 },
    { range: '21-40', count: 12 },
    { range: '41-60', count: 28 },
    { range: '61-80', count: 45 },
    { range: '81-100', count: 22 },
  ],
  recentCandidates: [
    { name: 'Sarah Chen', role: 'Software Engineer', score: 92, status: 'Recommended' },
    { name: 'Marcus Johnson', role: 'Product Manager', score: 78, status: 'Under Review' },
    { name: 'Ana Silva', role: 'Data Analyst', score: 85, status: 'Recommended' },
    { name: 'James Park', role: 'DevOps Engineer', score: 71, status: 'Under Review' },
  ],
  evidenceTimestamps: [
    { competency: 'Problem Solving', score: 4.5, evidence: 'Demonstrated debugging approach', timestamp: '3:42' },
    { competency: 'Technical Depth', score: 4.8, evidence: 'Explained system design clearly', timestamp: '12:30' },
    { competency: 'Communication', score: 4.2, evidence: 'Clear articulation of trade-offs', timestamp: '5:20' },
  ],
  rubricConfigured: true,
  totalInterviewsThisMonth: 156,
  avgTimeToHire: '12 days',
};

// B2B HR Knowledge Hub Preview Data
export const MOCK_HR_KNOWLEDGE_HUB = {
  chatHistory: [
    { role: 'user', message: "What's the vacation policy for new employees?" },
    { role: 'assistant', message: 'New employees receive 15 days of PTO in their first year, accruing at 1.25 days per month. After one year of service, this increases to 20 days annually.' },
    { role: 'user', message: 'How do I request time off?' },
    { role: 'assistant', message: 'You can request time off through the HR portal under "Time & Attendance" → "Request PTO". Your manager will receive an automatic notification for approval.' },
  ],
  categories: [
    { name: 'Policies', iconName: 'FileText', count: 24 },
    { name: 'Benefits', iconName: 'Heart', count: 18 },
    { name: 'Payroll', iconName: 'Wallet', count: 12 },
    { name: 'Org Chart', iconName: 'Users', count: 8 },
  ],
  quickActions: [
    'Request PTO',
    'View Payslip',
    'Update Address',
    'Benefits Enrollment',
  ],
  stats: {
    ticketsDeflected: '58%',
    avgResponseTime: '< 3 sec',
    knowledgeArticles: 124,
  },
};

// B2C Personal Features
export const B2C_FEATURES = [
  {
    id: 'practice',
    iconName: 'Mic',
    title: 'AI Interview Practice',
    description: 'Practice with realistic AI interviews tailored to your target role, company, and language.',
  },
  {
    id: 'dashboard',
    iconName: 'BarChart3',
    title: 'Performance Dashboard',
    description: 'Track your progress with detailed analytics, skill breakdowns, and weekly activity insights.',
  },
  {
    id: 'resume',
    iconName: 'FileText',
    title: 'Resume Repository',
    description: 'Store multiple resume versions for different roles. See which resume you used for each interview.',
  },
  {
    id: 'linkedin',
    iconName: 'Link',
    title: 'LinkedIn Import',
    description: 'Import your profile directly from LinkedIn to create optimized resumes.',
    comingSoon: true,
  },
  {
    id: 'privacy',
    iconName: 'Lock',
    title: 'Privacy First',
    description: 'Your data is encrypted and never shared. Practice with complete confidence.',
  },
];

// B2B Recruiter Features
export const B2B_RECRUITER_FEATURES = [
  {
    id: 'consistent',
    iconName: 'CheckCircle',
    title: 'Consistent Evaluations',
    description: 'Standardized interviews eliminate bias and ensure every candidate is assessed fairly.',
  },
  {
    id: 'rubrics',
    iconName: 'ClipboardCheck',
    title: 'Configurable Rubrics',
    description: 'Define competency frameworks and scoring criteria that match your hiring standards.',
  },
  {
    id: 'prompts',
    iconName: 'Target',
    title: 'Dynamic Prompts',
    description: 'Personalize interview questions per role, team, or recruiter preferences.',
  },
  {
    id: 'scorecards',
    iconName: 'FileBarChart',
    title: 'Evidence Scorecards',
    description: 'Get scorecards with timestamps linking to exact moments in the interview.',
  },
  {
    id: 'analytics',
    iconName: 'TrendingUp',
    title: 'Analytics Dashboard',
    description: 'Track pipeline metrics, score distributions, and hiring insights across your team.',
  },
  {
    id: 'languages',
    iconName: 'Globe',
    title: 'Multi-language Support',
    description: 'Conduct interviews in 7 languages to evaluate global talent pools.',
  },
];

// B2B HR Employee Hub Features
export const B2B_HR_FEATURES = [
  {
    id: 'rag',
    iconName: 'Brain',
    title: 'Org-tied Knowledge Base',
    description: 'AI trained on your policies, benefits, and procedures for accurate answers.',
  },
  {
    id: 'escalation',
    iconName: 'Users',
    title: 'Smart Escalation',
    description: 'Seamlessly hand off complex queries to human HR when AI reaches its limits.',
  },
  {
    id: 'automations',
    iconName: 'Zap',
    title: 'Self-Service Automations',
    description: 'Employees can retrieve payslips, request PTO, update addresses, and more.',
  },
  {
    id: 'deflection',
    iconName: 'TrendingDown',
    title: 'Ticket Deflection',
    description: 'Reduce HR ticket volume significantly with instant, accurate answers.',
  },
  {
    id: 'segmentation',
    iconName: 'Lock',
    title: 'Tenant Isolation',
    description: 'Complete data separation per organization with role-based access controls.',
  },
];

// Trust & Security Features
export const TRUST_FEATURES = [
  { iconName: 'Lock', title: 'Data Encrypted', description: 'End-to-end encryption in transit and at rest' },
  { iconName: 'UserCheck', title: 'Role-based Access', description: 'Granular permissions for teams and admins' },
  { iconName: 'Building2', title: 'Tenant Isolation', description: 'Complete data separation for B2B clients' },
  { iconName: 'CheckCircle', title: 'Clear Consent', description: 'Transparent consent for interview analysis' },
];
