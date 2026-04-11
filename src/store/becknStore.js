/**
 * Global Zustand store — mirrors Beckn session state
 * Keeps transaction context, cart, and order history in sync
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { mockStats, mockItems, mockOrders } from '../api/mockData'

const useBecknStore = create(
  devtools((set, get) => ({
    // ── Demo / Auth ──────────────────────────────────────────────────────────
    isDemoMode: false,
    provider: {
      id:       'WBNDG123467',
      name:     'Warung Sumber Rezeki',
      shopId:   'WBNDG1234567',
      phone:    '0812-3456-7890',
      verified: true,
      address:  'Jl. Sukajadi No. 10, Bandung, West Java',
      rating:   4.2,
      ratingCount: 215,
    },
    setDemoMode: (val) => set({ isDemoMode: val }),

    // ── Beckn Session ────────────────────────────────────────────────────────
    transactionId: null,
    messageId:     null,
    startTransaction: () => set({ transactionId: uuidv4(), messageId: uuidv4() }),
    newMessage:       () => set({ messageId: uuidv4() }),

    // ── Stats ────────────────────────────────────────────────────────────────
    stats: mockStats,
    setStats: (stats) => set({ stats }),

    // ── Catalog / Products ───────────────────────────────────────────────────
    catalog: mockItems,
    setCatalog: (items) => set({ catalog: items }),
    catalogLoading: false,
    setCatalogLoading: (v) => set({ catalogLoading: v }),

    searchQuery:   '',
    searchResults: [],
    setSearchQuery:   (q)   => set({ searchQuery: q }),
    setSearchResults: (res) => set({ searchResults: res }),

    // ── Cart (Beckn select → init → confirm flow) ────────────────────────────
    cart: [],
    cartTransactionId: null,
    addToCart: (item) => {
      const { cart } = get()
      const existing = cart.find((c) => c.id === item.id)
      if (existing) {
        set({ cart: cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c) })
      } else {
        set({ cart: [...cart, { ...item, quantity: 1 }] })
      }
    },
    removeFromCart: (itemId) => set((s) => ({ cart: s.cart.filter((c) => c.id !== itemId) })),
    updateCartQty:  (itemId, qty) => set((s) => ({
      cart: qty <= 0
        ? s.cart.filter((c) => c.id !== itemId)
        : s.cart.map((c) => c.id === itemId ? { ...c, quantity: qty } : c),
    })),
    clearCart: () => set({ cart: [], cartTransactionId: null }),
    setCartTransactionId: (id) => set({ cartTransactionId: id }),

    cartTotal: () => {
      const { cart } = get()
      return cart.reduce((sum, item) => sum + parseFloat(item.price?.value || 0) * item.quantity, 0)
    },

    // ── Orders ───────────────────────────────────────────────────────────────
    orders:        mockOrders,
    activeOrder:   null,
    ordersLoading: false,
    setOrders:        (orders) => set({ orders }),
    setActiveOrder:   (order)  => set({ activeOrder: order }),
    setOrdersLoading: (v)      => set({ ordersLoading: v }),
    addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
    updateOrderState: (orderId, newState) => set((s) => ({
      orders: s.orders.map((o) => o.id === orderId ? { ...o, beckn_state: newState } : o),
    })),

    // ── Published Catalog (BPP seller-side) ─────────────────────────────────
    publishedItemIds:  new Set(),
    publishLoading:    false,
    lastPublishedAt:   null,
    setPublishedItemIds: (ids) => set({ publishedItemIds: new Set(ids) }),
    addPublishedItemIds: (ids) => set((s) => ({
      publishedItemIds: new Set([...s.publishedItemIds, ...ids]),
      lastPublishedAt: new Date().toISOString(),
    })),
    removePublishedItemIds: (ids) => set((s) => {
      const next = new Set(s.publishedItemIds)
      ids.forEach((id) => next.delete(id))
      return { publishedItemIds: next }
    }),
    setPublishLoading: (v) => set({ publishLoading: v }),

    // ── Fulfillment ──────────────────────────────────────────────────────────
    fulfillments: [],
    setFulfillments: (f) => set({ fulfillments: f }),

    // ── Notifications ────────────────────────────────────────────────────────
    notifications: [],
    addNotification: (notif) => set((s) => ({
      notifications: [{ id: uuidv4(), ts: new Date().toISOString(), read: false, ...notif }, ...s.notifications],
    })),
    markNotifRead: (id) => set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
    })),
    clearNotifications: () => set({ notifications: [] }),

    // ── Messages ─────────────────────────────────────────────────────────────
    messages: [],
    setMessages: (m) => set({ messages: m }),
  }))
)

export default useBecknStore
