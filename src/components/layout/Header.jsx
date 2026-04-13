import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Command, Menu } from 'lucide-react'

export default function Header({ onMenuToggle }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-3 md:px-5 gap-3"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* ── Hamburger (mobile only) ── */}
      <button
        onClick={onMenuToggle}
        className="md:hidden beckn-btn-ghost p-2 flex-shrink-0"
        aria-label="Toggle menu"
      >
        <Menu size={18} />
      </button>

      {/* ── Brand ── */}
      <div className="flex-shrink-0 flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
        >
          <span className="text-white font-black text-sm tracking-tight">ION</span>
        </div>
        <div className="leading-none hidden sm:block">
          <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
            Indonesia Open Network
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            BPP Seller Portal
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0 max-w-lg">
        <div className="relative flex-1 min-w-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="beckn-input pl-9 pr-4 py-1.5 text-xs"
            style={{ background: 'var(--surface-r)' }}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 pointer-events-none hidden md:flex"
            style={{ color: 'var(--text-3)' }}>
            <Command size={10} />
            <span className="text-[10px]">K</span>
          </div>
        </div>
        <button
          type="submit"
          className="beckn-btn-primary py-1.5 px-3 md:px-4 text-xs flex-shrink-0"
        >
          <span className="hidden sm:inline">Search</span>
          <Search size={13} className="sm:hidden" />
        </button>
      </form>

      {/* ── Spacer ── */}
      <div className="flex-1 hidden md:block" />

      {/* ── Integra Logo ── */}
      <img
        src="https://integramicro.com/en/wp-content/uploads/2025/12/INTEGRA-WHITE-logo-for-Digital-Media-Website-Mobile-Applications-RGB-PNG-Format.png"
        alt="Integra"
        className="object-contain flex-shrink-0 hidden sm:block"
        style={{ height: '38px' }}
      />
    </header>
  )
}
