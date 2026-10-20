const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Custom error class matching server JSON error envelope per PRD Section 6.0.
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

/**
 * POST /api/analyze
 * Real multipart/form-data upload to backend analyze endpoint.
 */
export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  return request('/api/analyze', {
    method: 'POST',
    body: formData,
  });
}

/**
 * POST /api/clean
 * Strips metadata and verifies sanitized image.
 */
export async function cleanImage(token) {
  if (!token) throw new ApiError('INVALID_TOKEN', 'Token is required to clean metadata', 400);
  return request('/api/clean', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });
}

/**
 * Get direct download URL for sanitized image.
 */
export function getDownloadUrl(token) {
  return `${API_BASE}/api/download/${token}`;
}

/**
 * Get metadata-free preview URL.
 */
export function getPreviewUrl(token, which = 'original') {
  return `${API_BASE}/api/preview/${token}/${which}`;
}

/**
 * GET /api/session/:token
 */
export async function getSession(token) {
  if (!token) return null;
  return request(`/api/session/${token}`);
}

/**
 * DELETE /api/session/:token
 * Explicit cleanup of session files.
 */
export async function deleteSession(token) {
  if (!token) return;
  try {
    return await request(`/api/session/${token}`, {
      method: 'DELETE',
    });
  } catch {
    // Best-effort cleanup, ignore failures
  }
}

