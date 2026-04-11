/**
 * API error utilities
 * Classifies HTTP / network errors into user-friendly types and messages.
 */

// ─── Error types ──────────────────────────────────────────────────────────────

export const ERR = {
  NETWORK:      'NETWORK',
  TIMEOUT:      'TIMEOUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN:    'FORBIDDEN',
  NOT_FOUND:    'NOT_FOUND',
  VALIDATION:   'VALIDATION',
  SERVER:       'SERVER',
  UNKNOWN:      'UNKNOWN',
}

// ─── Custom error class ───────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message, type = ERR.UNKNOWN, status = null, detail = null) {
    super(message)
    this.name    = 'ApiError'
    this.type    = type
    this.status  = status   // HTTP status code, or null for network errors
    this.detail  = detail   // raw server message for debugging
  }
}

// ─── Classifier ───────────────────────────────────────────────────────────────

/**
 * Turns an axios error into an ApiError with a user-friendly message.
 * Call this inside axios interceptors or catch blocks.
 */
export function classifyError(err) {
  // Already classified
  if (err instanceof ApiError) return err

  const status  = err.response?.status ?? null
  const raw     = err.response?.data?.message
               || err.response?.data?.error
               || err.response?.data?.detail
               || null

  // ── Network / timeout ──────────────────────────────────────────────────────
  if (!err.response) {
    if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
      return new ApiError(
        'Request timed out. The server is taking too long to respond.',
        ERR.TIMEOUT, null, err.message
      )
    }
    return new ApiError(
      'Unable to connect. Check your internet connection and try again.',
      ERR.NETWORK, null, err.message
    )
  }

  // ── HTTP status codes ──────────────────────────────────────────────────────
  switch (status) {
    case 400:
      return new ApiError(
        raw || 'Bad request. Please check the submitted data.',
        ERR.VALIDATION, status, raw
      )
    case 401:
      return new ApiError(
        'Your session has expired. Please log in again.',
        ERR.UNAUTHORIZED, status, raw
      )
    case 403:
      return new ApiError(
        'You don\'t have permission to perform this action.',
        ERR.FORBIDDEN, status, raw
      )
    case 404:
      return new ApiError(
        raw || 'The requested item was not found.',
        ERR.NOT_FOUND, status, raw
      )
    case 422:
      return new ApiError(
        raw || 'Validation failed. Please check your input.',
        ERR.VALIDATION, status, raw
      )
    default:
      if (status >= 500) {
        return new ApiError(
          'Server error. Please try again in a moment.',
          ERR.SERVER, status, raw
        )
      }
      return new ApiError(
        raw || `Unexpected error (${status}).`,
        ERR.UNKNOWN, status, raw
      )
  }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

/** Maps error type → tailwind color tokens used by ErrorDisplay */
export const ERR_STYLE = {
  [ERR.NETWORK]:      { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  icon: 'text-amber-500'  },
  [ERR.TIMEOUT]:      { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-800',  icon: 'text-amber-500'  },
  [ERR.UNAUTHORIZED]: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    icon: 'text-red-500'    },
  [ERR.FORBIDDEN]:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    icon: 'text-red-500'    },
  [ERR.NOT_FOUND]:    { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700',   icon: 'text-gray-400'   },
  [ERR.VALIDATION]:   { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-500' },
  [ERR.SERVER]:       { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    icon: 'text-red-500'    },
  [ERR.UNKNOWN]:      { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    icon: 'text-red-500'    },
}

export const getErrStyle = (err) =>
  ERR_STYLE[(err instanceof ApiError ? err.type : null)] || ERR_STYLE[ERR.UNKNOWN]
