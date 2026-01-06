/**
 * Performance Chat Component
 * AI-powered interview performance analysis chat interface
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from 'contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Sparkles,
  Filter,
  ChevronDown,
  Bot,
  User as UserIcon,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { config } from '../../lib/config';

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatContext {
  roleFilter?: string;
  companyFilter?: string;
}

interface FilterOption {
  roles: string[];
  companies: string[];
}

interface PerformanceChatProps {
  onClose?: () => void;
  onBack?: () => void;
  isOpen: boolean;
  /** 'modal' = fullscreen overlay (default), 'embedded' = inline within a container */
  variant?: 'modal' | 'embedded';
}

const BACKEND_URL = config.backendUrl;

const PerformanceChat: React.FC<PerformanceChatProps> = ({ onClose, onBack, isOpen, variant = 'modal' }) => {
  const { user, isSignedIn } = useUser();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChatContext>({});
  const [filterOptions, setFilterOptions] = useState<FilterOption>({ roles: [], companies: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Fetch available filters
  const fetchFilters = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/analytics/filters`, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Non-JSON response from filters endpoint');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch filters:', err);
    }
  }, [user?.id]);

  // Fetch quick insights on first open
  const fetchQuickInsights = useCallback(async () => {
    if (!user?.id || messages.length > 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/insights`, {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include'
      });
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('Non-JSON response from insights endpoint');
        // Show welcome message instead of insights
        setMessages([{
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `👋 Hi! I'm your Interview Performance Analyst. How can I help you today?`,
          timestamp: new Date()
        }]);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.data?.insights) {
          setMessages([{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `👋 Hi! I'm your Interview Performance Analyst. Here are some quick insights based on your interviews:\n\n${data.data.insights}\n\nFeel free to ask me anything about your performance!`,
            timestamp: new Date()
          }]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      // Show welcome message on error
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `👋 Hi! I'm your Interview Performance Analyst. How can I help you today?`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, messages.length]);

  useEffect(() => {
    if (isOpen && isSignedIn) {
      fetchFilters();
      fetchQuickInsights();
    }
  }, [isOpen, isSignedIn, fetchFilters, fetchQuickInsights]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user?.id) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        credentials: 'include',
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          filters
        })
      });

      // Check content type before parsing
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from chat:', { 
          status: response.status, 
          contentType, 
          preview: text.slice(0, 200) 
        });
        throw new Error(`Server returned invalid response (${response.status}). Please try again.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'Failed to get response');
      }

      if (data.data?.sessionId && !sessionId) {
        setSessionId(data.data.sessionId);
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.data?.message || 'Sorry, I could not generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    fetchQuickInsights();
  };

  // Suggested questions
  const suggestedQuestions = [
    t('performanceChat.suggestedQuestions.strengths'),
    t('performanceChat.suggestedQuestions.improvements'),
    t('performanceChat.suggestedQuestions.progress'),
    t('performanceChat.suggestedQuestions.nextSteps')
  ];

  if (!isOpen) return null;

  // Embedded mode: render inline without modal overlay
  const isEmbedded = variant === 'embedded';

  const chatContent = (
    <div
      className={isEmbedded
        ? 'bg-white w-full h-full flex flex-col overflow-hidden rounded-xl'
        : 'bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden'
      }
      onClick={(e) => e.stopPropagation()}
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-violet-600 text-white">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={t('performanceChat.backToMenu')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">{t('performanceChat.title')}</h2>
              <p className="text-xs text-purple-200">{t('performanceChat.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title={t('performanceChat.filterByRole')}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={clearChat}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title={t('performanceChat.newConversation')}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
{onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-3 bg-gray-50 border-b border-gray-100 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600">{t('performanceChat.filters.role')}</label>
                <select
                  value={filters.roleFilter || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, roleFilter: e.target.value || undefined }))}
                  className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">{t('performanceChat.filters.allRoles')}</option>
                  {filterOptions.roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600">{t('performanceChat.filters.company')}</label>
                <select
                  value={filters.companyFilter || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, companyFilter: e.target.value || undefined }))}
                  className="w-full mt-1 px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">{t('performanceChat.filters.allCompanies')}</option>
                  {filterOptions.companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
            </div>
            {(filters.roleFilter || filters.companyFilter) && (
              <button
                onClick={() => setFilters({})}
                className="text-xs text-purple-600 hover:text-purple-800"
              >
                {t('performanceChat.filters.clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[50vh]">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-3 text-purple-300" />
              <p className="text-sm">{t('performanceChat.loadingInsights')}</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600">{t('performanceChat.analyzing')}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-2">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && !isLoading && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">{t('performanceChat.tryAsking')}</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(question);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('performanceChat.placeholder')}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 max-h-24"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
    </div>
  );

  // For embedded mode, return content directly; for modal, wrap in overlay
  if (isEmbedded) {
    return chatContent;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {chatContent}
    </div>
  );
};

export default PerformanceChat;
