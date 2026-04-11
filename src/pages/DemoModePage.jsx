import React, { useState } from 'react'
import { Sparkles, Play, CheckCircle2, Clock, ArrowRight, Code2 } from 'lucide-react'
import { useBeckn } from '../hooks/useBeckn'
import useBecknStore from '../store/becknStore'

const DEMO_FLOWS = [
  {
    id: 'search',
    title: 'Discovery Flow',
    action: 'search → on_search',
    desc: 'BAP sends a search intent; BPP responds with catalog',
    steps: ['build context + intent', 'POST /search', 'receive on_search with catalog'],
  },
  {
    id: 'order',
    title: 'Order Flow',
    action: 'select → init → confirm',
    desc: 'End-to-end order placement through Beckn protocol',
    steps: ['POST /select → on_select (quote)', 'POST /init → on_init (payment terms)', 'POST /confirm → on_confirm (order ID)'],
  },
  {
    id: 'fulfillment',
    title: 'Fulfillment Flow',
    action: 'status → track → update',
    desc: 'Track and update order fulfillment state',
    steps: ['POST /status → on_status', 'POST /track → on_track (URL)', 'POST /update → on_update'],
  },
  {
    id: 'post-order',
    title: 'Post-Order Flow',
    action: 'rating → support → cancel',
    desc: 'Rate, get support, or cancel an existing order',
    steps: ['POST /rating → on_rating', 'POST /support → on_support', 'POST /cancel → on_cancel'],
  },
]

function FlowRunner({ flow }) {
  const { search, select, status, cancel, loading } = useBeckn()
  const { catalog, orders, provider } = useBecknStore()
  const [result,  setResult]  = useState(null)
  const [step,    setStep]    = useState(-1)

  const run = async () => {
    setResult(null)
    setStep(0)
    let res
    if (flow.id === 'search') {
      res = await search('beras')
    } else if (flow.id === 'order') {
      res = await select(provider.id, catalog.slice(0, 1).map((i) => ({ ...i, quantity: 2 })))
    } else if (flow.id === 'fulfillment') {
      res = await status(orders[0]?.id, orders[0]?.transaction_id)
    } else if (flow.id === 'post-order') {
      res = await cancel(orders[0]?.id, '001', orders[0]?.transaction_id)
    }
    setStep(flow.steps.length - 1)
    setResult(res)
  }

  return (
    <div className="beckn-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-800">{flow.title}</h3>
          <code className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{flow.action}</code>
          <p className="text-xs text-gray-500 mt-1">{flow.desc}</p>
        </div>
        <button onClick={run} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex-shrink-0">
          <Play size={12} /> Run
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {flow.steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-2 text-xs py-1 px-2 rounded-lg transition-all
            ${i <= step ? 'bg-blue-50 text-blue-700' : 'text-gray-400'}`}>
            {i < step ? (
              <CheckCircle2 size={12} className="text-blue-500 flex-shrink-0" />
            ) : i === step && loading ? (
              <Clock size={12} className="text-blue-400 flex-shrink-0 animate-spin" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-current flex-shrink-0" />
            )}
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase flex items-center gap-1">
            <Code2 size={11} /> Response (context.action: {result?.context?.action})
          </p>
          <pre className="bg-gray-900 text-gray-100 text-[10px] rounded-lg p-3 overflow-auto max-h-40 font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function DemoModePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Demo Mode</h1>
          <p className="text-sm text-gray-500">Interactive Beckn protocol flow explorer</p>
        </div>
      </div>

      {/* Protocol Overview */}
      <div className="beckn-card p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Beckn Protocol Overview</h2>
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {['search', 'select', 'init', 'confirm', 'status', 'track', 'update', 'cancel', 'rating', 'support'].map((a, i, arr) => (
            <React.Fragment key={a}>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{a}</span>
              {i < arr.length - 1 && <ArrowRight size={12} className="text-gray-300" />}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Each action above sends a synchronous ACK and an asynchronous callback (<code className="bg-gray-100 px-1 rounded">on_action</code>) to the BAP URI.
        </p>
      </div>

      {/* Flow Runners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEMO_FLOWS.map((flow) => (
          <FlowRunner key={flow.id} flow={flow} />
        ))}
      </div>
    </div>
  )
}
