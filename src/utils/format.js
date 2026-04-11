/**
 * Shared formatting utilities
 * Currency: Indonesian Rupiah (IDR, Rp)
 * Locale:   id-ID  (Bahasa Indonesia)
 */

const LOCALE   = 'id-ID'
const CURRENCY = 'IDR'

/** Format a number as IDR — e.g. Rp 85.000 */
export const formatIDR = (n) =>
  new Intl.NumberFormat(LOCALE, {
    style:                'currency',
    currency:             CURRENCY,
    maximumFractionDigits: 0,
  }).format(n ?? 0)

/** Format a bare number with thousand separators — e.g. 85.000 */
export const formatNumber = (n) =>
  new Intl.NumberFormat(LOCALE).format(n ?? 0)

/** Format an ISO date string — e.g. 11 Apr 2026 */
export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(LOCALE, { dateStyle: 'medium' }) : '—'

/** Format an ISO datetime string — e.g. 11 Apr 2026, 14.30 */
export const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' }) : '—'

/** Format a raw amount with its currency code using id-ID locale */
export const formatCurrency = (amount, currency = CURRENCY) => {
  if (amount == null) return '—'
  try {
    return new Intl.NumberFormat(LOCALE, {
      style:                'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    // Fallback for unknown currency codes
    return `${currency} ${formatNumber(amount)}`
  }
}
