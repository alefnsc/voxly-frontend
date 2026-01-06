/**
 * Unified API Client
 * 
 * Centralized HTTP client for all backend API calls with:
 * - Environment-based URL selection
 * - Consistent header injection (auth, locale, country, request ID)
 * - Standardized error handling
 * - Request deduplication
 * - ETag/caching support
 * - Retry logic with exponential backoff
 * 
 * @module lib/apiClient
 */

import { config } from './config';

// ============================================
// TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  cached?: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
  maxRetries?: number;
  cache?: boolean;
  dedupe?: boolean;
}

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

// ============================================
// REQUEST TRACKING
// ============================================

// In-flight request deduplication
const inFlightRequests = new Map<string, Promise<ApiResponse<unknown>>>();

// ETag cache for conditional requests
const etagCache = new Map<string, { etag: string; data: unknown }>();

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// HEADER MANAGEMENT
// ============================================

interface AuthState {
  token?: string;
}

interface LocaleState {
  language?: string;
  country?: string;
}

let authState: AuthState = {};
let localeState: LocaleState = {};

/**
 * Set authentication state for all requests
 */
export function setAuthState(state: AuthState) {
  authState = { ...authState, ...state };
}

/**
 * Set locale state for all requests
 */
export function setLocaleState(state: LocaleState) {
  localeState = { ...localeState, ...state };
}

/**
 * Clear all client state (on logout)
 */
export function clearClientState() {
  authState = {};
  localeState = {};
  inFlightRequests.clear();
  etagCache.clear();
}

function buildHeaders(options: RequestOptions = {}): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  });

  // Request ID for tracing
  headers.set('X-Request-Id', generateRequestId());

  // Auth headers
  if (authState.token) {
    headers.set('Authorization', `Bearer ${authState.token}`);
  }

  // Locale headers
  if (localeState.language) {
    headers.set('X-Locale', localeState.language);
    headers.set('Accept-Language', localeState.language);
  }
  if (localeState.country) {
    headers.set('X-Country', localeState.country);
  }

  // Custom headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  return headers;
}

// ============================================
// ERROR HANDLING
// ============================================

export class ApiClientError extends Error {
  status: number;
  code?: string;
  errors?: Array<{ field?: string; message: string }>;
  originalError?: unknown;

  constructor(error: ApiError, originalError?: unknown) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = error.status;
    this.code = error.code;
    this.errors = error.errors;
    this.originalError = originalError;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }
}

async function handleErrorResponse(response: Response, endpointName: string): Promise<never> {
  let errorData: ApiError = {
    status: response.status,
    message: `Request to ${endpointName} failed with status ${response.status}`
  };

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await response.json();
      errorData = {
        status: response.status,
        message: json.message || json.error || errorData.message,
        code: json.code,
        errors: json.errors
      };
    } else {
      const text = await response.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        errorData.message = `Server returned HTML instead of JSON for ${endpointName}. The endpoint may not exist.`;
      } else {
        errorData.message = text.slice(0, 200) || errorData.message;
      }
    }
  } catch {
    // Keep default error message
  }

  throw new ApiClientError(errorData);
}

// ============================================
// RETRY LOGIC
// ============================================

function shouldRetry(status: number, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false;
  
  // Retry on network errors, 429 (rate limit), 5xx (server errors)
  return status === 0 || status === 429 || (status >= 500 && status < 600);
}

function getRetryDelay(attempt: number): number {
  // Exponential backoff with jitter
  const baseDelay = RETRY_DELAY_BASE * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return baseDelay + jitter;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// CORE REQUEST FUNCTION
// ============================================

async function makeRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    timeout = DEFAULT_TIMEOUT,
    retry = true,
    maxRetries = MAX_RETRIES,
    cache = true,
    dedupe = true
  } = options;

  const url = `${config.backendUrl}${endpoint}`;
  const requestKey = `${method}:${url}`;
  const endpointName = endpoint.split('?')[0];

  // Deduplication for GET requests
  if (dedupe && method === 'GET' && inFlightRequests.has(requestKey)) {
    console.debug(`[ApiClient] Deduped request: ${endpointName}`);
    return inFlightRequests.get(requestKey) as Promise<ApiResponse<T>>;
  }

  const headers = buildHeaders(options);

  // Add ETag for conditional request
  const cachedEntry = etagCache.get(requestKey);
  if (cache && method === 'GET' && cachedEntry?.etag) {
    headers.set('If-None-Match', cachedEntry.etag);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: controller.signal,
    credentials: 'include' // Include cookies for session-based auth
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const executeRequest = async (attempt = 0): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Handle 304 Not Modified - return cached data
      if (response.status === 304 && cachedEntry) {
        console.debug(`[ApiClient] Cache hit (304): ${endpointName}`);
        return {
          data: cachedEntry.data as T,
          status: 304,
          headers: response.headers,
          cached: true
        };
      }

      // Handle errors
      if (!response.ok) {
        if (retry && shouldRetry(response.status, attempt, maxRetries)) {
          const delay = getRetryDelay(attempt);
          console.warn(`[ApiClient] Retrying ${endpointName} in ${delay}ms (attempt ${attempt + 1})`);
          await sleep(delay);
          return executeRequest(attempt + 1);
        }
        await handleErrorResponse(response, endpointName);
      }

      // Parse response
      const contentType = response.headers.get('content-type') || '';
      let data: T;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      // Cache ETag if present
      const etag = response.headers.get('etag');
      if (cache && method === 'GET' && etag) {
        etagCache.set(requestKey, { etag, data });
      }

      return {
        data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiClientError({
            status: 0,
            message: `Request to ${endpointName} timed out after ${timeout}ms`,
            code: 'TIMEOUT'
          }, error);
        }

        if (retry && attempt < maxRetries) {
          const delay = getRetryDelay(attempt);
          console.warn(`[ApiClient] Network error, retrying ${endpointName} in ${delay}ms`);
          await sleep(delay);
          return executeRequest(attempt + 1);
        }

        throw new ApiClientError({
          status: 0,
          message: `Network error: ${error.message}`,
          code: 'NETWORK_ERROR'
        }, error);
      }

      throw error;
    }
  };

  const requestPromise = executeRequest();

  // Track in-flight requests for deduplication
  if (dedupe && method === 'GET') {
    inFlightRequests.set(requestKey, requestPromise as Promise<ApiResponse<unknown>>);
    requestPromise.finally(() => {
      inFlightRequests.delete(requestKey);
    });
  }

  return requestPromise;
}

// ============================================
// PUBLIC API
// ============================================

export const apiClient = {
  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, { ...options, method: 'GET' });
  },

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  },

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  },

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * Set auth state
   */
  setAuth: setAuthState,

  /**
   * Set locale state
   */
  setLocale: setLocaleState,

  /**
   * Clear all state
   */
  clear: clearClientState,

  /**
   * Check if request is currently in-flight
   */
  isRequestInFlight(endpoint: string, userId?: string): boolean {
    const key = `GET:${config.backendUrl}${endpoint}:${userId || 'anon'}`;
    return inFlightRequests.has(key);
  }
};

export default apiClient;
