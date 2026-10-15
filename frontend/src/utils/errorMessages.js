/**
 * Friendly error messages mapping error codes from PRD Section 6.0
 */
const ERROR_MESSAGES = {
  NO_FILE: 'Please choose a JPEG photo to analyze.',
  INVALID_TOKEN: 'This analysis session is invalid or has ended.',
  FILE_TOO_LARGE: 'That photo is larger than 10 MB. Please choose a smaller JPEG.',
  IMAGE_TOO_LARGE: 'That image resolution exceeds 50 megapixels. Please choose a smaller photo.',
  INVALID_SIGNATURE: 'The selected file is not a valid JPEG image.',
  UNSUPPORTED_TYPE: 'Only JPEG images (.jpg, .jpeg) are supported.',
  CORRUPT_IMAGE: 'The photo file is corrupted and cannot be decoded.',
  TRUNCATED_JPEG: 'The photo file appears incomplete or truncated.',
  MALFORMED_STRUCTURE: 'The JPEG structure contains corrupted marker segments.',
  TOKEN_NOT_FOUND: 'This photo session has expired or was already downloaded.',
  TOKEN_EXPIRED: 'This photo has expired (10-minute privacy limit) and was purged.',
  NOT_ANALYZED: 'Please wait for the image analysis to finish before cleaning.',
  NOT_VERIFIED: 'This photo could not be verified yet. Please try again.',
  VERIFICATION_FAILED: "We couldn't confirm all hidden data was removed. No download was created.",
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  SERVER_BUSY: 'Server is currently at capacity. Please try again in a few moments.',
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
};

export function getFriendlyErrorMessage(code, fallback = 'An unexpected error occurred.') {
  return ERROR_MESSAGES[code] || fallback;
}
