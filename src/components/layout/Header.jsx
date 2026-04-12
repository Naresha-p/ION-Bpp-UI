import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Command } from 'lucide-react'
import useBecknStore from '../../store/becknStore'
import { useBeckn } from '../../hooks/useBeckn'

export default function Header() {
  const navigate = useNavigate()
  const { setSearchResults, setSearchQuery } = useBecknStore()
  const { search } = useBeckn()
  const [query, setQuery] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearchQuery(query)
    const res = await search(query)
    const items = res?.message?.catalog?.providers?.[0]?.items || []
    setSearchResults(items)
    navigate('/products?search=1')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-5 gap-4"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* ── Brand ── */}
      <div className="w-64 flex-shrink-0 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
        >
          <span className="text-white font-black text-sm tracking-tight">ION</span>
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
            Indonesia Open Network
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            BPP Seller Portal
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-lg">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="beckn-input pl-9 pr-4 py-1.5 text-xs"
            style={{ background: 'var(--surface-r)' }}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none"
            style={{ color: 'var(--text-3)' }}>
            <Command size={10} />
            <span className="text-[10px]">K</span>
          </div>
        </div>
        <button
          type="submit"
          className="beckn-btn-primary py-1.5 px-4 text-xs"
        >
          Search
        </button>
      </form>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Integra Logo ── */}
      <img
        src="https://integramicro.com/en/wp-content/uploads/2025/12/INTEGRA-WHITE-logo-for-Digital-Media-Website-Mobile-Applications-RGB-PNG-Format.png"
        alt="Integra"
        className="object-contain flex-shrink-0"
        style={{ height: '42px' }}
      />
    </header>
  )
}
