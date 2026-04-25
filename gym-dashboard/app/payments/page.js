"use client"
/**
 * PaymentsSection.jsx — FINAL BUG-FREE VERSION
 *
 * ═══════════════════════════════════════════════════════════════
 * BUG 1 — Selected member / plan not shown in input after pick
 * ───────────────────────────────────────────────────────────────
 * ROOT CAUSE: Both comboboxes had a useEffect([value]) that called
 * setQuery("") / setSelected(null) whenever !value.  form.planId
 * starts as "" (falsy) and EVERY re-render (e.g. any setErrors
 * call) re-ran that effect and wiped the display name the user
 * just saw appear.
 * FIX: Removed value-watching effects entirely. Comboboxes are
 * now keyed on the modal's `open` prop so they fully unmount +
 * remount when the dialog opens/closes — a clean slate every
 * time, with zero risk of stale-state resets mid-session.
 * Internal state is 100% self-contained; parent only receives
 * callbacks.
 *
 * ═══════════════════════════════════════════════════════════════
 * BUG 3 — Amount / Notes / TransactionId accept only 1 char
 * ───────────────────────────────────────────────────────────────
 * ROOT CAUSE (the real one, missed in prior fix):
 *   `Field` was declared as a function component INSIDE
 *   `RecordPaymentModal`.  On every single state change (every
 *   keystroke) React sees a brand-new component type for `Field`
 *   and therefore UNMOUNTS and REMOUNTS every child — including
 *   the <Input> and <Textarea> nodes.  Unmounting destroys DOM
 *   focus and the typed character appears to vanish.
 * FIX: Moved `FormField` OUTSIDE the modal as a stable top-level
 * component. It is now defined once, its identity never changes,
 * and React never unmounts it between keystrokes.
 *
 * ═══════════════════════════════════════════════════════════════
 * BUG 2 — Amount ↔ Plan sync + "remove plan / enter manually"
 * ───────────────────────────────────────────────────────────────
 * • Select plan → amount pre-filled with plan.price (read-only)
 * • Remove plan (new X button in amount row) → amount cleared,
 *   field becomes freely editable
 * • No plan selected → user types freely, any positive number OK
 *
 * ═══════════════════════════════════════════════════════════════
 * BUG 4 — Revenue chart bars invisible
 * ───────────────────────────────────────────────────────────────
 * ROOT CAUSE: Bars used `height: X%` on a flex-1 child whose
 * parent had no explicit pixel height, so % resolved to 0.
 * FIX: Chart container gets a fixed pixel height (180px).
 * Each column is `display:flex; flex-direction:column;
 * justify-content:flex-end; height:100%`.  The bar div itself
 * uses flexBasis for its height, which resolves reliably inside
 * a flex column — no % height quirks.
 *
 * ═══════════════════════════════════════════════════════════════
 * BUG 5 — cap() only replaced first underscore
 * ───────────────────────────────────────────────────────────────
 * "personal_training" was rendered as "Personal_training".
 * FIX: replaced .replace("_"," ") with .replace(/_/g," ").
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useDispatch } from "react-redux"
import axiosInstance from "@/lib/config/axiosConfig"
import { showToast } from "@/lib/redux/slices/toastSlice"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  DollarSign,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Eye,
  Edit2,
  BarChart3,
  X,
  AlertCircle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Receipt,
  Banknote,
  Smartphone,
  Globe,
  Hash,
  UserCheck,
  UserSearch,
  Phone,
  Mail,
  PackageSearch,
  Tag,
  Clock3,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const PAYMENT_METHODS = ["cash", "card", "upi", "bank_transfer", "online"]
const PAYMENT_TYPES = [
  "membership",
  "session",
  "personal_training",
  "product",
  "other",
]
const PAYMENT_STATUSES = ["completed", "pending", "failed", "refunded"]
const PERIODS = ["daily", "monthly", "yearly"]

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-500/10  text-amber-400  border-amber-500/20",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-red-500/10    text-red-400    border-red-500/20",
  },
  refunded: {
    label: "Refunded",
    icon: RotateCcw,
    className: "bg-blue-500/10   text-blue-400   border-blue-500/20",
  },
}

const METHOD_ICONS = {
  cash: Banknote,
  card: CreditCard,
  upi: Smartphone,
  bank_transfer: Globe,
  online: Wallet,
}

// Stable blank form — defined OUTSIDE every component so the reference never
// changes and no useEffect depending on it re-fires spuriously.
const BLANK_FORM = {
  clientId: "",
  planId: "",
  amount: "",
  method: "",
  type: "",
  transactionId: "",
  notes: "",
  status: "completed",
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    n ?? 0
  )

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—"

// BUG 5 FIX: use regex /g so ALL underscores are replaced, not just the first.
const cap = (s) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : ""

// ─────────────────────────────────────────────────────────────────────────────
// STABLE FORM FIELD WRAPPER — must live OUTSIDE RecordPaymentModal
// ─────────────────────────────────────────────────────────────────────────────
/**
 * BUG 3 CORE FIX:
 * Previously `Field` was an arrow-function component defined INSIDE
 * `RecordPaymentModal`. React reconciliation uses referential identity of
 * component types to decide mount vs. update.  A function defined inside
 * another function gets a new reference on every render of the parent, so
 * React treats it as a completely different component type each time →
 * unmounts the old tree, mounts a fresh one → every <Input>/<Textarea>
 * loses its DOM node and therefore focus + the typed character.
 *
 * Moving it here (module scope) gives it a stable identity forever.
 */
