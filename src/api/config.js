/**
 * Centralized API configuration
 * All environment variables and shared constants live here.
 * Import from this file — never read import.meta.env directly in components.
 */

// ─── BPP UI REST API (all endpoints: dashboard, orders, products, publish …) ──
export const BPP_UI_URL = import.meta.env.VITE_BPP_UI_URL || 'https://tsp.nearshop.in/bpp-ui'

// ─── Beckn Gateway (protocol actions: search, select, init, confirm …) ───────
export const BECKN_BG_URL = import.meta.env.VITE_BECKN_BG_URL || '/api/beckn'

// ─── BAP credentials ─────────────────────────────────────────────────────────
export const BAP_ID  = import.meta.env.VITE_BAP_ID  || 'ion-bap.example.id'
export const BAP_URI = import.meta.env.VITE_BAP_URI  || 'https://ion-bap.example.id/beckn'

// ─── BPP credentials ─────────────────────────────────────────────────────────
export const BPP_ID  = import.meta.env.VITE_BPP_ID  || 'ion-bpp.example.id'
export const BPP_URI = import.meta.env.VITE_BPP_URI  || 'https://ion-bpp.example.id/beckn'

// ─── Beckn protocol constants ─────────────────────────────────────────────────
export const DOMAIN       = 'retail'
export const COUNTRY      = 'IDN'
export const CITY         = 'std:022'   // Bandung
export const CORE_VERSION = '1.1.0'
