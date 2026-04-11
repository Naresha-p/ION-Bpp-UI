import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import useBecknStore from '../../store/becknStore'
import { useBeckn } from '../../hooks/useBeckn'

export default function Header() {
  const navigate = useNavigate()
  const { notifications, setSearchResults, setSearchQuery } = useBecknStore()
  const { search } = useBeckn()
  const [query, setQuery] = useState('')
  const unread = notifications.filter((n) => !n.read).length

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
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-5 gap-4"
      style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)' }}
    >
      {/* ── Left: Inegra logo + network selector ─────────────── */}
      {/* <div className="flex items-center gap-3 w-56 flex-shrink-0"> */}
        {/* Inegra logo */}
        {/* <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <svg viewBox="0 0 36 36" className="w-7 h-7" fill="none">
              <circle cx="18" cy="18" r="18" fill="#1a56db" />
              <path d="M10 18 Q18 8 26 18 Q18 28 10 18Z" fill="white" opacity="0.9" />
              <circle cx="18" cy="18" r="3" fill="white" />
            </svg>
          </div>

          
          <button className="flex items-center gap-1 text-white hover:text-blue-200 transition-colors">
            <span className="text-sm font-semibold">viooneg</span>
            <ChevronDown size={14} />
          </button>
        </div> */}
        {/* <div>
          <img class="stnd skip-lazy" width="2127" height="1383" alt="Integra Micro Systems" src="https://integramicro.com/en/wp-content/uploads/2025/12/INTEGRA-WHITE-logo-for-Digital-Media-Website-Mobile-Applications-RGB-PNG-Format.png">
        </div> */}
      {/* </div> */}

      {/* ── Center: ION Branding + Search ────────────────────── */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* ION brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 border-r border-white/20 pr-4">
            <div className="flex items-center gap-1">
              <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center flex-shrink-0">
                <span className="text-blue-800 font-black text-[11px] tracking-tight">ION</span>
              </div>
              <span className="text-white/40 text-xl font-thin">|</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-lg">Indonesia Open Network</span>
              <span className="text-blue-200 text-[12px] font-normal">
                Interconnected Open Procurement Ecosystem for Indonesia
              </span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products"
              className="w-full pl-9 pr-4 py-2 bg-white rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg transition-colors border border-blue-400 shadow-sm flex-shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* ── Right: Notifications ─────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
