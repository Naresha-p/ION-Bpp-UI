/**
 * DashboardPage — live stats + recent orders
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, ShoppingCart, Truck, BarChart3,
  CheckCircle2, RefreshCw, Clock, ArrowRight,
  TrendingUp,
} from 'lucide-react'
import StatsCard from '../components/common/StatsCard'
import BecknBadge from '../components/common/BecknBadge'
import { ErrorBanner } from '../components/common/ErrorDisplay'
import { getDashboardStats, getOrders } from '../api/bppApi'
import { formatDate, formatNumber } from '../utils/format'

const STATUS_CONFIG = {
  CONFIRMED:       { label: 'Confirmed',    color: 'blue'   },
  CANCELLED:       { label: 'Cancelled',    color: 'red'    },
  ORDER_PLACED:    { label: 'Order Placed', color: 'yellow' },
  ORDER_PICKED_UP: { label: 'Picked Up',    color: 'orange' },
  ORDER_DELIVERED: { label: 'Delivered',    color: 'green'  },
  ACTIVE:          { label: 'Active',       color: 'blue'   },
}

const getOrderStatus  = (o) => STATUS_CONFIG[o?.data?.message?.contract?.performance?.[0]?.status?.code] || STATUS_CONFIG[o?.status] || { label: o?.status || '—', color: 'gray' }
const getOrderTotal   = (o) => { const t = o?.data?.message?.contract?.consideration?.[0]?.considerationAttributes; return t?.totalAmount != null ? `${t.currency || 'IDR'} ${formatNumber(t.totalAmount)}` : '—' }
const getFirstItem    = (o) => o?.data?.message?.contract?.commitments?.[0]?.resources?.[0]?.descriptor?.name || '—'

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl h-24 skeleton" />
      ))}
    </div>
  )
}

function OrderRowSkeleton() {
  return (
    <div className="flex items-center px-5 py-4 gap-4">
      <div className="w-8 h-8 rounded-xl skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 skeleton rounded w-36" />
        <div className="h-2.5 skeleton rounded w-56" />
      </div>
      <div className="space-y-2 flex flex-col items-end">
        <div className="h-3 skeleton rounded w-16" />
        <div className="h-2.5 skeleton rounded w-20" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError,   setStatsError]   = useState(null)
  const [recentOrders,  setRecentOrders]  = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError,   setOrdersError]   = useState(null)

  const fetchStats = async () => {
    setStatsLoading(true); setStatsError(null)
    try { setStats(await getDashboardStats()) }
    catch (err) { setStatsError(err) }
    finally { setStatsLoading(false) }
  }

  const fetchRecentOrders = async () => {
    setOrdersLoading(true); setOrdersError(null)
    try { setRecentOrders((await getOrders({ page: 1, limit: 5 })).orders ?? []) }
    catch (err) { setOrdersError(err) }
    finally { setOrdersLoading(false) }
  }

  useEffect(() => { fetchStats(); fetchRecentOrders() }, [])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Real-time overview of your store on the Beckn network
          </p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchRecentOrders() }}
          disabled={statsLoading || ordersLoading}
          className="beckn-btn-secondary text-xs py-1.5 px-3"
        >
          <RefreshCw size={13} className={(statsLoading || ordersLoading) ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Stats ── */}
      {statsError && <ErrorBanner error={statsError} onRetry={fetchStats} />}
      {statsLoading ? <StatsSkeleton /> : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard label="Total Products"   value={stats.totalProducts   ?? 0} icon={Package}      color="blue"   sub="catalog items"     />
          <StatsCard label="Total Orders"     value={stats.totalOrders     ?? 0} icon={BarChart3}    color="teal"   sub="all time"          />
          <StatsCard label="Confirmed"        value={stats.confirmedOrders ?? 0} icon={ShoppingCart} color="orange" sub="on_confirm received"/>
          <StatsCard label="Out for Delivery" value={stats.enRouteOrders   ?? 0} icon={Truck}        color="red"    sub="in transit"        />
          <StatsCard label="Delivered"        value={stats.deliveredOrders ?? 0} icon={CheckCircle2} color="green"  sub="completed"         />
        </div>
      ) : null}

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/products"
          className="beckn-card p-4 flex items-center gap-3 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Package size={16} style={{ color: '#a5b4fc' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Manage Products</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Add, edit, and organise catalog</p>
          </div>
          <ArrowRight size={14} style={{ color: 'var(--text-3)' }}
            className="group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </Link>
        <Link to="/publish"
          className="beckn-card p-4 flex items-center gap-3 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <TrendingUp size={16} style={{ color: '#86efac' }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Publish Catalog</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Go live on Beckn network</p>
          </div>
          <ArrowRight size={14} style={{ color: 'var(--text-3)' }}
            className="group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </Link>
      </div>

      {/* ── Recent Orders ── */}
      <div className="beckn-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <ShoppingCart size={13} style={{ color: '#fdba74' }} />
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Recent Orders</h2>
            {ordersLoading && <RefreshCw size={12} className="animate-spin" style={{ color: 'var(--text-3)' }} />}
          </div>
          <Link to="/orders"
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: '#a5b4fc' }}
            onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
            onMouseLeave={e => e.currentTarget.style.color = '#a5b4fc'}
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {ordersError && <div className="px-5 pt-3"><ErrorBanner error={ordersError} onRetry={fetchRecentOrders} /></div>}

        {ordersLoading && recentOrders.length === 0 ? (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {Array.from({ length: 4 }).map((_, i) => <OrderRowSkeleton key={i} />)}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
              <ShoppingCart size={20} style={{ color: 'var(--text-3)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>No orders yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Orders will appear here once received</p>
          </div>
        ) : (
          <div>
            {recentOrders.map((order, i) => {
              const status   = getOrderStatus(order)
              const itemName = getFirstItem(order)
              const total    = getOrderTotal(order)
              const count    = order?.data?.message?.contract?.commitments?.length ?? 0

              return (
                <div
                  key={order._id}
                  className="flex items-center px-5 py-3.5 gap-4 transition-colors cursor-pointer"
                  style={{ borderBottom: i < recentOrders.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-r)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Index */}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: 'var(--surface-r)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold font-mono" style={{ color: 'var(--text-1)' }}>
                        {order.orderId}
                      </span>
                      <BecknBadge label={status.label} color={status.color} dot />
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>
                      {itemName}{count > 1 && ` +${count - 1} more`}
                      {' · '}
                      <span className="font-mono">txn:{order.transactionId?.slice(0, 8)}…</span>
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{total}</p>
                    <p className="text-xs flex items-center justify-end gap-1 mt-0.5" style={{ color: 'var(--text-3)' }}>
                      <Clock size={10} />{formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
