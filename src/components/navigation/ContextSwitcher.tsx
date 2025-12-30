/**
 * ContextSwitcher Component
 * 
 * Allows users to switch between platform contexts:
 * - B2C: Interview Practice (candidates)
 * - B2B: Recruiter Platform (organizations)
 * - HR: Employee Hub (internal)
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, User, Building2, Users, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PLATFORM_CONFIG,
  ViewContext,
  getAvailablePlatforms,
  detectPlatformFromPath,
} from '../../config/navigation';
import type { UserRole } from '../../config/navigation';

interface ContextSwitcherProps {
  userRole?: UserRole;
  className?: string;
}

const ICON_MAP = {
  User,
  Building2,
  Users,
} as const;

export function ContextSwitcher({ userRole, className = '' }: ContextSwitcherProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Get available platforms for user
  const availablePlatforms = getAvailablePlatforms(userRole);

  // Detect current platform from URL
  const currentPlatformId = detectPlatformFromPath(location.pathname);
  const currentPlatform = PLATFORM_CONFIG.find((p) => p.id === currentPlatformId) || availablePlatforms[0];

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if only one platform available
  if (availablePlatforms.length <= 1) {
    return null;
  }

  const handlePlatformChange = (platform: ViewContext) => {
    const selectedPlatform = PLATFORM_CONFIG.find((p) => p.id === platform);
    if (selectedPlatform && selectedPlatform.id !== currentPlatform?.id) {
      navigate(selectedPlatform.basePath + '/dashboard');
    }
    setIsOpen(false);
  };

  const CurrentIcon = currentPlatform ? ICON_MAP[currentPlatform.icon as keyof typeof ICON_MAP] : User;

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="h-4 w-4 text-purple-600" />
        <span className="hidden sm:inline">
          {currentPlatform?.id === 'b2c' && t('contextSwitcher.practice')}
          {currentPlatform?.id === 'b2b' && t('contextSwitcher.recruiter')}
          {currentPlatform?.id === 'hr' && t('contextSwitcher.employeeHub')}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
          >
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {t('contextSwitcher.switchPlatform')}
              </p>
              
              {availablePlatforms.map((platform) => {
                const Icon = ICON_MAP[platform.icon as keyof typeof ICON_MAP];
                const isActive = platform.id === currentPlatform?.id;

                return (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformChange(platform.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-purple-50 text-purple-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {platform.id === 'b2c' && t('contextSwitcher.interviewPractice')}
                          {platform.id === 'b2b' && t('contextSwitcher.recruiterPlatform')}
                          {platform.id === 'hr' && t('contextSwitcher.employeeHub')}
                        </span>
                        {isActive && <Check className="h-4 w-4 text-purple-600" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {platform.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <p className="text-xs text-gray-500">
                <strong>{t('contextSwitcher.tip')}</strong> {t('contextSwitcher.tipMessage')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ContextSwitcher;
