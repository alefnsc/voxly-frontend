'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from 'contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Loading from 'components/loading';
import { Input } from 'components/ui/input';
import PurpleButton from 'components/ui/purple-button';
import { TitleSplit } from 'components/ui/TitleSplit';
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
  Calendar,
  BarChart3
} from 'lucide-react';
import apiService, { ResumeListItem } from 'services/APIService';

// ========================================
// TYPES & CONSTANTS
// ========================================

type SortOption = 'date' | 'usage';
type DateFilter = 'all' | 'week' | 'month' | 'quarter' | 'year';

const DATE_FILTER_OPTIONS: Array<{ value: DateFilter; labelKey: string }> = [
  { value: 'all', labelKey: 'common.allTime' },
  { value: 'week', labelKey: 'common.lastWeek' },
  { value: 'month', labelKey: 'common.lastMonth' },
  { value: 'quarter', labelKey: 'common.last3Months' },
  { value: 'year', labelKey: 'common.lastYear' }
];

const SORT_OPTIONS: Array<{ value: SortOption; labelKey: string }> = [
  { value: 'date', labelKey: 'resumeLibrary.sortByDate' },
  { value: 'usage', labelKey: 'resumeLibrary.sortByUsage' }
];

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
  
  // Filter & Sort state
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  
  // LinkedIn import state
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [linkedInName, setLinkedInName] = useState('');
  const [linkedInEmail, setLinkedInEmail] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [linkedInHeadline, setLinkedInHeadline] = useState('');
  const [isImportingLinkedIn, setIsImportingLinkedIn] = useState(false);
  
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
    if (!user?.id) return;
    
    // Validate title is not empty
    if (!editTitle.trim()) {
      setError(t('resumeLibrary.errors.titleRequired', 'Resume title cannot be empty'));
      return;
    }

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

  // Handle keyboard events for rename input
  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, resumeId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateTitle(resumeId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingResume(null);
      setEditTitle('');
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
  const filteredResumes = useMemo(() => {
    return resumes.filter(resume => {
      // Search filter
      const matchesSearch = searchQuery.trim() === '' || 
        resume.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resume.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resume.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Role filter
      const matchesRole = roleFilter === 'all' || resume.alignedRole === roleFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const resumeDate = new Date(resume.createdAt);
        const now = new Date();
        switch (dateFilter) {
          case 'week':
            matchesDate = resumeDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            matchesDate = resumeDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'quarter':
            matchesDate = resumeDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case 'year':
            matchesDate = resumeDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        }
      }
      
      return matchesSearch && matchesRole && matchesDate;
    });
  }, [resumes, searchQuery, roleFilter, dateFilter]);
  
  // Sort resumes
  const sortedResumes = useMemo(() => {
    const sorted = [...filteredResumes];
    
    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'usage':
        return sorted.sort((a, b) => b.usageCount - a.usageCount);
      default:
        return sorted;
    }
  }, [filteredResumes, sortBy]);

  // Derive unique aligned roles from user's resumes for filtering
  const availableRoles = useMemo(() => {
    const roles = new Map<string, string>();
    resumes.forEach(resume => {
      if (resume.alignedRole && resume.alignedRoleLabel) {
        roles.set(resume.alignedRole, resume.alignedRoleLabel);
      }
    });
    return Array.from(roles.entries()).map(([value, label]) => ({ value, label }));
  }, [resumes]);

  // Check if any filters are active
  const hasActiveFilters = roleFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim() !== '';

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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <motion.div
        className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6"
          variants={itemVariants}
        >
          <div className="flex-1">
            <TitleSplit
              i18nKey="resumeLibrary.title"
              subtitleKey="resumeLibrary.subtitle"
              as="h1"
              size="lg"
            />
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
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div 
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between"
            variants={itemVariants}
          >
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Unified Search and Filters Bar */}
        <motion.div 
          className="bg-white rounded-xl border border-zinc-200 p-3 sm:p-4 mb-4 sm:mb-6"
          variants={itemVariants}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder={t('resumeLibrary.search', 'Search resumes...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[40px]"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Role Filter - only show if user has resumes with aligned roles */}
              {availableRoles.length > 0 && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex-shrink-0 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
                >
                  <option value="all">{t('resumeLibrary.allRoles', 'All Roles')}</option>
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              )}

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="flex-shrink-0 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
              >
                {DATE_FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.value)}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-shrink-0 px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[44px]"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.value)}</option>
                ))}
              </select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setDateFilter('all');
                  }}
                  className="flex-shrink-0 px-3 py-2.5 text-sm text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {t('common.clearFilters', 'Clear')}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Resumes Grid */}
        <motion.div variants={itemVariants}>
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
                      onKeyDown={(e) => handleRenameKeyDown(e, resume.id)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateTitle(resume.id)}
                      className="p-1.5 bg-purple-100 hover:bg-purple-200 rounded text-purple-600"
                      title={t('common.save', 'Save')}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingResume(null);
                        setEditTitle('');
                      }}
                      className="p-1.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-600"
                      title={t('common.cancel', 'Cancel')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <h3 className="font-semibold text-zinc-900 mb-1 pr-8 truncate">{resume.title}</h3>
                )}

                <p className="text-xs text-zinc-500 mb-3 truncate">{resume.fileName}</p>

                {/* Aligned Role Badge */}
                {resume.alignedRoleLabel && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                      <Target className="w-3 h-3" />
                      {resume.alignedRoleLabel}
                    </span>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(resume.createdAt)}
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
        </motion.div>
      </motion.div>

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
                  placeholder={t('resumeLibrary.linkedIn.placeholder', 'Senior Software Engineer at Tech Company')}
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
    </div>
  );
};

export default ResumeLibrary;
