import React, { useState } from 'react'
import { HelpCircle, ChevronDown } from 'lucide-react'

const FAQS = [
  {
    q: 'What is the Beckn Protocol?',
    a: 'Beckn is an open, interoperable protocol that enables peer-to-peer commerce. It separates the buyer-facing app (BAP) from the seller/provider app (BPP) and allows them to communicate through a standardised message schema.',
  },
  {
    q: 'What is the Beckn context object?',
    a: 'Every Beckn API call includes a context object containing: domain, action, country, city, core_version, bap_id, bap_uri, bpp_id, bpp_uri, transaction_id, message_id, and timestamp. This uniquely identifies every transaction.',
  },
  {
    q: 'What is the difference between BAP and BPP?',
    a: 'BAP (Beckn Application Platform) is the buyer-facing app. BPP (Beckn Provider Platform) is the seller/provider platform. This dashboard is the BPP. Communication flows: BAP → BG → BPP (request), BPP → BG → BAP (callback as on_action).',
  },
  {
    q: 'How does the order flow work?',
    a: 'The Beckn order flow: (1) BAP sends /search → BPP responds on_search with catalog; (2) BAP sends /select → BPP responds on_select with quote; (3) BAP sends /init → BPP responds on_init with payment terms; (4) BAP sends /confirm → BPP responds on_confirm with order ID.',
  },
  {
    q: 'What is ION Indonesia?',
    a: 'ION (Indonesia Open Network) is Indonesia\'s implementation of the Beckn Protocol for open commerce. It enables any buyer app to discover and transact with any seller/provider registered on the network.',
  },
  {
    q: 'How do I go live on the Beckn network?',
    a: 'Register your BPP on the Beckn Gateway, configure your BAP/BPP IDs and URIs in Settings, generate your signing keys, and subscribe your provider to the network. Then you can receive real on_search and on_confirm callbacks from buyer apps.',
  },
]

function Accordion({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors">
        <span className="font-medium text-gray-800 text-sm">{q}</span>
        <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-50 bg-white">
          <p className="pt-3 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <HelpCircle size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Help &amp; FAQs</h1>
          <p className="text-sm text-gray-500">ION Indonesia · Beckn Protocol v1.1.0</p>
        </div>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, i) => <Accordion key={i} q={faq.q} a={faq.a} />)}
      </div>

      <div className="beckn-card p-5 bg-blue-50 border-blue-100">
        <h2 className="font-semibold text-blue-800 mb-2">Need more help?</h2>
        <p className="text-sm text-blue-700">
          Reach out to the ION Indonesia support team or visit the{' '}
          <span className="underline cursor-pointer">Beckn Protocol documentation</span>.
        </p>
      </div>
    </div>
  )
}
