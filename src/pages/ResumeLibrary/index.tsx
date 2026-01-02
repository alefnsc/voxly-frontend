'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { DefaultLayout } from 'components/default-layout';
import Loading from 'components/loading';
import { Input } from 'components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'components/ui/select';
import PurpleButton from 'components/ui/purple-button';
import {
  Upload,
  FileText,
  Star,
  Trash2,
  Edit3,
  Plus,
  Search,
  Clock,
  Tag,
  MoreVertical,
  FolderOpen,
  Check,
  X,
  Linkedin,
  Target,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import apiService, { ResumeListItem } from 'services/APIService';

const ResumeLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSignedIn, isLoaded } = useUser();
  const { t } = useTranslation();

  // State
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [editingResume, setEditingResume] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Role scoring state
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [resumeScores, setResumeScores] = useState<Record<string, number>>({});
  const [isScoring, setIsScoring] = useState<string | null>(null);
  
  // LinkedIn import state
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [linkedInName, setLinkedInName] = useState('');
  const [linkedInEmail, setLinkedInEmail] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInHeadline, setLinkedInHeadline] = useState('');
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);
  
  // Common role options for filtering/scoring
  const roleOptions = [
    'Software Engineer',
    'Product Manager',
    'Data Analyst',
    'Data Scientist',
    'UX Designer',
    'Marketing Manager',
    'Project Manager',
    'DevOps Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer'
  ];

  // Load resumes
  const loadResumes = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await apiService.getResumes(user.id);
      if (response.status === 'success') {
        setResumes(response.data);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
      setError(t('resumeLibrary.errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (isSignedIn && user?.id) {
      loadResumes();
    }
  }, [isSignedIn, user?.id, loadResumes]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/');
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!validTypes.includes(file.type)) {
      setError(t('resumeLibrary.errors.invalidFileType'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('resumeLibrary.errors.fileTooLarge'));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];

        const response = await apiService.createResume(user.id, {
          fileName: file.name,
          mimeType: file.type,
          base64Data,
          title: file.name.replace(/\.[^/.]+$/, ''),
          isPrimary: resumes.length === 0 // First resume is primary
        });

        if (response.status === 'success') {
          await loadResumes();
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError(t('resumeLibrary.errors.readFailed'));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload resume:', err);
      setError(t('resumeLibrary.errors.uploadFailed'));
      setIsUploading(false);
    }

    // Reset input
    e.target.value = '';
  };

  // Set primary resume
  const handleSetPrimary = async (resumeId: string) => {
    if (!user?.id) return;

    try {
      await apiService.setPrimaryResume(user.id, resumeId);
      await loadResumes();
      setActiveMenu(null);
    } catch (err) {
      console.error('Failed to set primary:', err);
      setError(t('resumeLibrary.errors.setPrimaryFailed'));
    }
  };

  // Delete resume
  const handleDelete = async (resumeId: string) => {
    if (!user?.id) return;

    if (!window.confirm(t('resumeLibrary.confirmDelete', 'Are you sure you want to delete this resume?'))) {
      return;
    }

    try {
      await apiService.deleteResume(user.id, resumeId);
      await loadResumes();
      setActiveMenu(null);
    } catch (err) {
      console.error('Failed to delete resume:', err);
      setError(t('resumeLibrary.errors.deleteFailed'));
    }
  };

  // Update resume title
  const handleUpdateTitle = async (resumeId: string) => {
    if (!user?.id || !editTitle.trim()) return;

    try {
      await apiService.updateResume(user.id, resumeId, { title: editTitle.trim() });
      await loadResumes();
      setEditingResume(null);
      setEditTitle('');
    } catch (err) {
      console.error('Failed to update resume:', err);
      setError(t('resumeLibrary.errors.updateFailed'));
    }
  };

  // Score resume for selected role
  const handleScoreResume = async (resumeId: string) => {
    if (!user?.id || !selectedRole) return;
    
    setIsScoring(resumeId);
    try {
      const response = await apiService.scoreResume(user.id, resumeId, selectedRole);
      if (response.status === 'success' && response.data) {
        setResumeScores(prev => ({
          ...prev,
          [resumeId]: response.data.score
        }));
      }
    } catch (err) {
      console.error('Failed to score resume:', err);
      setError(t('resumeLibrary.errors.scoreFailed', 'Failed to score resume'));
    } finally {
      setIsScoring(null);
    }
  };

  // Score all resumes for selected role
  const handleScoreAllResumes = async () => {
    if (!user?.id || !selectedRole) return;
    
    for (const resume of resumes) {
      await handleScoreResume(resume.id);
    }
  };

  // LinkedIn import (manual fallback - OAuth requires backend setup)
  const handleLinkedInImport = async () => {
    if (!user?.id || !linkedInName) return;
    
    setIsImportingLinkedIn(true);
    setError(null);
    
    try {
      const response = await apiService.createLinkedInResume(user.id, {
        name: linkedInName,
        email: linkedInEmail || '',
        headline: linkedInHeadline || '',
        linkedInUrl: linkedInUrl || undefined
      });
      
      if (response.status === 'success') {
        await loadResumes();
        setShowLinkedInModal(false);
        // Reset form
        setLinkedInName('');
        setLinkedInEmail('');
        setLinkedInUrl('');
        setLinkedInHeadline('');
      }
    } catch (err) {
      console.error('Failed to import from LinkedIn:', err);
      setError(t('resumeLibrary.errors.linkedInImportFailed', 'Failed to import from LinkedIn'));
    } finally {
      setIsImportingLinkedIn(false);
    }
  };

  // Filter resumes
  const filteredResumes = resumes.filter(resume =>
    resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resume.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Sort by score if role is selected
  const sortedResumes = selectedRole 
    ? [...filteredResumes].sort((a, b) => (resumeScores[b.id] || 0) - (resumeScores[a.id] || 0))
    : filteredResumes;

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isLoaded || !isSignedIn) {
    return <Loading />;
  }

  return (
    <DefaultLayout className="flex flex-col overflow-hidden bg-zinc-50 min-h-screen">
      <div className="page-container py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">
              {t('resumeLibrary.title', 'Resume')} <span className="text-purple-600">{t('resumeLibrary.titleHighlight', 'Library')}</span>
            </h1>
            <p className="text-zinc-600 mt-1">
              {t('resumeLibrary.subtitle', 'Manage your resumes for quick interview setup')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* LinkedIn Import Button */}
            <PurpleButton
              variant="outline"
              onClick={() => setShowLinkedInModal(true)}
              className="flex items-center gap-2"
            >
              <Linkedin className="w-4 h-4" />
              <span className="hidden sm:inline">{t('resumeLibrary.importLinkedIn', 'Import from LinkedIn')}</span>
              <span className="sm:hidden">LinkedIn</span>
            </PurpleButton>
            
            {/* Upload Button */}
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="resume-upload">
              <PurpleButton
                as="span"
                variant="primary"
                disabled={isUploading}
                className="cursor-pointer"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.uploading', 'Uploading...')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {t('resumeLibrary.uploadNew', 'Upload Resume')}
                  </span>
                )}
              </PurpleButton>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Role Filter & Scoring Section */}
        <div className="mb-6 p-4 bg-white border border-zinc-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-zinc-900">
                {t('resumeLibrary.compareFor', 'Compare for Role:')}
              </span>
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder={t('resumeLibrary.selectRole', 'Select a role to compare...')} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedRole && (
              <PurpleButton
                variant="secondary"
                size="sm"
                onClick={handleScoreAllResumes}
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                {t('resumeLibrary.scoreAll', 'Score All Resumes')}
              </PurpleButton>
            )}
          </div>
          
          {selectedRole && (
            <p className="mt-2 text-sm text-zinc-500">
              {t('resumeLibrary.scoringInfo', 'Scores show how well each resume matches the selected role. Higher is better.')}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder={t('resumeLibrary.search', 'Search resumes...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Resumes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-medium text-zinc-700 mb-2">
              {searchQuery
                ? t('resumeLibrary.noResults', 'No resumes match your search')
                : t('resumeLibrary.empty', 'No resumes yet')
              }
            </h3>
            <p className="text-zinc-500 mb-6">
              {t('resumeLibrary.emptyDescription', 'Upload your first resume to get started')}
            </p>
            {!searchQuery && (
              <label htmlFor="resume-upload">
                <PurpleButton as="span" variant="secondary" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('resumeLibrary.uploadFirst', 'Upload Resume')}
                </PurpleButton>
              </label>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedResumes.map((resume) => (
              <div
                key={resume.id}
                className={`relative bg-white border rounded-xl p-4 transition-all hover:shadow-md ${
                  resume.isPrimary ? 'border-purple-200 ring-1 ring-purple-100' : 'border-zinc-200'
                }`}
              >
                {/* Primary Badge */}
                {resume.isPrimary && (
                  <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    {t('resumeLibrary.primary', 'Primary')}
                  </div>
                )}

                {/* Menu Button */}
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => setActiveMenu(activeMenu === resume.id ? null : resume.id)}
                    className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === resume.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                      {!resume.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(resume.id)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          {t('resumeLibrary.setAsPrimary', 'Set as Primary')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingResume(resume.id);
                          setEditTitle(resume.title);
                          setActiveMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        {t('resumeLibrary.rename', 'Rename')}
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('resumeLibrary.delete', 'Delete')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Resume Icon */}
                <div className="p-3 bg-purple-50 rounded-lg w-fit mb-3">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>

                {/* Title */}
                {editingResume === resume.id ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateTitle(resume.id)}
                      className="p-1.5 bg-purple-100 hover:bg-purple-200 rounded text-purple-600"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingResume(null);
                        setEditTitle('');
                      }}
                      className="p-1.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h3 className="font-semibold text-zinc-900 mb-1 pr-8 truncate">{resume.title}</h3>
                )}

                <p className="text-xs text-zinc-500 mb-3 truncate">{resume.fileName}</p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(resume.updatedAt)}
                  </span>
                  <span>{formatFileSize(resume.fileSize)}</span>
                  {resume.usageCount > 0 && (
                    <span>{resume.usageCount} {t('resumeLibrary.uses', 'uses')}</span>
                  )}
                </div>

                {/* Quality Score */}
                {resume.qualityScore !== undefined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-500">{t('resumeLibrary.qualityScore', 'Quality Score')}</span>
                      <span className={`font-medium ${
                        resume.qualityScore >= 80 ? 'text-green-600' :
                        resume.qualityScore >= 60 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {resume.qualityScore}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          resume.qualityScore >= 80 ? 'bg-green-500' :
                          resume.qualityScore >= 60 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${resume.qualityScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Role-Based ATS Score */}
                {selectedRole && (
                  <div className="mb-3 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-purple-700 font-medium flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {selectedRole} {t('resumeLibrary.fit', 'Fit')}
                      </span>
                      {isScoring === resume.id ? (
                        <RefreshCw className="w-3 h-3 text-purple-600 animate-spin" />
                      ) : resumeScores[resume.id] !== undefined ? (
                        <span className={`font-bold ${
                          resumeScores[resume.id] >= 80 ? 'text-green-600' :
                          resumeScores[resume.id] >= 60 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {resumeScores[resume.id]}%
                        </span>
                      ) : (
                        <button
                          onClick={() => handleScoreResume(resume.id)}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          {t('resumeLibrary.score', 'Score')}
                        </button>
                      )}
                    </div>
                    {resumeScores[resume.id] !== undefined && (
                      <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            resumeScores[resume.id] >= 80 ? 'bg-green-500' :
                            resumeScores[resume.id] >= 60 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${resumeScores[resume.id]}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {resume.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resume.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                    {resume.tags.length > 3 && (
                      <span className="text-xs text-zinc-400">+{resume.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Start Interview Button */}
                <button
                  onClick={() => navigate('/app/b2c/interview/new', { state: { selectedResumeId: resume.id } })}
                  className="mt-4 w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-medium rounded-lg transition-colors"
                >
                  {t('resumeLibrary.startInterview', 'Start Interview')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* LinkedIn Import Modal */}
      {showLinkedInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Linkedin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">
                    {t('resumeLibrary.linkedInImport', 'Import from LinkedIn')}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {t('resumeLibrary.linkedInImportDesc', 'Create a resume from your LinkedIn profile')}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-sm text-zinc-600 mb-4">
                {t('resumeLibrary.linkedInManualNote', 'Enter your LinkedIn profile details to generate a resume. Make sure your LinkedIn profile is up to date for best results.')}
              </p>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {t('resumeLibrary.fullName', 'Full Name')} *
                </label>
                <Input
                  type="text"
                  value={linkedInName}
                  onChange={(e) => setLinkedInName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {t('resumeLibrary.email', 'Email')} *
                </label>
                <Input
                  type="email"
                  value={linkedInEmail}
                  onChange={(e) => setLinkedInEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {t('resumeLibrary.linkedInUrl', 'LinkedIn Profile URL')}
                </label>
                <Input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  {t('resumeLibrary.headline', 'Professional Headline')} *
                </label>
                <Input
                  type="text"
                  value={linkedInHeadline}
                  onChange={(e) => setLinkedInHeadline(e.target.value)}
                  placeholder="Senior Software Engineer at Tech Company"
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowLinkedInModal(false);
                  setLinkedInName('');
                  setLinkedInEmail('');
                  setLinkedInUrl('');
                  setLinkedInHeadline('');
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-800 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <PurpleButton
                variant="primary"
                onClick={handleLinkedInImport}
                disabled={isImportingLinkedIn || !linkedInName || !linkedInEmail || !linkedInHeadline}
              >
                {isImportingLinkedIn ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.importing', 'Importing...')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4" />
                    {t('resumeLibrary.createResume', 'Create Resume')}
                  </span>
                )}
              </PurpleButton>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default ResumeLibrary;
