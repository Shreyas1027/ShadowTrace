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

/**
 * Mock analysis response strictly conforming to PRD Section 6.2
 * Used during Milestone 2/3 prior to backend analyze endpoint activation.
 */
function generateMockAnalysis(file) {
  const token = 'tok_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const now = new Date();
  const expires = new Date(now.getTime() + 10 * 60 * 1000);

  return {
    ok: true,
    token,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    ttl_seconds: 600,
    file: {
      name: file.name,
      size_bytes: file.size,
      width: 4032,
      height: 3024,
      megapixels: 12.19,
      format: 'JPEG',
    },
    risk: {
      level: 'high',
      score: 100,
      flags: {
        gps: true,
        timestamp: true,
        device: true,
        serial: false,
        software: true,
        thumbnail: true,
        author: false,
        comment: false,
        technical_only: false,
      },
      reasons: [
        {
          code: 'GPS_PRESENT',
          severity: 'high',
          title: 'Exact location found',
          plain_text: 'This photo contains the exact GPS location where it was taken (47.620422, -122.349358). Anyone who receives the original file could find this place.',
        },
        {
          code: 'TIMESTAMP_PRESENT',
          severity: 'medium',
          title: 'Date and time found',
          plain_text: 'The photo records when it was taken (2026-10-12 18:41:07), which can reveal your daily routines.',
        },
        {
          code: 'DEVICE_ID_PRESENT',
          severity: 'medium',
          title: 'Device identified',
          plain_text: 'The camera make and model (Apple iPhone 15 Pro) are embedded in this image.',
        },
      ],
    },
    metadata: {
      location: [
        { tag: 'GPSLatitude', label: 'Latitude', value: '47.620422', raw: '47 deg 37\' 13.52" N', source: 'exif', risk: 'high' },
        { tag: 'GPSLongitude', label: 'Longitude', value: '-122.349358', raw: '122 deg 20\' 57.69" W', source: 'exif', risk: 'high' },
        { tag: 'GPSAltitude', label: 'Altitude', value: '56.4 m', raw: '5640/100', source: 'exif', risk: 'high' },
      ],
      capture: [
        { tag: 'DateTimeOriginal', label: 'Taken on', value: '2026-10-12 18:41:07', source: 'exif', risk: 'medium' },
        { tag: 'ExposureTime', label: 'Shutter speed', value: '1/120 s', source: 'exif', risk: 'low' },
        { tag: 'FNumber', label: 'Aperture', value: 'f/1.8', source: 'exif', risk: 'low' },
        { tag: 'ISOSpeedRatings', label: 'ISO', value: '64', source: 'exif', risk: 'low' },
      ],
      device: [
        { tag: 'Make', label: 'Camera make', value: 'Apple', source: 'exif', risk: 'medium' },
        { tag: 'Model', label: 'Camera model', value: 'iPhone 15 Pro', source: 'exif', risk: 'medium' },
        { tag: 'Software', label: 'Software', value: '17.5.1', source: 'exif', risk: 'medium' },
      ],
      image: [
        { tag: 'ImageWidth', label: 'Width', value: '4032 px', source: 'file', risk: 'none' },
        { tag: 'ImageLength', label: 'Height', value: '3024 px', source: 'file', risk: 'none' },
        { tag: 'Orientation', label: 'Orientation', value: '6 (Rotate 90° CW)', source: 'exif', risk: 'none' },
        { tag: 'ICCProfile', label: 'Colour profile', value: 'Display P3', source: 'icc', risk: 'none' },
      ],
    },
    gps: {
      present: true,
      valid: true,
      latitude: 47.620422,
      longitude: -122.349358,
      altitude_m: 56.4,
    },
    segments: [
      { marker: 'APP0', name: 'JFIF', offset: 2, length: 16, removable: false },
      { marker: 'APP1', name: 'EXIF', offset: 20, length: 12544, removable: true },
      { marker: 'APP1', name: 'XMP', offset: 12566, length: 2310, removable: true },
      { marker: 'APP2', name: 'ICC_PROFILE', offset: 14878, length: 3144, removable: false },
      { marker: 'COM', name: 'Comment', offset: 18024, length: 0, removable: true },
    ],
    orientation: { value: 6, requires_reencode: true },
    thumbnail: { present: true, size_bytes: 8120, width: 160, height: 120 },
    warnings: [],
  };
}

/**
 * POST /api/analyze
 * Uploads JPEG image for analysis. Falls back gracefully to mock analysis if backend route is not yet deployed.
 */
export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  try {
    return await request('/api/analyze', {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    // If backend route is not yet implemented (HTTP 404/501) or proxy fails in dev milestone
    if (err.status === 404 || err.status === 501 || err.code === 'UNKNOWN_ERROR') {
      // Simulate realistic network latency (500ms) for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 600));
      return generateMockAnalysis(file);
    }
    throw err;
  }
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
