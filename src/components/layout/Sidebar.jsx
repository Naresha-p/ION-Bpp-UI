import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Upload, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package,         label: 'Products'  },
  { to: '/publish',  icon: Upload,          label: 'Publish'   },
  { to: '/orders',   icon: ShoppingCart,    label: 'Orders'    },
  { to: '/settings', icon: Settings,        label: 'Settings'  },
]

export default function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-14 h-full w-56 flex flex-col z-40 pb-4"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Nav label */}
      <p className="px-4 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--text-3)' }}>
        Menu
      </p>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => isActive ? {
              background: 'rgba(99,102,241,0.15)',
              color: '#a5b4fc',
              borderLeft: '2px solid #6366f1',
            } : {
              color: 'var(--text-2)',
              borderLeft: '2px solid transparent',
            }}
            className="nav-item hover:!bg-[var(--surface-r)] hover:!text-[var(--text-1)] transition-all"
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
