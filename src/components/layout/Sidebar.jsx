import React from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import {
  LayoutDashboard, Package, ShoppingCart, Settings,
  HelpCircle, Users, ChevronRight, CheckCircle2,
  XCircle,
} from 'lucide-react'
import useBecknStore from '../../store/becknStore'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: Package,         label: 'Products'  },
  { to: '/orders',    icon: ShoppingCart,    label: 'Orders'    },
  { to: '/settings',  icon: Settings,        label: 'Settings'  },
]

export default function Sidebar() {
  const { provider } = useBecknStore()

  return (
    <aside className="fixed left-0 top-10 h-full w-56 flex flex-col z-40 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)' }}>

      

      {/* Logo */}
      {/* <div className="w-20 center mt-10 ml-12"> */}
        <div className="flex items-center gap-2 w-20 mt-5 ml-5">
          <img alt="Integra Micro Systems" src="https://integramicro.com/en/wp-content/uploads/2025/12/INTEGRA-WHITE-logo-for-Digital-Media-Website-Mobile-Applications-RGB-PNG-Format.png"/>
          <button className="flex items-center gap-1 text-white hover:text-blue-200 transition-colors">
            <span className="text-sm font-semibold">Joko</span>
            <ChevronDown size={14} />
          </button>
        </div>
      {/* <div className="flex items-center gap-2 px-4 py-4 border-b border-blue-700/50">
        <div classNme="flex items-center gap-1.5">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-blue-800 font-black text-xs">ION</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-xs leading-none">Indonesia</span>
            <span className="text-blue-200 text-[10px] leading-none">Open Network</span>
          </div>
        </div> */}
        {/* Network selector pill */}
        {/* <button className="ml-auto flex items-center gap-1 bg-blue-700/60 hover:bg-blue-700 text-blue-100 text-[10px] px-1.5 py-0.5 rounded-full transition-colors">
          <span>viooneg</span>
          <ChevronRight size={9} />
        </button>
      </div> */}

      {/* Provider Info */}
      {/* <div className="px-3 py-3 border-b border-blue-700/50">
        <p className="text-white font-semibold text-xs leading-tight truncate">{provider.name}</p>
        <p className="text-blue-200 text-[10px] mt-0.5">ID Shop: {provider.shopId.slice(0, 12)}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex items-center gap-0.5 text-[10px]">
            <span className="text-blue-200">{provider.phone}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1">
          {provider.verified ? (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-300 font-semibold">
              <CheckCircle2 size={10} /> Verified
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] text-red-300">
              <XCircle size={10} /> Unverified
            </span>
          )}
        </div>
      </div> */}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive
                ? 'bg-white/20 text-white font-semibold'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {/* <div className="px-2 pb-3 space-y-1">
        <button className="nav-item w-full text-blue-100 hover:bg-white/10 hover:text-white">
          <Users size={16} />
          <span>Ini Beelia</span>
          <ChevronRight size={13} className="ml-auto" />
        </button>
        <NavLink to="/help" className="nav-item text-blue-100 hover:bg-white/10 hover:text-white">
          <HelpCircle size={16} />
          <span>Help &amp; FAQs</span>
        </NavLink>
      </div> */}
    </aside>
  )
}
