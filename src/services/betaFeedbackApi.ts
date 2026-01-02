/**
 * Beta Feedback API Service
 * 
 * Handles communication with the backend for beta feedback submissions.
 */

import { config } from 'lib/config';
import { BetaFeedbackRequest, BetaFeedbackResponse } from 'types/betaFeedback';

const BETA_FEEDBACK_ENDPOINT = `${config.backendUrl}/api/feedback/beta`;

/**
 * Submit beta feedback (bug report or feature suggestion)
 */
export async function submitBetaFeedback(
  payload: BetaFeedbackRequest
): Promise<BetaFeedbackResponse> {
  try {
    const response = await fetch(BETA_FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      return {
        ok: true,
        refId: data.refId,
        message: data.message,
      };
    }

    return {
      ok: false,
      refId: payload.refId,
      error: data.error || 'Failed to submit feedback',
    };
  } catch (error) {
    console.error('Beta feedback submission error:', error);
    return {
      ok: false,
      refId: payload.refId,
      error: 'Network error. Please check your connection and try again.',
    };
  }
}

/**
 * Check if beta feedback is enabled on the server
 */
export async function checkBetaFeedbackStatus(): Promise<{
  enabled: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${BETA_FEEDBACK_ENDPOINT}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { enabled: data.enabled };
    }

    return { enabled: false, error: 'Failed to check status' };
  } catch (error) {
    console.error('Beta feedback status check error:', error);
    return { enabled: false, error: 'Network error' };
  }
}

const betaFeedbackApi = {
  submitBetaFeedback,
  checkBetaFeedbackStatus,
};

export default betaFeedbackApi;
