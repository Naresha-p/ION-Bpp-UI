import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Package, Edit2, Trash2, X, Save, Plus,
  ChevronDown, ChevronUp, RefreshCw, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'
import { Toast, ErrorBanner, ErrorPage } from '../components/common/ErrorDisplay'
import { getProducts, addProduct, deleteProduct } from '../api/bppApi'
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
    <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-3)' }}>
      {children}{required && <span className="ml-0.5" style={{ color: '#f87171' }}>*</span>}
    </label>
  )
}

function SectionHeader({ title, open, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="section-toggle">
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
    <div className="modal-backdrop">
      <div className="modal-panel w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Add New Product</h2>
          <button onClick={onClose} disabled={loading} className="beckn-btn-ghost p-1.5">
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
                            ? 'tag-pill active-red'
                            : 'tag-pill'
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
                  <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-2)' }}>
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => set('isActive', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-2)' }}>
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
                <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--surface-r)' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
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
                <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--surface-r)' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
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
                <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--surface-r)' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
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
                            ? 'tag-pill active'
                            : 'tag-pill'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-2)' }}>
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
                            ? 'tag-pill active-dark'
                            : 'tag-pill'
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
        <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
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

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{msg}</p>
}

function SectionToggle({ title, open, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="section-toggle">
      {title}
      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  )
}

function validate(form) {
  const errs = {}
  if (!form.offerId.trim())          errs.offerId          = 'Offer ID is required'
  if (!form.providerId.trim())       errs.providerId       = 'Provider ID is required'
  if (!form.name.trim())             errs.name             = 'Product name is required'
  if (!form.shortDesc.trim())        errs.shortDesc        = 'Short description is required'
  if (!form.unitPrice)               errs.unitPrice        = 'Unit price is required'
  else if (parseFloat(form.unitPrice) < 0) errs.unitPrice  = 'Unit price must be ≥ 0'
  if (!form.brand.trim())            errs.brand            = 'Brand is required'
  if (!form.originCountry.trim())    errs.originCountry    = 'Origin country is required'
  if (!form.weightQty)               errs.weightQty        = 'Weight quantity is required'
  else if (parseFloat(form.weightQty) <= 0) errs.weightQty = 'Weight must be > 0'
  if (!form.cuisine.trim())          errs.cuisine          = 'Cuisine is required'
  if (!form.prepInstructions.trim()) errs.prepInstructions = 'Preparation instructions are required'
  return errs
}

function itemToForm(item) {
  const ra = item.resourceAttributes || {}
  const oa = item.offerAttributes    || {}
  const pol = oa.policies            || {}
  const svc = oa.serviceability      || {}
  const timing = svc.timing?.[0]     || {}
  return {
    offerId:           item.offerId              || '',
    providerId:        item.providerId           || 'provider-test-001',
    name:              item.name                 || '',
    shortDesc:         item.shortDesc            || '',
    imageUri:          item.imageUri             || '',
    unitPrice:         item.unitPrice != null ? String(item.unitPrice) : '',
    currency:          item.currency             || 'INR',
    unitCode:          item.unitCode             || 'EA',
    isActive:          item.isActive             ?? true,
    isPublished:       item.isPublished          ?? false,
    brand:             ra.brand                  || '',
    originCountry:     ra.originCountry          || 'IN',
    weightQty:         ra.weight?.unitQuantity != null ? String(ra.weight.unitQuantity) : '',
    weightUnit:        ra.weight?.unitCode       || 'GRAM',
    foodClassification: ra.foodClassification   || 'VEG',
    allergens:         ra.allergens              || [],
    cuisine:           ra.cuisine               || '',
    prepInstructions:  ra.preparation?.instructions || '',
    prepStorage:       ra.preparation?.storage   || '',
    prepShelfLife:     ra.preparation?.shelfLife || '',
    returnsAllowed:    pol.returns?.allowed       ?? false,
    returnsWindow:     pol.returns?.window        || '',
    returnsMethod:     pol.returns?.method        || 'SELLER_PICKUP',
    cancellationAllowed: pol.cancellation?.allowed ?? true,
    cancellationWindow:  pol.cancellation?.window  || 'PT30M',
    cancellationCutoff:  pol.cancellation?.cutoffEvent || 'BEFORE_PACKING',
    replacementAllowed:  pol.replacement?.allowed  ?? false,
    replacementWindow:   pol.replacement?.window   || '',
    replacementMethod:   pol.replacement?.method   || 'SELLER_PICKUP',
    codAvailable:      oa.paymentConstraints?.codAvailable  ?? true,
    paymentMethods:    oa.paymentConstraints?.paymentMethods || ['COD', 'UPI'],
    maxDistance:       svc.maxDistance != null ? String(svc.maxDistance) : '8',
    distanceUnit:      svc.unit        || 'KM',
    timingDays:        timing.daysOfWeek || [...DAYS],
    timingStart:       timing.timeRange?.start || '11:00',
    timingEnd:         timing.timeRange?.end   || '22:00',
    holidays:          oa.holidays     || [],
  }
}

