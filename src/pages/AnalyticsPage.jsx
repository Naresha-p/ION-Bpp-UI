import React, { useState } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Package, ShoppingCart, Star } from 'lucide-react'
import useBecknStore from '../store/becknStore'
import { BECKN_ORDER_STATES } from '../api/mockData'

const formatIDR = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const DAILY = [
  { day: 'Mon', revenue: 3200000, orders: 8  },
  { day: 'Tue', revenue: 4100000, orders: 11 },
  { day: 'Wed', revenue: 3800000, orders: 9  },
  { day: 'Thu', revenue: 5200000, orders: 14 },
  { day: 'Fri', revenue: 4800000, orders: 13 },
  { day: 'Sat', revenue: 6100000, orders: 18 },
  { day: 'Sun', revenue: 4250000, orders: 12 },
]

const MAX_REV = Math.max(...DAILY.map((d) => d.revenue))

function BarChartSimple({ data }) {
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-400">{formatIDR(d.revenue).replace('Rp\u00a0', 'Rp').replace(',00', '')}</span>
          <div className="w-full rounded-t-md bg-blue-200 hover:bg-blue-500 transition-colors relative cursor-pointer"
            style={{ height: `${(d.revenue / MAX_REV) * 130}px` }}>
            <div className="absolute inset-x-0 top-0 h-1.5 bg-blue-600 rounded-t-md" />
          </div>
          <span className="text-xs font-medium text-gray-500">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ label, value, change, icon: Icon, color }) {
  const up = change >= 0
  return (
    <div className="beckn-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { stats, orders, catalog } = useBecknStore()
  const [period, setPeriod] = useState('week')

  const stateBreakdown = Object.entries(BECKN_ORDER_STATES).map(([code, info]) => ({
    label: info.label,
    count: orders.filter((o) => o.beckn_state === code).length,
    color: info.color,
  }))

  const topItems = catalog.slice(0, 5).map((item) => ({
    name: item.descriptor.name,
    sales: Math.floor(Math.random() * 50 + 10),
    revenue: Math.floor(Math.random() * 500000 + 100000),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">Beckn provider performance</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['week', 'month', 'year'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                period === p ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue"    value={formatIDR(stats.revenue.month)} change={12}  icon={TrendingUp} color="bg-blue-600" />
        <MetricCard label="Total Orders"     value={stats.totalOrders}              change={8}   icon={ShoppingCart} color="bg-emerald-500" />
        <MetricCard label="Active Products"  value={stats.activeProducts}           change={-2}  icon={Package} color="bg-orange-500" />
        <MetricCard label="Avg. Rating"      value={`${stats.rating.average}/5`}    change={5}   icon={Star} color="bg-purple-500" />
      </div>

      {/* Revenue Chart */}
      <div className="beckn-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-800">Daily Revenue</h2>
            <p className="text-xs text-gray-400">This week</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">{formatIDR(DAILY.reduce((s, d) => s + d.revenue, 0))}</p>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
              <TrendingUp size={11} /> +12% vs last week
            </p>
          </div>
        </div>
        <BarChartSimple data={DAILY} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order State Breakdown */}
        <div className="beckn-card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Beckn Order States</h2>
          <div className="space-y-3">
            {stateBreakdown.map((s) => {
              const pct = orders.length ? Math.round((s.count / orders.length) * 100) : 0
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{s.label}</span>
                    <span className="font-semibold text-gray-800">{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      s.color === 'green' ? 'bg-emerald-500' :
                      s.color === 'yellow' ? 'bg-amber-400' :
                      s.color === 'blue' ? 'bg-blue-500' :
                      s.color === 'red' ? 'bg-red-400' : 'bg-gray-300'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="beckn-card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Top Products</h2>
          <div className="space-y-3">
            {topItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.sales} units sold</p>
                </div>
                <span className="text-xs font-semibold text-gray-800">{formatIDR(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