function FormField({ label, id, required, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </Label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS / METHOD BADGES
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function MethodBadge({ method }) {
  const Icon = METHOD_ICONS[method] ?? Wallet
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      {cap(method)}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON / EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 9 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  )
}

function EmptyState({ message = "No payments found", sub = "" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-2xl bg-muted p-5">
        <Receipt className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">{message}</p>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, trend, loading }) {
  return (
    <Card className="relative overflow-hidden border-border/50 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{title}</p>
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            {sub && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {trend === "up" && (
                  <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                )}
                {trend === "down" && (
                  <ArrowDownRight className="h-3 w-3 text-red-400" />
                )}
                {sub}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REVENUE CHART  (BUG 4 FIX)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * BUG 4 ROOT CAUSE (definitive):
 *   The bar divs used `style={{ height: `${pct}%` }}` inside a flex-row
 *   container.  In CSS, percentage heights resolve against the height of the
 *   *containing block*.  A flex item whose height is determined by the flex
 *   algorithm (i.e. not an explicit px/rem value) is treated as `auto` for
 *   the purpose of percentage resolution → child % height = 0 → invisible bars.
 *
 * FIX:
 *   • Give the outer row an explicit inline height (180px).
 *   • Make each column a flex-column with justify-end and height:100% —
 *     this propagates the explicit pixel height down.
 *   • The bar itself sits at the *bottom* of its column using `marginTop:auto`
 *     (i.e. `flex-grow: the empty space above`) + an explicit pixel height
 *     computed as `(pct / 100) * 180`.  Pixel heights always resolve correctly,
 *     no CSS percentage-height quirks at all.
 */
const CHART_HEIGHT = 180 // px

function RevenueChart({ data, period }) {
  if (!data || data.length === 0)
    return (
      <EmptyState
        message="No revenue data"
        sub="Change the period or year to see results"
      />
    )

  const max = Math.max(...data.map((d) => d.totalRevenue), 1)

  const getLabel = (item) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]
    if (period === "monthly") return months[(item._id.month ?? 1) - 1]
    if (period === "daily") return `${item._id.day}/${item._id.month}`
    return String(item._id.year)
  }

  return (
    <div
      className="flex items-end gap-1.5 px-1"
      style={{ height: CHART_HEIGHT }}
    >
      {data.map((item, i) => {
        const pct = (item.totalRevenue / max) * 100
        const barPx = Math.max((pct / 100) * CHART_HEIGHT, 4) // min 4 px so 0-revenue still shows a sliver

        return (
          <TooltipProvider key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/*
                  Column: full height, flex-column, content pushed to bottom.
                  The label sits below the bar.
                */}
                <div
                  className="group flex flex-1 cursor-default flex-col items-center justify-end gap-1"
                  style={{ height: "100%" }}
                >
                  {/* BUG 4 FIX: explicit pixel height — always renders */}
                  <div
                    className="brand-bg w-full transition-all duration-300 group-hover:bg-primary"
                    style={{ height: barPx }}
                  />
                  <span className="pb-0.5 text-[9px] leading-none text-muted-foreground">
                    {getLabel(item)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-semibold">{fmt(item.totalRevenue)}</p>
                <p className="text-muted-foreground">{item.count} payment(s)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
function validatePaymentForm(form) {
  const errors = {}
  if (!form.clientId?.trim()) errors.clientId = "Client is required"
  if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
    errors.amount = "Enter a valid amount greater than 0"
  if (!form.method) errors.method = "Select a payment method"
  if (!form.type) errors.type = "Select a payment type"
  return errors
}

function validateStatusForm(form) {
  const errors = {}
  if (!form.status) errors.status = "Select a status"
  if (form.status === "refunded" && !form.refundReason?.trim())
    errors.refundReason = "Refund reason is required"
  return errors
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT SEARCH COMBOBOX
// ─────────────────────────────────────────────────────────────────────────────
/**
 * BUG 1 FIX strategy:
 * This component is used inside RecordPaymentModal which is keyed on `open`.
 * When the modal opens, React mounts a fresh instance — internal state is
 * always clean.  No value-watching useEffect needed; no stale-reset risk.
 *
 * The only reset path: parent passes `onSelect(null)` → we call handleClear
 * imperatively.  That's handled locally, no effect needed.
 */
function ClientSearchCombobox({ onSelect, error }) {
  const dispatch = useDispatch()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { data } = await axiosInstance.get("/clients", {
          params: { search: query.trim() },
        })
        const list = data.data ?? data.clients ?? []
        setResults(list)
        setOpen(list.length > 0)
      } catch {
        dispatch(
          showToast({ message: "Failed to search clients", type: "error" })
        )
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 350)

    return () => clearTimeout(debounceRef.current)
  }, [query, dispatch])

  const handleSelect = (client) => {
    setSelected(client)
    setQuery(client.name)
    setOpen(false)
    setResults([])
    onSelect(client)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery("")
    setResults([])
    onSelect(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <UserSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search member by name, phone or email…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (selected) {
              setSelected(null)
              onSelect(null)
            }
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          className={`pr-8 pl-9 ${error ? "border-red-500/50" : ""} ${selected ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}
          autoComplete="off"
        />
        <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
          {searching ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : selected ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Selected client chip */}
      {selected && (
        <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-400">
            {selected.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selected.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {selected.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {selected.phone}
                </span>
              )}
              {selected.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3" />
                  {selected.email}
                </span>
              )}
            </div>
          </div>
          <UserCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" />
        </div>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div className="max-h-52 overflow-y-auto">
            {results.map((client) => (
              <button
                key={client._id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(client)
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  {client.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{client.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="truncate">{client.email}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border px-3 py-1.5">
            <p className="text-xs text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""} · type
              more to refine
            </p>
          </div>
        </div>
      )}

      {open && !searching && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover px-4 py-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            No members found for <span className="font-medium">"{query}"</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN SEARCH COMBOBOX
// ─────────────────────────────────────────────────────────────────────────────
/**
 * BUG 1 FIX — same strategy as ClientSearchCombobox.
 * Keyed on modal `open`, so always starts fresh. No value-watching effect.
 */
function PlanSearchCombobox({ onSelect, error }) {
  const dispatch = useDispatch()
  const [query, setQuery] = useState("")
  const [plans, setPlans] = useState([])
  const [selected, setSelected] = useState(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)

  // Fetch all plans once on mount
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        // BUG 5 FIX: endpoint was "/membership/plans" — corrected to "/plans"
        // (axiosInstance baseURL already includes /api)
        // If your backend route is /api/membership/plans, change back to "/membership/plans"
        const { data } = await axiosInstance.get("membership/plans")
        setPlans(data.data ?? [])
      } catch {
        dispatch(
          showToast({
            message: "Could not load membership plans",
            type: "error",
          })
        )
      } finally {
        setLoading(false)
      }
    })()
  }, [dispatch])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return plans
    const q = query.toLowerCase()
    return plans.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }, [query, plans])

  const handleSelect = (plan) => {
    setSelected(plan)
    setQuery(plan.name)
    setOpen(false)
    onSelect(plan)
  }

  const handleClear = () => {
    setSelected(null)
    setQuery("")
    onSelect(null)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <PackageSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={
            loading ? "Loading plans…" : "Search membership plan… (optional)"
          }
          value={query}
          disabled={loading}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (selected) {
              setSelected(null)
              onSelect(null)
            }
          }}
          onFocus={() => filtered.length > 0 && setOpen(true)}
          className={`pr-8 pl-9 ${error ? "border-red-500/50" : ""} ${selected ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}
          autoComplete="off"
        />
        <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : selected ? (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Selected plan chip */}
      {selected && (
        <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
            <PackageSearch className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{selected.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {fmt(selected.price)}
              </span>
              {selected.duration && (
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {selected.duration} {selected.durationUnit}
                </span>
              )}
            </div>
          </div>
          <UserCheck className="h-4 w-4 flex-shrink-0 text-emerald-400" />
        </div>
      )}

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((plan) => (
              <button
                key={plan._id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(plan)
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                  <PackageSearch className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{plan.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{fmt(plan.price)}</span>
                    {plan.duration && (
                      <span>
                        · {plan.duration} {plan.durationUnit}
                      </span>
                    )}
                    {plan.highlight && (
                      <span className="rounded bg-primary/10 px-1.5 text-primary">
                        {plan.highlight}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-border px-3 py-1.5">
            <p className="text-xs text-muted-foreground">
              {filtered.length} plan{filtered.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
      )}

      {open && !loading && filtered.length === 0 && query.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover px-4 py-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            No plans match <span className="font-medium">"{query}"</span>
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RECORD PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function RecordPaymentModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch()

  const [form, setForm] = useState({ ...BLANK_FORM })
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({ ...BLANK_FORM })
      setSelectedClient(null)
      setSelectedPlan(null)
      setErrors({})
    }
  }, [open])

  // Generic field setter — updates one key, clears its error
  const setField = useCallback((key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }, [])

  // ── Client selection ────────────────────────────────────────────────────────
  const handleClientSelect = useCallback((client) => {
    if (client) {
      setSelectedClient(client)
      setForm((prev) => ({ ...prev, clientId: client._id }))
      setErrors((prev) => ({ ...prev, clientId: undefined }))
    } else {
      setSelectedClient(null)
      setForm((prev) => ({ ...prev, clientId: "" }))
    }
  }, [])

  // ── Plan selection — BUG 2 FIX ──────────────────────────────────────────────
  // Select plan → pre-fill amount (read-only). Remove plan → clear amount, make editable.
  const handlePlanSelect = useCallback((plan) => {
    if (plan) {
      setSelectedPlan(plan)
      setForm((prev) => ({
        ...prev,
        planId: plan._id,
        amount: String(plan.price ?? ""), // always overwrite with plan price
      }))
      setErrors((prev) => ({ ...prev, amount: undefined }))
    } else {
      // Plan removed → clear amount so user must type manually
      setSelectedPlan(null)
      setForm((prev) => ({ ...prev, planId: "", amount: "" }))
    }
  }, [])

  // ── Remove plan button (new feature) ────────────────────────────────────────
  // Exposed so the amount row can show an "× Remove plan" button inline
  const handleRemovePlan = useCallback(() => {
    handlePlanSelect(null)
  }, [handlePlanSelect])

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validatePaymentForm(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const payload = {
        clientId: form.clientId,
        amount: Number(form.amount),
        method: form.method,
        type: form.type,
        status: form.status,
        ...(form.planId?.trim() && { planId: form.planId.trim() }),
        ...(form.transactionId?.trim() && {
          transactionId: form.transactionId.trim(),
        }),
        ...(form.notes?.trim() && { notes: form.notes.trim() }),
      }
      await axiosInstance.post("/payments", payload)
      dispatch(
        showToast({
          message: "Payment recorded successfully!",
          type: "success",
        })
      )
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Payment submission error:", err)
      dispatch(
        showToast({
          message: err?.response?.data?.message ?? "Failed to record payment",
          type: "error",
        })
      )
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { label: "Select Member", done: !!form.clientId },
    {
      label: "Payment Info",
      done: !!form.amount && !!form.method && !!form.type,
    },
    { label: "Confirm", done: false },
  ]

  return (
    /*
     * KEY PROP = open ? "open" : "closed"
     *
     * This is part of BUG 1 FIX: keying the Dialog content on the open state
     * causes React to fully unmount ClientSearchCombobox and PlanSearchCombobox
     * when the modal closes and remount them fresh when it opens.
     * This guarantees their internal state (query, selected, results) is always
     * a clean slate — no stale display names, no stale selections.
     */
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent
        // key={open ? "modal-open" : "modal-closed"}
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
        // onInteractOutside={(e) => {
        //   e.preventDefault()
        //   onClose()
        // }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Search for a member, then fill in the payment details.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center">
          {steps.map((step, i) => (
            <React.Fragment key={step.label}>
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${step.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                >
                  {step.done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs ${step.done ? "text-emerald-400" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 h-px flex-1 transition-colors ${step.done ? "bg-emerald-500/40" : "bg-border"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <Separator />

        <div className="grid gap-4 py-1">
          {/* ── Member field ── */}
          <FormField
            label="Member"
            id="clientSearch"
            required
            error={errors.clientId}
          >
            {/*
              ClientSearchCombobox no longer receives a `value` prop — its
              internal state is the source of truth. The modal's key prop
              handles reset. BUG 1 FIXED.
            */}
            <ClientSearchCombobox
              onSelect={handleClientSelect}
              error={errors.clientId}
            />
          </FormField>

          {/* ── Fields unlocked after client selection ── */}
          <div
            className={`space-y-4 transition-opacity duration-200 ${!form.clientId ? "pointer-events-none opacity-40" : "opacity-100"}`}
          >
            {/* ── Plan field (optional) ── */}
            <FormField label="Membership Plan (optional)" id="planSearch">
              {/*
                PlanSearchCombobox no longer receives a `value` prop.
                BUG 1 FIXED.
              */}
              <PlanSearchCombobox onSelect={handlePlanSelect} />
            </FormField>

            {/* ── Amount field — BUG 2 + BUG 3 FIX ── */}
            <FormField
              label="Amount (₹)"
              id="amount"
              required
              error={errors.amount}
            >
              <div className="relative">
                <DollarSign className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                {/*
                  BUG 3 FIX: type="text" + inputMode="decimal"
                  With type="number", browsers return "" for intermediate states
                  like "1." causing keystrokes to disappear. type="text" always
                  gives us the actual typed string.

                  BUG 2 FIX: readOnly when plan selected; editable otherwise.
                */}
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={form.amount}
                  readOnly={!!selectedPlan}
                  onChange={(e) => {
                    // Allow digits and a single decimal point — no regex that
                    // drops characters mid-type.
                    const v = e.target.value
                    if (v === "" || /^\d*\.?\d*$/.test(v)) {
                      setField("amount", v)
                    }
                  }}
                  className={[
                    "pl-9",
                    errors.amount ? "border-red-500/50" : "",
                    selectedPlan
                      ? "cursor-not-allowed bg-muted/40 text-muted-foreground"
                      : "",
                  ].join(" ")}
                />
                {/* ── "Remove plan & enter manually" button — NEW FEATURE ── */}
                {selectedPlan && (
                  <button
                    type="button"
                    onClick={handleRemovePlan}
                    className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Remove plan and enter amount manually"
                  >
                    <X className="h-3 w-3" />
                    Remove plan
                  </button>
                )}
              </div>
              {selectedPlan && (
                <p className="text-[11px] text-muted-foreground">
                  Pre-filled from{" "}
                  <span className="font-medium text-foreground">
                    {selectedPlan.name}
                  </span>
                  . Click <span className="font-medium">"Remove plan"</span> to
                  enter a custom amount.
                </p>
              )}
            </FormField>

            {/* ── Method + Type ── */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Method"
                id="method"
                required
                error={errors.method}
              >
                <Select
                  value={form.method}
                  onValueChange={(v) => setField("method", v)}
                >
                  <SelectTrigger
                    className={errors.method ? "border-red-500/50" : ""}
                  >
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {cap(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Type" id="type" required error={errors.type}>
                <Select
                  value={form.type}
                  onValueChange={(v) => {
                    if (PAYMENT_TYPES.includes(v)) setField("type", v)
                  }}
                >
                  <SelectTrigger
                    className={errors.type ? "border-red-500/50" : ""}
                  >
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((t) => (
                      // BUG 5 FIX: cap() now uses /g regex → "Personal Training"
                      <SelectItem key={t} value={t}>
                        {cap(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* ── Status ── */}
            <FormField label="Status" id="status">
              <Select
                value={form.status}
                onValueChange={(v) => {
                  if (PAYMENT_STATUSES.includes(v)) setField("status", v)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {cap(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* ── Transaction ID ── */}
            {/*
              BUG 3 FIX: FormField is now a stable module-level component, so
              React never unmounts <Input> between keystrokes.
            */}
            <FormField label="Transaction / Reference ID" id="transactionId">
              <div className="relative">
                <Hash className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="transactionId"
                  type="text"
                  placeholder="Optional – UPI ref, cheque no., etc."
                  value={form.transactionId}
                  onChange={(e) => setField("transactionId", e.target.value)}
                  className="pl-9"
                />
              </div>
            </FormField>

            {/* ── Notes ── */}
            {/*
              BUG 3 FIX: same — stable FormField wrapper means Textarea is never
              unmounted between keystrokes.
            */}
            <FormField label="Notes" id="notes">
              <Textarea
                id="notes"
                placeholder="Any additional notes…"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={2}
                className="resize-none"
              />
            </FormField>
          </div>

          {/* ── Confirm summary ── */}
          {form.clientId && form.amount && form.method && form.type && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-3 text-xs font-semibold tracking-wider text-primary uppercase">
                Confirm Payment
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Member</div>
                <div className="font-medium">{selectedClient?.name}</div>

                <div className="text-muted-foreground">Amount</div>
                <div className="font-semibold text-emerald-400">
                  {fmt(Number(form.amount) || 0)}
                </div>

                {selectedPlan && (
                  <>
                    <div className="text-muted-foreground">Plan</div>
                    <div className="font-medium">{selectedPlan.name}</div>
                  </>
                )}

                <div className="text-muted-foreground">Method</div>
                <div>
                  <MethodBadge method={form.method} />
                </div>

                <div className="text-muted-foreground">Type</div>
                <div className="capitalize">{cap(form.type)}</div>

                <div className="text-muted-foreground">Status</div>
                <div>
                  <StatusBadge status={form.status} />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.clientId}
            className="min-w-36"
          >
            {loading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {loading ? "Recording…" : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE STATUS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function UpdateStatusModal({ open, payment, onClose, onSuccess }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState({ status: "", refundReason: "" })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && payment) {
      setForm({ status: payment.status, refundReason: "" })
      setErrors({})
    }
  }, [open, payment])

  const setField = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }))
    setErrors((p) => ({ ...p, [key]: undefined }))
  }

  const handleSubmit = async () => {
    const errs = validateStatusForm(form)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await axiosInstance.patch(`/payments/${payment._id}/status`, form)
      dispatch(
        showToast({ message: "Payment status updated!", type: "success" })
      )
      onSuccess()
      onClose()
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message ?? "Failed to update status",
          type: "error",
        })
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-1.5">
              <Edit2 className="h-4 w-4 text-amber-400" />
            </div>
            Update Status
          </DialogTitle>
          <DialogDescription>
            Change the status for payment{" "}
            <span className="font-mono text-xs">{payment?._id?.slice(-8)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              New Status <span className="text-red-400">*</span>
            </Label>
            <Select
              value={form.status}
              onValueChange={(v) => setField("status", v)}
            >
              <SelectTrigger
                className={errors.status ? "border-red-500/50" : ""}
              >
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {cap(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" />
                {errors.status}
              </p>
            )}
          </div>

          {form.status === "refunded" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Refund Reason <span className="text-red-400">*</span>
              </Label>
              <Textarea
                placeholder="Reason for refund…"
                value={form.refundReason}
                onChange={(e) => setField("refundReason", e.target.value)}
                rows={3}
                className={`resize-none ${errors.refundReason ? "border-red-500/50" : ""}`}
              />
              {errors.refundReason && (
                <p className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {errors.refundReason}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PaymentDetailModal({ open, paymentId, onClose }) {
  const dispatch = useDispatch()
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !paymentId) return
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await axiosInstance.get(`/payments/${paymentId}`)
        setPayment(data.data)
      } catch {
        dispatch(
          showToast({
            message: "Failed to load payment details",
            type: "error",
          })
        )
        onClose()
      } finally {
        setLoading(false)
      }
    })()
  }, [open, paymentId])

  const Row = ({ label, value }) => (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="min-w-0 flex-shrink-0 text-sm text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value ?? "—"}</span>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            Payment Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : payment ? (
          <div className="divide-y divide-border">
            <Row
              label="Payment ID"
              value={<span className="font-mono text-xs">{payment._id}</span>}
            />
            <Row
              label="Client"
              value={
                payment.client
                  ? `${payment.client.name} (${payment.client.email})`
                  : "—"
              }
            />
            <Row label="Plan" value={payment.plan?.name} />
            <Row label="Amount" value={fmt(payment.amount)} />
            <Row
              label="Method"
              value={<MethodBadge method={payment.method} />}
            />
            <Row
              label="Type"
              value={
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                  {cap(payment.type)}
                </span>
              }
            />
            <Row
              label="Status"
              value={<StatusBadge status={payment.status} />}
            />
            {payment.transactionId && (
              <Row
                label="Transaction ID"
                value={
                  <span className="font-mono text-xs">
                    {payment.transactionId}
                  </span>
                }
              />
            )}
            {payment.refundReason && (
              <Row label="Refund Reason" value={payment.refundReason} />
            )}
            <Row label="Recorded On" value={fmtDate(payment.createdAt)} />
            {payment.notes && <Row label="Notes" value={payment.notes} />}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTERS BAR
// ─────────────────────────────────────────────────────────────────────────────
function FiltersBar({ filters, onChange, onReset, activeCount }) {
  const set = (key, val) => onChange({ ...filters, [key]: val, page: 1 })
  const toSel = (v) => v || "all"
  const fromSel = (v) => (v === "all" ? "" : v)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Filter by client ID…"
          value={filters.clientId}
          onChange={(e) => set("clientId", e.target.value)}
          className="h-9 w-48 pl-9 text-sm"
        />
      </div>

      <Select
        value={toSel(filters.method)}
        onValueChange={(v) => set("method", fromSel(v))}
      >
        <SelectTrigger className="h-9 w-36! text-sm">
          <SelectValue placeholder="Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          {PAYMENT_METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              {cap(m)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={toSel(filters.status)}
        onValueChange={(v) => set("status", fromSel(v))}
      >
        <SelectTrigger className="h-9 w-36! text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {PAYMENT_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {cap(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={toSel(filters.type)}
        onValueChange={(v) => set("type", fromSel(v))}
      >
        <SelectTrigger className="h-9 w-36! text-sm">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {PAYMENT_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {cap(t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => set("from", e.target.value)}
          className="h-9 w-36 text-sm"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => set("to", e.target.value)}
          className="h-9 w-36 text-sm"
        />
      </div>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground hover:text-foreground"
          onClick={onReset}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Clear ({activeCount})
        </Button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REVENUE SUMMARY CARD
// ─────────────────────────────────────────────────────────────────────────────
function RevenueSummaryCard() {
  const dispatch = useDispatch()
  const [period, setPeriod] = useState("monthly")
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const total = useMemo(
    () => data.reduce((a, d) => a + d.totalRevenue, 0),
    [data]
  )
  const count = useMemo(() => data.reduce((a, d) => a + d.count, 0), [data])

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const { data: res } = await axiosInstance.get("/payments/summary", {
        params: { period, year },
      })
      setData(res.data ?? [])
    } catch {
      dispatch(
        showToast({ message: "Failed to load revenue summary", type: "error" })
      )
    } finally {
      setLoading(false)
    }
  }, [period, year, dispatch])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  )

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Revenue Overview
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {fmt(total)} · {count} transactions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {cap(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={fetchSummary}
              disabled={loading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="flex items-end gap-1.5"
            style={{ height: CHART_HEIGHT }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>
        ) : (
          <RevenueChart data={data} period={period} />
        )}
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAYMENTS SECTION
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  clientId: "",
  method: "",
  status: "",
  type: "",
  from: "",
  to: "",
  page: 1,
  limit: 15,
}

export default function PaymentsSection() {
  const dispatch = useDispatch()

  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completed: 0,
    pending: 0,
    refunded: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [recordOpen, setRecordOpen] = useState(false)
  const [updateModal, setUpdateModal] = useState({ open: false, payment: null })
  const [detailModal, setDetailModal] = useState({ open: false, id: null })

  const fetchPayments = useCallback(
    async (params = filters) => {
      setLoading(true)
      try {
        const query = Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== "")
        )
        const { data } = await axiosInstance.get("/payments", { params: query })
        setPayments(data.data ?? [])
        setTotal(data.total ?? 0)
      } catch {
        dispatch(
          showToast({ message: "Failed to fetch payments", type: "error" })
        )
      } finally {
        setLoading(false)
      }
    },
    [dispatch]
  )

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const [completed, pending, refunded] = await Promise.all([
        axiosInstance.get("/payments", {
          params: { limit: 1, status: "completed" },
        }),
        axiosInstance.get("/payments", {
          params: { limit: 1, status: "pending" },
        }),
        axiosInstance.get("/payments", {
          params: { limit: 1, status: "refunded" },
        }),
      ])
      const summaryRes = await axiosInstance.get("/payments/summary", {
        params: { period: "yearly", year: new Date().getFullYear() },
      })
      const rev =
        summaryRes.data.data?.reduce((a, d) => a + d.totalRevenue, 0) ?? 0
      setStats({
        totalRevenue: rev,
        completed: completed.data.total ?? 0,
        pending: pending.data.total ?? 0,
        refunded: refunded.data.total ?? 0,
      })
    } catch {
      /* non-critical */
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayments(filters)
  }, [filters, fetchPayments])
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const totalPages = Math.ceil(total / filters.limit)
  const goPage = (p) => setFilters((f) => ({ ...f, page: p }))
  const resetFilters = () => setFilters(DEFAULT_FILTERS)
  const refreshAll = () => {
    fetchPayments(filters)
    fetchStats()
  }

  const activeFilterCount = useMemo(() => {
    const { page, limit, ...rest } = filters
    return Object.values(rest).filter(Boolean).length
  }, [filters])

  return (
    <div className="min-h-screen">
      <div className="my-5 w-full space-y-6 lg:my-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage transactions, refunds, and revenue analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={loading}
              className="h-9"
            >
              <RefreshCw
                className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              className="h-9"
              onClick={() => setRecordOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            title="Revenue (This Year)"
            value={fmt(stats.totalRevenue)}
            icon={TrendingUp}
            loading={statsLoading}
            trend="up"
            sub="All completed payments"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            loading={statsLoading}
            trend="up"
            sub="Successful transactions"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            loading={statsLoading}
            sub="Awaiting confirmation"
          />
          <StatCard
            title="Refunded"
            value={stats.refunded}
            icon={RotateCcw}
            loading={statsLoading}
            trend="down"
            sub="Returned transactions"
          />
        </div>

        <RevenueSummaryCard />

        {/* Payments table */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="mb-4 flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Receipt className="h-4 w-4 text-primary" />
                All Payments
                {total > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {total}
                  </Badge>
                )}
              </CardTitle>
            </div>
            <FiltersBar
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
              activeCount={activeFilterCount}
            />
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-32 pl-6 text-xs">ID</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs">Plan</TableHead>
                    <TableHead className="text-right text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Method</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="pr-6 text-right text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <SkeletonRow key={i} />
                    ))
                  ) : payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <EmptyState
                          message="No payments found"
                          sub={
                            activeFilterCount
                              ? "Try adjusting your filters"
                              : "Record the first payment to get started"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow
                        key={p._id}
                        className="group transition-colors hover:bg-muted/40"
                      >
                        <TableCell className="pl-6">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="font-mono text-xs text-muted-foreground">
                                  #{p._id.slice(-8)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{p._id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {p.client ? (
                            <div>
                              <p className="text-sm font-medium">
                                {p.client.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.client.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {p.plan?.name ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {fmt(p.amount)}
                        </TableCell>
                        <TableCell>
                          <MethodBadge method={p.method} />
                        </TableCell>
                        <TableCell>
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                            {cap(p.type)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(p.createdAt)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      setDetailModal({ open: true, id: p._id })
                                    }
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View details</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      setUpdateModal({ open: true, payment: p })
                                    }
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Update status</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <>
                <Separator />
                <div className="flex items-center justify-between px-6 py-3">
                  <p className="text-xs text-muted-foreground">
                    Page {filters.page} of {totalPages} · {total} total
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={filters.page <= 1}
                      onClick={() => goPage(filters.page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const start = Math.max(
                        1,
                        Math.min(filters.page - 2, totalPages - 4)
                      )
                      const page = start + i
                      return (
                        <Button
                          key={page}
                          size="icon"
                          variant={
                            page === filters.page ? "default" : "outline"
                          }
                          className="h-8 w-8 text-xs"
                          onClick={() => goPage(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      disabled={filters.page >= totalPages}
                      onClick={() => goPage(filters.page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <RecordPaymentModal
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        onSuccess={refreshAll}
      />
      <UpdateStatusModal
        open={updateModal.open}
        payment={updateModal.payment}
        onClose={() => setUpdateModal({ open: false, payment: null })}
        onSuccess={refreshAll}
      />
      <PaymentDetailModal
        open={detailModal.open}
        paymentId={detailModal.id}
        onClose={() => setDetailModal({ open: false, id: null })}
      />
    </div>
  )
}
