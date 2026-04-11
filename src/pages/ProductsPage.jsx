import { useState, useEffect, useCallback } from 'react'
import {
  Search, Package, Edit2, Trash2, X, Save, Plus,
  ChevronDown, ChevronUp, RefreshCw, CheckCircle2, XCircle,
} from 'lucide-react'
import { Toast, ErrorBanner, ErrorPage } from '../components/common/ErrorDisplay'
import { getProducts, addProduct, deleteProduct, updateProduct } from '../api/bppApi'
import { formatIDR } from '../utils/format'

const PAGE_LIMIT = 20

// ─── Schema-aligned enums ─────────────────────────────────────────────────────

const DAYS             = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const UNIT_CODES       = ['EA', 'KG', 'G', 'L', 'ML', 'PACK']
const WEIGHT_UNITS     = ['GRAM', 'KG', 'ML', 'L']
const FOOD_CLASS       = ['VEG', 'NON_VEG', 'EGG']
const ALLERGENS        = ['GLUTEN', 'DAIRY', 'EGGS', 'NUTS', 'PEANUTS', 'SOY', 'FISH', 'SHELLFISH', 'SESAME']
const PAYMENT_METHODS  = ['COD', 'UPI', 'PREPAID', 'CARD']
const CUTOFF_EVENTS    = ['BEFORE_PACKING', 'BEFORE_DISPATCH']
const RETURN_METHODS   = ['SELLER_PICKUP', 'BUYER_DROP']

// ─── Field helpers ────────────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function SectionHeader({ title, open, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center justify-between py-2 text-xs font-bold text-gray-600 uppercase tracking-wide border-b border-gray-100 mb-3">
      {title}
      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  )
}

// ─── Add Product Modal ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  // top-level (required: resourceId, offerId, providerId, name, shortDesc, unitPrice, isActive)
  resourceId: '', offerId: '', providerId: 'provider-test-001',
  name: '', shortDesc: '', imageUri: '',
  unitPrice: '', currency: 'IDR', unitCode: 'EA',
  isActive: true, isPublished: false,
  // resourceAttributes (required: brand, originCountry, weight, foodClassification, cuisine, preparation.instructions)
  brand: '', originCountry: 'IN',
  weightQty: '', weightUnit: 'GRAM',
  foodClassification: 'VEG',
  allergens: [],
  cuisine: '',
  prepInstructions: '', prepStorage: '', prepShelfLife: '',
  // offerAttributes.policies
  returnsAllowed: false, returnsWindow: '', returnsMethod: 'SELLER_PICKUP',
  cancellationAllowed: true, cancellationWindow: 'PT30M', cancellationCutoff: 'BEFORE_PACKING',
  replacementAllowed: false, replacementWindow: '', replacementMethod: 'SELLER_PICKUP',
  // paymentConstraints
  codAvailable: true,
  paymentMethods: ['COD', 'UPI'],
  // serviceability
  maxDistance: '8', distanceUnit: 'KM',
  timingDays: [...DAYS],
  timingStart: '11:00', timingEnd: '22:00',
  // holidays
  holidays: [],
}

