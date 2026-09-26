import { db } from './storage';
import { WebhookConfig, WebhookDeliveryLog } from '../types';

/**
 * Computes a HMAC-SHA256 hex signature using the Web Crypto API
 * to allow CI/CD pipelines to securely verify the webhook payload authenticity.
 */
async function computeHMACSignature(secret: string, message: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('Error calculating HMAC signature:', err);
    return 'signature-calculation-failed';
  }
}

/**
 * Dispatches active webhooks registered for a project upon events such as secret mutations.
 * Also logs deliveries with real execution states to the database for debugging.
 */
export async function dispatchWebhooks(
  projectId: string,
  event: 'secret.created' | 'secret.updated' | 'secret.deleted' | 'secret.reverted',
  payloadDetails: {
    environment_name: string;
    environment_id: string;
    actor_email: string;
    actor_name: string;
    impacted_keys: string[];
    notes?: string;
  }
): Promise<void> {
  const webhooks = db.getWebhooks(projectId).filter((w) => w.active && w.events.includes(event));
  if (webhooks.length === 0) return;

  const project = db.getProject(projectId);
  const projectName = project ? project.name : 'Unknown Project';

  const basePayload = {
    event,
    id: 'evt_' + Math.random().toString(36).substring(2, 11),
    timestamp: new Date().toISOString(),
    project: {
      id: projectId,
      name: projectName,
    },
    environment: {
      id: payloadDetails.environment_id,
      name: payloadDetails.environment_name,
    },
    actor: {
      name: payloadDetails.actor_name,
      email: payloadDetails.actor_email,
    },
    impacted_keys: payloadDetails.impacted_keys,
    notes: payloadDetails.notes || '',
  };

  const payloadString = JSON.stringify(basePayload, null, 2);

  for (const webhook of webhooks) {
    const startTime = performance.now();
    let statusCode: number | null = null;
    let success = false;
    let responseBody = '';
    let signature = '';

    if (webhook.secret_token) {
      signature = await computeHMACSignature(webhook.secret_token, payloadString);
    } else {
      signature = 'unsigned-no-secret-token';
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Envault-Event': event,
      'X-Envault-Signature': `sha256=${signature}`,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      statusCode = response.status;
      success = response.ok;
      responseBody = await response.text();

      // Truncate response body if it's too long
      if (responseBody.length > 2000) {
        responseBody = responseBody.substring(0, 2000) + '\n... [Response Truncated]';
      }
    } catch (err: any) {
      success = false;
      if (err.name === 'AbortError') {
        statusCode = 408;
        responseBody = 'Request Timeout (6000ms limit exceeded).';
      } else {
        statusCode = null; // Represents network / CORS error
        responseBody = `Connection Error: ${err.message || 'CORS blocker or destination unreachable'}.\n` +
          `Note: Since Envault runs on client-side zero-knowledge architecture, webhooks are fired directly ` +
          `from your browser. Ensure the webhook destination supports CORS requests or accepts external origins.`;
      }
    } finally {
      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      db.addWebhookDeliveryLog({
        webhook_id: webhook.id,
        project_id: projectId,
        event,
        url: webhook.url,
        status_code: statusCode,
        success,
        duration_ms: durationMs,
        request_payload: payloadString,
        request_headers: headers,
        response_body: responseBody,
      });
    }
  }
}
