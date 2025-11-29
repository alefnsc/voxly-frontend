// Mercado Pago Payment Service - Serverless Architecture
// Documentation: https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/sdk-js-react-installation
// Note: This is a client-side only implementation. In production, payment processing
// should be handled through secure serverless functions (e.g., Vercel Functions, AWS Lambda)

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceUSD: number;      // Display price in USD
  priceBRL: number;      // Payment price in BRL (for MercadoPago)
  description: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'professional',
    name: 'Professional',
    credits: 15,
    priceUSD: 7.99,       // Display in USD
    priceBRL: 47.94,      // ~7.99 * 6.0 BRL for MercadoPago
    description: 'Ideal for regular practice',
    features: [
      '15 interview sessions',
      'Detailed feedback',
      'Performance analysis',
      'Resume upload',
      'Priority support',
    ],
    popular: true,
    savings: 'Save 17%'
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    credits: 10,
    priceUSD: 5.99,       // Display in USD
    priceBRL: 35.94,      // ~5.99 * 6.0 BRL for MercadoPago
    description: 'Great for focused preparation',
    features: [
      '10 interview sessions',
      'Detailed feedback',
      'Performance analysis',
      'Resume upload',
    ],
    savings: 'Save 10%'
  },
  {
    id: 'starter',
    name: 'Starter',
    credits: 5,
    priceUSD: 3.99,       // Display in USD
    priceBRL: 23.94,      // ~3.99 * 6.0 BRL for MercadoPago
    description: 'Perfect to get started',
    features: [
      '5 interview sessions',
      'Detailed feedback',
      'Performance analysis',
      'Resume upload',
    ],
  },
];

export interface PreferenceResponse {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint: string;
}

class MercadoPagoService {
  private publicKey: string;
  private backendUrl: string;

  constructor() {
    this.publicKey = process.env.REACT_APP_MERCADOPAGO_PUBLIC_KEY || '';
    this.backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
  }

  /**
   * Get Mercado Pago public key for SDK initialization
   */
  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Create a payment preference using Mercado Pago API via backend
   * Returns the preference ID for use with the Wallet component
   */
  async createPreference(packageId: string, userId: string, userEmail: string): Promise<string> {
    try {
      const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      if (!selectedPackage) {
        throw new Error('Invalid package selected');
      }

      console.log('💳 Creating payment preference:', {
        packageId,
        userId,
        package: selectedPackage.name,
        priceUSD: `$${selectedPackage.priceUSD.toFixed(2)}`,
        priceBRL: `R$ ${selectedPackage.priceBRL.toFixed(2)}`
      });

      const response = await fetch(`${this.backendUrl}/create-payment-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          packageId,
          userId,
          userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Payment preference creation failed:', response.status, errorData);
        throw new Error(errorData.message || `Failed to create preference: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.preference) {
        console.log('✅ Payment preference created:', data.preference.preferenceId);
        // Return the preference ID for the Wallet component
        return data.preference.preferenceId;
      }

      throw new Error('Invalid response from payment service');
    } catch (error) {
      console.error('❌ Error creating preference:', error);
      throw error;
    }
  }

  /**
   * Get payment redirect URL and preference ID (for manual redirect flow)
   */
  async getPaymentUrl(packageId: string, userId: string, userEmail: string): Promise<string> {
    try {
      const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      if (!selectedPackage) {
        throw new Error('Invalid package selected');
      }

      const response = await fetch(`${this.backendUrl}/create-payment-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          packageId,
          userId,
          userEmail
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create preference: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.preference) {
        // Store preference ID for polling
        this.lastPreferenceId = data.preference.preferenceId;
        // Always use init_point - with test credentials, this is the correct URL for testing
        // sandbox_init_point is deprecated and may cause issues
        return data.preference.initPoint;
      }

      throw new Error('Failed to get payment URL');
    } catch (error) {
      console.error('Error getting payment URL:', error);
      throw error;
    }
  }

  /**
   * Get the last created preference ID
   */
  getLastPreferenceId(): string | null {
    return this.lastPreferenceId;
  }

  // Store for last preference ID
  private lastPreferenceId: string | null = null;

  /**
   * Verify payment status (called after payment completion)
   * Note: Payment verification is handled automatically via webhook on backend
   */
  async verifyPayment(paymentId: string): Promise<boolean> {
    try {
      console.log('🔍 Payment verification handled automatically via backend webhook');
      // Payment verification is handled automatically by the backend
      // via Mercado Pago webhooks. When payment is approved, credits
      // are automatically added to the user's Clerk metadata.
      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }
}

const mercadoPagoService = new MercadoPagoService();
export default mercadoPagoService;
