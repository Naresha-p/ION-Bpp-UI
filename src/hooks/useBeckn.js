/**
 * useBeckn — React hook wrapping all Beckn API calls
 * Handles demo-mode fallback, loading state, and store sync
 */

import { useState, useCallback } from 'react'
import useBecknStore from '../store/becknStore'
import {
  becknSelect, becknInit,
  becknConfirm, becknStatus, becknTrack,
  becknCancel, becknUpdate, becknRating,
} from '../api/beckn'
import { mockItems, mockOrders } from '../api/mockData'
import { v4 as uuidv4 } from 'uuid'

export function useBeckn() {
  const store      = useBecknStore()
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const run = useCallback(async (fn, fallback) => {
    setLoading(true)
    setError(null)
    try {
      if (store.isDemoMode) {
        await new Promise((r) => setTimeout(r, 600))
        return typeof fallback === 'function' ? fallback() : fallback
      }
      return await fn()
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [store.isDemoMode])

  // SEARCH — always returns mock data; buyer-side Beckn gateway not used in BPP portal
  const search = useCallback(async (query) => {
    await new Promise((r) => setTimeout(r, 300))
    return {
      context: { action: 'on_search' },
      message: {
        catalog: {
          providers: [{ items: mockItems.filter((i) =>
            i.descriptor.name.toLowerCase().includes((query || '').toLowerCase())
          )}],
        },
      },
    }
  }, [])

  // SELECT
  const select = useCallback(async (providerId, items) => {
    const txnId = store.cartTransactionId || uuidv4()
    store.setCartTransactionId(txnId)
    return run(
      () => becknSelect(providerId, items, txnId),
      () => ({
        context: { action: 'on_select', transaction_id: txnId },
        message: { order: { provider: { id: providerId }, items, quote: {
          price: { currency: 'IDR', value: String(items.reduce((s, i) => s + parseFloat(i.price?.value || 0) * i.quantity, 0) + 5000) },
          breakup: [
            ...items.map((i) => ({ title: `${i.descriptor.name} x${i.quantity}`, price: { value: String(parseFloat(i.price?.value) * i.quantity) } })),
            { title: 'Delivery Charges', price: { value: '5000' } },
          ],
        }}},
      })
    )
  }, [run, store])

  // INIT
  const init = useCallback(async (order) => {
    return run(
      () => becknInit(order, store.cartTransactionId),
      () => ({
        context: { action: 'on_init', transaction_id: store.cartTransactionId },
        message: { order: { ...order, payment: { type: 'PRE-FULFILLMENT', params: { amount: String(store.cartTotal()), currency: 'IDR' } } } },
      })
    )
  }, [run, store])

  // CONFIRM
  const confirm = useCallback(async (order) => {
    const newOrder = {
      id:             `ORD-${Date.now()}`,
      transaction_id:  store.cartTransactionId,
      state:          'Active',
      beckn_state:    'ORDER-CONFIRMED',
      provider:       { id: store.provider.id, descriptor: { name: store.provider.name } },
      items:          store.cart,
      billing:        order.billing,
      fulfillment:    { id: uuidv4(), type: 'Delivery', state: { descriptor: { code: 'Order-confirmed' } } },
      quote:          { price: { currency: 'IDR', value: String(store.cartTotal() + 5000) } },
      payment:        { type: 'PRE-FULFILLMENT', status: 'PAID', params: { amount: String(store.cartTotal() + 5000), currency: 'IDR' } },
      created_at:     new Date().toISOString(),
      updated_at:     new Date().toISOString(),
    }
    const result = await run(
      () => becknConfirm(order, store.cartTransactionId),
      () => ({ context: { action: 'on_confirm' }, message: { order: newOrder } })
    )
    store.addOrder(newOrder)
    store.clearCart()
    store.addNotification({ type: 'success', title: 'Order Confirmed', body: `Order ${newOrder.id} placed successfully.` })
    return result
  }, [run, store])

  // STATUS
  const status = useCallback(async (orderId, transactionId) => {
    return run(
      () => becknStatus(orderId, transactionId),
      () => {
        const order = store.orders.find((o) => o.id === orderId)
        return { context: { action: 'on_status' }, message: { order } }
      }
    )
  }, [run, store])

  // TRACK
  const track = useCallback(async (orderId, transactionId) => {
    return run(
      () => becknTrack(orderId, transactionId),
      () => ({
        context: { action: 'on_track' },
        message: { tracking: { url: `https://track.ion.id/${orderId}`, status: 'active' } },
      })
    )
  }, [run, store])

  // CANCEL
  const cancel = useCallback(async (orderId, reasonId, transactionId) => {
    const result = await run(
      () => becknCancel(orderId, reasonId, transactionId),
      () => ({ context: { action: 'on_cancel' }, message: { order: { id: orderId, state: 'Cancelled' } } })
    )
    store.updateOrderState(orderId, 'ORDER-CANCELLED')
    store.addNotification({ type: 'info', title: 'Order Cancelled', body: `Order ${orderId} has been cancelled.` })
    return result
  }, [run, store])

  // RATING
  const rating = useCallback(async (target, id, value, transactionId) => {
    return run(
      () => becknRating(target, id, value, transactionId),
      () => ({ context: { action: 'on_rating' }, message: { feedback_form: {} } })
    )
  }, [run, store])

  return { search, select, init, confirm, status, track, cancel, rating, loading, error }
}
