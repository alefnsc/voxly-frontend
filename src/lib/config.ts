/**
 * Environment Configuration
 * 
 * Handles environment-based configuration switching for:
 * - Backend API URL
 * - MercadoPago Public Key
 * 
 * Usage:
 *   import { config } from 'lib/config';
 *   const apiUrl = config.backendUrl;
 *   const mpKey = config.mercadoPagoPublicKey;
 */

// Determine if we're in production mode
const isProduction = process.env.REACT_APP_ENV === 'production';

/**
 * Get the appropriate backend URL based on environment
 */
function getBackendUrl(): string {
  if (isProduction) {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  }
  // Development: prefer DEV URL, fallback to main URL
  return process.env.REACT_APP_BACKEND_URL_DEV || 
         process.env.REACT_APP_BACKEND_URL || 
         'http://localhost:3001';
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
 * Application configuration object
 */
export const config = {
  // Environment
  env: process.env.REACT_APP_ENV || 'development',
  isProduction,
  isDevelopment: !isProduction,

  // Backend API
  backendUrl: getBackendUrl(),

  // MercadoPago
  mercadoPagoPublicKey: getMercadoPagoPublicKey(),

  // Clerk
  clerkPublishableKey: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || '',

  // reCAPTCHA
  recaptchaSiteKey: process.env.REACT_APP_RECAPTCHA_SITE_KEY || '',

  // Interview duration thresholds (in milliseconds)
  minInterviewDurationMs: parseInt(process.env.REACT_APP_MIN_INTERVIEW_DURATION_MS || '45000', 10),
  creditRestorationThresholdMs: parseInt(process.env.REACT_APP_CREDIT_RESTORATION_THRESHOLD_MS || '15000', 10),
} as const;

// Log configuration in development (but hide sensitive parts)
if (!isProduction) {
  console.log('🔧 App Configuration:', {
    env: config.env,
    isProduction: config.isProduction,
    backendUrl: config.backendUrl,
    mercadoPagoKey: config.mercadoPagoPublicKey ? `${config.mercadoPagoPublicKey.slice(0, 20)}...` : 'NOT SET',
  });
}

export default config;
