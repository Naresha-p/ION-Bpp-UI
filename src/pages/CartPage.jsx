/**
 * CartPage — Manages the Beckn select → init → confirm flow
 * Each step maps to a Beckn API call:
 *   1. Cart review    → on_select  (quote generation)
 *   2. Billing form   → on_init    (payment terms)
 *   3. Confirm order  → on_confirm (order creation)
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, CheckCircle2, Package } from 'lucide-react'
import useBecknStore from '../store/becknStore'
import { useBeckn } from '../hooks/useBeckn'

const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const STEPS = ['Review Cart', 'Billing & Delivery', 'Confirm Order']

const BILLING_INITIAL = {
  name: '', phone: '', email: '',
  address: { street: '', city: 'Bandung', state: 'West Java', country: 'IDN' },
}

export default function CartPage() {
  const navigate  = useNavigate()
  const store     = useBecknStore()
  const { select, init, confirm, loading } = useBeckn()

  const [step,    setStep]    = useState(0)   // 0=cart 1=billing 2=confirm
  const [billing, setBilling] = useState(BILLING_INITIAL)
  const [quote,   setQuote]   = useState(null)
  const [placed,  setPlaced]  = useState(false)

  const cartTotal = store.cart.reduce(
    (s, i) => s + parseFloat(i.price?.value || 0) * i.quantity, 0
  )

  // Step 0 → 1: call beckn select
  const handleSelectStep = async () => {
    const res = await select(store.provider.id, store.cart)
    setQuote(res?.message?.order?.quote || null)
    setStep(1)
  }

  // Step 1 → 2: call beckn init
  const handleInitStep = async (e) => {
    e.preventDefault()
    await init({ providerId: store.provider.id, items: store.cart, billing, deliveryAddress: billing.address })
    setStep(2)
  }

  // Step 2: call beckn confirm
  const handleConfirm = async () => {
    await confirm({
      providerId:      store.provider.id,
      billing,
      deliveryAddress: billing.address,
      totalAmount:     cartTotal + 5000,
      paymentRef:      `PAY-${Date.now()}`,
    })
    setPlaced(true)
  }

  if (placed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h2>
        <p className="text-gray-500 mb-1">Beckn <code className="bg-gray-100 px-1 rounded">on_confirm</code> received</p>
        <p className="text-gray-500 text-sm mb-6">Your order has been placed successfully.</p>
        <button onClick={() => navigate('/orders')} className="beckn-btn-primary px-8 py-2.5">
          View Orders
        </button>
      </div>
    )
  }

  if (store.cart.length === 0 && !placed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingCart size={48} className="text-gray-300 mb-3" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-400 text-sm mb-6">Add products from the catalog to start a Beckn order</p>
        <button onClick={() => navigate('/products')} className="beckn-btn-primary px-8">Browse Products</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${i < step ? 'bg-blue-600 border-blue-600 text-white' : i === step ? 'border-blue-600 text-blue-600' : 'border-gray-300 text-gray-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0 — Review Cart */}
      {step === 0 && (
        <div className="beckn-card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Cart Items</h2>
            <p className="text-xs text-gray-400 font-mono">Beckn action: select → on_select</p>
          </div>
          <div className="divide-y divide-gray-50">
            {store.cart.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.descriptor?.images?.[0] ? (
                    <img
                      src={item.descriptor.images[0]}
                      alt={item.descriptor?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={22} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{item.descriptor?.name}</p>
                  <p className="text-xs text-gray-400">{formatIDR(item.price?.value)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => store.updateCartQty(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => store.updateCartQty(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100">
                    <Plus size={12} />
                  </button>
                </div>
                <p className="text-sm font-bold text-gray-800 w-24 text-right">
                  {formatIDR(parseFloat(item.price?.value) * item.quantity)}
                </p>
                <button onClick={() => store.removeFromCart(item.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 bg-gray-50 rounded-b-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-xl font-bold text-gray-900">{formatIDR(cartTotal)}</p>
            </div>
            <button onClick={handleSelectStep} disabled={loading} className="beckn-btn-primary px-8">
              {loading ? 'Processing…' : 'Continue'} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Step 1 — Billing */}
      {step === 1 && (
        <form onSubmit={handleInitStep} className="beckn-card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Billing & Delivery</h2>
            <p className="text-xs text-gray-400 font-mono">Beckn action: init → on_init</p>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Full Name</label>
              <input required className="beckn-input" value={billing.name}
                onChange={(e) => setBilling({ ...billing, name: e.target.value })} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Phone</label>
              <input required className="beckn-input" value={billing.phone}
                onChange={(e) => setBilling({ ...billing, phone: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Email</label>
              <input type="email" required className="beckn-input" value={billing.email}
                onChange={(e) => setBilling({ ...billing, email: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Street Address</label>
              <input required className="beckn-input" value={billing.address.street}
                onChange={(e) => setBilling({ ...billing, address: { ...billing.address, street: e.target.value } })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">City</label>
              <input required className="beckn-input" value={billing.address.city}
                onChange={(e) => setBilling({ ...billing, address: { ...billing.address, city: e.target.value } })} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">State</label>
              <input required className="beckn-input" value={billing.address.state}
                onChange={(e) => setBilling({ ...billing, address: { ...billing.address, state: e.target.value } })} />
            </div>
          </div>

          {/* Quote from on_select */}
          {quote && (
            <div className="mx-5 mb-5 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 mb-2 uppercase">Quote (on_select)</p>
              {quote.breakup?.map((b, i) => (
                <div key={i} className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-600">{b.title}</span>
                  <span>{formatIDR(b.price?.value)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-blue-200 mt-1">
                <span>Total</span>
                <span>{formatIDR(quote.price?.value)}</span>
              </div>
            </div>
          )}

          <div className="px-5 pb-5 flex gap-3">
            <button type="button" onClick={() => setStep(0)} className="beckn-btn-secondary flex-1">Back</button>
            <button type="submit" disabled={loading} className="beckn-btn-primary flex-1">
              {loading ? 'Processing…' : 'Proceed'} <ArrowRight size={15} />
            </button>
          </div>
        </form>
      )}

      {/* Step 2 — Confirm */}
      {step === 2 && (
        <div className="beckn-card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Confirm Order</h2>
            <p className="text-xs text-gray-400 font-mono">Beckn action: confirm → on_confirm</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="font-semibold text-gray-700">{billing.name}</p>
              <p className="text-sm text-gray-500">{billing.phone} · {billing.email}</p>
              <p className="text-sm text-gray-500">{billing.address.street}, {billing.address.city}</p>
            </div>
            <div className="space-y-2">
              {store.cart.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{item.descriptor?.name} × {item.quantity}</span>
                  <span className="font-medium">{formatIDR(parseFloat(item.price?.value) * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">Delivery Charges</span>
                <span className="font-medium">{formatIDR(5000)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>Total Payment</span>
                <span className="text-blue-700">{formatIDR(cartTotal + 5000)}</span>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
              Payment type: PRE-FULFILLMENT · Currency: IDR
            </div>
          </div>
          <div className="px-5 pb-5 flex gap-3">
            <button onClick={() => setStep(1)} className="beckn-btn-secondary flex-1">Back</button>
            <button onClick={handleConfirm} disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
              {loading ? 'Placing Order…' : '✓ Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
