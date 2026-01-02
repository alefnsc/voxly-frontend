/**
 * Device Fingerprint Utility
 * Creates a unique identifier for the device/browser to help prevent signup abuse.
 * 
 * This is a lightweight fingerprinting solution. For more robust protection,
 * consider using FingerprintJS Pro (https://fingerprint.com/).
 */

// Generate a hash from a string
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Collect browser/device characteristics
function collectFingerprint(): string {
  const components: string[] = [];
  
  // Screen properties - use window.screen to avoid ESLint no-restricted-globals
  const screenObj = window.screen;
  components.push(`screen:${screenObj.width}x${screenObj.height}x${screenObj.colorDepth}`);
  components.push(`availScreen:${screenObj.availWidth}x${screenObj.availHeight}`);
  
  // Timezone
  components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  components.push(`tzOffset:${new Date().getTimezoneOffset()}`);
  
  // Language
  components.push(`lang:${navigator.language}`);
  components.push(`langs:${navigator.languages?.join(',') || ''}`);
  
  // Platform
  components.push(`platform:${navigator.platform || ''}`);
  
  // Hardware concurrency (number of CPU cores)
  components.push(`cores:${navigator.hardwareConcurrency || ''}`);
  
  // Device memory (approximate RAM in GB)
  components.push(`memory:${(navigator as any).deviceMemory || ''}`);
  
  // Touch support
  components.push(`touch:${navigator.maxTouchPoints || 0}`);
  
  // User agent
  components.push(`ua:${navigator.userAgent}`);
  
  // Canvas fingerprint (renders text and gets pixel data)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Vocaid FP Test', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Vocaid FP Test', 4, 17);
      components.push(`canvas:${canvas.toDataURL()}`);
    }
  } catch (e) {
    components.push('canvas:error');
  }
  
  // WebGL info
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl && gl instanceof WebGLRenderingContext) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(`webgl:${gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)}|${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`);
      }
    }
  } catch (e) {
    components.push('webgl:error');
  }
  
  // Audio context fingerprint (simplified, without deprecated ScriptProcessorNode)
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Just use basic audio context properties for fingerprinting
    const properties = [
      audioContext.sampleRate,
      audioContext.baseLatency || 0,
      audioContext.state,
    ];
    components.push(`audio:${properties.join('-')}`);
    audioContext.close();
  } catch (e) {
    components.push('audio:error');
  }
  
  return components.join('|||');
}

// Cache the fingerprint in sessionStorage to avoid recalculating
const FINGERPRINT_CACHE_KEY = 'Vocaid_device_fp';

/**
 * Get or generate device fingerprint
 * Returns a hashed string that uniquely identifies this device/browser
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    // Check cache first
    const cached = sessionStorage.getItem(FINGERPRINT_CACHE_KEY);
    if (cached) {
      return cached;
    }
    
    // Collect and hash fingerprint
    const rawFingerprint = collectFingerprint();
    const hashedFingerprint = await hashString(rawFingerprint);
    
    // Cache it
    sessionStorage.setItem(FINGERPRINT_CACHE_KEY, hashedFingerprint);
    
    console.log('🔏 Device fingerprint generated');
    return hashedFingerprint;
  } catch (error) {
    console.warn('⚠️ Failed to generate device fingerprint:', error);
    // Return a fallback based on timestamp + random (won't be reliable for abuse detection)
    return `fallback-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Clear cached fingerprint (useful for testing)
 */
export function clearFingerprintCache(): void {
  sessionStorage.removeItem(FINGERPRINT_CACHE_KEY);
}
