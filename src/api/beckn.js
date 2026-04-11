/**
 * Beckn Protocol API Client
 * Implements Beckn Core Specification v1.1.0
 * Domain: retail (ONDC/ION Indonesia)
 */

import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import {
  BECKN_BG_URL as BECKN_BASE_URL,
  BAP_ID, BAP_URI,
  BPP_ID, BPP_URI,
  DOMAIN, COUNTRY, CITY, CORE_VERSION,
} from './config'

// ─── Context Builder ────────────────────────────────────────────────────────

export function buildContext(action, transactionId = null) {
  return {
    domain:          DOMAIN,
    action,
    country:         COUNTRY,
    city:            CITY,
    core_version:    CORE_VERSION,
    bap_id:          BAP_ID,
    bap_uri:         BAP_URI,
    bpp_id:          BPP_ID,
    bpp_uri:         BPP_URI,
    transaction_id:  transactionId || uuidv4(),
    message_id:      uuidv4(),
    timestamp:       new Date().toISOString(),
    ttl:             'PT30S',
  }
}

// ─── HTTP Client ─────────────────────────────────────────────────────────────

const client = axios.create({
  baseURL: BECKN_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('ion_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message?.ack?.status === 'NACK'
      ? err.response.data.message.ack.error?.message
      : err.message
    return Promise.reject(new Error(msg || 'Beckn API error'))
  }
)

// ─── Beckn Actions ───────────────────────────────────────────────────────────

/**
 * SEARCH — Discover products on the network
 * Beckn action: search
 */
export async function becknSearch(query, filters = {}) {
  const context = buildContext('search')
  const payload = {
    context,
    message: {
      intent: {
        item: {
          descriptor: { name: query },
          ...(filters.category && { category_id: filters.category }),
        },
        ...(filters.location && {
          fulfillment: {
            end: {
              location: {
                gps: filters.location.gps,
                address: { city: filters.location.city },
              },
            },
          },
        }),
        ...(filters.maxPrice && {
          payment: { params: { amount: String(filters.maxPrice), currency: 'IDR' } },
        }),
      },
    },
  }
  return client.post('/search', payload)
}

/**
 * SELECT — Choose items from a provider catalog
 * Beckn action: select
 */
export async function becknSelect(providerId, items, transactionId) {
  const context = buildContext('select', transactionId)
  const payload = {
    context,
    message: {
      order: {
        provider: { id: providerId },
        items: items.map((item) => ({
          id:       item.id,
          quantity: { count: item.quantity },
        })),
        fulfillment: { type: 'Delivery' },
      },
    },
  }
  return client.post('/select', payload)
}

/**
 * INIT — Initialize an order (get final quote + payment terms)
 * Beckn action: init
 */
export async function becknInit(order, transactionId) {
  const context = buildContext('init', transactionId)
  const payload = {
    context,
    message: {
      order: {
        provider:    { id: order.providerId },
        items:       order.items.map((i) => ({ id: i.id, quantity: { count: i.quantity } })),
        billing:     order.billing,
        fulfillment: {
          type: 'Delivery',
          end:  { contact: order.billing, location: order.deliveryAddress },
        },
        payment: { type: 'PRE-FULFILLMENT' },
      },
    },
  }
  return client.post('/init', payload)
}

/**
 * CONFIRM — Place the order
 * Beckn action: confirm
 */
export async function becknConfirm(order, transactionId) {
  const context = buildContext('confirm', transactionId)
  const payload = {
    context,
    message: {
      order: {
        provider:    { id: order.providerId },
        items:       order.items.map((i) => ({ id: i.id, quantity: { count: i.quantity } })),
        billing:     order.billing,
        fulfillment: {
          type: 'Delivery',
          end:  { contact: order.billing, location: order.deliveryAddress },
        },
        payment: {
          type:   'PRE-FULFILLMENT',
          params: { transaction_id: order.paymentRef, currency: 'IDR', amount: String(order.totalAmount) },
          status: 'PAID',
        },
      },
    },
  }
  return client.post('/confirm', payload)
}

/**
 * STATUS — Get order status
 * Beckn action: status
 */
export async function becknStatus(orderId, transactionId) {
  const context = buildContext('status', transactionId)
  return client.post('/status', { context, message: { order_id: orderId } })
}

/**
 * TRACK — Track active order
 * Beckn action: track
 */
export async function becknTrack(orderId, transactionId) {
  const context = buildContext('track', transactionId)
  return client.post('/track', { context, message: { order_id: orderId } })
}

/**
 * CANCEL — Cancel an order
 * Beckn action: cancel
 */
export async function becknCancel(orderId, reasonId, transactionId) {
  const context = buildContext('cancel', transactionId)
  return client.post('/cancel', {
    context,
    message: { order_id: orderId, cancellation_reason_id: reasonId },
  })
}

/**
 * UPDATE — Update an order (quantity / fulfillment)
 * Beckn action: update
 */
export async function becknUpdate(orderId, updateTarget, transactionId) {
  const context = buildContext('update', transactionId)
  return client.post('/update', {
    context,
    message: { update_target: updateTarget, order: { id: orderId, ...updateTarget } },
  })
}

/**
 * RATING — Rate a provider or item
 * Beckn action: rating
 */
export async function becknRating(ratingTarget, id, value, transactionId) {
  const context = buildContext('rating', transactionId)
  return client.post('/rating', {
    context,
    message: { ratings: [{ id, rating_category: ratingTarget, value: String(value) }] },
  })
}

/**
 * SUPPORT — Get support info
 * Beckn action: support
 */
export async function becknSupport(refId, transactionId) {
  const context = buildContext('support', transactionId)
  return client.post('/support', { context, message: { ref_id: refId } })
}

// ─── Seller / BPP Catalog Management APIs ────────────────────────────────────

/**
 * PUBLISH CATALOG — Publish items to the Beckn network (BPP side)
 * Makes items discoverable via on_search responses
 */
export async function publishCatalog(items, provider) {
  const context = buildContext('catalog')
  const payload = {
    context,
    message: {
      catalog: {
        'bpp/descriptor': {
          name:       provider.name,
          short_desc: provider.short_desc || '',
          images:     provider.images     || [],
        },
        'bpp/providers': [
          {
            id:         provider.id,
            descriptor: { name: provider.name },
            items:      items.map((item) => ({
              id:          item.id,
              descriptor:  item.descriptor,
              price:       item.price,
              quantity:    item.quantity,
              category_id: item.category_id,
              tags:        item.tags || [],
            })),
          },
        ],
      },
    },
  }
  return client.post('/catalog/publish', payload)
}

/**
 * UPDATE CATALOG ITEM — Update a single item in the BPP catalog
 */
export async function updateCatalogItem(item, providerId) {
  const context = buildContext('catalog')
  return client.put(`/catalog/items/${item.id}`, {
    context,
    message: { provider_id: providerId, item },
  })
}

/**
 * UNPUBLISH ITEMS — Remove items from Beckn network visibility
 */
export async function unpublishCatalogItems(itemIds, providerId) {
  const context = buildContext('catalog')
  return client.post('/catalog/unpublish', {
    context,
    message: { provider_id: providerId, item_ids: itemIds },
  })
}

/**
 * GET PUBLISHED CATALOG — Fetch currently published items for this provider
 */
export async function getPublishedCatalog(providerId) {
  return client.get(`/catalog/provider/${providerId}`)
}

export default client
