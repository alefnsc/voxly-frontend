import { RetellWebClient } from "retell-client-js-sdk";

// Note: This service still requires backend API for Retell interview functionality
// Backend is NOT needed for: Authentication (Clerk), Credits (Clerk metadata), Payments (MercadoPago)
// Backend IS needed for: Interview calls (Retell API proxy), Feedback generation

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
    job_title: string;
    company_name: string;
    job_description: string;
    interviewee_cv: string;
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

class APIService {
    private retellWebClient: RetellWebClient;

    constructor() {
        this.retellWebClient = new RetellWebClient();
    }

    initialize(eventHandlers: { [key: string]: (...args: any[]) => void }) {
        Object.keys(eventHandlers).forEach(event => {
            this.retellWebClient.on(event, eventHandlers[event]);
        });
    }

    async registerCall(body: MainInterface): Promise<RegisterCallResponse> {
        // Backend endpoint required for Retell API integration
        console.log('📞 Registering call with backend:', {
            candidate: body.metadata.first_name,
            position: body.metadata.job_title,
            backend_url: process.env.REACT_APP_BACKEND_URL,
            userId: body.userId ? '✅ Present' : '❌ Missing'
        });
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/register-call`, {
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
        
        return result;
    }

    async getUserInfo(userId: string): Promise<UserInfoResponse> {
        // Note: This method may be deprecated - user info should come from Clerk
        console.log('🌐 APIService: Making request to getUserInfo for user:', userId);
        console.log('⚠️ Consider using Clerk user data instead of backend API');
        
        const url = `${process.env.REACT_APP_BACKEND_URL}/get-user-info/${userId}`;
        console.log('🌐 APIService: Full URL:', url);
        
        const response = await fetch(url, {
            method: "GET",
            headers: getHeaders(),
        });
        
        console.log('🌐 APIService: Response status:', response.status);
        console.log('🌐 APIService: Response ok:', response.ok);
        
        if (!response.ok) {
            console.error('🌐 APIService: Error response:', response.status, response.statusText);
            throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('🌐 APIService: Response data:', data);
        
        return data;
    }

    async getCall(call_id: string): Promise<Response> {
        // Backend endpoint required for Retell call data
        return await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-call/`+call_id, {
            headers: getHeaders()
        });
    }

    async getFeedback(call_id: string): Promise<Response> {
        // Backend endpoint required for AI-generated interview feedback
        return await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-feedback-for-interview/${call_id}`, 
            {
              method: 'GET',
              headers: getHeaders()
            });
    }

    async restoreCredit(userId: string, reason: string, callId?: string): Promise<{ status: string; newCredits?: number }> {
        // Restore credit when interview is cancelled due to incompatibility
        console.log('💳 Requesting credit restoration:', { userId, reason, callId });
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/restore-credit`, {
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

    async consumeCredit(userId: string, callId?: string): Promise<{ status: string; newCredits?: number }> {
        // Consume credit when interview starts
        console.log('💳 Consuming credit:', { userId, callId });
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/consume-credit`, {
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
}
const apiService =  new APIService();
export default apiService;