function EditModal({ item, onClose, onSaved }) {
  const resourceId = item.resourceId || item._id || item.id

  const [form, setForm]       = useState(() => itemToForm(item))
  const [errors, setErrors]   = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState({ core: true, policies: false, serviceability: false })

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
    setErrors((e) => { const n = { ...e }; delete n[key]; return n })
  }

  const toggleSection  = (k) => setSections((s) => ({ ...s, [k]: !s[k] }))
  const toggleAllergen = (a) => set('allergens',
    form.allergens.includes(a) ? form.allergens.filter((x) => x !== a) : [...form.allergens, a])
  const toggleDay      = (d) => set('timingDays',
    form.timingDays.includes(d) ? form.timingDays.filter((x) => x !== d) : [...form.timingDays, d])
  const togglePayment  = (m) => set('paymentMethods',
    form.paymentMethods.includes(m) ? form.paymentMethods.filter((x) => x !== m) : [...form.paymentMethods, m])

  const handleSubmit = async () => {
    setApiError(null)
    const errs = validate(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      const coreFields = ['offerId','providerId','name','shortDesc','unitPrice','brand','originCountry','weightQty','cuisine','prepInstructions']
      if (coreFields.some((k) => errs[k])) setSections((s) => ({ ...s, core: true }))
      return
    }

    setLoading(true)
    try {
      const payload = {
        resourceId,
        offerId:     form.offerId.trim(),
        providerId:  form.providerId.trim(),
        name:        form.name.trim(),
        shortDesc:   form.shortDesc.trim(),
        ...(form.imageUri && { imageUri: form.imageUri.trim() }),
        unitPrice:   parseFloat(form.unitPrice),
        currency:    form.currency,
        unitCode:    form.unitCode,
        resourceAttributes: {
          brand:              form.brand.trim(),
          originCountry:      form.originCountry.trim(),
          weight: { unitQuantity: parseFloat(form.weightQty), unitCode: form.weightUnit },
          foodClassification: form.foodClassification,
          ...(form.allergens.length && { allergens: form.allergens }),
          cuisine:     form.cuisine.trim(),
          preparation: {
            instructions: form.prepInstructions.trim(),
            ...(form.prepStorage   && { storage:   form.prepStorage.trim() }),
            ...(form.prepShelfLife && { shelfLife: form.prepShelfLife.trim() }),
          },
        },
        offerAttributes: {
          policies: {
            returns:      { allowed: form.returnsAllowed,      ...(form.returnsAllowed      && form.returnsWindow      && { window: form.returnsWindow }),      ...(form.returnsAllowed      && { method: form.returnsMethod }) },
            cancellation: { allowed: form.cancellationAllowed, ...(form.cancellationAllowed && form.cancellationWindow && { window: form.cancellationWindow }), ...(form.cancellationAllowed && { cutoffEvent: form.cancellationCutoff }) },
            replacement:  { allowed: form.replacementAllowed,  ...(form.replacementAllowed  && form.replacementWindow  && { window: form.replacementWindow }),  ...(form.replacementAllowed  && { method: form.replacementMethod }) },
          },
          paymentConstraints: { codAvailable: form.codAvailable, paymentMethods: form.paymentMethods },
          serviceability: {
            maxDistance: parseFloat(form.maxDistance) || 8,
            unit:        form.distanceUnit,
            timing: [{ daysOfWeek: form.timingDays, timeRange: { start: form.timingStart, end: form.timingEnd } }],
          },
          ...(form.holidays.length && { holidays: form.holidays }),
        },
        isActive:    form.isActive,
        isPublished: form.isPublished,
      }

      const result = await addProduct(payload)

      if (result?.message?.ack?.status === 'NACK') {
        setApiError({ message: result.error || 'Server returned NACK — please check your input.' })
        return
      }

      onSaved(form.name.trim())
      onClose()
    } catch (err) {
      setApiError(err)
    } finally {
      setLoading(false)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="modal-backdrop">
      <div className="modal-panel w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Edit Product</h2>
            {hasErrors && (
              <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                <AlertCircle size={11} /> Fix {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} before saving
              </p>
            )}
          </div>
          <button onClick={onClose} disabled={loading} className="beckn-btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {apiError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Save failed</p>
                <p className="text-xs mt-0.5">{apiError.message || String(apiError)}</p>
              </div>
            </div>
          )}

          {/* ── Core Info ── */}
          <div>
            <SectionToggle title="Core Info" open={sections.core} onToggle={() => toggleSection('core')} />
            {sections.core && (
              <div className="space-y-3">

                {/* Resource ID — read-only */}
                <div>
                  <Label>Resource ID <span className="normal-case text-gray-400 font-normal">(read-only)</span></Label>
                  <div className="beckn-input font-mono text-xs select-all cursor-default truncate" style={{ background: 'var(--surface-r)', color: 'var(--text-3)' }}>
                    {resourceId}
                  </div>
                </div>

                <div>
                  <Label required>Offer ID</Label>
                  <input className={`beckn-input ${errors.offerId ? 'border-red-400' : ''}`}
                    value={form.offerId} onChange={(e) => set('offerId', e.target.value)} />
                  <FieldError msg={errors.offerId} />
                </div>

                <div>
                  <Label required>Provider ID</Label>
                  <input className={`beckn-input ${errors.providerId ? 'border-red-400' : ''}`}
                    value={form.providerId} onChange={(e) => set('providerId', e.target.value)} />
                  <FieldError msg={errors.providerId} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Product Name</Label>
                    <input className={`beckn-input ${errors.name ? 'border-red-400' : ''}`}
                      value={form.name} onChange={(e) => set('name', e.target.value)} />
                    <FieldError msg={errors.name} />
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
                  <input className={`beckn-input ${errors.shortDesc ? 'border-red-400' : ''}`}
                    value={form.shortDesc} onChange={(e) => set('shortDesc', e.target.value)} />
                  <FieldError msg={errors.shortDesc} />
                </div>

                <div>
                  <Label>Image URL</Label>
                  <input type="url" className="beckn-input" placeholder="https://…/image.jpg"
                    value={form.imageUri} onChange={(e) => set('imageUri', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Unit Price</Label>
                    <input type="number" min="0" step="0.01"
                      className={`beckn-input ${errors.unitPrice ? 'border-red-400' : ''}`}
                      value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} />
                    <FieldError msg={errors.unitPrice} />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <select className="beckn-input" value={form.currency}
                      onChange={(e) => set('currency', e.target.value)}>
                      {['INR', 'IDR', 'USD'].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Brand</Label>
                    <input className={`beckn-input ${errors.brand ? 'border-red-400' : ''}`}
                      value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                    <FieldError msg={errors.brand} />
                  </div>
                  <div>
                    <Label required>Origin Country</Label>
                    <input className={`beckn-input ${errors.originCountry ? 'border-red-400' : ''}`}
                      value={form.originCountry} onChange={(e) => set('originCountry', e.target.value)} />
                    <FieldError msg={errors.originCountry} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Cuisine</Label>
                    <input className={`beckn-input ${errors.cuisine ? 'border-red-400' : ''}`}
                      value={form.cuisine} onChange={(e) => set('cuisine', e.target.value)} />
                    <FieldError msg={errors.cuisine} />
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
                    <input type="number" min="0" step="0.1"
                      className={`beckn-input ${errors.weightQty ? 'border-red-400' : ''}`}
                      value={form.weightQty} onChange={(e) => set('weightQty', e.target.value)} />
                    <FieldError msg={errors.weightQty} />
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
                            ? 'tag-pill active-red'
                            : 'tag-pill'
                        }`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label required>Prep Instructions</Label>
                    <input className={`beckn-input ${errors.prepInstructions ? 'border-red-400' : ''}`}
                      value={form.prepInstructions}
                      onChange={(e) => set('prepInstructions', e.target.value)} />
                    <FieldError msg={errors.prepInstructions} />
                  </div>
                  <div>
                    <Label>Storage</Label>
                    <input className="beckn-input"
                      value={form.prepStorage} onChange={(e) => set('prepStorage', e.target.value)} />
                  </div>
                  <div>
                    <Label>Shelf Life</Label>
                    <input className="beckn-input" placeholder="PT4H"
                      value={form.prepShelfLife} onChange={(e) => set('prepShelfLife', e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-2)' }}>
                    <input type="checkbox" checked={form.isActive}
                      onChange={(e) => set('isActive', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-2)' }}>
                    <input type="checkbox" checked={form.isPublished}
                      onChange={(e) => set('isPublished', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Published
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ── Policies & Payment ── */}
          <div>
            <SectionToggle title="Policies & Payment" open={sections.policies}
              onToggle={() => toggleSection('policies')} />
            {sections.policies && (
              <div className="space-y-4">
                <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--surface-r)' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
                    <input type="checkbox" checked={form.returnsAllowed}
                      onChange={(e) => set('returnsAllowed', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Returns Allowed
                  </label>
                  {form.returnsAllowed && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div><Label>Return Window</Label>
                        <input className="beckn-input" placeholder="P1D" value={form.returnsWindow}
                          onChange={(e) => set('returnsWindow', e.target.value)} /></div>
                      <div><Label>Return Method</Label>
                        <select className="beckn-input" value={form.returnsMethod}
                          onChange={(e) => set('returnsMethod', e.target.value)}>
                          {RETURN_METHODS.map((m) => <option key={m}>{m}</option>)}
                        </select></div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--surface-r)' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
                    <input type="checkbox" checked={form.cancellationAllowed}
                      onChange={(e) => set('cancellationAllowed', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Cancellation Allowed
                  </label>
                  {form.cancellationAllowed && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div><Label>Cancellation Window</Label>
                        <input className="beckn-input" placeholder="PT30M" value={form.cancellationWindow}
                          onChange={(e) => set('cancellationWindow', e.target.value)} /></div>
                      <div><Label>Cutoff Event</Label>
                        <select className="beckn-input" value={form.cancellationCutoff}
                          onChange={(e) => set('cancellationCutoff', e.target.value)}>
                          {CUTOFF_EVENTS.map((c) => <option key={c}>{c}</option>)}
                        </select></div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl p-3 space-y-2" style={{ border: '1px solid var(--border)', background: 'var(--surface-r)' }}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
                    <input type="checkbox" checked={form.replacementAllowed}
                      onChange={(e) => set('replacementAllowed', e.target.checked)}
                      className="w-4 h-4 accent-blue-600" />
                    Replacement Allowed
                  </label>
                  {form.replacementAllowed && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div><Label>Replacement Window</Label>
                        <input className="beckn-input" placeholder="P7D" value={form.replacementWindow}
                          onChange={(e) => set('replacementWindow', e.target.value)} /></div>
                      <div><Label>Method</Label>
                        <select className="beckn-input" value={form.replacementMethod}
                          onChange={(e) => set('replacementMethod', e.target.value)}>
                          {RETURN_METHODS.map((m) => <option key={m}>{m}</option>)}
                        </select></div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Payment Methods</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m} type="button" onClick={() => togglePayment(m)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                          form.paymentMethods.includes(m)
                            ? 'tag-pill active'
                            : 'tag-pill'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--text-2)' }}>
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
            <SectionToggle title="Serviceability" open={sections.serviceability}
              onToggle={() => toggleSection('serviceability')} />
            {sections.serviceability && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Max Distance</Label>
                    <input type="number" min="0" className="beckn-input" value={form.maxDistance}
                      onChange={(e) => set('maxDistance', e.target.value)} /></div>
                  <div><Label>Unit</Label>
                    <select className="beckn-input" value={form.distanceUnit}
                      onChange={(e) => set('distanceUnit', e.target.value)}>
                      {['KM', 'MILE'].map((u) => <option key={u}>{u}</option>)}
                    </select></div>
                </div>

                <div>
                  <Label>Service Days</Label>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {DAYS.map((d) => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                          form.timingDays.includes(d)
                            ? 'tag-pill active-dark'
                            : 'tag-pill'
                        }`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Opens</Label>
                    <input type="time" className="beckn-input" value={form.timingStart}
                      onChange={(e) => set('timingStart', e.target.value)} /></div>
                  <div><Label>Closes</Label>
                    <input type="time" className="beckn-input" value={form.timingEnd}
                      onChange={(e) => set('timingEnd', e.target.value)} /></div>
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" onClick={onClose} disabled={loading} className="beckn-btn-secondary flex-1">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="beckn-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({ item, onConfirm, onClose, loading }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-panel w-full max-w-sm">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Delete Product</h2>
          <button onClick={onClose} disabled={loading} className="beckn-btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Are you sure you want to delete{' '}
            <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{item.name}</span>?
            This action cannot be undone.
          </p>
          <p className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>ID: {item.resourceId || item._id}</p>
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

function ProductCard({ item, onEdit }) {
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
    <div className="beckn-card flex flex-col hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* Image */}
      <div className="h-36 rounded-t-xl overflow-hidden flex-shrink-0 relative"
        style={{ background: 'var(--surface-r)' }}>
        {imageUri ? (
          <img src={imageUri} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} style={{ color: 'var(--text-3)' }} />
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {isPublished && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }}>
              Published
            </span>
          )}
          {isActive === false && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--surface-o)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        {foodClass && (
          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full w-fit"
            style={
              foodClass === 'VEG'
                ? { background: 'rgba(34,197,94,0.1)',  color: '#86efac',  border: '1px solid rgba(34,197,94,0.2)' }
                : foodClass === 'EGG'
                ? { background: 'rgba(234,179,8,0.1)',  color: '#fde047',  border: '1px solid rgba(234,179,8,0.2)' }
                : { background: 'rgba(239,68,68,0.1)',  color: '#fca5a5',  border: '1px solid rgba(239,68,68,0.2)' }
            }>
            {foodClass}
          </span>
        )}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1" style={{ color: 'var(--text-1)' }}>
          {name}
        </h3>
        {shortDesc && (
          <p className="text-xs line-clamp-1" style={{ color: 'var(--text-3)' }}>{shortDesc}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>
            {price != null ? (currency === 'IDR' ? formatIDR(price) : `${currency} ${price}`) : '—'}
          </p>
          {isActive !== undefined && (
            isActive
              ? <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
              : <XCircle size={13} style={{ color: 'var(--text-3)' }} />
          )}
        </div>
        <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-3)' }}>{resourceId}</p>

        <div className="flex gap-1.5 pt-1">
          <button onClick={() => onEdit(item)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-2)', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.background = 'transparent' }}>
            <Edit2 size={12} /> Edit
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="beckn-card overflow-hidden">
      <div className="h-36 rounded-t-xl skeleton" />
      <div className="p-3 space-y-2.5">
        <div className="h-3 skeleton rounded w-14" />
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-full" />
        <div className="h-4 skeleton rounded w-1/3" />
        <div className="h-8 skeleton rounded-lg" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,      setProducts]      = useState([])
  const [pagination,    setPagination]    = useState({ total: 0, totalPages: 1 })
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [page,          setPage]          = useState(1)
  const [query,         setQuery]         = useState(() => searchParams.get('q') || '')
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

  const handleSaveEdit = (name) => {
    showToast(`"${name}" updated successfully`)
    fetchProducts()
  }

  const { total, totalPages } = pagination

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Products</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {loading ? 'Loading…' : `${total} product${total !== 1 ? 's' : ''} · page ${page} of ${totalPages}`}
          </p>
        </div>
        <button onClick={fetchProducts} disabled={loading} className="beckn-btn-ghost p-2 rounded-lg">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && <ErrorBanner error={error} onRetry={fetchProducts} />}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
        <input value={query} onChange={(e) => {
            const v = e.target.value
            setQuery(v)
            setSearchParams(v ? { q: v } : {}, { replace: true })
          }}
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
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
            <Package size={24} style={{ color: 'var(--text-3)' }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-2)' }}>No products found</p>
          {query && (
            <button onClick={() => { setQuery(''); setSearchParams({}, { replace: true }) }}
              className="mt-2 text-xs font-medium" style={{ color: '#a5b4fc' }}>
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
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-3)' }}>
          <span>Page {page} of {totalPages} · {total} products</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="beckn-btn-secondary py-1.5 px-3 text-xs disabled:opacity-30">
              ← Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="beckn-btn-secondary py-1.5 px-3 text-xs disabled:opacity-30">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {editItem && (
        <EditModal item={editItem}
          onClose={() => setEditItem(null)} onSaved={handleSaveEdit} />
      )}
      {deleteItem && (
        <DeleteConfirmModal item={deleteItem} loading={actionLoading}
          onClose={() => setDeleteItem(null)} onConfirm={handleDeleteConfirm} />
      )}

      <Toast toast={toast} />
    </div>
  )
}
