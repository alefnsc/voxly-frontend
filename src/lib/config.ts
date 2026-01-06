/**
 * Environment Configuration
 * 
 * Single source of truth for all frontend environment variables.
 * Handles environment-based configuration switching for:
 * - Backend API URL
 * - MercadoPago Public Key
 * - PayPal Client ID
 * - Feature flags
 * 
 * Usage:
 *   import { config } from 'lib/config';
 *   const apiUrl = config.backendUrl;
 *   const mpKey = config.mercadoPagoPublicKey;
 * 
 * @module lib/config
 */

// ========================================
// ENVIRONMENT DETECTION
// ========================================

type AppEnv = 'development' | 'staging' | 'production';

const appEnv = (process.env.REACT_APP_ENV || 'development') as AppEnv;
const isProduction = appEnv === 'production';
const isStaging = appEnv === 'staging';
const isDevelopment = appEnv === 'development';

// ========================================
// URL RESOLVERS
// ========================================

/**
 * Get the appropriate backend URL based on environment
 * 
 * Priority in development:
 * 1. REACT_APP_BACKEND_URL_DEV (if set and not ngrok, or ngrok explicitly intended)
 * 2. REACT_APP_BACKEND_URL (if explicitly local)
 * 3. Default: http://localhost:3001 (safest for local dev)
 */
function getBackendUrl(): string {
  if (isProduction) {
    return process.env.REACT_APP_BACKEND_URL || 'https://vocaid-backend.azurewebsites.net';
  }
  if (isStaging) {
    return process.env.REACT_APP_BACKEND_URL_STAGING || 
           process.env.REACT_APP_BACKEND_URL || 
           'http://localhost:3001';
  }
  
  // Development: prefer DEV URL, fallback to main URL, then localhost
  const configuredDevUrl = process.env.REACT_APP_BACKEND_URL_DEV || process.env.REACT_APP_BACKEND_URL;
  const localhostUrl = 'http://localhost:3001';

  if (!configuredDevUrl) {
    return localhostUrl;
  }

  const isNgrokUrl = configuredDevUrl.includes('ngrok') || configuredDevUrl.includes('ngrok-free.app');
  const allowNgrok = (process.env.REACT_APP_ALLOW_NGROK || '').toLowerCase() === 'true';

  // Using ngrok for the backend in dev often breaks cookie-based auth (SameSite), so require an explicit opt-in.
  if (isNgrokUrl && !allowNgrok) {
    console.warn(
      '⚠️ BACKEND_URL is set to an ngrok tunnel, which commonly breaks cookie-based auth:', configuredDevUrl,
      '\n   Falling back to http://localhost:3001 for local development.',
      '\n   If you *intentionally* want ngrok, set REACT_APP_ALLOW_NGROK=true'
    );
    return localhostUrl;
  }

  if (isNgrokUrl) {
    console.warn(
      '⚠️ BACKEND_URL is using ngrok tunnel:', configuredDevUrl,
      '\n   If /api/auth/me returns 401, this is likely due to SameSite cookie restrictions across domains.'
    );
  }

  return configuredDevUrl;
}

/**
 * Get the appropriate MercadoPago public key based on environment
 */
function getMercadoPagoPublicKey(): string {
  if (isProduction) {
    return process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY || '';
  }
  // Development: prefer TEST key, fallback to main key
  return process.env.REACT_APP_MERCADOPAGO_TEST_PUBLIC_KEY || 
         process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY || 
         '';
}

/**
 * Get the appropriate PayPal client ID based on environment
 */
function getPayPalClientId(): string {
  if (isProduction) {
    return process.env.REACT_APP_PAYPAL_CLIENT_ID || '';
  }
  // Development: prefer SANDBOX key, fallback to main key
  return process.env.REACT_APP_PAYPAL_SANDBOX_CLIENT_ID || 
         process.env.REACT_APP_PAYPAL_CLIENT_ID || 
         '';
}

/**
 * Application configuration object
 */
export const config = {
  // Environment
  appEnv,
  env: appEnv, // alias for compatibility
  isProduction,
  isStaging,
  isDevelopment,

  // Backend API
  backendUrl: getBackendUrl(),

  // MercadoPago
  mercadoPagoPublicKey: getMercadoPagoPublicKey(),

  // PayPal
  paypalClientId: getPayPalClientId(),

  // reCAPTCHA
  recaptchaSiteKey: process.env.REACT_APP_RECAPTCHA_SITE_KEY || '',

  // Interview duration thresholds (in milliseconds)
  minInterviewDurationMs: parseInt(process.env.REACT_APP_MIN_INTERVIEW_DURATION_MS || '30000', 10),
  creditRestorationThresholdMs: parseInt(process.env.REACT_APP_CREDIT_RESTORATION_THRESHOLD_MS || '30000', 10),
  
  // Feature flags
  useMockData: process.env.REACT_APP_USE_MOCK_DATA === 'true',
  closedBetaFeedback: process.env.REACT_APP_CLOSED_BETA_FEEDBACK === 'true',
  
  // App version
  version: process.env.REACT_APP_VERSION || '0.0.0',
} as const;

// ========================================
// DIAGNOSTICS (DEV ONLY)
// ========================================

// Log configuration in development (but hide sensitive parts)
if (isDevelopment) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🔧 FRONTEND ENVIRONMENT DIAGNOSTICS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  APP_ENV:          ${config.appEnv}`);
  console.log(`  BACKEND_URL:      ${config.backendUrl}`);
  console.log(`  MOCK_DATA:        ${config.useMockData}`);
  console.log(`  VERSION:          ${config.version}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
}

export default config;
