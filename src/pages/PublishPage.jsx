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
import { addProduct, publishItems, getProducts } from '../api/bppApi'
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
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
      className="w-full flex items-center justify-between py-2 text-xs font-bold text-gray-600 uppercase tracking-wide border-b border-gray-100 mb-3">
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
  const [form, setForm]       = useState({ ...EMPTY_FORM, resourceId: autoResourceId })
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

  const handleSubmit = async (e) => {
    e?.preventDefault()
    setApiError(null)

    const errs = validate(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      // open the section that has errors
      const coreFields = ['offerId','providerId','name','shortDesc','unitPrice','brand','originCountry','weightQty','cuisine','prepInstructions']
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
        ...(form.imageUri && { imageUri: form.imageUri.trim() }),
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
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800">Add New Product</h2>
            {hasErrors && (
              <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                <AlertCircle size={11} /> Fix {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} before submitting
              </p>
            )}
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {apiError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Request failed</p>
                <p className="text-xs mt-0.5">{apiError.message || String(apiError)}</p>
              </div>
            </div>
          )}

          {/* ── Core Info ── */}
          <div>
            <SectionHeader title="Core Info" open={sections.core} onToggle={() => toggleSection('core')} />
            {sections.core && (
              <div className="space-y-3">

                <div>
                  <Label>Resource ID <span className="normal-case text-gray-400 font-normal">(auto-generated)</span></Label>
                  <div className="beckn-input bg-gray-50 text-gray-500 font-mono text-xs select-all cursor-default truncate">
                    {form.resourceId}
                  </div>
                </div>

                <div>
                  <Label required>Offer ID</Label>
                  <input className={`beckn-input ${errors.offerId ? 'border-red-400' : ''}`}
                    placeholder="offer-butter-chicken-001"
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
                  <Label>Image URL</Label>
                  <input type="url" className="beckn-input" placeholder="https://…/image.jpg"
                    value={form.imageUri} onChange={(e) => set('imageUri', e.target.value)} />
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
            <SectionHeader title="Policies & Payment" open={sections.policies}
              onToggle={() => toggleSection('policies')} />
            {sections.policies && (
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
        </div>

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
      className={`beckn-card cursor-pointer hover:shadow-md transition-all relative select-none
        ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''}
        ${isPublished ? 'border-emerald-200' : ''}`}>

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
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-xl overflow-hidden">
        {imageUri ? (
          <img src={imageUri} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={36} className="text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {foodClass && (
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full
            ${foodClass === 'VEG'     ? 'bg-green-50 text-green-700'
            : foodClass === 'EGG'    ? 'bg-yellow-50 text-yellow-700'
            : 'bg-red-50 text-red-700'}`}>
            {foodClass}
          </span>
        )}
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-1">{name}</h3>
        {shortDesc && <p className="text-xs text-gray-500 line-clamp-1">{shortDesc}</p>}
        <p className="font-bold text-gray-900 text-sm">{formatPrice(price, currency)}</p>
        <p className="text-[10px] font-mono text-gray-400 truncate">{resourceId}</p>
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
            Publishing <span className="font-semibold text-gray-900">{items.length} item{items.length !== 1 ? 's' : ''}</span> to
            the Beckn open network.
          </p>
          <div className="bg-blue-50 rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
            {items.map((id) => (
              <div key={id} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                <span className="text-gray-700 font-mono text-xs truncate">{id}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
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
    <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
      ${ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
      {ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {toast.message}
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
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Publish Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Add products and publish them to the Beckn network
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchProducts} disabled={loading} title="Refresh"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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
          { label: 'Total Products', value: products.length,                                       color: 'text-gray-700',    bg: 'bg-gray-50'    },
          { label: 'Published',      value: publishedIds.size,                                     color: 'text-emerald-700', bg: 'bg-emerald-50' },
          { label: 'Selected',       value: selected.size,                                         color: 'text-blue-700',    bg: 'bg-blue-50'    },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl p-3 ${bg}`}>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Fetch error ── */}
      {fetchError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{fetchError.message || 'Failed to load products.'}</span>
          <button onClick={fetchProducts} className="ml-auto text-xs underline font-medium">Retry</button>
        </div>
      )}

      {/* ── Search & bulk controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or resource ID…"
            className="beckn-input pl-9"
          />
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <button onClick={selectAll} className="hover:text-blue-600 font-medium transition-colors">
              Select All ({filtered.length})
            </button>
            {selected.size > 0 && (
              <>
                <span>·</span>
                <button onClick={clearSelect} className="hover:text-red-500 font-medium transition-colors">
                  Clear
                </button>
                <span className="text-blue-600 font-semibold">{selected.size} selected</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Product Grid ── */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="beckn-card animate-pulse">
              <div className="h-32 bg-gray-100 rounded-t-xl" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Package size={44} className="mb-3 opacity-40" />
          <p className="font-medium text-gray-500">
            {query ? 'No products match your search' : 'No products yet'}
          </p>
          {!query && (
            <button onClick={() => setShowAdd(true)} className="mt-4 beckn-btn-primary text-sm">
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
