/**
 * PublishPage — Add products and publish them to the Beckn network
 *
 * Add Product  → POST /resources/add
 * Publish      → POST /publish  { resourceIds: [...] }
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  Plus, Upload, Package, Globe, RefreshCw, Search,
  CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp,
} from 'lucide-react'
import { addProduct, publishItems, getProducts, getProviders } from '../api/bppApi'
import { Toast, ErrorBanner } from '../components/common/ErrorDisplay'

// ─── Constants ────────────────────────────────────────────────────────────────

const UNIT_CODES      = ['EA', 'KG', 'G', 'L', 'ML', 'PACK']
const WEIGHT_UNITS    = ['GRAM', 'KG', 'ML', 'L']
const FOOD_CLASS      = ['VEG', 'NON_VEG', 'EGG']
const ALLERGENS       = ['GLUTEN', 'DAIRY', 'EGGS', 'NUTS', 'PEANUTS', 'SOY', 'FISH', 'SHELLFISH', 'SESAME']
const PAYMENT_METHODS = ['COD', 'UPI', 'PREPAID', 'CARD']
const CUTOFF_EVENTS   = ['BEFORE_PACKING', 'BEFORE_DISPATCH']
const RETURN_METHODS  = ['SELLER_PICKUP', 'BUYER_DROP']
const DAYS            = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const EMPTY_FORM = {
  // Required top-level (resourceId is auto-generated per modal open)
  offerId: '', providerId: 'provider-test-001',
  name: '', shortDesc: '', imageUri: '',
  unitPrice: '', currency: 'INR', unitCode: 'EA',
  isActive: true, isPublished: false,
  // resourceAttributes — all required
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
  codAvailable: true, paymentMethods: ['COD', 'UPI'],
  // serviceability
  maxDistance: '8', distanceUnit: 'KM',
  timingDays: [...DAYS], timingStart: '11:00', timingEnd: '22:00',
  holidays: [],
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form) {
  const errs = {}
  if (!form.providerId)              errs.providerId       = 'Please select a provider'
  if (!form.name.trim())             errs.name             = 'Product name is required'
  if (!form.shortDesc.trim())        errs.shortDesc        = 'Short description is required'
  if (!form.unitPrice)               errs.unitPrice        = 'Unit price is required'
  else if (parseFloat(form.unitPrice) < 0) errs.unitPrice  = 'Unit price must be ≥ 0'
  if (!form.imageUri.trim())         errs.imageUri         = 'Image URL is required'
  if (!form.brand.trim())            errs.brand            = 'Brand is required'
  if (!form.originCountry.trim())    errs.originCountry    = 'Origin country is required'
  if (!form.weightQty)               errs.weightQty        = 'Weight quantity is required'
  else if (parseFloat(form.weightQty) <= 0) errs.weightQty = 'Weight must be > 0'
  if (!form.cuisine.trim())          errs.cuisine          = 'Cuisine is required'
  if (!form.prepInstructions.trim()) errs.prepInstructions = 'Preparation instructions are required'
  return errs
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-3)' }}>
      {children}{required && <span className="ml-0.5" style={{ color: '#f87171' }}>*</span>}
    </label>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{msg}</p>
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

function formatPrice(price, currency) {
  if (price == null) return '—'
  if (currency === 'INR') return `₹${Number(price).toLocaleString('en-IN')}`
  if (currency === 'IDR') return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
  return `${currency} ${price}`
}

// ─── Add Product Modal ────────────────────────────────────────────────────────

function AddProductModal({ onClose, onAdded }) {
  const autoResourceId = useMemo(() => `item-${uuidv4()}`, [])
  const autoOfferId    = useMemo(() => `offer-${uuidv4()}`, [])
  const [form, setForm]         = useState({
    ...EMPTY_FORM,
    resourceId: autoResourceId,
    offerId:    autoOfferId,
    providerId: '',   // filled when provider is selected
  })
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [sections, setSections] = useState({ core: true, policies: false, serviceability: false })

  // Providers list
  const [providers, setProviders]           = useState([])
  const [providersLoading, setProvidersLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState(null)

  useEffect(() => {
    getProviders()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.providers ?? [])
        setProviders(list)
        if (list.length > 0) {
          setSelectedProvider(list[0])
          setForm((f) => ({ ...f, providerId: list[0].providerId || list[0].id || list[0]._id || '' }))
        }
      })
      .catch(() => {})
      .finally(() => setProvidersLoading(false))
  }, [])

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

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setApiError(null)

    const errs = validate(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      // open the section that has errors
      const coreFields = ['providerId','name','shortDesc','imageUri','unitPrice','brand','originCountry','weightQty','cuisine','prepInstructions']
      if (coreFields.some((k) => errs[k])) setSections((s) => ({ ...s, core: true }))
      return
    }

    setLoading(true)
    try {
      const payload = {
        resourceId:  form.resourceId.trim(),
        offerId:     form.offerId.trim(),
        providerId:  form.providerId.trim(),
        name:        form.name.trim(),
        shortDesc:   form.shortDesc.trim(),
        imageUri:    form.imageUri.trim(),
        unitPrice:   parseFloat(form.unitPrice),
        currency:    form.currency,
        unitCode:    form.unitCode,
        resourceAttributes: {
          brand:              form.brand.trim(),
          originCountry:      form.originCountry.trim(),
          weight: {
            unitQuantity: parseFloat(form.weightQty),
            unitCode:     form.weightUnit,
          },
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
            returns: {
              allowed: form.returnsAllowed,
              ...(form.returnsAllowed && form.returnsWindow && { window: form.returnsWindow }),
              ...(form.returnsAllowed && { method: form.returnsMethod }),
            },
            cancellation: {
              allowed: form.cancellationAllowed,
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
            maxDistance: parseFloat(form.maxDistance) || 8,
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

      // Check for NACK
      if (result?.message?.ack?.status === 'NACK') {
        setApiError({ message: result.error || 'Server returned NACK — please check your input.' })
        return
      }

      onAdded(payload)
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
            <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Add New Product</h2>
            {hasErrors && (
              <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                <AlertCircle size={11} /> Fix {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} before submitting
              </p>
            )}
          </div>
          <button onClick={onClose} disabled={loading} className="beckn-btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {apiError && (
            <ErrorBanner error={apiError} onDismiss={() => setApiError(null)} />
          )}

          {/* ── Core Info ── */}
          <div>
            <SectionHeader title="Core Info" open={sections.core} onToggle={() => toggleSection('core')} />
            {sections.core && (
              <div className="space-y-3">

                {/* <div>
                  <Label>Resource ID <span className="normal-case font-normal" style={{ color: 'var(--text-3)' }}>(auto-generated)</span></Label>
                  <div className="beckn-input font-mono text-xs select-all cursor-default truncate" style={{ background: 'var(--surface-r)', color: 'var(--text-3)' }}>
                    {form.resourceId}
                  </div>
                </div>

                <div>
                  <Label>Offer ID</Label>
                  <input readOnly className="beckn-input opacity-60 cursor-default select-all"
                    value={form.offerId} />
                </div> */}

                <div>
                  <Label required>Provider Name</Label>
                  {providersLoading ? (
                    <div className="beckn-input animate-pulse bg-gray-100 text-transparent select-none">Loading…</div>
                  ) : (
                    <select
                      className={`beckn-input ${errors.providerId ? 'border-red-400' : ''}`}
                      value={selectedProvider?.providerId || selectedProvider?.id || ''}
                      onChange={(e) => {
                        const found = providers.find(
                          (p) => (p.providerId || p.id || p._id) === e.target.value
                        )
                        setSelectedProvider(found || null)
                        set('providerId', e.target.value)
                      }}>
                      <option value="">— Select provider —</option>
                      {providers.map((p) => {
                        const id   = p.providerId || p.id || p._id || ''
                        const name = p.name || p.providerName || id
                        return <option key={id} value={id}>{name}</option>
                      })}
                    </select>
                  )}
                  <FieldError msg={errors.providerId} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Product Name</Label>
                    <input className={`beckn-input ${errors.name ? 'border-red-400' : ''}`}
                      placeholder="Butter Chicken"
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
                    placeholder="Tender chicken in a rich tomato-butter gravy"
                    value={form.shortDesc} onChange={(e) => set('shortDesc', e.target.value)} />
                  <FieldError msg={errors.shortDesc} />
                </div>

                <div>
                  <Label required>Image URL</Label>
                  <input type="url" className={`beckn-input ${errors.imageUri ? 'border-red-400' : ''}`}
                    placeholder="https://…/image.jpg"
                    value={form.imageUri} onChange={(e) => set('imageUri', e.target.value)} />
                  <FieldError msg={errors.imageUri} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Unit Price</Label>
                    <input type="number" min="0" step="0.01"
                      className={`beckn-input ${errors.unitPrice ? 'border-red-400' : ''}`}
                      placeholder="280"
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

                {/* resourceAttributes */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Brand</Label>
                    <input className={`beckn-input ${errors.brand ? 'border-red-400' : ''}`}
                      placeholder="Spice Garden"
                      value={form.brand} onChange={(e) => set('brand', e.target.value)} />
                    <FieldError msg={errors.brand} />
                  </div>
                  <div>
                    <Label required>Origin Country</Label>
                    <input className={`beckn-input ${errors.originCountry ? 'border-red-400' : ''}`}
                      placeholder="IN"
                      value={form.originCountry} onChange={(e) => set('originCountry', e.target.value)} />
                    <FieldError msg={errors.originCountry} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Cuisine</Label>
                    <input className={`beckn-input ${errors.cuisine ? 'border-red-400' : ''}`}
                      placeholder="North Indian"
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
                      placeholder="350"
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
                        className={form.allergens.includes(a) ? 'tag-pill active-red' : 'tag-pill'}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label required>Prep Instructions</Label>
                    <input className={`beckn-input ${errors.prepInstructions ? 'border-red-400' : ''}`}
                      placeholder="Heat and serve"
                      value={form.prepInstructions}
                      onChange={(e) => set('prepInstructions', e.target.value)} />
                    <FieldError msg={errors.prepInstructions} />
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
            <SectionHeader title="Policies & Payment" open={sections.policies}
              onToggle={() => toggleSection('policies')} />
            {sections.policies && (
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
                        <Label>Method</Label>
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
                        className={form.paymentMethods.includes(m) ? 'tag-pill active' : 'tag-pill'}>
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
                        className={form.timingDays.includes(d) ? 'tag-pill active-dark' : 'tag-pill'}>
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
        </div>

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

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ item, isSelected, isPublished, onToggle }) {
  const name       = item.name        || item.descriptor?.name  || '—'
  const price      = item.unitPrice   ?? item.price?.value
  const currency   = item.currency    || item.price?.currency   || 'INR'
  const imageUri   = item.imageUri    || item.descriptor?.images?.[0] || null
  const resourceId = item.resourceId  || item._id               || item.id
  const foodClass  = item.resourceAttributes?.foodClassification
  const shortDesc  = item.shortDesc   || item.descriptor?.short_desc || ''

  return (
    <div
      onClick={() => onToggle(resourceId)}
      className={`beckn-card cursor-pointer hover:shadow-card-hover transition-all relative select-none
        ${isSelected ? 'ring-2 ring-indigo-500 shadow-glow-blue' : ''}
        ${isPublished ? 'ring-1 ring-emerald-500/40' : ''}`}>

      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(resourceId)}
          onClick={(e) => e.stopPropagation()}
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
      <div className="h-32 rounded-t-xl overflow-hidden" style={{ background: 'var(--surface-r)' }}>
        {imageUri ? (
          <img src={imageUri} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} style={{ color: 'var(--text-3)', opacity: 0.4 }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {foodClass && (
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full
            ${foodClass === 'VEG'  ? 'bg-green-500/15 text-green-400'
            : foodClass === 'EGG' ? 'bg-yellow-500/15 text-yellow-400'
            : 'bg-red-500/15 text-red-400'}`}>
            {foodClass}
          </span>
        )}
        <h3 className="font-semibold text-sm leading-tight line-clamp-1" style={{ color: 'var(--text-1)' }}>{name}</h3>
        {shortDesc && <p className="text-xs line-clamp-1" style={{ color: 'var(--text-3)' }}>{shortDesc}</p>}
        <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{formatPrice(price, currency)}</p>
        <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-3)' }}>{resourceId}</p>
      </div>
    </div>
  )
}

// ─── Confirm Publish Modal ────────────────────────────────────────────────────

function ConfirmPublishModal({ items, onConfirm, onClose, loading }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-panel w-full max-w-md">
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-blue-600" />
            <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Publish to Beckn Network</h2>
          </div>
          <button onClick={onClose} disabled={loading} className="beckn-btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Publishing <span className="font-semibold" style={{ color: 'var(--text-1)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span> to
            the Beckn open network.
          </p>
          <div className="rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto" style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
            {items.map((id) => (
              <div key={id} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#a5b4fc' }} />
                <span className="font-mono text-xs truncate" style={{ color: 'var(--text-2)' }}>{id}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#fbbf24' }} />
            <p className="text-xs" style={{ color: '#fcd34d' }}>
              Published items become live immediately and can be ordered by network participants.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="beckn-btn-secondary flex-1">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="beckn-btn-primary flex-1">
              {loading
                ? <><RefreshCw size={14} className="animate-spin" /> Publishing…</>
                : <><Upload size={14} /> Publish Now</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Toast wrapper ────────────────────────────────────────────────────────────

function ToastMsg({ toast }) {
  if (!toast) return null
  const ok = toast.type === 'success'
  return (
    <div className={ok ? 'toast-success' : 'toast-error'}>
      {ok
        ? <CheckCircle2 size={15} style={{ color: '#86efac', flexShrink: 0 }} />
        : <AlertCircle  size={15} style={{ color: '#fda4af', flexShrink: 0 }} />}
      <span>{toast.message}</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublishPage() {
  const [products,       setProducts]       = useState([])
  const [loading,        setLoading]        = useState(false)
  const [fetchError,     setFetchError]     = useState(null)
  const [publishLoading, setPublishLoading] = useState(false)
  const [selected,       setSelected]       = useState(new Set())   // resourceIds
  const [publishedIds,   setPublishedIds]   = useState(new Set())   // track locally after publish
  const [query,          setQuery]          = useState('')
  const [showAdd,        setShowAdd]        = useState(false)
  const [showConfirm,    setShowConfirm]    = useState(false)
  const [toast,          setToast]          = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch products ────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const data = await getProducts({ page: 1, limit: 100 })
      const list = Array.isArray(data)
        ? data
        : data.products ?? data.data ?? data.items ?? []
      setProducts(list)

      // Sync published state from API response
      const alreadyPublished = list
        .filter((p) => p.isPublished)
        .map((p) => p.resourceId || p._id || p.id)
      if (alreadyPublished.length) {
        setPublishedIds((prev) => new Set([...prev, ...alreadyPublished]))
      }
    } catch (err) {
      setFetchError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = products.filter((p) => {
    if (!query) return true
    const name = (p.name || p.descriptor?.name || '').toLowerCase()
    const id   = (p.resourceId || p._id || '').toLowerCase()
    return name.includes(query.toLowerCase()) || id.includes(query.toLowerCase())
  })

  const selectedList = [...selected]

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll   = () => setSelected(new Set(filtered.map((p) => p.resourceId || p._id || p.id)))
  const clearSelect = () => setSelected(new Set())

  const handleAdded = (addedItem) => {
    // Prepend optimistically; fetchProducts will reconcile
    setProducts((prev) => [addedItem, ...prev])
    showToast(`"${addedItem.name}" added — select it below to publish`)
  }

  const handlePublish = async () => {
    setPublishLoading(true)
    try {
      const result = await publishItems(selectedList)

      if (result?.message?.ack?.status === 'NACK') {
        showToast(result.error || 'Publish failed — server returned NACK', 'error')
        return
      }

      setPublishedIds((prev) => new Set([...prev, ...selectedList]))
      showToast(`${selectedList.length} item${selectedList.length !== 1 ? 's' : ''} published successfully!`)
      setSelected(new Set())
      setShowConfirm(false)
      fetchProducts() // refresh to get server-side isPublished flags
    } catch (err) {
      showToast(err.message || 'Publish failed. Please try again.', 'error')
    } finally {
      setPublishLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Publish Catalog</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Add products and publish them to the Beckn network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} disabled={loading} title="Refresh"
            className="beckn-btn-secondary text-xs py-1.5 px-3">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
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

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Products', value: products.length,  accent: 'rgba(99,102,241,0.1)',   border: 'rgba(99,102,241,0.2)',  text: '#a5b4fc' },
          { label: 'Published',      value: publishedIds.size, accent: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)',   text: '#86efac' },
          { label: 'Selected',       value: selected.size,     accent: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.2)',  text: '#fdba74' },
        ].map(({ label, value, accent, border, text }) => (
          <div key={label} className="beckn-card p-3" style={{ background: accent, borderColor: border }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: text }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Fetch error ── */}
      {fetchError && <ErrorBanner error={fetchError} onRetry={fetchProducts} onDismiss={() => setFetchError(null)} />}

      {/* ── Search & bulk controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or resource ID…"
            className="beckn-input pl-9"
          />
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
            <button onClick={selectAll} className="font-medium transition-colors hover:opacity-80" style={{ color: '#a5b4fc' }}>
              Select All ({filtered.length})
            </button>
            {selected.size > 0 && (
              <>
                <span>·</span>
                <button onClick={clearSelect} className="font-medium transition-colors hover:opacity-80" style={{ color: '#f87171' }}>
                  Clear
                </button>
                <span className="font-semibold" style={{ color: '#a5b4fc' }}>{selected.size} selected</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Product Grid ── */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="beckn-card overflow-hidden">
              <div className="h-32 skeleton rounded-t-xl rounded-b-none" />
              <div className="p-3 space-y-2">
                <div className="h-3 skeleton rounded w-16" />
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-3 skeleton rounded w-full" />
                <div className="h-4 skeleton rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
            <Package size={28} style={{ color: 'var(--text-3)' }} />
          </div>
          <p className="font-medium" style={{ color: 'var(--text-2)' }}>
            {query ? 'No products match your search' : 'No products yet'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            {query ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
          {!query && (
            <button onClick={() => setShowAdd(true)} className="mt-5 beckn-btn-primary text-sm">
              <Plus size={14} /> Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item, i) => {
            const id = item.resourceId || item._id || item.id || String(i)
            return (
              <ProductCard
                key={id}
                item={item}
                isSelected={selected.has(id)}
                isPublished={publishedIds.has(id) || item.isPublished}
                onToggle={toggleSelect}
              />
            )
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />
      )}
      {showConfirm && (
        <ConfirmPublishModal
          items={selectedList}
          onConfirm={handlePublish}
          onClose={() => setShowConfirm(false)}
          loading={publishLoading}
        />
      )}

      <ToastMsg toast={toast} />
    </div>
  )
}
