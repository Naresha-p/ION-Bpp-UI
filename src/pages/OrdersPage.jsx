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
  Network, Calendar, X,
} from 'lucide-react'
import { getOrders } from '../api/bppApi'
import { ErrorBanner, ErrorPage } from '../components/common/ErrorDisplay'
import { formatDateTime, formatDate, formatNumber } from '../utils/format'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 10

const TABS = ['All', 'CONFIRMED', 'ORDER_PLACED', 'ORDER_PICKED_UP', 'ORDER_DELIVERED', 'CANCELLED']

// ─── Status config — dark-friendly ───────────────────────────────────────────

const STATUS_CONFIG = {
  CONFIRMED:          { label: 'Confirmed',    dot: 'bg-blue-400',    badge: 'rgba(99,102,241,0.15)',  badgeText: '#a5b4fc' },
  CANCELLED:          { label: 'Cancelled',    dot: 'bg-red-400',     badge: 'rgba(239,68,68,0.15)',   badgeText: '#fca5a5' },
  PENDING:            { label: 'Pending',      dot: 'bg-amber-400',   badge: 'rgba(251,191,36,0.15)',  badgeText: '#fcd34d' },
  ORDER_PLACED:       { label: 'Order Placed', dot: 'bg-amber-400',   badge: 'rgba(251,191,36,0.15)',  badgeText: '#fcd34d' },
  ORDER_PICKED_UP:    { label: 'Picked Up',    dot: 'bg-orange-400',  badge: 'rgba(249,115,22,0.15)',  badgeText: '#fdba74' },
  ORDER_DELIVERED:    { label: 'Delivered',    dot: 'bg-emerald-400', badge: 'rgba(34,197,94,0.15)',   badgeText: '#86efac' },
  ACTIVE:             { label: 'Active',       dot: 'bg-blue-400',    badge: 'rgba(99,102,241,0.15)',  badgeText: '#a5b4fc' },
  COMPLETE:           { label: 'Complete',     dot: 'bg-emerald-400', badge: 'rgba(34,197,94,0.15)',   badgeText: '#86efac' },
  AGREED:             { label: 'Agreed',       dot: 'bg-teal-400',    badge: 'rgba(20,184,166,0.15)',  badgeText: '#5eead4' },
}

const getStatus = (code) =>
  STATUS_CONFIG[code] || { label: code || '—', dot: 'bg-zinc-500', badge: 'rgba(113,113,122,0.15)', badgeText: '#a1a1aa' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = formatDateTime

const fmtISO8601 = (dur) => {
  if (!dur) return dur
  const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return dur
  const h = match[1] ? `${match[1]}h ` : ''
  const m = match[2] ? `${match[2]}m` : ''
  return (h + m).trim() || dur
}

const getContract    = (order) => order?.data?.message?.contract || {}
const getPerfStatus  = (order) => getContract(order).performance?.[0]?.status?.code || order.status || '—'
const getTotalAmount = (order) => getContract(order).consideration?.[0]?.considerationAttributes?.totalAmount ?? null
const getCurrency    = (order) => getContract(order).consideration?.[0]?.considerationAttributes?.currency || 'IDR'
const getItemNames   = (order) => {
  const contract = getContract(order)
  return (contract.commitments || []).flatMap((c) =>
    (c.resources || []).map((r) => r.descriptor?.name || r.id)
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ code, dot = false, small = false }) {
  const cfg = getStatus(code)
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full
        ${small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
      style={{ background: cfg.badge, color: cfg.badgeText }}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />}
      {cfg.label}
    </span>
  )
}

// ─── Collapsible section used inside the detail modal ────────────────────────

