/**
 * PublishPage — Seller-side catalog publish management
 * Allows sellers to publish / unpublish items to the Beckn network (BPP)
 */

import React, { useState, useCallback } from 'react'
import {
  Upload, Package, CheckCircle2, XCircle, Search, Filter,
  Plus, Trash2, Edit2, Globe, EyeOff, RefreshCw, AlertCircle,
  ChevronDown, X, Save, Layers,
} from 'lucide-react'
import useBecknStore from '../store/becknStore'
import BecknBadge from '../components/common/BecknBadge'
import StarRating from '../components/common/StarRating'
import {
  publishItems,
  unpublishCatalogItems,
  updateCatalogItem,
} from '../api/bppApi'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const CATEGORY_COLORS = {
  staple:    'blue',
  cooking:   'orange',
  baking:    'yellow',
  condiment: 'teal',
  household: 'purple',
  snacks:    'green',
}

const CATEGORIES = ['staple', 'cooking', 'baking', 'condiment', 'household', 'snacks']

// ─── Edit Item Modal ──────────────────────────────────────────────────────────

function EditItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name:      item.descriptor.name,
    short_desc: item.descriptor.short_desc || '',
    price:     item.price.value,
    max_price: item.price.maximum_value || '',
    stock:     item.quantity?.available?.count || 0,
    max_qty:   item.quantity?.maximum?.count   || 10,
    category:  item.category_id,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...item,
      descriptor: {
        ...item.descriptor,
        name:       form.name,
        short_desc: form.short_desc,
      },
      price: {
        currency:      'IDR',
        value:         form.price,
        maximum_value: form.max_price || String(parseInt(form.price) * 1.1),
      },
      quantity: {
        available: { count: parseInt(form.stock) },
        maximum:   { count: parseInt(form.max_qty) },
      },
      category_id: form.category,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Edit Catalog Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Product Name</label>
            <input required className="beckn-input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Short Description</label>
            <input className="beckn-input" value={form.short_desc}
              onChange={(e) => setForm({ ...form, short_desc: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Price (IDR)</label>
              <input required type="number" className="beckn-input" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Max Price (IDR)</label>
              <input type="number" className="beckn-input" value={form.max_price}
                onChange={(e) => setForm({ ...form, max_price: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Stock</label>
              <input required type="number" className="beckn-input" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Max per Order</label>
              <input type="number" className="beckn-input" value={form.max_qty}
                onChange={(e) => setForm({ ...form, max_qty: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Category</label>
            <select className="beckn-input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="beckn-btn-secondary flex-1">Cancel</button>
            <button type="submit" className="beckn-btn-primary flex-1">
              <Save size={14} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Product Modal ────────────────────────────────────────────────────────

function AddProductModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', short_desc: '', price: '', max_price: '', stock: '', max_qty: '10', category: 'staple',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd({
      id:          `ITEM${Date.now()}`,
      provider_id: 'WBNDG123467',
      descriptor:  { name: form.name, short_desc: form.short_desc, images: [] },
      price:       {
        currency:      'IDR',
        value:         form.price,
        maximum_value: form.max_price || String(parseInt(form.price) * 1.1),
      },
      quantity:    { available: { count: parseInt(form.stock) }, maximum: { count: parseInt(form.max_qty) } },
      category_id: form.category,
      rating:      '0',
      tags:        [],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Add New Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Product Name</label>
            <input required className="beckn-input" placeholder="e.g. Beras Premium 5kg"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Short Description</label>
            <input className="beckn-input" placeholder="Brief product description"
              value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Price (IDR)</label>
              <input required type="number" className="beckn-input" placeholder="85000"
                value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Max Price (IDR)</label>
              <input type="number" className="beckn-input" placeholder="90000"
                value={form.max_price} onChange={(e) => setForm({ ...form, max_price: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Stock</label>
              <input required type="number" className="beckn-input" placeholder="100"
                value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Max per Order</label>
              <input type="number" className="beckn-input" placeholder="10"
                value={form.max_qty} onChange={(e) => setForm({ ...form, max_qty: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Category</label>
            <select className="beckn-input" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="beckn-btn-secondary flex-1">Cancel</button>
            <button type="submit" className="beckn-btn-primary flex-1">
              <Plus size={14} /> Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Confirm Publish Modal ────────────────────────────────────────────────────

function ConfirmPublishModal({ items, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Publish to Beckn Network</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            You are about to publish <span className="font-semibold text-gray-900">{items.length} item{items.length !== 1 ? 's' : ''}</span> to
            the Beckn open network. These items will be discoverable by buyers via on_search responses.
          </p>
          <div className="bg-blue-50 rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium truncate max-w-[60%]">{item.descriptor.name}</span>
                <span className="text-blue-700 font-semibold">{formatIDR(item.price.value)}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Published items become live immediately and can be ordered by network participants.
              Ensure prices and stock are accurate before publishing.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="beckn-btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading} className="beckn-btn-primary flex-1">
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Publishing…</>
              ) : (
                <><Upload size={14} /> Publish Now</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Toast Notification ───────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null
  const isSuccess = toast.type === 'success'
  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${isSuccess ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {isSuccess
        ? <CheckCircle2 size={16} />
        : <AlertCircle size={16} />}
      {toast.message}
    </div>
  )
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item, isSelected, isPublished, onToggleSelect, onEdit, onDelete, onUnpublish }) {
  return (
    <div className={`beckn-card hover:shadow-md transition-all group relative
      ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''}
      ${isPublished ? 'border-emerald-200' : ''}`}>

      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="w-4 h-4 accent-blue-600 cursor-pointer rounded"
        />
      </div>

      {/* Published badge */}
      {isPublished && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <Globe size={9} /> Live
        </div>
      )}

      {/* Image */}
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden">
        {item.descriptor.images?.[0] ? (
          <img src={item.descriptor.images[0]} alt={item.descriptor.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <BecknBadge label={item.category_id} color={CATEGORY_COLORS[item.category_id] || 'gray'} />
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-1">
          {item.descriptor.name}
        </h3>
        {item.descriptor.short_desc && (
          <p className="text-xs text-gray-500 line-clamp-1">{item.descriptor.short_desc}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-900 text-sm">{formatIDR(item.price?.value)}</p>
          <div className="flex items-center gap-1">
            <StarRating value={parseFloat(item.rating || 0)} size={10} />
            <span className="text-xs text-gray-500">{item.rating || '—'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Stock: <span className={item.quantity?.available?.count < 10 ? 'text-red-500 font-semibold' : ''}>
            {item.quantity?.available?.count}
          </span></span>
          <span className="font-mono text-[10px]">{item.id}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2
              border border-gray-200 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
            <Edit2 size={11} /> Edit
          </button>
          {isPublished ? (
            <button
              onClick={() => onUnpublish(item.id)}
              className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2
                border border-emerald-200 rounded-lg text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors">
              <EyeOff size={11} /> Unpublish
            </button>
          ) : (
            <button
              onClick={() => onDelete(item.id)}
              className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 px-2
                border border-gray-200 rounded-lg text-gray-600 hover:border-red-300 hover:text-red-600 transition-colors">
              <Trash2 size={11} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublishPage() {
  const {
    catalog, setCatalog,
    provider, isDemoMode,
    publishedItemIds, addPublishedItemIds, removePublishedItemIds,
    publishLoading, setPublishLoading,
    lastPublishedAt,
    addNotification,
  } = useBecknStore()

  const [query,       setQuery]       = useState('')
  const [category,    setCategory]    = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // all | published | draft
  const [selected,    setSelected]    = useState(new Set())
  const [editItem,    setEditItem]    = useState(null)
  const [showAdd,     setShowAdd]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast,       setToast]       = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Derived data ─────────────────────────────────────────────────────────

  const filtered = catalog.filter((item) => {
    const matchQ = item.descriptor.name.toLowerCase().includes(query.toLowerCase())
    const matchC = category === 'all' || item.category_id === category
    const isPublished = publishedItemIds.has(item.id)
    const matchS =
      statusFilter === 'all'       ? true :
      statusFilter === 'published' ? isPublished :
      /* draft */                    !isPublished
    return matchQ && matchC && matchS
  })

  const allCategories = ['all', ...new Set(catalog.map((i) => i.category_id))]
  const publishedCount = catalog.filter((i) => publishedItemIds.has(i.id)).length
  const draftCount     = catalog.length - publishedCount
  const selectedItems  = catalog.filter((i) => selected.has(i.id))

  // ── Selection handlers ────────────────────────────────────────────────────

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const selectAll = () => setSelected(new Set(filtered.map((i) => i.id)))
  const clearSelection = () => setSelected(new Set())

  const selectDraft = () =>
    setSelected(new Set(filtered.filter((i) => !publishedItemIds.has(i.id)).map((i) => i.id)))

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    setPublishLoading(true)
    try {
      if (!isDemoMode) {
        // POST /publish — { resourceIds: ["id1", "id2", ...] }
        await publishItems([...selected])
      } else {
        // Demo: simulate 800ms network delay
        await new Promise((r) => setTimeout(r, 800))
      }
      addPublishedItemIds([...selected])
      addNotification({
        type:    'success',
        title:   'Catalog Published',
        message: `${selected.size} item${selected.size !== 1 ? 's' : ''} published to Beckn network`,
      })
      showToast(`${selected.size} item${selected.size !== 1 ? 's' : ''} published successfully!`)
      setSelected(new Set())
      setShowConfirm(false)
    } catch (err) {
      showToast(err.message || 'Publish failed. Please try again.', 'error')
    } finally {
      setPublishLoading(false)
    }
  }

  // ── Unpublish ─────────────────────────────────────────────────────────────

  const handleUnpublish = async (itemId) => {
    setPublishLoading(true)
    try {
      if (!isDemoMode) {
        await unpublishCatalogItems({ context: null, message: { provider_id: provider.id, item_ids: [itemId] } })
      } else {
        await new Promise((r) => setTimeout(r, 500))
      }
      removePublishedItemIds([itemId])
      showToast('Item removed from Beckn network')
    } catch (err) {
      showToast(err.message || 'Unpublish failed.', 'error')
    } finally {
      setPublishLoading(false)
    }
  }

  // ── Edit / Save ───────────────────────────────────────────────────────────

  const handleSaveEdit = async (updatedItem) => {
    const isPublished = publishedItemIds.has(updatedItem.id)
    setCatalog(catalog.map((i) => (i.id === updatedItem.id ? updatedItem : i)))

    if (isPublished && !isDemoMode) {
      try {
        await updateCatalogItem(updatedItem.id, { provider_id: provider.id, item: updatedItem })
        showToast('Item updated on Beckn network')
      } catch (err) {
        showToast('Local save OK — network sync failed', 'error')
      }
    } else {
      showToast('Item updated locally')
    }
  }

  // ── Add / Delete ──────────────────────────────────────────────────────────

  const handleAdd = (item) => {
    setCatalog([item, ...catalog])
    showToast('Product added to catalog')
  }

  const handleDelete = (id) => {
    setCatalog(catalog.filter((i) => i.id !== id))
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
    showToast('Product removed from catalog')
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Publish Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage which products are live on the Beckn network
            {lastPublishedAt && (
              <span className="ml-2 text-xs text-gray-400">
                · Last published {new Date(lastPublishedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)} className="beckn-btn-secondary text-sm">
            <Plus size={15} /> Add Product
          </button>
          <button
            onClick={() => selected.size > 0 && setShowConfirm(true)}
            disabled={selected.size === 0 || publishLoading}
            className="beckn-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Upload size={15} />
            Publish Selected
            {selected.size > 0 && (
              <span className="ml-1 bg-white/25 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {selected.size}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Items',  value: catalog.length,  icon: Layers,       color: 'text-gray-600',   bg: 'bg-gray-50'    },
          { label: 'Published',    value: publishedCount,  icon: Globe,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Draft',        value: draftCount,      icon: Package,      color: 'text-amber-600',  bg: 'bg-amber-50'   },
          { label: 'Selected',     value: selected.size,   icon: CheckCircle2, color: 'text-blue-600',   bg: 'bg-blue-50'    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl p-3 flex items-center gap-3 ${bg}`}>
            <div className={`${color}`}><Icon size={20} /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Actions ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="beckn-input pl-9"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5">
          {[
            { key: 'all',       label: 'All'       },
            { key: 'published', label: 'Published' },
            { key: 'draft',     label: 'Draft'     },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                statusFilter === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 flex-wrap">
          {allCategories.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                category === c
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
              }`}>
              {c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk Selection Bar ── */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <button onClick={selectAll} className="hover:text-blue-600 font-medium transition-colors">
            Select All ({filtered.length})
          </button>
          <span>·</span>
          <button onClick={selectDraft} className="hover:text-amber-600 font-medium transition-colors">
            Select Draft
          </button>
          {selected.size > 0 && (
            <>
              <span>·</span>
              <button onClick={clearSelection} className="hover:text-red-500 font-medium transition-colors">
                Clear Selection
              </button>
              <span className="ml-auto text-blue-600 font-semibold">
                {selected.size} selected
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Product Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Package size={44} className="mb-3" />
          <p className="font-medium text-gray-500">No products found</p>
          <p className="text-sm mt-1">
            {statusFilter === 'published'
              ? 'No items published yet. Select items and click Publish.'
              : statusFilter === 'draft'
              ? 'All items are published!'
              : 'Add products to your catalog to get started.'}
          </p>
          {statusFilter === 'draft' && draftCount === 0 && (
            <button onClick={() => setShowAdd(true)} className="mt-4 beckn-btn-primary text-sm">
              <Plus size={14} /> Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isSelected={selected.has(item.id)}
              isPublished={publishedItemIds.has(item.id)}
              onToggleSelect={toggleSelect}
              onEdit={setEditItem}
              onDelete={handleDelete}
              onUnpublish={handleUnpublish}
            />
          ))}
        </div>
      )}

      {/* ── Demo mode notice ── */}
      {isDemoMode && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>
            <span className="font-semibold">Demo Mode:</span> Publish/unpublish actions are simulated locally.
            Connect your BPP backend to make items live on the Beckn network.
          </span>
        </div>
      )}

      {/* ── Modals ── */}
      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
      {editItem && (
        <EditItemModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
        />
      )}
      {showConfirm && (
        <ConfirmPublishModal
          items={selectedItems}
          onConfirm={handlePublish}
          onClose={() => setShowConfirm(false)}
          loading={publishLoading}
        />
      )}

      {/* ── Toast ── */}
      <Toast toast={toast} />
    </div>
  )
}
