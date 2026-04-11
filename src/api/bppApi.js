/**
 * BPP UI REST API Client
 * All endpoints share the same base URL: VITE_BPP_UI_URL (default https://tsp.nearshop.in/bpp-ui)
 *
 * Endpoints:
 *   GET  /dashboard          — stats
 *   GET  /orders             — paginated orders (Beckn 2.0 contracts)
 *   GET  /orders/:id         — single order
 *   DELETE /products/:id     — delete product
 *   PUT    /products/:id     — update product
 *   POST /resourse/add       — add new product resource
 *   POST /publish            — publish resources to Beckn network
 *   GET  /catalog/provider/:id
 *   POST /catalog/publish
 *   PUT  /catalog/items/:id
 *   POST /catalog/unpublish
 */

import axios from 'axios'
import { BPP_UI_URL } from './config'
import { classifyError } from '../utils/apiError'

// ─── Single shared axios instance ────────────────────────────────────────────

const bppClient = axios.create({
  baseURL: BPP_UI_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

bppClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ion_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

bppClient.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(classifyError(err))
)

// ─── Dashboard ────────────────────────────────────────────────────────────────

/** GET /dashboard → { totalProducts, totalOrders, confirmedOrders, enRouteOrders, deliveredOrders } */
export function getDashboardStats() {
  return bppClient.get('/dashboard')
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/** GET /orders?page=&limit= → { orders, pagination } */
export function getOrders({ page = 1, limit = 10 } = {}) {
  return bppClient.get('/orders', { params: { page, limit } })
}

/** GET /orders/:id */
export function getOrder(id) {
  return bppClient.get(`/orders/${id}`)
}

// ─── Products ─────────────────────────────────────────────────────────────────

/** GET /products?page=&limit= → { products, pagination } */
export function getProducts({ page = 1, limit = 20 } = {}) {
  return bppClient.get('/products', { params: { page, limit } })
}

/**
 * POST /resourse/add  (typo in API path is intentional)
 * Full payload shape — see curl spec in project docs.
 */
export function addProduct(payload) {
  return bppClient.post('/resources/add', payload)
}

/** DELETE /products/:id */
export function deleteProduct(productId) {
  return bppClient.delete(`/products/${productId}`)
}

/** PUT /products/:id */
export function updateProduct(productId, payload) {
  return bppClient.put(`/products/${productId}`, payload)
}

// ─── Publish ──────────────────────────────────────────────────────────────────

/**
 * POST /publish
 * Makes resources discoverable on the Beckn network.
 * @param {string[]} resourceIds
 */
export function publishItems(resourceIds) {
  return bppClient.post('/publish', { resourceIds })
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

/** GET /catalog/provider/:providerId */
export function getPublishedCatalog(providerId) {
  return bppClient.get(`/catalog/provider/${providerId}`)
}

/** POST /catalog/publish */
export function publishCatalog(payload) {
  return bppClient.post('/catalog/publish', payload)
}

/** PUT /catalog/items/:id */
export function updateCatalogItem(itemId, payload) {
  return bppClient.put(`/catalog/items/${itemId}`, payload)
}

/** POST /catalog/unpublish */
export function unpublishCatalogItems(payload) {
  return bppClient.post('/catalog/unpublish', payload)
}

export default bppClient
