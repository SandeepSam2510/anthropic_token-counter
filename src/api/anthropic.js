// Thin client for Anthropic's official Token Counting API.
// Docs: https://docs.anthropic.com/en/docs/build-with-claude/token-counting
//
// Security notes:
// - The API key is passed in per call and never stored, cached or logged here.
// - Requests go directly from the browser to api.anthropic.com over HTTPS.
//   Anthropic requires the `anthropic-dangerous-direct-browser-access` header
//   for browser (CORS) requests. This is acceptable here because each user
//   supplies THEIR OWN key at runtime – nothing is bundled into the app.

const API_URL = 'https://api.anthropic.com/v1/messages/count_tokens';
const API_VERSION = '2023-06-01';
const TIMEOUT_MS = 20000;

/** Error type carrying a user-friendly message and the HTTP status. */
export class TokenCountError extends Error {
  constructor(message, { status = 0, type = 'unknown' } = {}) {
    super(message);
    this.name = 'TokenCountError';
    this.status = status;
    this.type = type;
  }
}

/** Quick client-side sanity check before we hit the network. */
export function validateApiKeyFormat(key) {
  const trimmed = (key || '').trim();
  if (!trimmed) return 'Please enter your Anthropic API key.';
  if (/\s/.test(trimmed)) return 'API key must not contain spaces.';
  if (!trimmed.startsWith('sk-ant-')) {
    return 'That does not look like an Anthropic API key (keys start with "sk-ant-").';
  }
  if (trimmed.length < 30) return 'API key looks too short – please check it.';
  return null;
}

/** Map an HTTP status + API error body to a clear message for the user. */
function friendlyMessage(status, apiMessage) {
  switch (status) {
    case 400:
      return `Bad request: ${apiMessage || 'the request was rejected by the API.'}`;
    case 401:
      return 'Invalid API key. Please check the key and try again.';
    case 403:
      return 'This API key does not have permission to use the token counting API.';
    case 404:
      return `Not found: ${apiMessage || 'the selected model may not exist or is not available to your account.'}`;
    case 413:
      return 'The text is too large to count.';
    case 429:
      return 'Rate limit reached. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'Anthropic API is having trouble right now. Please try again shortly.';
    case 529:
      return 'Anthropic API is overloaded. Please try again shortly.';
    default:
      return apiMessage || `Request failed with status ${status}.`;
  }
}

/**
 * Count tokens for a single piece of text.
 * @returns {Promise<number>} input_tokens reported by the API
 */
export async function countTokens({ apiKey, model, text, signal }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS);
  // Abort if the caller aborts too.
  const onAbort = () => controller.abort('cancelled');
  signal?.addEventListener('abort', onAbort);

  let response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: text }],
      }),
      signal: controller.signal,
      // Never send cookies / never cache.
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason;
      if (reason === 'timeout') {
        throw new TokenCountError('Request timed out. Check your connection and try again.', { type: 'timeout' });
      }
      throw new TokenCountError('Request cancelled.', { type: 'cancelled' });
    }
    throw new TokenCountError(
      'Network error: could not reach the Anthropic API. Check your internet connection.',
      { type: 'network' },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body – handled below.
  }

  if (!response.ok) {
    const apiMessage = data?.error?.message;
    throw new TokenCountError(friendlyMessage(response.status, apiMessage), {
      status: response.status,
      type: data?.error?.type || 'api_error',
    });
  }

  if (typeof data?.input_tokens !== 'number') {
    throw new TokenCountError('Unexpected response from the API (no token count returned).', {
      status: response.status,
      type: 'bad_response',
    });
  }

  return data.input_tokens;
}
