const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Custom error class matching server JSON error envelope.
 */
export class ApiError extends Error {
  constructor(code, message, status, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Centralized fetch helper that parses JSON responses and envelopes.
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorPayload = data?.error || {};
    throw new ApiError(
      errorPayload.code || 'UNKNOWN_ERROR',
      errorPayload.message || `Request failed with status ${response.status}`,
      response.status,
      errorPayload.details
    );
  }

  return data;
}

/**
 * GET /api/health
 */
export async function getHealth() {
  return request('/api/health');
}
