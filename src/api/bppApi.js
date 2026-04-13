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
import { BPP_UI_URL, TSP_URL } from './config'
import { classifyError } from '../utils/apiError'

// ─── Shared interceptor factory ───────────────────────────────────────────────

function attachInterceptors(client) {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('ion_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  client.interceptors.response.use(
    (res) => res.data,
    (err) => Promise.reject(classifyError(err))
  )
  return client
}

// ─── BPP UI client (dashboard, orders, products …) ───────────────────────────

const bppClient = attachInterceptors(axios.create({
  baseURL: BPP_UI_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
}))

// ─── TSP client (resources/add, publish) ─────────────────────────────────────

const tspClient = attachInterceptors(axios.create({
  baseURL: TSP_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
}))

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

// ─── Providers ────────────────────────────────────────────────────────────────

/** GET /providers → array of providers */
export function getProviders() {
  return bppClient.get('/providers')
}

// ─── Products ─────────────────────────────────────────────────────────────────

/** GET /products?page=&limit= → { products, pagination } */
export function getProducts({ page = 1, limit = 20 } = {}) {
  return bppClient.get('/products', { params: { page, limit } })
}

/**
 * POST /resources/add  — upsert by resourceId
 * Full payload shape matches ResourceRequest schema.
 */
export function addProduct(payload) {
  return tspClient.post('/resources/add', payload)
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
 * POST /publish  — { resourceIds: string[] }
 * Makes resources discoverable on the Beckn network.
 */
export function publishItems(resourceIds) {
  return tspClient.post('/publish', { resourceIds })
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
