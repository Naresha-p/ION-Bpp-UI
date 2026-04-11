import React, { useState } from 'react'
import { Truck, MapPin, Clock, CheckCircle2, Package, AlertCircle } from 'lucide-react'
import useBecknStore from '../store/becknStore'
import BecknBadge from '../components/common/BecknBadge'
import { BECKN_ORDER_STATES } from '../api/mockData'
import { useBeckn } from '../hooks/useBeckn'

const FULFILLMENT_STEPS = [
  { code: 'ORDER-CONFIRMED', label: 'Confirmed',  icon: CheckCircle2, color: 'text-blue-500'   },
  { code: 'ORDER-PICKED-UP', label: 'Picked Up',  icon: Package,      color: 'text-amber-500'  },
  { code: 'ORDER-DELIVERED', label: 'Delivered',  icon: Truck,        color: 'text-emerald-500' },
]

function FulfillmentCard({ order }) {
  const { track, loading } = useBeckn()
  const { updateOrderState } = useBecknStore()
  const stateInfo = BECKN_ORDER_STATES[order.beckn_state] || { label: order.beckn_state, color: 'gray' }
  const currentStep = FULFILLMENT_STEPS.findIndex((s) => s.code === order.beckn_state)

  const advanceState = () => {
    const next = FULFILLMENT_STEPS[currentStep + 1]
    if (next) updateOrderState(order.id, next.code)
  }

  return (
    <div className="beckn-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-800">{order.id}</p>
          <p className="text-xs text-gray-500 mt-0.5">{order.billing?.name} · {order.billing?.phone}</p>
          <p className="text-xs font-mono text-gray-400">txn: {order.transaction_id?.slice(0, 16)}…</p>
        </div>
        <BecknBadge label={stateInfo.label} color={stateInfo.color} dot />
      </div>

      {/* Fulfillment progress */}
      <div className="flex items-center gap-1 mb-4">
        {FULFILLMENT_STEPS.map((step, i) => {
          const done    = i <= currentStep
          const current = i === currentStep
          const Icon    = step.icon
          return (
            <React.Fragment key={step.code}>
              <div className={`flex flex-col items-center gap-1 flex-1`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                  ${done ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}>
                  <Icon size={14} className={done ? 'text-white' : 'text-gray-300'} />
                </div>
                <span className={`text-[10px] font-medium text-center ${done ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < FULFILLMENT_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 ${i < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Items summary */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Items</p>
        {order.items?.slice(0, 2).map((item, i) => (
          <div key={i} className="flex justify-between text-xs text-gray-600 py-0.5">
            <span>{item.descriptor?.name}</span>
            <span>× {item.quantity?.count}</span>
          </div>
        ))}
        {order.items?.length > 2 && (
          <p className="text-xs text-gray-400">+{order.items.length - 2} more</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {currentStep < FULFILLMENT_STEPS.length - 1 && order.beckn_state !== 'ORDER-CANCELLED' && (
          <button onClick={advanceState}
            className="beckn-btn-primary flex-1 justify-center text-xs py-1.5">
            <Truck size={13} /> Mark as {FULFILLMENT_STEPS[currentStep + 1]?.label}
          </button>
        )}
        {order.beckn_state === 'ORDER-DELIVERED' && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
            <CheckCircle2 size={14} /> Delivered
          </div>
        )}
      </div>
    </div>
  )
}

export default function FulfillmentPage() {
  const { orders } = useBecknStore()
  const activeOrders = orders.filter((o) => o.beckn_state !== 'ORDER-CANCELLED')
  const [filter, setFilter] = useState('all')

  const filtered = activeOrders.filter((o) =>
    filter === 'all' || o.beckn_state === filter
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Fulfillment</h1>
        <p className="text-sm text-gray-500">Beckn fulfillment state machine · {activeOrders.length} active</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {[['all', 'All'], ...Object.entries(BECKN_ORDER_STATES)].map(([code, info]) => (
          <button key={code} onClick={() => setFilter(code)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filter === code
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}>
            {typeof info === 'object' ? info.label : 'All'}
          </button>
        ))}
      </div>

      {/* Beckn fulfillment flow explanation */}
      <div className="beckn-card p-4 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <strong>Beckn Fulfillment Flow:</strong> on_confirm → ORDER-CONFIRMED → ORDER-PICKED-UP → ORDER-DELIVERED.
            Each state change triggers a Beckn <code className="bg-blue-100 px-1 rounded">on_status</code> callback to the BAP.
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Truck size={40} className="mb-3" />
          <p>No fulfillments in this state</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order) => (
            <FulfillmentCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
