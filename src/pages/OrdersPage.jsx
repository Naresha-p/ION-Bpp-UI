/**
 * OrdersPage — Beckn 2.0 contract-based order management
 *
 * API response shape:
 *   { orders: [...], pagination: { total, page, limit, totalPages } }
 *
 * Each order:
 *   { _id, orderId, transactionId, status, createdAt, updatedAt,
 *     data: { context: {...}, message: { contract: {
 *       id, participants, status, commitments, consideration, performance, settlements
 *     }}}}
 */

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart, Search, Eye, RefreshCw,
  Package, Truck, CreditCard, Users,
  CheckCircle2, Clock, ChevronDown, ChevronUp,
  Network, Calendar,
} from 'lucide-react'
import { getOrders } from '../api/bppApi'
import { ErrorBanner, ErrorPage } from '../components/common/ErrorDisplay'
import { formatDateTime, formatDate, formatNumber } from '../utils/format'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10

const TABS = ['All', 'CONFIRMED', 'ORDER_PLACED', 'ORDER_PICKED_UP', 'ORDER_DELIVERED', 'CANCELLED']

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  // top-level order status
  CONFIRMED:          { label: 'Confirmed',    color: 'blue',   bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  CANCELLED:          { label: 'Cancelled',    color: 'red',    bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500'     },
  PENDING:            { label: 'Pending',      color: 'yellow', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  // performance / fulfillment status
  ORDER_PLACED:       { label: 'Order Placed', color: 'yellow', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  ORDER_PICKED_UP:    { label: 'Picked Up',    color: 'orange', bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  ORDER_DELIVERED:    { label: 'Delivered',    color: 'green',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  // contract / commitment status
  ACTIVE:             { label: 'Active',       color: 'blue',   bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  COMPLETE:           { label: 'Complete',     color: 'green',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  AGREED:             { label: 'Agreed',       color: 'teal',   bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-500'    },
}

const getStatus = (code) =>
  STATUS_CONFIG[code] || { label: code || '—', color: 'gray', bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = formatDateTime

const fmtISO8601 = (dur) => {
  // e.g. PT30M → 30 min, PT2H → 2 hr
  if (!dur) return dur
  const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return dur
  const h = match[1] ? `${match[1]}h ` : ''
  const m = match[2] ? `${match[2]}m` : ''
  return (h + m).trim() || dur
}

/** Pull the contract out of the order document */
const getContract = (order) => order?.data?.message?.contract || {}

/** Primary display status: prefer performance status, fall back to order.status */
const getPerfStatus = (order) => {
  const contract = getContract(order)
  return contract.performance?.[0]?.status?.code || order.status || '—'
}

/** Total amount from consideration */
const getTotalAmount = (order) => {
  const contract = getContract(order)
  return contract.consideration?.[0]?.considerationAttributes?.totalAmount ?? null
}

/** Currency from consideration */
const getCurrency = (order) => {
  const contract = getContract(order)
  return contract.consideration?.[0]?.considerationAttributes?.currency || 'IDR'
}

/** All resource names from commitments */
const getItemNames = (order) => {
  const contract = getContract(order)
  return (contract.commitments || []).flatMap((c) =>
    (c.resources || []).map((r) => r.descriptor?.name || r.id)
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ code, dot = false, small = false }) {
  const cfg = getStatus(code)
  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full
      ${small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}
      ${cfg.bg} ${cfg.text}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  )
}

// ─── Section wrapper used inside modal ───────────────────────────────────────

function Section({ icon: Icon, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <Icon size={13} className="text-gray-400" />
          {title}
        </span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  )
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }) {
  const contract  = getContract(order)
  const ctx       = order.data?.context || {}
  const currency  = getCurrency(order)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white rounded-t-2xl">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-gray-900 text-base">{order.orderId}</h2>
              <StatusBadge code={order.status} dot />
              <StatusBadge code={getPerfStatus(order)} dot small />
            </div>
            <p className="text-[11px] font-mono text-gray-400">txn: {order.transactionId}</p>
            <p className="text-[11px] text-gray-400">
              Created: {fmtDate(order.createdAt)}
              {order.updatedAt !== order.createdAt && (
                <span className="ml-2">· Updated: {fmtDate(order.updatedAt)}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4">×</button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Commitments (items) */}
          <Section icon={Package} title={`Commitments · ${contract.commitments?.length || 0} line(s)`}>
            <div className="space-y-3">
              {(contract.commitments || []).map((commitment) => {
                const attrs    = commitment.commitmentAttributes || {}
                const priceVal = attrs.price?.consideredValue ?? null
                return (
                  <div key={commitment.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                    {/* Commitment header */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge code={commitment.status?.code} small />
                        <span className="text-xs font-mono text-gray-400">{commitment.id}</span>
                      </div>
                      {priceVal !== null && (
                        <span className="text-sm font-bold text-gray-800">
                          {currency} {formatNumber(priceVal)}
                        </span>
                      )}
                    </div>

                    {/* Resources */}
                    {(commitment.resources || []).map((res) => (
                      <div key={res.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{res.descriptor?.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{res.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-700">
                            {res.quantity?.unitQuantity} {res.quantity?.unitCode}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Price components */}
                    {(attrs.price?.components || []).length > 0 && (
                      <div className="pt-1">
                        {attrs.price.components.map((comp) => (
                          <div key={comp.lineId} className="flex justify-between text-xs text-gray-500 py-0.5">
                            <span className="truncate max-w-[70%]">{comp.lineSummary || comp.lineId}</span>
                            <span>{currency} {formatNumber(comp.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>

          {/* Consideration (payment + breakup) */}
          {contract.consideration?.length > 0 && (
            <Section icon={CreditCard} title="Consideration (Payment)">
              {contract.consideration.map((cons) => {
                const ca = cons.considerationAttributes || {}
                return (
                  <div key={cons.id} className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge code={cons.status?.code} dot small />
                      {(ca.paymentMethods || []).map((m) => (
                        <span key={m} className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {m}
                        </span>
                      ))}
                    </div>

                    {/* Breakup */}
                    {(ca.breakup || []).length > 0 && (
                      <div className="bg-gray-50 rounded-xl overflow-hidden">
                        {ca.breakup.map((b, i) => (
                          <div key={i}
                            className={`flex items-center justify-between px-3 py-2 text-sm
                              ${i !== ca.breakup.length - 1 ? 'border-b border-gray-100' : ''}`}>
                            <div>
                              <span className="text-gray-700">{b.title}</span>
                              <span className="ml-2 text-[10px] text-gray-400 font-mono">{b.type}</span>
                            </div>
                            <span className={`font-semibold ${b.amount === 0 ? 'text-gray-400' : 'text-gray-800'}`}>
                              {ca.currency} {formatNumber(b.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between px-3 py-2.5 bg-gray-100 font-bold text-gray-900">
                          <span>Total</span>
                          <span>{ca.currency} {formatNumber(ca.totalAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </Section>
          )}

          {/* Performance (fulfillment) */}
          {contract.performance?.length > 0 && (
            <Section icon={Truck} title="Performance (Fulfillment)">
              {contract.performance.map((perf) => {
                const pa = perf.performanceAttributes || {}
                return (
                  <div key={perf.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge code={perf.status?.code} dot />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Delivery modes */}
                      {(pa.supportedPerformanceModes || []).length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Modes</p>
                          <div className="flex flex-wrap gap-1">
                            {pa.supportedPerformanceModes.map((m) => (
                              <span key={m} className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SLA */}
                      {pa.sla && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5 flex items-center gap-1">
                            <Clock size={10} /> SLA
                          </p>
                          <p className="text-xs text-gray-700">
                            {fmtISO8601(pa.sla.min)} – {fmtISO8601(pa.sla.max)}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{pa.sla.unitBasis}</p>
                        </div>
                      )}

                      {/* Handling */}
                      {(pa.handling || []).length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Handling</p>
                          <div className="flex flex-wrap gap-1">
                            {pa.handling.map((h) => (
                              <span key={h} className="text-xs font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </Section>
          )}

          {/* Participants */}
          {(contract.participants || []).length > 0 && (
            <Section icon={Users} title="Participants" defaultOpen={false}>
              <div className="space-y-2">
                {contract.participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{p.descriptor?.name}</p>
                      <p className="text-[11px] font-mono text-gray-400">{p.id}</p>
                    </div>
                    <span className="text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase">
                      {p.descriptor?.code}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Settlements */}
          {(contract.settlements || []).length > 0 && (
            <Section icon={CheckCircle2} title="Settlements" defaultOpen={false}>
              <div className="space-y-2">
                {contract.settlements.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-gray-500">{s.id}</span>
                    <StatusBadge code={s.status} small />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Context (Beckn network info) */}
          <Section icon={Network} title="Beckn Context" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {[
                ['Version',     ctx.version],
                ['Action',      ctx.action],
                ['Network ID',  ctx.networkId],
                ['BAP ID',      ctx.bapId],
                ['BPP ID',      ctx.bppId],
                ['Message ID',  ctx.messageId],
                ['Timestamp',   ctx.timestamp ? fmtDate(ctx.timestamp) : null],
                ['TTL',         ctx.ttl],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex items-start gap-2 text-xs">
                  <span className="text-gray-400 font-medium w-24 flex-shrink-0">{label}</span>
                  <span className="text-gray-700 font-mono break-all">{value}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}

// ─── useOrders hook ───────────────────────────────────────────────────────────

function useOrders({ page, limit }) {
  const [orders,  setOrders]  = useState([])
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrders({ page, limit })
      // Beckn 2.0 shape: { orders: [...], pagination: { total, page, limit, totalPages } }
      if (Array.isArray(data)) {
        setOrders(data)
        setPagination({ total: data.length, totalPages: 1 })
      } else {
        setOrders(data.orders ?? data.data ?? [])
        const pg = data.pagination ?? {}
        setPagination({
          total:      pg.total      ?? data.total      ?? 0,
          totalPages: pg.totalPages ?? data.totalPages ?? 1,
        })
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  return { orders, pagination, loading, error, refetch: fetchOrders }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [tab,           setTab]           = useState('All')
  const [searchQuery,   setSearchQuery]   = useState('')
  const [page,          setPage]          = useState(1)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const { orders, pagination, loading, error, refetch } = useOrders({ page, limit: PAGE_LIMIT })

  useEffect(() => { setPage(1) }, [tab, searchQuery])

  // Client-side filter on paginated results
  const filtered = orders.filter((o) => {
    const perfStatus = getPerfStatus(o)
    const matchTab =
      tab === 'All' ||
      o.status === tab ||
      perfStatus === tab

    const q       = searchQuery.toLowerCase()
    const matchQ  =
      !q ||
      o.orderId?.toLowerCase().includes(q) ||
      o.transactionId?.toLowerCase().includes(q) ||
      getItemNames(o).some((n) => n.toLowerCase().includes(q))

    return matchTab && matchQ
  })

  const { total, totalPages } = pagination

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Beckn 2.0 · on_confirm contracts · {total} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={loading}
            title="Refresh"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && <ErrorBanner error={error} onRetry={refetch} />}

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => {
          const count = t === 'All'
            ? orders.length
            : orders.filter((o) => o.status === t || getPerfStatus(o) === t).length
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {getStatus(t).label || t}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search order ID, txn, or item…"
          className="beckn-input pl-9 w-full"
        />
      </div>

      {/* ── Table ── */}
      <div className="beckn-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  'Order ID',
                  'Items (Commitments)',
                  'Amount',
                  'Status',
                  'Fulfillment',
                  'Payment',
                  'Date',
                  '',
                ].map((h) => (
                  <th key={h}
                    className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {/* Loading skeleton */}
              {loading && orders.length === 0
                ? Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : error && orders.length === 0
                ? (
                  <tr>
                    <td colSpan={8}>
                      <ErrorPage error={error} onRetry={refetch} compact />
                    </td>
                  </tr>
                )
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No orders found</p>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')}
                          className="mt-2 text-sm text-blue-500 hover:underline">
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                )
                : filtered.map((order) => {
                    const contract      = getContract(order)
                    const itemNames     = getItemNames(order)
                    const totalAmt      = getTotalAmount(order)
                    // const curr          = getCurrency(order)
                    const curr          = 'RP'
                    const perfStatus    = getPerfStatus(order)
                    const payMethod     = contract.consideration?.[0]
                      ?.considerationAttributes?.paymentMethods?.[0] || '—'
                    const settlStatus   = contract.settlements?.[0]?.status || null

                    return (
                      <tr key={order._id}
                        className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedOrder(order)}>

                        {/* Order ID */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900 font-mono">
                            {order.orderId}
                          </p>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                            {order.transactionId?.slice(0, 16)}…
                          </p>
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3 max-w-[180px]">
                          {itemNames.length > 0 ? (
                            <>
                              <p className="text-sm text-gray-800 truncate">
                                {itemNames[0]}
                              </p>
                              {itemNames.length > 1 && (
                                <p className="text-xs text-gray-400">
                                  +{itemNames.length - 1} more
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {contract.commitments?.length || 0} commitment(s)
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {totalAmt !== null ? (
                            <p className="text-sm font-bold text-gray-900">
                              {curr} {formatNumber(totalAmt)}
                            </p>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Order status */}
                        <td className="px-4 py-3">
                          <StatusBadge code={order.status} dot />
                        </td>

                        {/* Fulfillment / performance status */}
                        <td className="px-4 py-3">
                          <StatusBadge code={perfStatus} dot small />
                        </td>

                        {/* Payment method + settlement */}
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-gray-700">{payMethod}</p>
                          {settlStatus && (
                            <StatusBadge code={settlStatus} small />
                          )}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={11} />
                            {order.createdAt
                              ? formatDate(order.createdAt)
                              : '—'}
                          </div>
                        </td>

                        {/* View action */}
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>
            {loading ? 'Loading…' : `Page ${page} of ${totalPages} · ${total} order${total !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm
                hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* ── Detail modal ── */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}
