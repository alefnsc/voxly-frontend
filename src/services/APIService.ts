import { RetellWebClient } from "retell-client-js-sdk";
import { config } from "../lib/config";
import { getDeviceFingerprint } from "./deviceFingerprint";

// Note: This service still requires backend API for Retell interview functionality
// Backend is NOT needed for: Authentication (Clerk), Credits (Clerk metadata), Payments (MercadoPago)
// Backend IS needed for: Interview calls (Retell API proxy), Feedback generation

// Backend URL from environment config
const BACKEND_URL = config.backendUrl;

// ==========================================
// CACHING LAYER
// ==========================================

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
    DASHBOARD_STATS: 60000,      // 1 minute - stats change after interviews
    INTERVIEWS_LIST: 30000,      // 30 seconds - list updates frequently
    INTERVIEW_DETAILS: 300000,   // 5 minutes - details rarely change
    SCORE_EVOLUTION: 300000,     // 5 minutes - historical data
    SPENDING_HISTORY: 300000,    // 5 minutes - historical data
    PAYMENT_HISTORY: 60000,      // 1 minute - payments update after purchase
};

// Cache storage keys
const CACHE_KEYS = {
    DASHBOARD_STATS: (userId: string) => `Vocaid_stats_${userId}`,
    INTERVIEWS_LIST: (userId: string, page: number, limit: number) => `Vocaid_interviews_${userId}_${page}_${limit}`,
    INTERVIEW_DETAILS: (interviewId: string) => `Vocaid_interview_${interviewId}`,
    SCORE_EVOLUTION: (userId: string, months: number) => `Vocaid_scores_${userId}_${months}`,
    SPENDING_HISTORY: (userId: string, months: number) => `Vocaid_spending_${userId}_${months}`,
    PAYMENT_HISTORY: (userId: string) => `Vocaid_payments_${userId}`,
};

/**
 * Get cached data from sessionStorage or fetch fresh data
 * @param key Cache key
 * @param fetcher Function to fetch fresh data
 * @param ttlMs Time-to-live in milliseconds
 * @param forceRefresh Skip cache and fetch fresh data
 */
async function getCachedOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number,
    forceRefresh = false
): Promise<T> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        try {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                const entry: CacheEntry<T> = JSON.parse(cached);
                if (Date.now() < entry.expiry) {
                    return entry.data;
                }
                // Cache expired, remove it
                sessionStorage.removeItem(key);
            }
        } catch (e) {
            // Cache read failed, continue to fetch
            console.warn('Cache read failed:', e);
        }
    }

    // Fetch fresh data
    const data = await fetcher();

    // Store in cache
    try {
        const entry: CacheEntry<T> = {
            data,
            expiry: Date.now() + ttlMs
        };
        sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (e) {
        // Cache write failed (e.g., quota exceeded), continue without caching
        console.warn('Cache write failed:', e);
    }

    return data;
}

/**
 * Invalidate specific cache entries
 */
function invalidateCache(pattern: string): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(pattern)) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
}

/**
 * Clear all Vocaid cache entries
 */
function clearAllCache(): void {
    invalidateCache('Vocaid_');
}

// ==========================================
// SAFE JSON RESPONSE HANDLING
// ==========================================

/**
 * Safely parse JSON response with proper error handling
 * Ensures we never try to parse HTML as JSON
 */
async function safeJsonParse<T>(response: Response, endpointName: string): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    
    // Check if response is JSON
    if (!contentType.includes('application/json')) {
        // Get first 200 chars of response for debugging
        const text = await response.text();
        const preview = text.slice(0, 200);
        
        console.error(`❌ Non-JSON response from ${endpointName}:`, {
            status: response.status,
            contentType,
            preview: preview.replace(/\n/g, ' ')
        });
        
        // If it looks like HTML, provide a helpful error
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            throw new Error(`Server returned HTML instead of JSON for ${endpointName}. The endpoint may not exist or there's a server error.`);
        }
        
        throw new Error(`Invalid response type from ${endpointName}: expected JSON, got ${contentType || 'unknown'}`);
    }
    
    try {
        return await response.json() as T;
    } catch (parseError) {
        console.error(`❌ JSON parse error for ${endpointName}:`, parseError);
        throw new Error(`Failed to parse JSON response from ${endpointName}`);
    }
}

/**
 * Make a fetch request with safe JSON handling
     */
async function safeFetch<T>(
    url: string,
    options: RequestInit,
    endpointName: string
): Promise<{ response: Response; data: T }> {
    const response = await fetch(url, options);
    const data = await safeJsonParse<T>(response, endpointName);
    return { response, data };
}

// Get headers with optional user authentication
const getHeaders = (userId?: string): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Required for ngrok free tier
    };
    
    if (userId) {
        headers['x-user-id'] = userId;
    }
    
    return headers;
};

interface RegisterCallResponse {
    call_id: string;
    access_token: string;
    status: string;
    message: string;
}

interface Metadata {
    first_name: string;
    last_name?: string;
    job_title: string;
    seniority?: string; // Candidate seniority: intern, junior, mid, senior, staff, principal
    company_name: string;
    job_description: string;
    interviewee_cv: string; // Base64 encoded resume content
    resume_file_name?: string;
    resume_mime_type?: string;
    interview_id?: string;
    preferred_language?: string; // Language code for multilingual support (e.g., 'en-US', 'zh-CN')
}

interface MainInterface {
    metadata: Metadata;
    userId?: string; // User ID for authentication
}

interface UserInfo {
    id: string;
    email: string;
    name: string;
    username: string;
    level: string;
    followers: number;
    followings: number;
    github: string;
    instagram: string;
    linkedin: string;
    role: string[];
    imageUrl: string | null;
    lastLogin: string | null;
    isDisabled: boolean;
    isPublicEmail: boolean;
    location: string | null;
}

interface UserInfoResponse {
    status: string;
    message: string;
    user: UserInfo;
}

// Dashboard Types
export interface DashboardStats {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    totalSpent: number;
    creditsRemaining: number;
    scoreChange: number; // Percentage change from previous period
    interviewsThisMonth: number;
}

export interface InterviewSummary {
    id: string;
    retellCallId: string;
    jobTitle: string;      // Backend field name
    companyName: string;   // Backend field name
    createdAt: string;
    callDuration: number | null; // in milliseconds from backend
    score: number | null;  // Backend field name
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    seniority?: string;    // Seniority level (intern, junior, mid, senior, staff, principal)
    language?: string;     // Interview language
    // Aliases for backward compatibility
    position?: string;
    company?: string;
    duration?: number;
    overallScore?: number | null;
}

export interface InterviewDetail extends InterviewSummary {
    jobDescription?: string;
    resumeData?: string | null;
    resumeFileName?: string | null;
    resumeMimeType?: string | null;
    feedbackPdf?: string | null;
    feedbackText?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
    feedback: {
        overallScore: number;
        contentScore: number;
        communicationScore: number;
        confidenceScore: number;
        technicalScore: number;
        summary: string;
        strengths: string[];
        improvements: string[];
        recommendations: string[];
    } | null;
    transcript: string | null;
    resumeUrl: string | null;
}

export interface PaymentHistoryItem {
    id: string;
    packageId?: string;
    packageName: string;
    creditsAmount: number;
    amountUSD: number;
    amountBRL: number;
    status: string;
    statusDetail?: string;
    paidAt?: string;
    createdAt: string;
}

export interface ScoreDataPoint {
    date: string;
    score: number;
    interviewId: string;
}

export interface SpendingDataPoint {
    month: string;
    amount: number;
}

export interface CreateInterviewData {
    jobTitle: string;
    seniority?: string; // Candidate seniority: intern, junior, mid, senior, staff, principal
    companyName: string;
    jobDescription: string;
    language?: string; // Interview language code
    resumeData?: string;
    resumeFileName?: string;
    resumeMimeType?: string;
}

export interface CreatedInterview {
    id: string;
    userId: string;
    jobTitle: string;
    companyName: string;
    status: string;
    createdAt: string;
}

class APIService {
    /**
     * Execute a GraphQL request against the backend
     */
    async graphqlRequest<T>(
        userId: string,
        query: string,
        variables?: Record<string, unknown>
    ): Promise<T> {
        const response = await fetch(`${BACKEND_URL}/graphql`, {
            method: 'POST',
            headers: {
                ...getHeaders(userId),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query, variables }),
        });

        const result = await safeJsonParse<{
            data?: T;
            errors?: Array<{ message: string }>;
        }>(response, 'graphqlRequest');

        if (!response.ok || result.errors?.length) {
            const message = result.errors?.[0]?.message || 'GraphQL request failed';
            throw new Error(message);
        }

