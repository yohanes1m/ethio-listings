'use client'

import { useState } from 'react'
import { TrendingUp, DollarSign, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDeals, useDealSummary } from '@/hooks/useAdminListings'
import type { Deal } from '@/hooks/useAdminListings'

const PAGE_SIZE = 20

function formatETB(value: string | null) {
  if (!value) return '—'
  const n = parseFloat(value)
  if (isNaN(n)) return '—'
  return `ETB ${n.toLocaleString('en-ET', { maximumFractionDigits: 0 })}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ET', { year: 'numeric', month: 'short', day: 'numeric' })
}

function categoryLabel(cat: string | null) {
  if (!cat) return '—'
  const map: Record<string, string> = { HOUSE: 'House', LAND: 'Land', CAR: 'Car', MACHINE: 'Machine' }
  return map[cat] ?? cat
}

function statusBadge(status: string | null) {
  if (!status) return null
  const map: Record<string, string> = {
    SOLD: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    RENTED: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${map[status] ?? 'bg-muted text-muted-foreground'}`}>
      {status === 'SOLD' ? 'Sold' : status === 'RENTED' ? 'Rented' : status}
    </span>
  )
}

function SummaryCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function DealRow({ deal }: { deal: Deal }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
      <td className="py-3 px-4">
        <div className="max-w-[200px]">
          <p className="text-sm font-medium truncate">{deal.listing_title ?? 'Unnamed listing'}</p>
          <p className="text-xs text-muted-foreground">{categoryLabel(deal.listing_category)}</p>
        </div>
      </td>
      <td className="py-3 px-4 hidden sm:table-cell">{statusBadge(deal.listing_status)}</td>
      <td className="py-3 px-4 text-sm text-right font-medium">{formatETB(deal.actual_price)}</td>
      <td className="py-3 px-4 text-sm text-right text-primary font-semibold hidden md:table-cell">
        {formatETB(deal.commission_amount)}
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground text-right hidden lg:table-cell">
        {formatDate(deal.closed_at)}
      </td>
    </tr>
  )
}

export default function DealsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useDeals({ page })
  const { data: summary } = useDealSummary()

  const deals = data?.results ?? []
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Deals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All closed listings and recorded commissions</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={TrendingUp}
          label="Total deals"
          value={summary ? String(summary.deals_count) : '—'}
        />
        <SummaryCard
          icon={DollarSign}
          label="Total commission"
          value={summary ? formatETB(String(summary.total_commission)) : '—'}
        />
        <SummaryCard
          icon={Calendar}
          label="This month"
          value={summary ? String(summary.this_month_deals) : '—'}
          sub="deals closed"
        />
        <SummaryCard
          icon={DollarSign}
          label="This month"
          value={summary ? formatETB(String(summary.this_month_commission)) : '—'}
          sub="commission"
        />
      </div>

      {/* Deals table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium">Deal history</p>
          {data && <p className="text-xs text-muted-foreground mt-0.5">{data.count} total</p>}
        </div>

        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No closed deals yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-4 text-left">Listing</th>
                  <th className="py-2.5 px-4 text-left hidden sm:table-cell">Status</th>
                  <th className="py-2.5 px-4 text-right">Sale price</th>
                  <th className="py-2.5 px-4 text-right hidden md:table-cell">Commission</th>
                  <th className="py-2.5 px-4 text-right hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => <DealRow key={deal.id} deal={deal} />)}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
                className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
                className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
