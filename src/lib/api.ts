/**
 * Central API Client
 * 
 * Provides consistent error handling, JSON validation, and auth headers.
 * Prevents HTML-as-JSON parsing errors by validating Content-Type.
 * 
 * @module lib/api
 */

// ========================================
// CONFIGURATION
// ========================================

import { config } from './config';

const BACKEND_URL = config.backendUrl;

// ========================================
// TYPES
// ========================================

export interface APIResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface APIError extends Error {
  status: number;
  code?: string;
  responseText?: string;
}

// ========================================
// CENTRAL FETCH WRAPPER
// ========================================

/**
 * Safe fetch that validates JSON responses and handles errors consistently.
 * ALWAYS returns JSON or throws an APIError.
 */
export async function safeFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`;
  
  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers as Record<string, string> || {}),
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials ?? 'include',
    });
    
    // Validate Content-Type before parsing
    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      // Non-JSON response - likely an error page
      const textPreview = await response.text().then(t => t.slice(0, 200));
      
      console.error('🚨 Non-JSON API Response:', {
        url,
        status: response.status,
        contentType,
        textPreview,
      });
      
      const error = new Error(
        `API returned non-JSON response (${response.status}). ` +
        'This may indicate the backend is not running or the route does not exist.'
      ) as APIError;
      error.status = response.status;
      error.responseText = textPreview;
      throw error;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || `API error: ${response.status}`) as APIError;
      error.status = response.status;
      error.code = data.error?.code;
      throw error;
    }
    
    return data;
  } catch (err) {
    // Re-throw APIErrors as-is
    if ((err as APIError).status) {
      throw err;
    }
    
    // Network errors
    console.error('🌐 Network error:', err);
    const error = new Error('Network error. Please check your connection.') as APIError;
    error.status = 0;
    throw error;
  }
}

// ========================================
// CONVENIENCE METHODS
// ========================================

export const api = {
  get: <T>(endpoint: string, _userId?: string) => 
    safeFetch<T>(endpoint, { method: 'GET' }),
    
  post: <T>(endpoint: string, body: unknown, _userId?: string) =>
    safeFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    
  put: <T>(endpoint: string, body: unknown, _userId?: string) =>
    safeFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    
  delete: <T>(endpoint: string, _userId?: string) =>
    safeFetch<T>(endpoint, { method: 'DELETE' }),
};

export default api;