        if (!result.data) {
            throw new Error('GraphQL response missing data');
        }

        return result.data;
    }
    private retellWebClient: RetellWebClient;

    constructor() {
        this.retellWebClient = new RetellWebClient();
    }

    initialize(eventHandlers: { [key: string]: (...args: any[]) => void }) {
        Object.keys(eventHandlers).forEach(event => {
            this.retellWebClient.on(event, eventHandlers[event]);
        });
    }

    /**
     * Create an interview record in the database
     */
    async createInterview(userId: string, data: CreateInterviewData): Promise<CreatedInterview> {
        console.log('📝 Creating interview record:', {
            position: data.jobTitle,
            company: data.companyName,
            userId: userId ? '✅ Present' : '❌ Missing'
        });
        
        const response = await fetch(`${BACKEND_URL}/api/interviews`, {
            method: "POST",
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            console.error('❌ Interview creation failed:', response.status);
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error creating interview: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Interview created:', {
            interview_id: result.data?.id,
            status: result.status
        });
        
        return result.data;
    }

    /**
     * Link Retell call ID to existing interview
     */
    async linkRetellCallToInterview(interviewId: string, retellCallId: string, userId: string): Promise<void> {
        console.log('🔗 Linking Retell call to interview:', { interviewId, retellCallId });
        
        const response = await fetch(`${BACKEND_URL}/api/interviews/${interviewId}`, {
            method: "PATCH",
            headers: getHeaders(userId),
            body: JSON.stringify({
                retellCallId,
                status: 'IN_PROGRESS',
                startedAt: new Date().toISOString()
            }),
        });
        
        if (!response.ok) {
            console.error('❌ Failed to link Retell call:', response.status);
            // Don't throw - interview can still proceed
        } else {
            console.log('✅ Retell call linked to interview');
        }
    }

    /**
     * Complete interview with results
     */
    async completeInterview(interviewId: string, userId: string, results: {
        score?: number;
        feedbackText?: string;
        feedbackPdf?: string;
        callDuration?: number;
    }): Promise<void> {
        console.log('✅ Completing interview:', { interviewId, hasScore: !!results.score, hasPdf: !!results.feedbackPdf });
        
        const response = await fetch(`${BACKEND_URL}/api/interviews/${interviewId}`, {
            method: "PATCH",
            headers: getHeaders(userId),
            body: JSON.stringify({
                status: 'COMPLETED',
                endedAt: new Date().toISOString(),
                ...results
            }),
        });
        
        if (!response.ok) {
            console.error('❌ Failed to complete interview:', response.status);
        } else {
            console.log('✅ Interview marked as completed');
        }
    }

    /**
     * Send feedback email with PDF attachment
     * Uses the new unified email endpoint that accepts PDF directly
     * 
     * @param interviewId - Interview UUID
     * @param pdfBase64 - Base64 encoded PDF (with or without data URL prefix)
     * @param options - Optional metadata for email
     */
    async sendFeedbackEmail(
        interviewId: string, 
        pdfBase64: string,
        options?: {
            fileName?: string;
            locale?: string;
            meta?: { roleTitle?: string; seniority?: string; company?: string }
        }
    ): Promise<{ ok: boolean; messageId?: string; error?: { code: string; message: string }; status?: string }> {
        console.log('📧 Sending feedback email with PDF:', { 
            interviewId, 
            pdfSize: `${Math.round(pdfBase64.length / 1024)}KB`
        });
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/email/feedback`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    interviewId,
                    pdfBase64,
                    fileName: options?.fileName,
                    locale: options?.locale,
                    meta: options?.meta
                }),
            });
            
            // Verify response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                console.error('❌ Non-JSON response from email endpoint:', contentType);
                return { 
                    ok: false, 
                    error: { 
                        code: 'INVALID_RESPONSE', 
                        message: 'Server returned an invalid response' 
                    } 
                };
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                console.error('❌ Failed to send feedback email:', response.status, result);
                return { 
                    ok: false, 
                    error: result.error || { code: 'UNKNOWN', message: 'Failed to send email' }
                };
            }
            
            console.log('✅ Feedback email result:', result);
            return result;
        } catch (error: any) {
            console.error('❌ Error sending feedback email:', error);
            return { 
                ok: false, 
                error: { code: 'NETWORK_ERROR', message: error.message }
            };
        }
    }

    /**
     * Send feedback email using Resend template (no PDF attachment)
     * This uses the published Resend template with alias 'feedback'
     * Idempotent: Will not send if already sent for this interview
     * 
     * @param interviewId - Interview UUID
     */
    async sendFeedbackTemplateEmail(
        interviewId: string
    ): Promise<{ ok: boolean; skipped?: boolean; reason?: string; messageId?: string; error?: { code: string; message: string } }> {
        console.log('📧 Sending template-based feedback email:', { interviewId });
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/email/template/feedback/${interviewId}`, {
                method: "POST",
                headers: getHeaders(),
            });
            
            // Verify response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                console.error('❌ Non-JSON response from template email endpoint:', contentType);
                return { 
                    ok: false, 
                    error: { 
                        code: 'INVALID_RESPONSE', 
                        message: 'Server returned an invalid response' 
                    } 
                };
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                console.error('❌ Failed to send template feedback email:', response.status, result);
                return { 
                    ok: false, 
                    error: result.error || { code: 'UNKNOWN', message: 'Failed to send email' }
                };
            }
            
            console.log('✅ Template feedback email result:', result);
            return result;
        } catch (error: any) {
            console.error('❌ Error sending template feedback email:', error);
            return { 
                ok: false, 
                error: { code: 'NETWORK_ERROR', message: error.message }
            };
        }
    }

    /**
     * Get email status for an interview
     */
    async getEmailStatus(interviewId: string): Promise<{
        ok: boolean;
        status?: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
        sentAt?: string;
        error?: string;
    }> {
        try {
            const response = await fetch(`${BACKEND_URL}/api/email/status/${interviewId}`, {
                method: "GET",
                headers: getHeaders(),
            });
            
            if (!response.ok) {
                return { ok: false };
            }
            
            return await response.json();
        } catch (error) {
            return { ok: false };
        }
    }

    /**
     * Cancel interview (early termination)
     */
    async cancelInterview(interviewId: string, userId: string, callDuration?: number): Promise<void> {
        console.log('🚫 Cancelling interview:', { interviewId, callDuration });
        
        const response = await fetch(`${BACKEND_URL}/api/interviews/${interviewId}`, {
            method: "PATCH",
            headers: getHeaders(userId),
            body: JSON.stringify({
                status: 'CANCELLED',
                endedAt: new Date().toISOString(),
                callDuration
            }),
        });
        
        if (!response.ok) {
            console.error('❌ Failed to cancel interview:', response.status);
        } else {
            console.log('✅ Interview marked as cancelled');
        }
    }

    /**
     * Request password reset email (custom flow)
     */
    async requestPasswordResetEmail(userId: string): Promise<{ status: string; message: string }> {
        const response = await fetch(`${BACKEND_URL}/api/auth/password-reset/request`, {
            method: 'POST',
            headers: getHeaders(userId),
        });

        const result = await response.json().catch(() => ({
            status: 'error',
            message: 'Unexpected response from server',
        }));

        if (!response.ok) {
            throw new Error(result.message || `Error: ${response.status}`);
        }

        return result;
    }

    /**
     * Confirm password reset with token
     */
    async confirmPasswordReset(token: string, newPassword: string): Promise<{ status: string; message: string }> {
        const response = await fetch(`${BACKEND_URL}/api/auth/password-reset/confirm`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ token, newPassword }),
        });

        const result = await response.json().catch(() => ({
            status: 'error',
            message: 'Unexpected response from server',
        }));

        if (!response.ok) {
            throw new Error(result.message || `Error: ${response.status}`);
        }

        return result;
    }

    async registerCall(body: MainInterface): Promise<RegisterCallResponse & { interviewId?: string }> {
        // Backend endpoint required for Retell API integration
        console.log('📞 Registering call with backend:', {
            candidate: body.metadata.first_name,
            position: body.metadata.job_title,
            backend_url: BACKEND_URL,
            userId: body.userId ? '✅ Present' : '❌ Missing',
            preferredLanguage: body.metadata.preferred_language || 'not_provided'
        });
        
        // Step 1: Create interview record in database (skip if interview_id is already a UUID)
        let interviewId: string | undefined;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (body.metadata?.interview_id && uuidRegex.test(body.metadata.interview_id)) {
            interviewId = body.metadata.interview_id;
        } else if (body.userId) {
            try {
                const interview = await this.createInterview(body.userId, {
                    jobTitle: body.metadata.job_title,
                    seniority: body.metadata.seniority,
                    companyName: body.metadata.company_name,
                    jobDescription: body.metadata.job_description,
                    language: body.metadata.preferred_language,
                    resumeData: body.metadata.interviewee_cv, // Now Base64 encoded
                    resumeFileName: body.metadata.resume_file_name,
                    resumeMimeType: body.metadata.resume_mime_type,
                });
                interviewId = interview.id;
                console.log('✅ Interview record created:', interviewId);
            } catch (err) {
                console.error('⚠️ Failed to create interview record, continuing with call:', err);
                // Don't fail the call if interview creation fails
            }
        }
        
        // Step 2: Register Retell call
        const response = await fetch(`${BACKEND_URL}/register-call`, {
            method: "POST",
            headers: getHeaders(body.userId),
            body: JSON.stringify(body),
        });
        
        if (!response.ok) {
            console.error('❌ Call registration failed:', response.status);
            throw new Error(`Error: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Call registered:', {
            call_id: result.call_id,
            status: result.status
        });
        
        // Step 3: Link Retell call ID to interview record
        if (interviewId && result.call_id && body.userId) {
            try {
                await this.linkRetellCallToInterview(interviewId, result.call_id, body.userId);
            } catch (err) {
                console.error('⚠️ Failed to link Retell call to interview:', err);
                // Don't fail - interview can still proceed
            }
        }
        
        return { ...result, interviewId };
    }

    /**
     * @deprecated Use Clerk user data instead - this endpoint no longer exists
     * User information should be retrieved from:
     * - useUser() hook from @clerk/clerk-react
     * - getCurrentUser() method below for backend-synced data
     */
    async getUserInfo(_userId: string): Promise<UserInfoResponse> {
        console.warn('⚠️ getUserInfo is deprecated. Use Clerk user data or getCurrentUser() instead.');
        throw new Error('getUserInfo is deprecated. Use Clerk user data or getCurrentUser() instead.');
    }

    async getCall(call_id: string): Promise<Response> {
        // Backend endpoint required for Retell call data
        return await fetch(`${BACKEND_URL}/get-call/`+call_id, {
            headers: getHeaders()
        });
    }

    /**
     * Get feedback for an interview
     * @param call_id - Retell call ID
     * @param options - Optional parameters for structured feedback
     * @param options.structured - Request structured feedback format (v2.0)
     * @param options.seniority - Candidate seniority level
     * @param options.language - Feedback language code
     */
    async getFeedback(
        call_id: string, 
        options?: {
            structured?: boolean;
            seniority?: 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
            language?: 'en' | 'es' | 'pt-BR' | 'zh-CN';
        }
    ): Promise<Response> {
        // Build query params
        const params = new URLSearchParams();
        if (options?.structured) {
            params.append('structured', 'true');
        }
        if (options?.seniority) {
            params.append('seniority', options.seniority);
        }
        if (options?.language) {
            params.append('language', options.language);
        }
        
        const queryString = params.toString();
        const url = `${BACKEND_URL}/get-feedback-for-interview/${call_id}${queryString ? `?${queryString}` : ''}`;
        
        // Backend endpoint required for AI-generated interview feedback
        return await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });
    }

    async restoreCredit(userId: string, reason: string, callId?: string): Promise<{ status: string; newCredits?: number; message?: string }> {
        // Restore credit when interview is cancelled due to incompatibility
        console.log('💳 Requesting credit restoration:', { userId, reason, callId });
        
        const response = await fetch(`${BACKEND_URL}/restore-credit`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ userId, reason, callId })
        });
        
        if (!response.ok) {
            console.error('❌ Credit restoration failed:', response.status);
            throw new Error(`Error restoring credit: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Credit restored:', result);
        return result;
    }

    async consumeCredit(userId: string, callId?: string): Promise<{ status: string; newCredits?: number; message?: string }> {
        // Consume credit when interview starts
        console.log('💳 Consuming credit:', { userId, callId });
        
        const response = await fetch(`${BACKEND_URL}/consume-credit`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ userId, callId })
        });
        
        if (!response.ok) {
            console.error('❌ Credit consumption failed:', response.status);
            throw new Error(`Error consuming credit: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Credit consumed:', result);
        return result;
    }

    async startCall(accessToken: string, emitRawAudio = false) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🎙️ Starting Retell call with access token');
        console.log('═══════════════════════════════════════════════════════════');
        
        if (!this.retellWebClient) {
            console.error("❌ Retell Web Client not initialized");
            return;
        }

        try {
            // Ensure audio context is resumed (required for some browsers)
            if (typeof window !== 'undefined' && 'AudioContext' in window) {
                try {
                    const audioContext = new AudioContext();
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                        console.log('🔊 Audio context resumed');
                    }
                    console.log('🔊 Audio context state:', audioContext.state);
                } catch (audioErr) {
                    console.warn('⚠️ Could not create audio context:', audioErr);
                }
            }

            console.log('📞 Calling retellWebClient.startCall with options:');
            console.log('   • accessToken:', accessToken.substring(0, 20) + '...');
            console.log('   • sampleRate: 24000');
            console.log('   • captureDeviceId: default');
            console.log('   • playbackDeviceId: default');
            console.log('   • emitRawAudioSamples:', emitRawAudio);
            console.log('');
            console.log('⏳ Waiting for Retell to connect...');
            console.log('   (This may take a few seconds)');

            await this.retellWebClient.startCall({
                accessToken: accessToken,
                sampleRate: 24000,
                captureDeviceId: "default",
                playbackDeviceId: "default",
                emitRawAudioSamples: emitRawAudio 
            });
            
            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('✅ Retell call started successfully');
            console.log('🔊 Audio playback should be active');
            console.log('');
            console.log('📋 If you cannot hear the agent, check:');
            console.log('   1. System volume is not muted');
            console.log('   2. Browser tab is not muted');
            console.log('   3. Retell agent has a VOICE configured');
            console.log('═══════════════════════════════════════════════════════════');
        } catch (error: any) {
            console.error('═══════════════════════════════════════════════════════════');
            console.error('❌ ERROR STARTING RETELL CALL');
            console.error('═══════════════════════════════════════════════════════════');
            console.error('   • Error:', error);
            console.error('   • Error message:', error?.message || 'Unknown');
            console.error('   • Error name:', error?.name || 'Unknown');
            console.error('');
            console.error('🔧 POSSIBLE CAUSES:');
            console.error('   1. Microphone permission denied');
            console.error('   2. Invalid access token');
            console.error('   3. Retell agent not configured properly');
            console.error('   4. Network/WebRTC connection failed');
            console.error('═══════════════════════════════════════════════════════════');
            throw error;
        }
    }
    stopCall() {
        this.retellWebClient.stopCall();

    }

    // ==========================================
    // DASHBOARD API METHODS (WITH CACHING)
    // ==========================================

    /**
     * Get dashboard statistics for a user (cached for 1 minute)
     */
    async getDashboardStats(userId: string, forceRefresh = false): Promise<DashboardStats> {
        const cacheKey = CACHE_KEYS.DASHBOARD_STATS(userId);
        
        return getCachedOrFetch(
            cacheKey,
            async () => {
                const response = await fetch(`${BACKEND_URL}/api/users/${userId}/stats`, {
                    method: 'GET',
                    headers: getHeaders(userId),
                });
                
                if (!response.ok) {
                    throw new Error(`Error fetching dashboard stats: ${response.status}`);
                }
                
                const result = await response.json();
                return result.data;
            },
            CACHE_TTL.DASHBOARD_STATS,
            forceRefresh
        );
    }

    /**
     * Get list of user's interviews (cached for 30 seconds)
     */
    async getUserInterviews(userId: string, page = 1, limit = 10, forceRefresh = false): Promise<{ interviews: InterviewSummary[]; total: number; page: number; totalPages: number }> {
        const cacheKey = CACHE_KEYS.INTERVIEWS_LIST(userId, page, limit);
        
        return getCachedOrFetch(
            cacheKey,
            async () => {
                const response = await fetch(`${BACKEND_URL}/api/users/${userId}/interviews?page=${page}&limit=${limit}`, {
                    method: 'GET',
                    headers: getHeaders(userId),
                });
                
                if (!response.ok) {
                    throw new Error(`Error fetching interviews: ${response.status}`);
                }
                
                const result = await response.json();
                return {
                    interviews: result.data || [],
                    total: result.pagination?.total || 0,
                    page: result.pagination?.page || 1,
                    totalPages: result.pagination?.totalPages || 1
                };
            },
            CACHE_TTL.INTERVIEWS_LIST,
            forceRefresh
        );
    }

    /**
     * Get detailed interview information by ID (cached for 5 minutes)
     */
    async getInterviewDetails(interviewId: string, userId: string, forceRefresh = false): Promise<InterviewDetail> {
        const cacheKey = CACHE_KEYS.INTERVIEW_DETAILS(interviewId);
        
        return getCachedOrFetch(
            cacheKey,
            async () => {
                const response = await fetch(`${BACKEND_URL}/api/interviews/${interviewId}`, {
                    method: 'GET',
                    headers: getHeaders(userId),
                });
                
                if (!response.ok) {
                    throw new Error(`Error fetching interview details: ${response.status}`);
                }
                
                const result = await response.json();
                return result.data;
            },
            CACHE_TTL.INTERVIEW_DETAILS,
            forceRefresh
        );
    }

    /**
     * Get user's payment history (cached for 1 minute)
     */
    async getPaymentHistory(userId: string, forceRefresh = false): Promise<PaymentHistoryItem[]> {
        const cacheKey = CACHE_KEYS.PAYMENT_HISTORY(userId);
        
        return getCachedOrFetch(
            cacheKey,
            async () => {
                const response = await fetch(`${BACKEND_URL}/api/users/${userId}/payments`, {
                    method: 'GET',
                    headers: getHeaders(userId),
                });
                
                if (!response.ok) {
                    throw new Error(`Error fetching payment history: ${response.status}`);
                }
                
                const result = await response.json();
                return result.data || [];
            },
            CACHE_TTL.PAYMENT_HISTORY,
            forceRefresh
        );
    }

    /**
     * Get score evolution data for charts (cached for 5 minutes)
     */
    async getScoreEvolution(userId: string, months = 6, forceRefresh = false): Promise<ScoreDataPoint[]> {
        const cacheKey = CACHE_KEYS.SCORE_EVOLUTION(userId, months);
        
        return getCachedOrFetch(
            cacheKey,
            async () => {
                const response = await fetch(`${BACKEND_URL}/api/users/${userId}/score-evolution?months=${months}`, {
                    method: 'GET',
                    headers: getHeaders(userId),
                });
                
                if (!response.ok) {
                    throw new Error(`Error fetching score evolution: ${response.status}`);
                }
                
                const result = await response.json();
                return result.data || [];
            },
            CACHE_TTL.SCORE_EVOLUTION,
            forceRefresh
        );
    }

    /**
     * Get spending data for charts (cached for 5 minutes)
     */
    async getSpendingHistory(userId: string, months = 6, forceRefresh = false): Promise<SpendingDataPoint[]> {
        const cacheKey = CACHE_KEYS.SPENDING_HISTORY(userId, months);
        
        return getCachedOrFetch(
            cacheKey,
            async () => {
                const response = await fetch(`${BACKEND_URL}/api/users/${userId}/spending?months=${months}`, {
                    method: 'GET',
                    headers: getHeaders(userId),
                });
                
                if (!response.ok) {
                    throw new Error(`Error fetching spending history: ${response.status}`);
                }
                
                const result = await response.json();
                return result.data || [];
            },
            CACHE_TTL.SPENDING_HISTORY,
            forceRefresh
        );
    }

    // ==========================================
    // CACHE MANAGEMENT
    // ==========================================

    /**
     * Invalidate all interview-related caches (call after interview completion)
     */
    invalidateInterviewCaches(userId: string): void {
        invalidateCache(`Vocaid_stats_${userId}`);
        invalidateCache(`Vocaid_interviews_${userId}`);
        invalidateCache(`Vocaid_scores_${userId}`);
    }

    /**
     * Invalidate payment caches (call after successful payment)
     */
    invalidatePaymentCaches(userId: string): void {
        invalidateCache(`Vocaid_stats_${userId}`);
        invalidateCache(`Vocaid_payments_${userId}`);
        invalidateCache(`Vocaid_spending_${userId}`);
    }

    /**
     * Clear all cached data (call on logout)
     */
    clearCache(): void {
        clearAllCache();
    }

    // ========================================
    // USER SYNC METHODS
    // ========================================

    /**
     * Sync user data to backend database on login
     * This ensures user exists in local database even if webhook wasn't received
     */
    async syncUser(userId: string): Promise<{ status: string; user: any; message: string }> {
        console.log('🔄 Syncing user to backend:', userId);
        
        const response = await fetch(`${BACKEND_URL}/api/users/sync`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            console.error('❌ User sync failed:', response.status);
            throw new Error(`Error syncing user: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ User synced:', {
            status: result.status,
            message: result.message,
            userId: result.user?.id
        });
        return result;
    }

    /**
     * Validate user session and ensure user exists in database
     * Called on interview page load and critical actions
     * Includes device fingerprint for signup abuse detection
     */
    async validateUser(userId: string): Promise<{ status: string; user: any; message: string; freeTrialGranted?: boolean; freeCreditBlocked?: boolean }> {
        console.log('🔐 Validating user session:', userId);
        
        // Get device fingerprint for abuse detection
        let deviceFingerprint: string | undefined;
        try {
            deviceFingerprint = await getDeviceFingerprint();
        } catch (e) {
            console.warn('⚠️ Could not get device fingerprint');
        }
        
        const response = await fetch(`${BACKEND_URL}/api/users/validate`, {
            method: 'POST',
            headers: {
                ...getHeaders(userId),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deviceFingerprint }),
        });
        
        // Use safe JSON parsing to avoid HTML errors
        const result = await safeJsonParse<{ status: string; user: any; message: string; freeTrialGranted?: boolean; freeCreditBlocked?: boolean }>(
            response, 
            'validateUser'
        );
        
        if (!response.ok) {
            console.error('❌ User validation failed:', response.status, result);
            throw new Error(result.message || `Error validating user: ${response.status}`);
        }
        
        console.log('✅ User validated:', {
            status: result.status,
            message: result.message,
            userId: result.user?.id,
            credits: result.user?.credits,
            freeTrialGranted: result.freeTrialGranted,
            freeCreditBlocked: result.freeCreditBlocked
        });
        return result;
    }

    /**
     * Get current user data from backend
     * Uses sessionStorage cache to prevent excessive API calls
     */
    async getCurrentUser(userId: string, skipCache: boolean = false): Promise<{ status: string; user: any }> {
        const cacheKey = `Vocaid_current_user_${userId}`;
        const cacheTTL = 60 * 1000; // 1 minute cache
        
        // Check cache first (unless skipCache is true)
        if (!skipCache) {
            try {
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < cacheTTL) {
                        console.log('📦 Using cached user data (getCurrentUser)');
                        return data;
                    }
                }
            } catch {
                // Ignore cache errors
            }
        }
        
        console.log('👤 Getting current user from backend:', userId);
        
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            console.error('❌ Failed to get current user:', response.status);
            throw new Error(`Error getting user: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Current user received:', {
            id: result.user?.id,
            email: result.user?.email,
            credits: result.user?.credits
        });
        
        // Cache the result
        try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
                data: result,
                timestamp: Date.now()
            }));
        } catch {
            // Ignore cache errors
        }
        
        return result;
    }

    // ==========================================
    // CREDITS WALLET API
    // ==========================================

    /**
     * Get user's wallet balance and summary
     */
    async getWalletBalance(userId: string): Promise<{
        status: string;
        data: {
            balance: number;
            totalEarned: number;
            totalSpent: number;
            totalPurchased: number;
            totalGranted: number;
            lastCreditAt?: string;
            lastDebitAt?: string;
        };
    }> {
        console.log('💰 Getting wallet balance:', userId);
        
        const response = await fetch(`${BACKEND_URL}/api/credits/balance`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting wallet balance: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get user's credit transaction history
     */
    async getWalletHistory(
        userId: string,
        options?: { limit?: number; offset?: number; type?: string }
    ): Promise<{
        status: string;
        data: {
            transactions: Array<{
                id: string;
                type: string;
                amount: number;
                balanceAfter: number;
                description: string;
                referenceType?: string;
                referenceId?: string;
                createdAt: string;
            }>;
            pagination: {
                total: number;
                limit: number;
                offset: number;
                hasMore: boolean;
            };
        };
    }> {
        console.log('📜 Getting wallet history:', userId);
        
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', String(options.limit));
        if (options?.offset) params.append('offset', String(options.offset));
        if (options?.type) params.append('type', options.type);
        
        const url = `${BACKEND_URL}/api/credits/history${params.toString() ? `?${params}` : ''}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting wallet history: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Check if user has enough credits
     */
    async checkCredits(userId: string, amount: number = 1): Promise<{
        status: string;
        data: {
            hasEnough: boolean;
            currentBalance: number;
            required: number;
        };
    }> {
        console.log('🔍 Checking credits:', { userId, amount });
        
        const response = await fetch(`${BACKEND_URL}/api/credits/check?amount=${amount}`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error checking credits: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get user's trial status including promo info
     */
    async getTrialStatus(userId: string): Promise<{
        status: string;
        message?: string;
        data?: {
            trialCreditsGranted: boolean;
            trialCreditsAmount: number;
            trialCreditsGrantedAt: string | null;
            isPromoActive: boolean;
            promoEndsAt: string;
            promoRemainingDays: number;
            currentBalance: number;
            riskLevel: 'low' | 'medium' | 'high';
        };
    }> {
        console.log('🎁 Getting trial status:', userId);
        
        const response = await fetch(`${BACKEND_URL}/api/credits/trial-status`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                status: 'error',
                message: errorData.message || `Error getting trial status: ${response.status}`
            };
        }
        
        return response.json();
    }

    /**
     * Get current promo information (public endpoint)
     */
    async getPromoInfo(): Promise<{
        status: string;
        data?: {
            isPromoActive: boolean;
            promoEndsAt: string;
            promoRemainingDays: number;
            promoCredits: number;
            standardCredits: number;
        };
    }> {
        console.log('🎉 Getting promo info');
        
        const response = await fetch(`${BACKEND_URL}/api/credits/promo-info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error(`Error getting promo info: ${response.status}`);
        }
        
        return response.json();
    }

    // ==========================================
    // LEADS API (Public - No Auth Required)
    // ==========================================

    /**
     * Submit a demo request (B2B sales lead)
     */
    async submitDemoRequest(data: {
        name: string;
        email: string;
        company: string;
        teamSize?: string;
        useCase?: string;
    }): Promise<{ status: string; message: string; data?: { id: string } }> {
        console.log('📧 Submitting demo request:', { email: data.email, company: data.company });
        
        const response = await fetch(`${BACKEND_URL}/api/leads/demo-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error submitting demo request: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Submit early access signup for B2B modules
     */
    async submitEarlyAccess(data: {
        name: string;
        email: string;
        company?: string;
        phone?: string;
        interestedModules?: string[];
    }): Promise<{ status: string; message: string; data?: { id: string } }> {
        console.log('🚀 Submitting early access request:', { 
            email: data.email, 
            modules: data.interestedModules 
        });
        
        const response = await fetch(`${BACKEND_URL}/api/leads/early-access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Error submitting early access request: ${response.status}`);
        }
        
        return response.json();
    }

    // ==========================================
    // MULTILINGUAL & PREFERENCES API
    // ==========================================

    /**
     * Get user's language and region preferences
     */
    async getUserPreferences(userId: string): Promise<{
        status: string;
        data: {
            language: string;
            languageConfig: {
                code: string;
                name: string;
                englishName: string;
                flag: string;
            };
            region: string;
            country: string;
            paymentProvider: 'mercadopago' | 'paypal';
            timezone?: string;
        };
    }> {
        console.log('🌐 Getting user preferences:', userId);
        
        const response = await fetch(`${BACKEND_URL}/api/multilingual/preferences`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting preferences: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Update user's language and region preferences
     */
    async updateUserPreferences(params: {
        preferredLanguage?: string;
        country?: string;
        timezone?: string;
        languageSetByUser?: boolean;
    }): Promise<any> {
        // This is a placeholder - in production, this would call the backend
        // For now, we're storing in Clerk metadata via the backend
        console.log('🌐 Updating user preferences:', params);
        
        // The actual implementation would be:
        // const response = await fetch(`${BACKEND_URL}/api/multilingual/preferences`, {
        //     method: 'PUT',
        //     headers: getHeaders(userId),
        //     body: JSON.stringify({
        //         language: params.preferredLanguage,
        //         country: params.country,
        //         timezone: params.timezone,
        //     }),
        // });
        
        // For now, just store locally
        if (params.preferredLanguage) {
            localStorage.setItem('Vocaid_language', params.preferredLanguage);
        }
        
        return { status: 'success' };
    }

    /**
     * Initialize preferences for new user with auto-detection
     */
    async initializeUserPreferences(userId: string): Promise<any> {
        console.log('🌐 Initializing user preferences:', userId);
        
        const response = await fetch(`${BACKEND_URL}/api/multilingual/preferences/initialize`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error initializing preferences: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get list of supported languages
     */
    async getSupportedLanguages(): Promise<{
        status: string;
        data: Array<{
            code: string;
            name: string;
            englishName: string;
            flag: string;
            hasAgent: boolean;
        }>;
    }> {
        const response = await fetch(`${BACKEND_URL}/api/multilingual/languages`, {
            method: 'GET',
            headers: getHeaders(),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting languages: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Register a multilingual interview call
     */
    async registerMultilingualCall(
        userId: string,
        params: {
            language?: string;
            metadata: {
                first_name: string;
                last_name?: string;
                job_title: string;
                company_name: string;
                job_description: string;
                interviewee_cv: string;
                resume_file_name?: string;
                resume_mime_type?: string;
                interview_id?: string;
            };
        }
    ): Promise<{
        status: string;
        data: {
            call_id: string;
            access_token: string;
            status: string;
            message: string;
            language: {
                code: string;
                name: string;
                englishName: string;
            };
        };
    }> {
        console.log('📞 Registering multilingual call:', { userId, language: params.language });
        
        const response = await fetch(`${BACKEND_URL}/api/multilingual/call/register`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(params),
        });
        
        if (!response.ok) {
            throw new Error(`Error registering call: ${response.status}`);
        }
        
        return response.json();
    }

    // ==========================================
    // GEO-PAYMENT API
    // ==========================================

    /**
     * Get preferred payment provider based on user's region
     */
    async getPreferredPaymentProvider(userId: string): Promise<{
        status: string;
        data: {
            provider: 'mercadopago' | 'paypal';
            name: string;
            isFallback: boolean;
            supportedCurrencies: string[];
        };
    }> {
        console.log('💳 Getting preferred payment provider:', userId);
        
        const response = await fetch(`${BACKEND_URL}/api/multilingual/payment/provider`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting payment provider: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get credit packages with localized prices
     */
    async getLocalizedPackages(userId: string): Promise<{
        status: string;
        data: {
            packages: Array<{
                id: string;
                name: string;
                credits: number;
                price: number;
                priceUSD: number;
                currency: string;
                description: string;
            }>;
            currency: string;
            region: string;
            language: string;
        };
    }> {
        console.log('📦 Getting localized packages:', userId);
        
        const response = await fetch(`${BACKEND_URL}/api/multilingual/payment/packages`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting packages: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Create payment with automatic provider selection based on region
     */
    async createGeoPayment(
        userId: string,
        params: {
            packageId: 'starter' | 'intermediate' | 'professional';
            language?: string;
            provider?: 'mercadopago' | 'paypal';
        }
    ): Promise<{
        status: string;
        data: {
            paymentId: string;
            redirectUrl: string;
            provider: 'mercadopago' | 'paypal';
            sandboxMode: boolean;
        };
    }> {
        console.log('💳 Creating geo-based payment:', { userId, ...params });
        
        const response = await fetch(`${BACKEND_URL}/api/multilingual/payment/create`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(params),
        });
        
        if (!response.ok) {
            throw new Error(`Error creating payment: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Check payment status
     */
    async checkPaymentStatus(
        userId: string,
        paymentId: string,
        provider: 'mercadopago' | 'paypal'
    ): Promise<{
        status: string;
        data: {
            status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'unknown';
            statusDetail?: string;
            paidAt?: string;
            amount?: number;
            currency?: string;
        };
    }> {
        console.log('🔍 Checking payment status:', { paymentId, provider });
        
        const response = await fetch(
            `${BACKEND_URL}/api/multilingual/payment/status/${paymentId}?provider=${provider}`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error checking payment status: ${response.status}`);
        }
        
        return response.json();
    }

    // ==========================================
    // RESUME REPOSITORY
    // ==========================================

    /**
     * Get all resumes from the repository
     */
    async getResumes(userId: string): Promise<{
        status: string;
        data: ResumeListItem[];
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting resumes: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get primary resume
     */
    async getPrimaryResume(userId: string, includeData = false): Promise<{
        status: string;
        data: ResumeDocument | null;
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/resumes/primary?includeData=${includeData}`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            if (response.status === 404) {
                return { status: 'success', data: null };
            }
            throw new Error(`Error getting primary resume: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get a specific resume by ID
     */
    async getResumeById(
        userId: string,
        resumeId: string,
        includeData = false
    ): Promise<{
        status: string;
        data: ResumeDocument;
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/resumes/${resumeId}?includeData=${includeData}`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error getting resume: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Create a new resume in the repository
     */
    async createResume(
        userId: string,
        data: {
            fileName: string;
            mimeType: string;
            base64Data: string;
            title?: string;
            description?: string;
            tags?: string[];
            isPrimary?: boolean;
        }
    ): Promise<{
        status: string;
        data: {
            id: string;
            title: string;
            fileName: string;
            version: number;
            isPrimary: boolean;
        };
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error(`Error creating resume: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Update resume metadata
     */
    async updateResume(
        userId: string,
        resumeId: string,
        data: {
            title?: string;
            description?: string;
            tags?: string[];
            isPrimary?: boolean;
        }
    ): Promise<{
        status: string;
        data: ResumeDocument;
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes/${resumeId}`, {
            method: 'PATCH',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error(`Error updating resume: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Delete a resume
     */
    async deleteResume(userId: string, resumeId: string): Promise<{
        status: string;
        message: string;
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes/${resumeId}`, {
            method: 'DELETE',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error deleting resume: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Set a resume as primary
     */
    async setPrimaryResume(userId: string, resumeId: string): Promise<{
        status: string;
        message: string;
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes/${resumeId}/primary`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error setting primary resume: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get resume version history
     */
    async getResumeVersions(userId: string, resumeId: string): Promise<{
        status: string;
        data: ResumeVersion[];
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes/${resumeId}/versions`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting resume versions: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Create a new version of a resume
     */
    async createResumeVersion(
        userId: string,
        resumeId: string,
        data: {
            fileName: string;
            mimeType: string;
            base64Data: string;
        }
    ): Promise<{
        status: string;
        data: {
            id: string;
            title: string;
            fileName: string;
            version: number;
        };
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes/${resumeId}/versions`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error(`Error creating resume version: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Score a resume against a specific role
     */
    async scoreResume(
        userId: string,
        resumeId: string,
        roleTitle: string
    ): Promise<{
        status: string;
        data: {
            resumeId: string;
            roleTitle: string;
            score: number;
            provider: string;
            breakdown: Record<string, unknown> | null;
            cachedAt: string | null;
        };
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes/${resumeId}/score`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ roleTitle }),
        });
        
        if (!response.ok) {
            throw new Error(`Error scoring resume: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get all scores for a resume
     */
    async getResumeScores(
        userId: string,
        resumeId: string
    ): Promise<{
        status: string;
        data: Array<{
            roleTitle: string;
            score: number;
            provider: string;
            cachedAt: string | null;
        }>;
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes/scores?resumeId=${resumeId}`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting resume scores: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Create a resume from LinkedIn profile data (manual entry)
     */
    async createLinkedInResume(
        userId: string,
        data: {
            name: string;
            email: string;
            headline: string;
            linkedInUrl?: string;
        }
    ): Promise<{
        status: string;
        data: {
            id: string;
            title: string;
            fileName: string;
            version: number;
            isPrimary: boolean;
        };
    }> {
        const response = await fetch(`${BACKEND_URL}/api/resumes/linkedin`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error(`Error creating LinkedIn resume: ${response.status}`);
        }
        
        return response.json();
    }

    // ==========================================
    // INTERVIEW CLONE & RETRY
    // ==========================================

    /**
     * Clone an interview to retry with same job details
     */
    async cloneInterview(
        userId: string,
        interviewId: string,
        options?: {
            useLatestResume?: boolean;
            resumeId?: string;
            updateJobDescription?: string;
        }
    ): Promise<{
        status: string;
        data: {
            id: string;
            jobTitle: string;
            companyName: string;
            status: string;
            message: string;
        };
    }> {
        const response = await fetch(`${BACKEND_URL}/api/interviews/${interviewId}/clone`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(options || {}),
        });
        
        if (!response.ok) {
            throw new Error(`Error cloning interview: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get suggested interviews to retake
     */
    async getSuggestedRetakes(userId: string, limit = 5): Promise<{
        status: string;
        data: Array<{
            id: string;
            jobTitle: string;
            companyName: string;
            score: number;
            createdAt: string;
            reason: string;
        }>;
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/interviews/suggested-retakes?limit=${limit}`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error getting suggested retakes: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Create interview from resume repository
     */
    async createInterviewFromResume(
        userId: string,
        resumeId: string,
        jobDetails: {
            jobTitle: string;
            companyName: string;
            jobDescription: string;
        }
    ): Promise<{
        status: string;
        data: {
            id: string;
            jobTitle: string;
            companyName: string;
            status: string;
            message: string;
        };
    }> {
        const response = await fetch(`${BACKEND_URL}/api/interviews/from-resume`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({
                resumeId,
                ...jobDetails,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Error creating interview from resume: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get interview history for role/company
     */
    async getInterviewHistory(
        userId: string,
        options?: {
            jobTitle?: string;
            companyName?: string;
        }
    ): Promise<{
        status: string;
        data: {
            interviews: InterviewSummary[];
            stats: {
                totalAttempts: number;
                averageScore: number | null;
                scoreImprovement: number | null;
                bestScore: number | null;
            };
        };
    }> {
        const params = new URLSearchParams();
        if (options?.jobTitle) params.append('jobTitle', options.jobTitle);
        if (options?.companyName) params.append('companyName', options.companyName);
        
        const response = await fetch(
            `${BACKEND_URL}/api/interviews/history?${params.toString()}`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error getting interview history: ${response.status}`);
        }
        
        return response.json();
    }

    // ==========================================
    // RECORDING PLAYBACK
    // ==========================================

    /**
     * Get complete playback data for an interview
     */
    async getPlaybackData(userId: string, interviewId: string): Promise<{
        status: string;
        data: PlaybackData;
    }> {
        const response = await fetch(`${BACKEND_URL}/api/recordings/${interviewId}`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting playback data: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get synchronized transcript
     */
    async getTranscript(userId: string, interviewId: string): Promise<{
        status: string;
        data: SynchronizedTranscript;
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/recordings/${interviewId}/transcript`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error getting transcript: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Search transcript
     */
    async searchTranscript(
        userId: string,
        interviewId: string,
        query: string
    ): Promise<{
        status: string;
        data: {
            query: string;
            matches: number;
            segments: TranscriptSegment[];
        };
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/recordings/${interviewId}/transcript/search?q=${encodeURIComponent(query)}`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error searching transcript: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get playback markers
     */
    async getPlaybackMarkers(userId: string, interviewId: string): Promise<{
        status: string;
        data: PlaybackMarker[];
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/recordings/${interviewId}/markers`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error getting playback markers: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Save custom playback marker
     */
    async savePlaybackMarker(
        userId: string,
        interviewId: string,
        marker: {
            timestamp: number;
            label: string;
            description?: string;
            color?: string;
        }
    ): Promise<{
        status: string;
        data: PlaybackMarker;
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/recordings/${interviewId}/markers`,
            {
                method: 'POST',
                headers: getHeaders(userId),
                body: JSON.stringify(marker),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error saving playback marker: ${response.status}`);
        }
        
        return response.json();
    }

    // ==========================================
    // ENHANCED ANALYTICS
    // ==========================================

    /**
     * Get enhanced filter options with counts
     */
    async getEnhancedFilterOptions(userId: string): Promise<{
        status: string;
        data: {
            roles: { name: string; count: number }[];
            companies: { name: string; count: number }[];
            dateRange: { earliest: string | null; latest: string | null };
            scoreRange: { min: number; max: number };
        };
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/analytics/filters/enhanced`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error getting filter options: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get filtered analytics
     */
    async getFilteredAnalytics(
        userId: string,
        filters: AdvancedFilters
    ): Promise<{
        status: string;
        data: FilteredAnalyticsResult;
    }> {
        const response = await fetch(`${BACKEND_URL}/api/analytics/filtered`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(filters),
        });
        
        if (!response.ok) {
            throw new Error(`Error getting filtered analytics: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Compare two interviews
     */
    async compareInterviews(
        userId: string,
        interview1: string,
        interview2: string
    ): Promise<{
        status: string;
        data: ComparisonResult;
    }> {
        const response = await fetch(
            `${BACKEND_URL}/api/analytics/compare?interview1=${interview1}&interview2=${interview2}`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error comparing interviews: ${response.status}`);
        }
        
        return response.json();
    }

    /**
     * Get interview progression
     */
    async getInterviewProgression(
        userId: string,
        options?: {
            role?: string;
            company?: string;
            limit?: number;
        }
    ): Promise<{
        status: string;
        data: {
            interviews: InterviewSummary[];
            trendLine: { date: string; score: number }[];
            averageImprovement: number;
        };
    }> {
        const params = new URLSearchParams();
        if (options?.role) params.append('role', options.role);
        if (options?.company) params.append('company', options.company);
        if (options?.limit) params.append('limit', options.limit.toString());
        
        const response = await fetch(
            `${BACKEND_URL}/api/analytics/progression?${params.toString()}`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );
        
        if (!response.ok) {
            throw new Error(`Error getting interview progression: ${response.status}`);
        }
        
        return response.json();
    }

    // ==========================================
    // CONSENT MANAGEMENT
    // ==========================================

    /**
     * Get consent requirements (public - no auth required)
     * Returns current versions and URLs for legal documents
     */
    async getConsentRequirements(): Promise<ConsentRequirements> {
        const response = await fetch(`${BACKEND_URL}/api/consent/requirements`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await safeJsonParse<{ ok: boolean; data: ConsentRequirements }>(
            response,
            'getConsentRequirements'
        );

        if (!response.ok || !result.ok) {
            throw new Error('Failed to get consent requirements');
        }

        return result.data;
    }

    /**
     * Get user's consent status (auth required)
     * Returns whether user has required consents and their preferences
     */
    async getConsentStatus(userId: string): Promise<ConsentStatus> {
        const response = await fetch(`${BACKEND_URL}/api/consent/status`, {
            method: 'GET',
            headers: getHeaders(userId),
        });

        const result = await safeJsonParse<{ ok: boolean; data: ConsentStatus }>(
            response,
            'getConsentStatus'
        );

        if (!response.ok || !result.ok) {
            throw new Error('Failed to get consent status');
        }

        return result.data;
    }

    /**
     * Submit user consent (auth required)
     * Creates or updates consent record with audit metadata
     */
    async submitConsent(
        userId: string,
        params: SubmitConsentParams
    ): Promise<ConsentSubmitResult> {
        const response = await fetch(`${BACKEND_URL}/api/consent/submit`, {
            method: 'POST',
            headers: {
                ...getHeaders(userId),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        const result = await safeJsonParse<{ ok: boolean; data: ConsentSubmitResult; error?: string; code?: string }>(
            response,
            'submitConsent'
        );

        if (!response.ok || !result.ok) {
            throw new Error(result.error || 'Failed to submit consent');
        }

        return result.data;
    }

    /**
     * Update marketing preference only (auth required)
     */
    async updateMarketingPreference(
        userId: string,
        marketingOptIn: boolean
    ): Promise<{ success: boolean; marketingOptIn: boolean }> {
        const response = await fetch(`${BACKEND_URL}/api/consent/marketing`, {
            method: 'PATCH',
            headers: {
                ...getHeaders(userId),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ marketingOptIn }),
        });

        const result = await safeJsonParse<{ ok: boolean; data: { success: boolean; marketingOptIn: boolean } }>(
            response,
            'updateMarketingPreference'
        );

        if (!response.ok || !result.ok) {
            throw new Error('Failed to update marketing preference');
        }

        return result.data;
    }

    // ==========================================
    // UNIFIED CANDIDATE DASHBOARD
    // ==========================================

    /**
     * Get candidate dashboard with filtering support (auth required)
     * Single endpoint that returns all dashboard data
     */
    async getCandidateDashboard(
        userId: string,
        filters?: CandidateDashboardFilters,
        forceRefresh = false
    ): Promise<CandidateDashboardResponse> {
        const cacheKey = `Vocaid_dashboard_${userId}_${JSON.stringify(filters || {})}`;

        return getCachedOrFetch(
            cacheKey,
            async () => {
                const query = `
                  query CandidateDashboard($filters: DashboardFiltersInput) {
                    candidateDashboard(filters: $filters) {
                      kpis {
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
                      scoreEvolution {
                        date
                        score
                        roleTitle
                        seniority
                      }
                      recentInterviews {
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
                      skillBreakdown {
                        skill
                        category
                        score
                        maxScore
                        interviewCount
                        trend
                      }
                      weeklyActivity {
                        day
                        date
                        interviews
                        averageScore
                        totalDurationMinutes
                      }
                      filters {
                        startDate
                        endDate
                        roleTitle
                        seniority
                        resumeId
                        weekStart
                        weekEnd
                      }
                    }
                  }
                `;

                const data = await this.graphqlRequest<{ candidateDashboard: CandidateDashboardResponse }>(
                    userId,
                    query,
                    { filters: filters || {} }
                );

                return data.candidateDashboard;
            },
            60000,
            forceRefresh
        );
    }

    /**
     * Download resume file (auth required)
     */
    async downloadResume(
        userId: string,
        resumeId: string
    ): Promise<{ fileName: string; mimeType: string; base64: string }> {
        const response = await fetch(
            `${BACKEND_URL}/api/dashboard/resumes/${resumeId}/download`,
            {
                method: 'GET',
                headers: getHeaders(userId),
            }
        );

        const result = await safeJsonParse<{
            status: string;
            data: { fileName: string; mimeType: string; base64: string };
        }>(response, 'downloadResume');

        if (!response.ok || result.status !== 'success') {
            throw new Error('Failed to download resume');
        }

        return result.data;
    }

    // ==========================================
    // B2C USER PROFILE API
    // ==========================================

    /**
     * Get current user's full profile including B2C status
     */
    async getUserProfile(userId: string): Promise<B2CUserProfile> {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            method: 'GET',
            headers: getHeaders(userId),
        });

        const result = await safeJsonParse<{
            ok: boolean;
            status: string;
            data: B2CUserProfile;
        }>(response, 'getUserProfile');

        if (!response.ok || !result.ok) {
            throw new Error('Failed to fetch user profile');
        }

        return result.data;
    }

    /**
     * Update user profile (country, language, etc.)
     */
    async updateUserProfile(
        userId: string,
        updates: {
            countryCode?: string;
            preferredLanguage?: string;
            role?: string;
            marketingOptIn?: boolean;
        }
    ): Promise<B2CUserProfile> {
        const response = await fetch(`${BACKEND_URL}/api/users/me`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(updates),
        });

        const result = await safeJsonParse<{
            ok: boolean;
            status: string;
            data: B2CUserProfile;
            error?: { code: string; message: string };
        }>(response, 'updateUserProfile');

        if (!response.ok || !result.ok) {
            const errorCode = result.error?.code || 'UPDATE_FAILED';
            const errorMessage = result.error?.message || 'Failed to update profile';
            throw new B2CApiError(errorCode, errorMessage);
        }

        // Invalidate user cache
        invalidateCache(`Vocaid_current_user_${userId}`);

        return result.data;
    }

    /**
     * Get B2C access status (eligibility checks)
     */
    async getB2CStatus(userId: string): Promise<B2CAccessStatus> {
        const response = await fetch(`${BACKEND_URL}/api/users/me/b2c-status`, {
            method: 'GET',
            headers: getHeaders(userId),
        });

        const result = await safeJsonParse<{
            ok: boolean;
            status: string;
            data: B2CAccessStatus;
        }>(response, 'getB2CStatus');

        if (!response.ok || !result.ok) {
            throw new Error('Failed to fetch B2C status');
        }

        return result.data;
    }

    // ==========================================
    // IDENTITY VERIFICATION API
    // ==========================================

    /**
     * Get identity verification status
     */
    async getIdentityStatus(userId: string): Promise<IdentityVerificationStatus> {
        const response = await fetch(`${BACKEND_URL}/api/identity/status`, {
            method: 'GET',
            headers: getHeaders(userId),
        });

        const result = await safeJsonParse<{
            ok: boolean;
            status: string;
            data: IdentityVerificationStatus;
        }>(response, 'getIdentityStatus');

        if (!response.ok || !result.ok) {
            throw new Error('Failed to fetch identity status');
        }

        return result.data;
    }

    /**
     * Record consent for identity verification
     */
    async recordIdentityConsent(
        userId: string,
        params: { termsAccepted: boolean; biometricConsent: boolean }
    ): Promise<{ sessionId: string; status: string; expiresAt: string }> {
        const response = await fetch(`${BACKEND_URL}/api/identity/consent`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(params),
        });

        const result = await safeJsonParse<{
            ok: boolean;
            status: string;
            data: { sessionId: string; status: string; expiresAt: string };
        }>(response, 'recordIdentityConsent');

        if (!response.ok || !result.ok) {
            throw new Error('Failed to record consent');
        }

        return result.data;
    }

    /**
     * Start identity verification session
     */
    async startIdentityVerification(
        userId: string,
        params?: { documentType?: 'RG' | 'CNH' | 'CPF' }
    ): Promise<{ sessionId: string; status: string; nextStep: string }> {
        const response = await fetch(`${BACKEND_URL}/api/identity/start`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(params || {}),
        });

        const result = await safeJsonParse<{
            ok: boolean;
            status: string;
            data: { sessionId: string; status: string; nextStep: string };
        }>(response, 'startIdentityVerification');

        if (!response.ok || !result.ok) {
            throw new Error('Failed to start verification');
        }

        return result.data;
    }

    /**
     * Upload identity documents
     */
    async uploadIdentityDocuments(
        userId: string,
        params: { sessionId: string; selfieBase64: string; documentBase64: string }
    ): Promise<IdentityVerificationResult> {
        const response = await fetch(`${BACKEND_URL}/api/identity/upload`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(params),
        });

        const result = await safeJsonParse<{
            ok: boolean;
            status: string;
            data: IdentityVerificationResult;
        }>(response, 'uploadIdentityDocuments');

        if (!response.ok || !result.ok) {
            throw new Error('Failed to upload documents');
        }

        return result.data;
    }
}

// ==========================================
// B2C API ERROR CLASS
// ==========================================

export class B2CApiError extends Error {
    constructor(public code: string, message: string) {
        super(message);
        this.name = 'B2CApiError';
    }
}

// ==========================================
// B2C TYPES
// ==========================================

export type UserType = 'PERSONAL' | 'CANDIDATE' | 'EMPLOYEE';

export interface B2CUserProfile {
    id: string;
    clerkId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    credits: number;
    userType: UserType;
    countryCode: string | null;
    preferredLanguage: string | null;
    currentRole: string | null;
    currentSeniority: string | null;
    onboardingComplete: boolean;
    createdAt: string;
    updatedAt: string;
    b2cEligible: boolean;
    countrySupported: boolean;
}

export interface B2CAccessStatus {
    b2cEligible: boolean;
    userType: UserType;
    countryCode: string | null;
    countrySupported: boolean;
    needsCountrySelection: boolean;
    onboardingComplete: boolean;
    restrictions: {
        canCreateInterview: boolean;
        canPurchaseCredits: boolean;
        canAccessDashboard: boolean;
    };
}

export interface IdentityVerificationStatus {
    featureEnabled: boolean;
    verification: {
        id?: string;
        status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
        provider?: string;
        documentType?: string;
        verifiedAt?: string;
        failureReason?: string;
        createdAt?: string;
        expiresAt?: string;
    };
    canStartNew: boolean;
}

export interface IdentityVerificationResult {
    sessionId: string;
    status: 'VERIFIED' | 'FAILED';
    verified: boolean;
    confidence: number;
    failureReason?: string;
    verifiedAt?: string;
}

// ==========================================
// CONSENT TYPES
// ==========================================

export interface ConsentRequirements {
    versions: {
        terms: string;
        privacy: string;
        marketing: string;
    };
    urls: {
        termsOfUse: string;
        privacyPolicy: string;
    };
    requirements: {
        termsRequired: boolean;
        privacyRequired: boolean;
        transactionalRequired: boolean;
        marketingOptional: boolean;
    };
}

export interface ConsentStatus {
    hasRequiredConsents: boolean;
    marketingOptIn: boolean;
    transactionalOptIn: boolean;
    versionsAccepted: {
        terms: string | null;
        privacy: string | null;
        marketing: string | null;
    };
    needsReConsent: boolean;
    consentRecordedAt: string | null;
}

export interface SubmitConsentParams {
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    marketingOptIn: boolean;
    source?: 'FORM' | 'OAUTH';
}

export interface ConsentSubmitResult {
    hasRequiredConsents: boolean;
    marketingOptIn: boolean;
    onboardingCompletedAt: string | null;
}

// ==========================================
// TYPES FOR NEW FEATURES
// ==========================================

export interface ResumeListItem {
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

export interface ResumeDocument extends ResumeListItem {
    userId: string;
    mimeType: string;
    base64Data?: string;
    description?: string;
    parsedText?: string;
    parsedMetadata?: any;
    parentVersionId?: string;
    isLatest: boolean;
    isActive: boolean;
}

export interface ResumeVersion {
    id: string;
    version: number;
    createdAt: string;
    fileName: string;
    fileSize: number;
    qualityScore?: number;
}

export interface TranscriptSegment {
    id: string;
    speaker: 'agent' | 'user';
    text: string;
    startTime: number;
    endTime: number;
    confidence?: number;
}

export interface SynchronizedTranscript {
    interviewId: string;
    segments: TranscriptSegment[];
    totalDuration: number;
    speakerBreakdown: {
        agentDuration: number;
        userDuration: number;
        agentWordCount: number;
        userWordCount: number;
    };
}

export interface PlaybackMarker {
    id: string;
    type: 'highlight' | 'improvement' | 'question' | 'answer' | 'pause' | 'custom';
    timestamp: number;
    label: string;
    description?: string;
    color?: string;
}

export interface PlaybackData {
    recording: {
        interviewId: string;
        retellCallId: string;
        audioUrl: string | null;
        audioDuration: number;
        audioFormat: string;
        recordingStatus: 'pending' | 'processing' | 'available' | 'unavailable' | 'expired';
        recordedAt: string;
        expiresAt?: string;
    };
    transcript: SynchronizedTranscript;
    markers: PlaybackMarker[];
}

export interface AdvancedFilters {
    dateRange: {
        preset?: 'today' | 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime' | 'custom';
        startDate?: string;
        endDate?: string;
    };
    roles?: string[];
    companies?: string[];
    scoreRange?: {
        min?: number;
        max?: number;
    };
    sortBy?: 'date' | 'score' | 'duration' | 'company' | 'role';
    sortOrder?: 'asc' | 'desc';
}

export interface FilteredAnalyticsResult {
    interviews: InterviewSummary[];
    summary: {
        totalInterviews: number;
        avgScore: number;
        bestScore: number;
        worstScore: number;
        totalDuration: number;
        scoreImprovement: number;
    };
    charts: {
        scoreTimeSeries: { date: string; value: number; count?: number }[];
        scoresByRole: { role: string; avgScore: number; count: number; trend: number }[];
        scoresByCompany: { company: string; avgScore: number; count: number; trend: number }[];
    };
}

export interface ComparisonResult {
    current: InterviewSummary;
    comparison: InterviewSummary | null;
    differences: {
        overallScore: number;
        duration: number;
        communicationScore?: number;
        technicalScore?: number;
        confidenceScore?: number;
    };
    improvements: string[];
    regressions: string[];
}

// ==========================================
// CANDIDATE DASHBOARD TYPES
// ==========================================

export interface CandidateDashboardFilters {
    startDate?: string;
    endDate?: string;
    roleTitle?: string;
    seniority?: string;
    resumeId?: string;
    limit?: number;
    weekStart?: string; // ISO date for week filter
    weekEnd?: string;   // ISO date for week filter
}

export interface DashboardKPIs {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number | null;
    scoreChange: number | null;
    averageDurationMinutes: number | null;
    totalSpent: number;
    creditsRemaining: number;
    interviewsThisMonth: number;
    passRate: number | null;
}

export interface ScoreEvolutionPoint {
    date: string;
    score: number;
    roleTitle: string;
    seniority: string | null;
}

export interface RecentInterview {
    id: string;
    date: string;
    roleTitle: string;
    companyName: string;
    seniority: string | null;
    resumeTitle: string | null;
    resumeId: string | null;
    durationMinutes: number | null;
    score: number | null;
    status: string;
}

export interface ResumeUtilization {
    id: string;
    title: string;
    fileName: string;
    createdAt: string;
    lastUsedAt: string | null;
    interviewCount: number;
    filteredInterviewCount: number;
    isPrimary: boolean;
    qualityScore: number | null;
}

export interface DashboardFilterOptions {
    roleTitles: string[];
    seniorities: string[];
    resumes: Array<{ id: string; title: string }>;
}

export interface SkillBreakdown {
    skill: string;
    category: string;
    score: number;
    maxScore: number;
    interviewCount: number;
    trend: 'up' | 'down' | 'stable';
}

export interface WeeklyActivityDay {
    day: string;
    date: string;
    interviews: number;
    averageScore: number | null;
    totalDurationMinutes: number;
}

export interface CandidateDashboardResponse {
    kpis: DashboardKPIs;
    scoreEvolution: ScoreEvolutionPoint[];
    recentInterviews: RecentInterview[];
    resumes: ResumeUtilization[];
    filterOptions: DashboardFilterOptions;
    skillBreakdown: SkillBreakdown[];
    weeklyActivity: WeeklyActivityDay[];
    filters: {
        startDate: string | null;
        endDate: string | null;
        roleTitle: string | null;
        seniority: string | null;
        resumeId: string | null;
        weekStart: string | null;
        weekEnd: string | null;
    };
}

const apiService = new APIService();
export default apiService;