function AddProductModal({ onClose, onAdded }) {
  const [form, setForm]       = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [sections, setSections] = useState({ resource: true, offer: false, serviceability: false })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const toggleSection  = (key) => setSections((s) => ({ ...s, [key]: !s[key] }))
  const toggleAllergen = (a)   => set('allergens',
    form.allergens.includes(a) ? form.allergens.filter((x) => x !== a) : [...form.allergens, a])
  const toggleDay      = (d)   => set('timingDays',
    form.timingDays.includes(d) ? form.timingDays.filter((x) => x !== d) : [...form.timingDays, d])
  const togglePayment  = (m)   => set('paymentMethods',
    form.paymentMethods.includes(m) ? form.paymentMethods.filter((x) => x !== m) : [...form.paymentMethods, m])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = {
        resourceId:  form.resourceId,
        offerId:     form.offerId,
        providerId:  form.providerId,
        name:        form.name,
        shortDesc:   form.shortDesc,
        imageUri:    form.imageUri || undefined,
        unitPrice:   parseFloat(form.unitPrice),
        currency:    form.currency,
        unitCode:    form.unitCode,
        resourceAttributes: {
          brand:              form.brand,
          originCountry:      form.originCountry,
          weight: {
            unitQuantity: parseFloat(form.weightQty),
            unitCode:     form.weightUnit,
          },
          foodClassification: form.foodClassification,
          allergens:          form.allergens.length ? form.allergens : undefined,
          cuisine:            form.cuisine,
          preparation: {
            instructions: form.prepInstructions,
            storage:      form.prepStorage   || undefined,
            shelfLife:    form.prepShelfLife || undefined,
          },
        },
        offerAttributes: {
          policies: {
            returns: {
              allowed: form.returnsAllowed,
              ...(form.returnsAllowed && form.returnsWindow && { window: form.returnsWindow }),
              ...(form.returnsAllowed && { method: form.returnsMethod }),
            },
            cancellation: {
              allowed:     form.cancellationAllowed,
              ...(form.cancellationAllowed && form.cancellationWindow && { window: form.cancellationWindow }),
              ...(form.cancellationAllowed && { cutoffEvent: form.cancellationCutoff }),
            },
            replacement: {
              allowed: form.replacementAllowed,
              ...(form.replacementAllowed && form.replacementWindow && { window: form.replacementWindow }),
              ...(form.replacementAllowed && { method: form.replacementMethod }),
            },
          },
          paymentConstraints: {
            codAvailable:   form.codAvailable,
            paymentMethods: form.paymentMethods,
          },
          serviceability: {
            maxDistance: parseFloat(form.maxDistance),
            unit:        form.distanceUnit,
            timing: [{
              daysOfWeek: form.timingDays,
              timeRange:  { start: form.timingStart, end: form.timingEnd },
            }],
          },
          ...(form.holidays.length && { holidays: form.holidays }),
        },
        isActive:    form.isActive,
        isPublished: form.isPublished,
      }
      const result = await addProduct(payload)
      onAdded(result)
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-semibold text-gray-800">Add New Product</h2>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

          {/* ── Core Info ── */}
          <div>
            <SectionHeader title="Core Info" open={sections.resource}
              onToggle={() => toggleSection('resource')} />
            {sections.resource && (
              <div className="space-y-3">

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Resource ID</Label>
                    <input required className="beckn-input" placeholder="item-butter-chicken-001"
                      value={form.resourceId} onChange={(e) => set('resourceId', e.target.value)} />
                  </div>
                  <div>
                    <Label required>Offer ID</Label>
                    <input required className="beckn-input" placeholder="offer-butter-chicken-001"
                      value={form.offerId} onChange={(e) => set('offerId', e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label required>Provider ID</Label>
                  <input required className="beckn-input"
                    value={form.providerId} onChange={(e) => set('providerId', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Product Name</Label>
                    <input required className="beckn-input" placeholder="Butter Chicken"
                      value={form.name} onChange={(e) => set('name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Unit Code</Label>
                    <select className="beckn-input" value={form.unitCode}
                      onChange={(e) => set('unitCode', e.target.value)}>
                      {UNIT_CODES.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <Label required>Short Description</Label>
                  <input required className="beckn-input"
                    placeholder="Tender chicken in a rich tomato-butter gravy"
                    value={form.shortDesc} onChange={(e) => set('shortDesc', e.target.value)} />
                </div>

                <div>
                  <Label>Image URL</Label>
                  <input type="url" className="beckn-input" placeholder="https://…/image.jpg"
                    value={form.imageUri} onChange={(e) => set('imageUri', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Unit Price</Label>
                    <input required type="number" min="0" step="0.01" className="beckn-input"
                      placeholder="280"
                      value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <select className="beckn-input" value={form.currency}
                      onChange={(e) => set('currency', e.target.value)}>
                      {['IDR', 'INR', 'USD'].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* resourceAttributes — all required */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Brand</Label>
                    <input required className="beckn-input" placeholder="Spice Garden"
                      value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                  </div>
                  <div>
                    <Label required>Origin Country</Label>
                    <input required className="beckn-input" placeholder="IN"
                      value={form.originCountry} onChange={(e) => set('originCountry', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Cuisine</Label>
                    <input required className="beckn-input" placeholder="North Indian"
                      value={form.cuisine} onChange={(e) => set('cuisine', e.target.value)} />
                  </div>
                  <div>
                    <Label required>Food Classification</Label>
                    <select className="beckn-input" value={form.foodClassification}
                      onChange={(e) => set('foodClassification', e.target.value)}>
                      {FOOD_CLASS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label required>Weight Quantity</Label>
                    <input required type="number" min="0" step="0.1" className="beckn-input"
                      placeholder="350"
                      value={form.weightQty} onChange={(e) => set('weightQty', e.target.value)} />
                  </div>
                  <div>
                    <Label>Weight Unit</Label>
                    <select className="beckn-input" value={form.weightUnit}
                      onChange={(e) => set('weightUnit', e.target.value)}>
                      {WEIGHT_UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Allergens</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {ALLERGENS.map((a) => (
                      <button key={a} type="button" onClick={() => toggleAllergen(a)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                          form.allergens.includes(a)
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-red-300'
                        }`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label required>Prep Instructions</Label>
                    <input required className="beckn-input" placeholder="Heat and serve"
                      value={form.prepInstructions}
                      onChange={(e) => set('prepInstructions', e.target.value)} />
                  </div>
                  <div>
                    <Label>Storage</Label>
                    <input className="beckn-input" placeholder="Refrigerate below 4°C"
                      value={form.prepStorage} onChange={(e) => set('prepStorage', e.target.value)} />
                  </div>
                  <div>
                    <Label>Shelf Life</Label>
                    <input className="beckn-input" placeholder="PT4H"
                      value={form.prepShelfLife} onChange={(e) => set('prepShelfLife', e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => set('isActive', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={form.isPublished}
                      onChange={(e) => set('isPublished', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Publish immediately
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ── Policies & Payment ── */}
          <div>
            <SectionHeader title="Policies & Payment" open={sections.offer}
              onToggle={() => toggleSection('offer')} />
            {sections.offer && (
              <div className="space-y-4">

                {/* Returns */}
                <div className="border border-gray-100 rounded-xl p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={form.returnsAllowed}
                      onChange={(e) => set('returnsAllowed', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Returns Allowed
                  </label>
                  {form.returnsAllowed && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label>Return Window</Label>
                        <input className="beckn-input" placeholder="P1D"
                          value={form.returnsWindow}
                          onChange={(e) => set('returnsWindow', e.target.value)} />
                      </div>
                      <div>
                        <Label>Return Method</Label>
                        <select className="beckn-input" value={form.returnsMethod}
                          onChange={(e) => set('returnsMethod', e.target.value)}>
                          {RETURN_METHODS.map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cancellation */}
                <div className="border border-gray-100 rounded-xl p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={form.cancellationAllowed}
                      onChange={(e) => set('cancellationAllowed', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Cancellation Allowed
                  </label>
                  {form.cancellationAllowed && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label>Cancellation Window</Label>
                        <input className="beckn-input" placeholder="PT30M"
                          value={form.cancellationWindow}
                          onChange={(e) => set('cancellationWindow', e.target.value)} />
                      </div>
                      <div>
                        <Label>Cutoff Event</Label>
                        <select className="beckn-input" value={form.cancellationCutoff}
                          onChange={(e) => set('cancellationCutoff', e.target.value)}>
                          {CUTOFF_EVENTS.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Replacement */}
                <div className="border border-gray-100 rounded-xl p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                    <input type="checkbox" checked={form.replacementAllowed}
                      onChange={(e) => set('replacementAllowed', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Replacement Allowed
                  </label>
                  {form.replacementAllowed && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <Label>Replacement Window</Label>
                        <input className="beckn-input" placeholder="P7D"
                          value={form.replacementWindow}
                          onChange={(e) => set('replacementWindow', e.target.value)} />
                      </div>
                      <div>
                        <Label>Return Method</Label>
                        <select className="beckn-input" value={form.replacementMethod}
                          onChange={(e) => set('replacementMethod', e.target.value)}>
                          {RETURN_METHODS.map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment */}
                <div>
                  <Label>Payment Methods</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m} type="button" onClick={() => togglePayment(m)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                          form.paymentMethods.includes(m)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={form.codAvailable}
                    onChange={(e) => set('codAvailable', e.target.checked)}
                    className="w-4 h-4 accent-blue-600" />
                  Cash on Delivery Available
                </label>
              </div>
            )}
          </div>

          {/* ── Serviceability ── */}
          <div>
            <SectionHeader title="Serviceability" open={sections.serviceability}
              onToggle={() => toggleSection('serviceability')} />
            {sections.serviceability && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Max Distance</Label>
                    <input type="number" min="0" className="beckn-input" placeholder="8"
                      value={form.maxDistance} onChange={(e) => set('maxDistance', e.target.value)} />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <select className="beckn-input" value={form.distanceUnit}
                      onChange={(e) => set('distanceUnit', e.target.value)}>
                      {['KM', 'MILE'].map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Service Days</Label>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {DAYS.map((d) => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                          form.timingDays.includes(d)
                            ? 'bg-gray-800 text-white border-gray-800'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Opens</Label>
                    <input type="time" className="beckn-input" value={form.timingStart}
                      onChange={(e) => set('timingStart', e.target.value)} />
                  </div>
                  <div>
                    <Label>Closes</Label>
                    <input type="time" className="beckn-input" value={form.timingEnd}
                      onChange={(e) => set('timingEnd', e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Holidays (ISO dates, comma-separated)</Label>
                  <input className="beckn-input" placeholder="2026-01-26, 2026-08-17"
                    value={form.holidays.join(', ')}
                    onChange={(e) =>
                      set('holidays', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
                    } />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={loading} className="beckn-btn-secondary flex-1">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="beckn-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding…</>
              : <><Plus size={14} /> Add Product</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ item, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    name:      item.name      || '',
    shortDesc: item.shortDesc || '',
    unitPrice: item.unitPrice ?? '',
    currency:  item.currency  || 'IDR',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(item.resourceId || item._id, {
      name:      form.name,
      shortDesc: form.shortDesc,
      unitPrice: parseFloat(form.unitPrice),
      currency:  form.currency,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Edit Product</h2>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label required>Product Name</Label>
            <input required className="beckn-input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label required>Short Description</Label>
            <input required className="beckn-input" value={form.shortDesc}
              onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Unit Price</Label>
              <input required type="number" min="0" step="0.01" className="beckn-input" value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
            </div>
            <div>
              <Label>Currency</Label>
              <select className="beckn-input" value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {['IDR', 'INR', 'USD'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="beckn-btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="beckn-btn-primary flex-1">
              {loading ? 'Saving…' : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ item, onConfirm, onClose, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Delete Product</h2>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-gray-900">{item.name}</span>?
            This action cannot be undone.
          </p>
          <p className="text-xs font-mono text-gray-400">ID: {item.resourceId || item._id}</p>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="beckn-btn-secondary flex-1">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600
                hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Deleting…' : <><Trash2 size={14} /> Delete</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ item, onEdit, onDelete }) {
  const price      = item.unitPrice ?? item.price?.value
  const currency   = item.currency || item.price?.currency || 'IDR'
  const name       = item.name || item.descriptor?.name || '—'
  const shortDesc  = item.shortDesc || item.descriptor?.short_desc || ''
  const imageUri   = item.imageUri || item.descriptor?.images?.[0] || null
  const resourceId = item.resourceId || item._id || item.id
  const foodClass  = item.resourceAttributes?.foodClassification
  const isActive   = item.isActive
  const isPublished = item.isPublished

  return (
    <div className="beckn-card hover:shadow-md transition-shadow flex flex-col">
      {/* Image */}
      <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden flex-shrink-0 relative">
        {imageUri ? (
          <img src={imageUri} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {isPublished && (
            <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
              Published
            </span>
          )}
          {isActive === false && (
            <span className="text-[10px] font-bold bg-gray-500 text-white px-2 py-0.5 rounded-full">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        {foodClass && (
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full w-fit
            ${foodClass === 'VEG' ? 'bg-green-50 text-green-700'
              : foodClass === 'EGG' ? 'bg-yellow-50 text-yellow-700'
              : 'bg-red-50 text-red-700'}`}>
            {foodClass}
          </span>
        )}
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 flex-1">
          {name}
        </h3>
        {shortDesc && (
          <p className="text-xs text-gray-500 line-clamp-1">{shortDesc}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-900 text-sm">
            {price != null
              ? (currency === 'IDR' ? formatIDR(price) : `${currency} ${price}`)
              : '—'}
          </p>
          {isActive !== undefined && (
            isActive
              ? <CheckCircle2 size={13} className="text-emerald-500" />
              : <XCircle size={13} className="text-gray-400" />
          )}
        </div>
        <p className="text-[10px] font-mono text-gray-400 truncate">{resourceId}</p>

        <div className="flex gap-2 pt-1">
          <button onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3
              border border-gray-200 rounded-lg text-xs font-semibold text-gray-700
              hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Edit2 size={12} /> Edit
          </button>
          <button onClick={() => onDelete(item)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3
              border border-gray-200 rounded-lg text-xs font-semibold text-gray-700
              hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="beckn-card animate-pulse">
      <div className="h-36 bg-gray-100 rounded-t-xl" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-8 bg-gray-100 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products,      setProducts]      = useState([])
  const [pagination,    setPagination]    = useState({ total: 0, totalPages: 1 })
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [page,          setPage]          = useState(1)
  const [query,         setQuery]         = useState('')
  const [showAdd,       setShowAdd]       = useState(false)
  const [editItem,      setEditItem]      = useState(null)
  const [deleteItem,    setDeleteItem]    = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast,         setToast]         = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProducts({ page, limit: PAGE_LIMIT })
      if (Array.isArray(data)) {
        setProducts(data)
        setPagination({ total: data.length, totalPages: 1 })
      } else {
        setProducts(data.products ?? data.data ?? data.items ?? [])
        const pg = data.pagination ?? {}
        setPagination({
          total:      pg.total      ?? data.total      ?? 0,
          totalPages: pg.totalPages ?? data.totalPages ?? 1,
        })
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const filtered = products.filter((p) => {
    if (!query) return true
    const name = (p.name || p.descriptor?.name || '').toLowerCase()
    const id   = (p.resourceId || p._id || '').toLowerCase()
    return name.includes(query.toLowerCase()) || id.includes(query.toLowerCase())
  })

  const handleAdded = () => {
    showToast('Product added successfully')
    fetchProducts()
  }

  const handleDeleteConfirm = async () => {
    setActionLoading(true)
    try {
      const id = deleteItem.resourceId || deleteItem._id || deleteItem.id
      await deleteProduct(id)
      setDeleteItem(null)
      showToast(`"${deleteItem.name || deleteItem.descriptor?.name}" deleted`)
      fetchProducts()
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveEdit = async (id, payload) => {
    setActionLoading(true)
    try {
      await updateProduct(id, payload)
      setEditItem(null)
      showToast(`"${payload.name}" updated`)
      fetchProducts()
    } catch (err) {
      showToast('Update failed.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const { total, totalPages } = pagination

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Loading…' : `${total} product${total !== 1 ? 's' : ''} · page ${page} of ${totalPages}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} disabled={loading} title="Refresh"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowAdd(true)} className="beckn-btn-primary">
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <ErrorBanner error={error} onRetry={fetchProducts} />}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or ID…" className="beckn-input pl-9 w-full" />
      </div>

      {/* Grid */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : error && products.length === 0 ? (
        <ErrorPage error={error} onRetry={fetchProducts} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Package size={40} className="mb-3 opacity-40" />
          <p className="font-medium text-gray-500">No products found</p>
          {query && (
            <button onClick={() => setQuery('')}
              className="mt-2 text-sm text-blue-500 hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item, i) => (
            <ProductCard
              key={item.resourceId || item._id || item.id || i}
              item={item}
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages} · {total} products</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />
      )}
      {editItem && (
        <EditModal item={editItem} loading={actionLoading}
          onClose={() => setEditItem(null)} onSave={handleSaveEdit} />
      )}
      {deleteItem && (
        <DeleteConfirmModal item={deleteItem} loading={actionLoading}
          onClose={() => setDeleteItem(null)} onConfirm={handleDeleteConfirm} />
      )}

      <Toast toast={toast} />
    </div>
  )
}