function Section({ icon: Icon, iconColor, title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-all hover:opacity-90"
        style={{ background: 'var(--surface-r)' }}>
        <span className="flex items-center gap-2.5 text-sm font-semibold"
          style={{ color: 'var(--text-1)' }}>
          <Icon size={15} style={{ color: iconColor || '#a5b4fc' }} />
          {title}
        </span>
        {open
          ? <ChevronUp  size={14} style={{ color: 'var(--text-3)' }} />
          : <ChevronDown size={14} style={{ color: 'var(--text-3)' }} />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  )
}


// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({ order, onClose }) {
  const contract = getContract(order)
  const ctx      = order.data?.context || {}
  const currency = getCurrency(order)

  const totalAmt  = getTotalAmount(order)
  const perfCode  = getPerfStatus(order)

  return (
    <div className="modal-backdrop">
      <div className="modal-panel w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* ── Header ── */}
        <div className="px-6 py-5 flex items-start justify-between flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="space-y-2">
            {/* Order ID + badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold font-mono tracking-tight" style={{ color: 'var(--text-1)' }}>
                {order.orderId}
              </h2>
              <StatusBadge code={order.status} dot />
              {perfCode !== order.status && <StatusBadge code={perfCode} dot small />}
            </div>

            {/* Summary strip */}
            <div className="flex items-center gap-4 flex-wrap">
              {totalAmt !== null && (
                <span className="text-sm font-bold" style={{ color: '#86efac' }}>
                  {currency} {formatNumber(totalAmt)}
                </span>
              )}
              <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
                txn: {order.transactionId?.slice(0, 20)}…
              </span>
              <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                <Calendar size={11} />
                {fmtDate(order.createdAt)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="beckn-btn-ghost p-2 ml-4">
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">

          {/* ── Order Items ── */}
          <Section icon={Package} iconColor="#a5b4fc" title={`Order Items  (${contract.commitments?.length || 0})`}>
            {(contract.commitments || []).map((commitment) => {
              const attrs    = commitment.commitmentAttributes || {}
              const priceVal = attrs.price?.consideredValue ?? null
              return (
                <div key={commitment.id} className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--border)' }}>

                  {/* Commitment header row */}
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: 'var(--surface-r)', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <StatusBadge code={commitment.status?.code} small />
                      <span className="text-[11px] font-mono" style={{ color: 'var(--text-3)' }}>
                        {commitment.id}
                      </span>
                    </div>
                    {priceVal !== null && (
                      <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                        {currency} {formatNumber(priceVal)}
                      </span>
                    )}
                  </div>

                  {/* Resource rows */}
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {(commitment.resources || []).map((res) => (
                      <div key={res.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                            {res.descriptor?.name}
                          </p>
                          <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>
                            {res.id}
                          </p>
                        </div>
                        <span className="text-sm font-medium px-2.5 py-1 rounded-lg"
                          style={{ background: 'var(--surface-r)', color: 'var(--text-2)' }}>
                          {res.quantity?.unitQuantity} {res.quantity?.unitCode}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Price breakdown */}
                  {(attrs.price?.components || []).length > 0 && (
                    <div className="px-4 py-2" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-r)' }}>
                      {attrs.price.components.map((comp) => (
                        <div key={comp.lineId} className="flex justify-between text-xs py-1" style={{ color: 'var(--text-2)' }}>
                          <span className="truncate max-w-[70%]">{comp.lineSummary || comp.lineId}</span>
                          <span className="font-mono">{currency} {formatNumber(comp.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </Section>

          {/* ── Payment ── */}
          {contract.consideration?.length > 0 && (
            <Section icon={CreditCard} iconColor="#86efac" title="Payment">
              {contract.consideration.map((cons) => {
                const ca = cons.considerationAttributes || {}
                return (
                  <div key={cons.id} className="space-y-3">
                    {/* Status + methods */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge code={cons.status?.code} dot />
                      {(ca.paymentMethods || []).map((m) => (
                        <span key={m} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                          {m}
                        </span>
                      ))}
                    </div>

                    {/* Breakup table */}
                    {(ca.breakup || []).length > 0 && (
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                        {ca.breakup.map((b, i) => (
                          <div key={i}
                            className="flex items-center justify-between px-4 py-2.5"
                            style={{ borderBottom: i !== ca.breakup.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm" style={{ color: 'var(--text-1)' }}>{b.title}</span>
                              {b.type && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: 'var(--surface-r)', color: 'var(--text-3)' }}>
                                  {b.type}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-semibold font-mono"
                              style={{ color: b.amount === 0 ? 'var(--text-3)' : 'var(--text-1)' }}>
                              {ca.currency} {formatNumber(b.amount)}
                            </span>
                          </div>
                        ))}
                        {/* Total row */}
                        <div className="flex items-center justify-between px-4 py-3 font-bold"
                          style={{ background: 'rgba(34,197,94,0.08)', borderTop: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-1)' }}>Total</span>
                          <span className="text-base font-mono" style={{ color: '#86efac' }}>
                            {ca.currency} {formatNumber(ca.totalAmount)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </Section>
          )}

          {/* ── Fulfillment ── */}
          {contract.performance?.length > 0 && (
            <Section icon={Truck} iconColor="#fdba74" title="Fulfillment">
              {contract.performance.map((perf) => {
                const pa = perf.performanceAttributes || {}
                return (
                  <div key={perf.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge code={perf.status?.code} dot />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(pa.supportedPerformanceModes || []).length > 0 && (
                        <div className="rounded-xl p-3" style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Delivery Modes</p>
                          <div className="flex flex-wrap gap-1.5">
                            {pa.supportedPerformanceModes.map((m) => (
                              <span key={m} className="text-xs font-medium px-2 py-0.5 rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {pa.sla && (
                        <div className="rounded-xl p-3" style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                            <Clock size={10} /> SLA
                          </p>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
                            {fmtISO8601(pa.sla.min)} – {fmtISO8601(pa.sla.max)}
                          </p>
                          {pa.sla.unitBasis && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{pa.sla.unitBasis}</p>
                          )}
                        </div>
                      )}
                      {(pa.handling || []).length > 0 && (
                        <div className="rounded-xl p-3" style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-3)' }}>Handling</p>
                          <div className="flex flex-wrap gap-1.5">
                            {pa.handling.map((h) => (
                              <span key={h} className="text-xs font-medium px-2 py-0.5 rounded-lg"
                                style={{ background: 'rgba(251,191,36,0.15)', color: '#fcd34d' }}>
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

          {/* ── Participants ── */}
          {(contract.participants || []).length > 0 && (
            <Section icon={Users} iconColor="#5eead4" title="Participants" defaultOpen={false}>
              {contract.participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{p.descriptor?.name}</p>
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>{p.id}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg uppercase"
                    style={{ background: 'var(--surface-o)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    {p.descriptor?.code}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {/* ── Settlements ── */}
          {(contract.settlements || []).length > 0 && (
            <Section icon={CheckCircle2} iconColor="#86efac" title="Settlements" defaultOpen={false}>
              {contract.settlements.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-2)' }}>{s.id}</span>
                  <StatusBadge code={s.status} small />
                </div>
              ))}
            </Section>
          )}

          {/* ── Beckn Context ── */}
          <Section icon={Network} iconColor="#c4b5fd" title="Beckn Context" defaultOpen={false}>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {[
                ['Version',    ctx.version],
                ['Action',     ctx.action],
                ['Network ID', ctx.networkId],
                ['BAP ID',     ctx.bapId],
                ['BPP ID',     ctx.bppId],
                ['Message ID', ctx.messageId],
                ['Timestamp',  ctx.timestamp ? fmtDate(ctx.timestamp) : null],
                ['TTL',        ctx.ttl],
              ].filter(([, v]) => v).map(([label, value], i, arr) => (
                <div key={label}
                  className="flex items-start gap-4 px-4 py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span className="text-xs font-medium w-24 flex-shrink-0 pt-0.5" style={{ color: 'var(--text-3)' }}>
                    {label}
                  </span>
                  <span className="text-xs font-mono break-all" style={{ color: 'var(--text-1)' }}>{value}</span>
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
  const [orders,     setOrders]     = useState([])
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrders({ page, limit })
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

  const filtered = orders.filter((o) => {
    const perfStatus = getPerfStatus(o)
    const matchTab   = tab === 'All' || o.status === tab || perfStatus === tab
    const q          = searchQuery.toLowerCase()
    const matchQ     = !q || o.orderId?.toLowerCase().includes(q) ||
      o.transactionId?.toLowerCase().includes(q) ||
      getItemNames(o).some((n) => n.toLowerCase().includes(q))
    return matchTab && matchQ
  })

  const { total, totalPages } = pagination

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>Orders</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            Beckn 2.0 · on_confirm contracts · {total} total
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="beckn-btn-secondary text-xs py-1.5 px-3">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && <ErrorBanner error={error} onRetry={refetch} />}

      {/* ── Tabs ── */}
      <div className="flex gap-0 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t) => {
          const count = t === 'All'
            ? orders.length
            : orders.filter((o) => o.status === t || getPerfStatus(o) === t).length
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px"
              style={{
                borderBottomColor: active ? '#818cf8' : 'transparent',
                color: active ? '#a5b4fc' : 'var(--text-3)',
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-2)' }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-3)' }}>
              {getStatus(t).label || t}
              {count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? 'rgba(99,102,241,0.2)' : 'var(--surface-r)',
                    color:      active ? '#a5b4fc' : 'var(--text-3)',
                  }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
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
            <thead style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-r)' }}>
              <tr>
                {['Order ID', 'Items (Commitments)', 'Amount', 'Status', 'Fulfillment', 'Payment', 'Date', ''].map((h) => (
                  <th key={h}
                    className="text-left text-xs font-semibold uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                    style={{ color: 'var(--text-3)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && orders.length === 0
                ? Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 skeleton rounded" />
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
                    <td colSpan={8} className="text-center py-16">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'var(--surface-r)', border: '1px solid var(--border)' }}>
                        <ShoppingCart size={22} style={{ color: 'var(--text-3)' }} />
                      </div>
                      <p className="font-medium" style={{ color: 'var(--text-2)' }}>No orders found</p>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')}
                          className="mt-2 text-sm font-medium transition-opacity hover:opacity-70"
                          style={{ color: '#a5b4fc' }}>
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                )
                : filtered.map((order, idx) => {
                    const contract   = getContract(order)
                    const itemNames  = getItemNames(order)
                    const totalAmt   = getTotalAmount(order)
                    const curr       = getCurrency(order)
                    const perfStatus = getPerfStatus(order)
                    const payMethod  = contract.consideration?.[0]
                      ?.considerationAttributes?.paymentMethods?.[0] || '—'
                    const settlStatus = contract.settlements?.[0]?.status || null

                    return (
                      <tr key={order._id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                        onClick={() => setSelectedOrder(order)}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-r)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>

                        {/* Order ID */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold font-mono" style={{ color: 'var(--text-1)' }}>
                            {order.orderId}
                          </p>
                          <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-3)' }}>
                            {order.transactionId?.slice(0, 16)}…
                          </p>
                        </td>

                        {/* Items */}
                        <td className="px-4 py-3 max-w-[180px]">
                          {itemNames.length > 0 ? (
                            <>
                              <p className="text-sm truncate" style={{ color: 'var(--text-2)' }}>
                                {itemNames[0]}
                              </p>
                              {itemNames.length > 1 && (
                                <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                                  +{itemNames.length - 1} more
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                              {contract.commitments?.length || 0} commitment(s)
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {totalAmt !== null ? (
                            <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                              {curr} {formatNumber(totalAmt)}
                            </p>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-3)' }}>—</span>
                          )}
                        </td>

                        {/* Order status */}
                        <td className="px-4 py-3">
                          <StatusBadge code={order.status} dot />
                        </td>

                        {/* Fulfillment status */}
                        <td className="px-4 py-3">
                          <StatusBadge code={perfStatus} dot small />
                        </td>

                        {/* Payment method + settlement */}
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{payMethod}</p>
                          {settlStatus && <StatusBadge code={settlStatus} small />}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                            <Calendar size={11} />
                            {order.createdAt ? formatDate(order.createdAt) : '—'}
                          </div>
                        </td>

                        {/* View action */}
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                            className="beckn-btn-ghost p-1.5">
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
        <div className="flex items-center justify-between px-4 py-3 text-sm"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-3)' }}>
          <span>
            {loading ? 'Loading…' : `Page ${page} of ${totalPages} · ${total} order${total !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="beckn-btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="beckn-btn-secondary text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">
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
