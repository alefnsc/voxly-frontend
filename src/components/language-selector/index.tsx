/**
 * Language Selector Component
 * 
 * Flag-based language selector with Framer Motion animations.
 * Dropdown design with country flags and language names.
 * Active language highlighted in purple-600 with left accent.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../hooks/use-language';
import { SupportedLanguageCode } from '../../lib/i18n';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'sidebar' | 'horizontal';
  showName?: boolean;
  className?: string;
}

// ISO code mapping for display
const isoCodeMap: Record<SupportedLanguageCode, string> = {
  'en-US': 'EN',
  'zh-CN': 'ZH',
  'hi-IN': 'HI',
  'es-ES': 'ES',
  'fr-FR': 'FR',
  'pt-BR': 'PT',
  'ru-RU': 'RU',
};

// Language display order
const languageOrder: SupportedLanguageCode[] = [
  'en-US',
  'zh-CN',
  'hi-IN',
  'es-ES',
  'fr-FR',
  'pt-BR',
  'ru-RU',
];

export function LanguageSelector({
  variant = 'dropdown',
  showName = true,
  className = '',
}: LanguageSelectorProps) {
  const { currentLanguage, supportedLanguages, changeLanguage, isSyncing } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentLangInfo = supportedLanguages[currentLanguage];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  const handleLanguageChange = async (language: SupportedLanguageCode) => {
    await changeLanguage(language);
    setIsOpen(false);
    localStorage.setItem('Vocaid_language_manual', 'true');
  };

  // Dropdown animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: 8,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      y: 8,
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  };

  // Sidebar variant - positioned for bottom-left of sidebar with slide-up animation
  if (variant === 'sidebar') {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isSyncing}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg 
            bg-white border-2 transition-all duration-200
            ${isOpen 
              ? 'border-purple-600 shadow-sm' 
              : 'border-zinc-200 hover:border-purple-600'
            }
            disabled:opacity-50
          `}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          <span className="flex-1 text-left text-sm font-medium text-black">
            {currentLangInfo?.name}
          </span>
          <motion.svg 
            className="w-4 h-4 text-zinc-400"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </motion.svg>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="absolute bottom-full left-0 right-0 mb-2 rounded-lg bg-white shadow-lg border-2 border-purple-600 py-1 z-50 overflow-hidden"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {languageOrder.map((code) => {
                  const info = supportedLanguages[code];
                  const isActive = code === currentLanguage;
                  return (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150
                        ${isActive 
                          ? 'bg-purple-50 border-l-4 border-l-purple-600' 
                          : 'bg-white hover:bg-zinc-50 border-l-4 border-l-transparent hover:border-l-purple-600'
                        }
                      `}
                    >
                      <span className={`font-medium ${isActive ? 'text-purple-600' : 'text-black'}`}>
                        {info.name}
                      </span>
                    </button>
                  );
                }
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Horizontal variant - text-only ISO codes in a row
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languageOrder.map((code) => {
            const isActive = code === currentLanguage;
            return (
              <button
                key={code}
                onClick={() => handleLanguageChange(code)}
                disabled={isSyncing}
                className={`
                  relative px-2 py-1 text-xs font-semibold tracking-wide transition-colors
                  ${isActive 
                    ? 'text-purple-600' 
                    : 'text-zinc-400 hover:text-zinc-600'
                  }
                  disabled:opacity-50
                `}
                aria-label={`Switch to ${supportedLanguages[code].name}`}
              >
                {isoCodeMap[code]}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-purple-600 rounded-full" />
                )}
              </button>
            );
          }
        )}
      </div>
    );
  }
  
  // Default dropdown variant with flags and Framer Motion
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSyncing}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg 
          bg-white border-2 transition-all duration-200
          ${isOpen 
            ? 'border-purple-600 shadow-sm' 
            : 'border-zinc-200 hover:border-purple-600'
          }
          disabled:opacity-50
        `}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        {showName && (
          <span className="text-sm font-medium text-black">{currentLangInfo?.name}</span>
        )}
        {!showName && (
          <span className="text-sm font-semibold text-black">{isoCodeMap[currentLanguage]}</span>
        )}
        <motion.svg 
          className="w-3.5 h-3.5 text-zinc-400"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute left-0 mt-2 w-52 rounded-lg bg-white shadow-lg border-2 border-purple-600 py-1 z-50 overflow-hidden"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {languageOrder.map((code) => {
                const info = supportedLanguages[code];
                const isActive = code === currentLanguage;
                return (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150
                      ${isActive 
                        ? 'bg-purple-50 border-l-4 border-l-purple-600' 
                        : 'bg-white hover:bg-zinc-50 border-l-4 border-l-transparent hover:border-l-purple-600'
                      }
                    `}
                  >
                    <span className={`font-medium ${isActive ? 'text-purple-600' : 'text-black'}`}>
                      {info.name}
                    </span>
                  </button>
                );
              }
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageSelector;
