/**
 * DashboardPage — live stats from GET /dashboard + recent orders from GET /orders
 *
 * Dashboard API response:
 *   { totalProducts, totalOrders, confirmedOrders, enRouteOrders, deliveredOrders }
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package, ShoppingCart, Truck, BarChart3,
  CheckCircle2, RefreshCw, Clock, ArrowRight,
} from 'lucide-react'
import useBecknStore from '../store/becknStore'
import StatsCard from '../components/common/StatsCard'
import BecknBadge from '../components/common/BecknBadge'
import { ErrorBanner } from '../components/common/ErrorDisplay'
import { getDashboardStats, getOrders } from '../api/bppApi'
import { formatDate, formatNumber } from '../utils/format'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  CONFIRMED:       { label: 'Confirmed',    color: 'blue'   },
  CANCELLED:       { label: 'Cancelled',    color: 'red'    },
  ORDER_PLACED:    { label: 'Order Placed', color: 'yellow' },
  ORDER_PICKED_UP: { label: 'Picked Up',    color: 'orange' },
  ORDER_DELIVERED: { label: 'Delivered',    color: 'green'  },
  ACTIVE:          { label: 'Active',       color: 'blue'   },
}

const getOrderStatus = (order) => {
  const perfCode = order?.data?.message?.contract?.performance?.[0]?.status?.code
  return STATUS_CONFIG[perfCode] ||
         STATUS_CONFIG[order?.status] ||
         { label: order?.status || '—', color: 'gray' }
}

const getOrderTotal = (order) => {
  const total = order?.data?.message?.contract
    ?.consideration?.[0]?.considerationAttributes?.totalAmount
  const curr  = order?.data?.message?.contract
    ?.consideration?.[0]?.considerationAttributes?.currency || 'IDR'
  return total != null ? `${curr} ${formatNumber(total)}` : '—'
}

const getFirstItemName = (order) => {
  const resources = order?.data?.message?.contract
    ?.commitments?.[0]?.resources || []
  return resources[0]?.descriptor?.name || '—'
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-24" />
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { } = useBecknStore()

  const [stats,        setStats]        = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError,   setStatsError]   = useState(null)

  const [recentOrders,  setRecentOrders]  = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError,   setOrdersError]   = useState(null)

  const fetchStats = async () => {
    setStatsLoading(true)
    setStatsError(null)
    try {
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      setStatsError(err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchRecentOrders = async () => {
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const data = await getOrders({ page: 1, limit: 5 })
      setRecentOrders(data.orders ?? [])
    } catch (err) {
      setOrdersError(err)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchRecentOrders()
  }, [])

  return (
    <div className="space-y-6">

      {/* ── Stats Grid ── */}
      {statsError && <ErrorBanner error={statsError} onRetry={fetchStats} />}

      {statsLoading ? (
        <StatsSkeleton />
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            label="Total Products"
            value={stats.totalProducts ?? 0}
            icon={Package}
            color="blue"
            sub="catalog items"
          />
          <StatsCard
            label="Total Orders"
            value={stats.totalOrders ?? 0}
            icon={BarChart3}
            color="teal"
            sub="all time"
          />
          <StatsCard
            label="Confirmed"
            value={stats.confirmedOrders ?? 0}
            icon={ShoppingCart}
            color="orange"
            sub="on_confirm received"
          />
          <StatsCard
            label="Out for Delivery"
            value={stats.enRouteOrders ?? 0}
            icon={Truck}
            color="red"
            sub="in transit"
          />
          <StatsCard
            label="Delivered"
            value={stats.deliveredOrders ?? 0}
            icon={CheckCircle2}
            color="teal"
            sub="completed"
          />
        </div>
      ) : null}

      {/* ── Recent Orders ── */}
      <div className="beckn-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
            {ordersLoading && <RefreshCw size={13} className="animate-spin text-gray-400" />}
          </div>
          <Link to="/orders"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {ordersError && (
          <div className="px-5 pt-3">
            <ErrorBanner error={ordersError} onRetry={fetchRecentOrders} />
          </div>
        )}

        {ordersLoading && recentOrders.length === 0 ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center px-5 py-3.5 gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded animate-pulse w-40" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-64" />
                </div>
                <div className="space-y-1.5 items-end flex flex-col">
                  <div className="h-3.5 bg-gray-100 rounded animate-pulse w-16" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <ShoppingCart size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => {
              const status    = getOrderStatus(order)
              const itemName  = getFirstItemName(order)
              const totalAmt  = getOrderTotal(order)
              const commitCnt = order?.data?.message?.contract?.commitments?.length ?? 0

              return (
                <div key={order._id}
                  className="flex items-center px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800 font-mono">
                        {order.orderId}
                      </span>
                      <BecknBadge label={status.label} color={status.color} dot />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {itemName}
                      {commitCnt > 1 && ` +${commitCnt - 1} more`}
                      {' · '}
                      <span className="font-mono">txn:{order.transactionId?.slice(0, 8)}…</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-sm font-semibold text-gray-800">{totalAmt}</p>
                    <p className="text-xs text-gray-400 flex items-center justify-end gap-1 mt-0.5">
                      <Clock size={10} />
                      {formatDate(order.createdAt)}
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
