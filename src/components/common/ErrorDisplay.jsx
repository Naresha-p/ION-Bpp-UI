/**
 * ErrorDisplay — reusable error UI components
 *
 * Exports:
 *   <ErrorBanner>   inline banner (inside a card / section)
 *   <ErrorPage>     full-page empty state
 *   <Toast>         bottom-right action feedback toast
 */

import React from 'react'
import { AlertCircle, WifiOff, Clock, ShieldOff, Lock, SearchX, ServerCrash, RefreshCw, X, CheckCircle2 } from 'lucide-react'
import { ERR, getErrStyle } from '../../utils/apiError'

// ─── Icon per error type ──────────────────────────────────────────────────────

const ERR_ICON = {
  [ERR.NETWORK]:      WifiOff,
  [ERR.TIMEOUT]:      Clock,
  [ERR.UNAUTHORIZED]: Lock,
  [ERR.FORBIDDEN]:    ShieldOff,
  [ERR.NOT_FOUND]:    SearchX,
  [ERR.VALIDATION]:   AlertCircle,
  [ERR.SERVER]:       ServerCrash,
  [ERR.UNKNOWN]:      AlertCircle,
}

const ERR_TITLE = {
  [ERR.NETWORK]:      'Connection Error',
  [ERR.TIMEOUT]:      'Request Timed Out',
  [ERR.UNAUTHORIZED]: 'Session Expired',
  [ERR.FORBIDDEN]:    'Access Denied',
  [ERR.NOT_FOUND]:    'Not Found',
  [ERR.VALIDATION]:   'Invalid Data',
  [ERR.SERVER]:       'Server Error',
  [ERR.UNKNOWN]:      'Something Went Wrong',
}

const getIcon  = (err) => ERR_ICON[err?.type]  || AlertCircle
const getTitle = (err) => ERR_TITLE[err?.type] || 'Error'

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
/**
 * Compact inline banner — use inside cards or sections.
 *
 * Props:
 *   error        ApiError | Error | string | null
 *   onRetry      () => void   optional retry callback
 *   onDismiss    () => void   optional dismiss callback
 *   className    string       extra wrapper classes
 */
export function ErrorBanner({ error, onRetry, onDismiss, className = '' }) {
  if (!error) return null

  const style  = getErrStyle(error)
  const Icon   = getIcon(error)
  const title  = getTitle(error)
  const msg    = typeof error === 'string' ? error : error.message

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3
      ${style.bg} ${style.border} ${className}`}>
      <Icon size={16} className={`flex-shrink-0 mt-0.5 ${style.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${style.text}`}>{title}</p>
        <p className={`text-xs mt-0.5 ${style.text} opacity-80`}>{msg}</p>
        {error?.status && (
          <p className="text-[10px] font-mono opacity-50 mt-0.5">
            HTTP {error.status}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5
              rounded-lg border transition-colors ${style.border} ${style.text}
              hover:opacity-80`}>
            <RefreshCw size={11} /> Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`p-1 rounded-lg hover:opacity-70 transition-opacity ${style.text}`}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── ErrorPage ────────────────────────────────────────────────────────────────
/**
 * Full-section empty state for when an entire list/page fails to load.
 *
 * Props:
 *   error        ApiError | Error | string
 *   onRetry      () => void   optional
 *   compact      bool         smaller padding (default false)
 */
export function ErrorPage({ error, onRetry, compact = false }) {
  if (!error) return null

  const style  = getErrStyle(error)
  const Icon   = getIcon(error)
  const title  = getTitle(error)
  const msg    = typeof error === 'string' ? error : error.message

  return (
    <div className={`flex flex-col items-center justify-center text-center
      ${compact ? 'py-12 px-4' : 'py-20 px-6'}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4
        ${style.bg} border ${style.border}`}>
        <Icon size={28} className={style.icon} />
      </div>
      <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-1)' }}>{title}</h3>
      <p className="text-sm max-w-sm" style={{ color: 'var(--text-2)' }}>{msg}</p>
      {error?.status && (
        <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-3)' }}>HTTP {error?.status}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 beckn-btn-secondary text-sm">
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
/**
 * Bottom-right action feedback toast.
 *
 * Props:
 *   toast   { message: string, type: 'success' | 'error' | 'info' } | null
 */
export function Toast({ toast }) {
  if (!toast) return null

  const isSuccess = toast.type === 'success'

  return (
    <div className={isSuccess ? 'toast-success' : 'toast-error'}>
      {isSuccess
        ? <CheckCircle2 size={15} style={{ color: '#86efac', flexShrink: 0 }} />
        : <AlertCircle  size={15} style={{ color: '#fda4af', flexShrink: 0 }} />}
      <span>{toast.message}</span>
    </div>
  )
}
