import React, { useState } from 'react'
import { MessageSquare, Send, Search } from 'lucide-react'
import useBecknStore from '../store/becknStore'

const MOCK_CONVERSATIONS = [
  {
    id: 'conv1', orderId: 'ORD-20240410-001', customer: 'Andi Prasetyo',
    avatar: 'A', lastMsg: 'Terima kasih, pesanan sudah diterima!', time: '10:30',
    unread: 0, messages: [
      { from: 'customer', text: 'Halo, kapan pesanan saya akan tiba?', time: '10:00' },
      { from: 'provider', text: 'Pesanan Anda sudah dalam pengiriman, estimasi 2 jam lagi.', time: '10:05' },
      { from: 'customer', text: 'Terima kasih, pesanan sudah diterima!', time: '10:30' },
    ],
  },
  {
    id: 'conv2', orderId: 'ORD-20240410-002', customer: 'Siti Rahayu',
    avatar: 'S', lastMsg: 'Apakah stok minyak goreng masih ada?', time: '11:15',
    unread: 2, messages: [
      { from: 'customer', text: 'Apakah stok minyak goreng masih ada?', time: '11:15' },
    ],
  },
  {
    id: 'conv3', orderId: 'ORD-20240410-003', customer: 'Budi Santoso',
    avatar: 'B', lastMsg: 'Baik, ditunggu ya pengirimannya.', time: '12:00',
    unread: 0, messages: [
      { from: 'customer', text: 'Order saya sudah dikonfirmasi belum?', time: '11:50' },
      { from: 'provider', text: 'Sudah dikonfirmasi, sedang diproses.', time: '11:55' },
      { from: 'customer', text: 'Baik, ditunggu ya pengirimannya.', time: '12:00' },
    ],
  },
]

export default function MessagesPage() {
  const [active, setActive] = useState(MOCK_CONVERSATIONS[0])
  const [draft, setDraft]   = useState('')
  const [convs, setConvs]   = useState(MOCK_CONVERSATIONS)
  const [query, setQuery]   = useState('')

  const send = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const newMsg = { from: 'provider', text: draft, time: now }
    setConvs((prev) => prev.map((c) =>
      c.id === active.id ? { ...c, messages: [...c.messages, newMsg], lastMsg: draft } : c
    ))
    setActive((a) => ({ ...a, messages: [...a.messages, newMsg], lastMsg: draft }))
    setDraft('')
  }

  const filtered = convs.filter((c) =>
    c.customer.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-10rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500">Beckn support channel</p>
        </div>
      </div>

      <div className="beckn-card flex h-[calc(100%-4rem)] overflow-hidden">
        {/* Conversation List */}
        <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…" className="beckn-input pl-8 py-1.5 text-xs" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.map((conv) => (
              <button key={conv.id} onClick={() => setActive(conv)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3
                  ${active.id === conv.id ? 'bg-blue-50' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {conv.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 truncate">{conv.customer}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{conv.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMsg}</p>
                  <p className="text-[10px] font-mono text-gray-300">{conv.orderId}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col min-w-0">
          {active ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {active.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{active.customer}</p>
                  <p className="text-xs font-mono text-gray-400">{active.orderId}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {active.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'provider' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm
                      ${msg.from === 'provider'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${msg.from === 'provider' ? 'text-blue-200' : 'text-gray-400'}`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={send} className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
                <input value={draft} onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="beckn-input flex-1" />
                <button type="submit" className="beckn-btn-primary p-2 px-3">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <MessageSquare size={40} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
