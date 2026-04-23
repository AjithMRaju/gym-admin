"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useDispatch } from "react-redux"
import axiosInstance from "@/lib/config/axiosConfig"
import { showToast } from "@/lib/redux/slices/toastSlice"

// ─── shadcn/ui — @/components/ui ─────────────────────────────────────────────
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// ─── Icons ────────────────────────────────────────────────────────────────────
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  ArrowUpDown,
  UserCheck,
  UserX,
  Loader2,
  Grid3X3,
  List,
  Activity,
  Clock,
  Filter,
} from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  dateofBirth: "",
  gender: "",
  address: "",
  status: "active",
}
const GENDER_OPTIONS = ["male", "female", "other", "prefer not to say"]
const STATUS_OPTIONS = ["active", "inactive"]
const PAGE_SIZE_OPTIONS = [10, 20, 50]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-indigo-500",
]
const getAvatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const formatDate = (d) => {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  active: {
    dot: "bg-emerald-500",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  inactive: {
    dot: "bg-rose-500",
    cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
}
const StatusBadge = ({ status = "inactive" }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.inactive
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="group relative flex cursor-default items-center gap-4 overflow-hidden rounded border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded ${accent}`}
    >
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
  </div>
)

// ─── Form Field Wrapper ───────────────────────────────────────────────────────
const FormField = ({ label, error, required, children }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </Label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs text-destructive">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {error}
      </p>
    )}
  </div>
)

// ─── Status Toggle Switch Component ──────────────────────────────────────────
const StatusToggle = ({ status, onToggle, disabled = false }) => {
  const isActive = status === "active"

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isActive ? "bg-emerald-500/10" : "bg-rose-500/10"
          }`}
        >
          {isActive ? (
            <UserCheck className="h-4 w-4 text-emerald-500" />
          ) : (
            <UserX className="h-4 w-4 text-rose-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Account Status</p>
          <p className="text-xs text-muted-foreground">
            {isActive
              ? "Client can access the system and book sessions"
              : "Client access is temporarily disabled"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium ${
            isActive ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
        <Switch
          checked={isActive}
          onCheckedChange={(checked) =>
            onToggle(checked ? "active" : "inactive")
          }
          disabled={disabled}
          className="data-[state=checked]:bg-emerald-500"
        />
      </div>
    </div>
  )
}

// ─── Client Card (Grid) ───────────────────────────────────────────────────────
const ClientCard = ({ client, onView, onEdit, onDelete }) => (
  <div
    className="group relative flex cursor-pointer flex-col overflow-hidden rounded border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
    onClick={() => onView(client)}
  >
    <div className="flex flex-1 flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/maxleiter.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate leading-tight font-semibold text-foreground">
              {client.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground capitalize">
              {client.gender || "—"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onView(client)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onEdit(client)
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Client
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(client)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={client.status} />
        {client.fitnessGoals?.length > 0 && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {client.fitnessGoals.length} goal
            {client.fitnessGoals.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <Separator />

      <div className="flex-1 space-y-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{client.email}</span>
        </div>
        {client.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span>{client.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
          <Clock className="h-3 w-3 shrink-0" />
          <span>Joined {formatDate(client.createdAt)}</span>
        </div>
      </div>
    </div>

    <div className="absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-gradient-to-r from-primary/60 via-primary to-primary/60 transition-transform duration-300 group-hover:scale-x-100" />
  </div>
)

// ─── Table Row (List) ─────────────────────────────────────────────────────────
const ClientRow = ({ client, onView, onEdit, onDelete }) => (
  <tr
    className="group cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30"
    onClick={() => onView(client)}
  >
    <td className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage
            src="https://github.com/maxleiter.png"
            alt="@maxleiter"
          />
          <AvatarFallback>LR</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {client.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {client.email}
          </p>
        </div>
      </div>
    </td>
    <td className="hidden px-4 py-3.5 text-sm text-muted-foreground sm:table-cell">
      {client.phone || "—"}
    </td>
    <td className="hidden px-4 py-3.5 md:table-cell">
      <Badge variant="secondary" className="text-xs capitalize">
        {client.gender || "—"}
      </Badge>
    </td>
    <td className="hidden px-4 py-3.5 lg:table-cell">
      <StatusBadge status={client.status} />
    </td>
    <td className="hidden px-4 py-3.5 text-xs text-muted-foreground xl:table-cell">
      {formatDate(client.createdAt)}
    </td>
    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onView(client)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(client)}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(client)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </td>
  </tr>
)

// ─── Skeletons ────────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="h-1.5 w-full animate-pulse bg-muted" />
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
      <Separator />
      <div className="space-y-2.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  </div>
)

const RowSkeleton = () => (
  <tr className="border-b border-border/50">
    <td className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </td>
    <td className="hidden px-4 py-3.5 sm:table-cell">
      <Skeleton className="h-3.5 w-24" />
    </td>
    <td className="hidden px-4 py-3.5 md:table-cell">
      <Skeleton className="h-5 w-16 rounded-full" />
    </td>
    <td className="hidden px-4 py-3.5 lg:table-cell">
      <Skeleton className="h-5 w-20 rounded-full" />
    </td>
    <td className="hidden px-4 py-3.5 xl:table-cell">
      <Skeleton className="h-3.5 w-24" />
    </td>
    <td className="px-4 py-3.5" />
  </tr>
)

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ hasFilters, onAdd, onClear }) => (
  <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
      <Users className="h-9 w-9 text-muted-foreground" />
    </div>
    <h3 className="mb-2 text-lg font-semibold text-foreground">
      {hasFilters ? "No clients match your filters" : "No clients yet"}
    </h3>
    <p className="mb-6 max-w-xs text-sm text-muted-foreground">
      {hasFilters
        ? "Try adjusting your search or filter criteria."
        : "Add your first client and they'll appear here."}
    </p>
    {hasFilters ? (
      <Button variant="outline" onClick={onClear} className="gap-2">
        <X className="h-4 w-4" />
        Clear Filters
      </Button>
    ) : (
      <Button onClick={onAdd} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Add First Client
      </Button>
    )}
  </div>
)

// ─── Pagination ───────────────────────────────────────────────────────────────
const Pagination = ({
  page,
  totalPages,
  total,
  pageSize,
  from,
  to,
  onPageChange,
  onPageSizeChange,
}) => {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, start + 4)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-2 sm:flex-row">
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
        <span>
          {total === 0 ? "0 results" : `${from}–${to} of ${total} clients`}
        </span>
        <Separator orientation="vertical" className="hidden h-4 sm:block" />
        <div className="flex items-center gap-2">
          <span className="text-xs">Rows:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-7 w-14 border-border bg-card px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          title="First page"
        >
          <ChevronLeft className="h-3 w-3" />
          <ChevronLeft className="-ml-2 h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {start > 1 && (
          <span className="px-1 text-xs text-muted-foreground">…</span>
        )}

        {pages.map((p) => (
          <Button
            key={p}
            variant={page === p ? "default" : "outline"}
            size="icon"
            className="h-8 w-8 text-xs font-medium"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}

        {end < totalPages && (
          <span className="px-1 text-xs text-muted-foreground">…</span>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
        >
          <ChevronRight className="h-3 w-3" />
          <ChevronRight className="-ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// ─── Form Validation ──────────────────────────────────────────────────────────
const validate = (form, isEdit) => {
  const e = {}
  if (!form.name.trim()) e.name = "Name is required"
  if (!form.email.trim()) e.email = "Email is required"
  else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address"
  if (!form.phone.trim()) e.phone = "Phone is required"
  if (!isEdit && !form.password.trim()) e.password = "Password is required"
  return e
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════
export default function ClientsPage() {
  const dispatch = useDispatch()

  // data
  const [clients, setClients] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // filters & pagination
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("name")
  const [sortDir, setSortDir] = useState("asc")
  const [viewMode, setViewMode] = useState("grid")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // dialogs - using refs to prevent unnecessary re-renders
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const [editClient, setEditClient] = useState(null)
  const [activeClient, setActiveClient] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})

  // Ref to track if dialog is opening to prevent filter effects
  const isDialogOpening = useRef(false)

  // debounce search - only when not opening dialog
  useEffect(() => {
    if (isDialogOpening.current) {
      isDialogOpening.current = false
      return
    }
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  // ── fetch (server-driven) ─────────────────────────────────────────────────
  const fetchClients = useCallback(
    async (pg, size) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: pg, limit: size })
        if (debouncedSearch) params.set("search", debouncedSearch)
        if (genderFilter !== "all") params.set("gender", genderFilter)
        if (statusFilter !== "all") params.set("status", statusFilter)

        const { data } = await axiosInstance.get(
          `/clients?${params.toString()}`
        )

        setClients(data.data ?? [])
        setTotalCount(data.total ?? 0)
      } catch (err) {
        dispatch(
          showToast({
            message: err?.response?.data?.message || "Failed to fetch clients",
            type: "error",
          })
        )
      } finally {
        setLoading(false)
      }
    },
    [dispatch, debouncedSearch, genderFilter, statusFilter]
  )

  useEffect(() => {
    fetchClients(page, pageSize)
  }, [fetchClients, page, pageSize])

  // ── derived ───────────────────────────────────────────────────────────────
  const sorted = [...clients].sort((a, b) => {
    const av = (a[sortField] || "").toString().toLowerCase()
    const bv = (b[sortField] || "").toString().toLowerCase()
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)
  const hasFilters =
    !!debouncedSearch || genderFilter !== "all" || statusFilter !== "all"

  // on-page stats
  const activeOnPage = clients.filter((c) => c.status === "active").length
  const inactiveOnPage = clients.filter((c) => c.status === "inactive").length

  // ── action handlers ───────────────────────────────────────────────────────
  const openCreate = () => {
    isDialogOpening.current = true
    setEditClient(null)
    setForm({ ...INITIAL_FORM, status: "active" })
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (c) => {
    isDialogOpening.current = true
    setEditClient(c)
    setForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      password: "",
      dateofBirth: c.dateofBirth?.slice(0, 10) || "",
      gender: c.gender || "",
      address: c.address || "",
      status: c.status || "active",
    })
    setErrors({})
    setShowForm(true)
  }

  const openView = (c) => {
    setActiveClient(c)
    setShowDetail(true)
  }

  const openDelete = (c) => {
    setDeleteTarget(c)
    setShowDelete(true)
  }

  const handleFormChange = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }))
    if (errors[key]) setErrors((p) => ({ ...p, [key]: "" }))
  }

  const handleSubmit = async () => {
    const errs = validate(form, !!editClient)
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setSubmitting(true)
    try {
      if (editClient) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await axiosInstance.put(`/clients/${editClient._id}`, payload)
        dispatch(
          showToast({ message: "Client updated successfully", type: "success" })
        )
      } else {
        await axiosInstance.post("/clients", form)
        dispatch(
          showToast({ message: "Client created successfully", type: "success" })
        )
      }
      setShowForm(false)
      fetchClients(page, pageSize)
    } catch (err) {
      dispatch(
        showToast({
          message:
            err?.response?.data?.message ||
            "Operation failed. Please try again.",
          type: "error",
        })
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axiosInstance.delete(`/clients/${deleteTarget._id}`)
      dispatch(
        showToast({ message: "Client deleted successfully", type: "success" })
      )
      setShowDelete(false)
      const newPage = clients.length === 1 && page > 1 ? page - 1 : page
      setPage(newPage)
      fetchClients(newPage, pageSize)
    } catch (err) {
      dispatch(
        showToast({
          message:
            err?.response?.data?.message || "Delete failed. Please try again.",
          type: "error",
        })
      )
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setGenderFilter("all")
    setStatusFilter("all")
    setPage(1)
  }

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <div className="mx-auto my-5 max-w-screen-2xl space-y-7 lg:my-10">
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Clients
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {loading
                  ? "Loading…"
                  : `${totalCount} client${totalCount !== 1 ? "s" : ""} registered`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => fetchClients(page, pageSize)}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
              <Button onClick={openCreate} className="h-9 gap-2 font-medium">
                <UserPlus className="h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>

          {/* ── Stat Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Clients"
              value={loading ? "—" : totalCount}
              accent="bg-primary"
              sub="all registered"
            />
            <StatCard
              icon={Activity}
              label="Active"
              value={loading ? "—" : activeOnPage}
              accent="bg-emerald-500"
              sub="this page"
            />
            <StatCard
              icon={UserX}
              label="Inactive"
              value={loading ? "—" : inactiveOnPage}
              accent="bg-rose-500"
              sub="this page"
            />
            <StatCard
              icon={UserCheck}
              label="Current Page"
              value={loading ? "—" : `${page} / ${totalPages}`}
              accent="bg-amber-500"
              sub={`${pageSize} per page`}
            />
          </div>

          {/* ── Filter Section with Grid Layout ────────────────────────── */}
          <div className="rounded border border-border bg-card p-4 shadow-none">
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Filters & Controls
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, phone…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 border-border bg-background pl-9"
                />
                {search && (
                  <button
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Gender Filter */}
              <Select
                value={genderFilter}
                onValueChange={(v) => {
                  setGenderFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-10 border-border bg-background">
                  <User className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All genders</SelectItem>
                  {GENDER_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g} className="capitalize">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-10 border-border bg-background">
                  <Activity className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={`${sortField}-${sortDir}`}
                onValueChange={(v) => {
                  const [f, d] = v.split("-")
                  setSortField(f)
                  setSortDir(d)
                }}
              >
                <SelectTrigger className="h-10 border-border bg-background">
                  <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A–Z</SelectItem>
                  <SelectItem value="name-desc">Name Z–A</SelectItem>
                  <SelectItem value="email-asc">Email A–Z</SelectItem>
                  <SelectItem value="email-desc">Email Z–A</SelectItem>
                  <SelectItem value="status-asc">
                    Status Active first
                  </SelectItem>
                  <SelectItem value="status-desc">
                    Status Inactive first
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex h-10 items-center gap-1 rounded border border-border bg-background p-1">
                <button
                  className={`flex-1 cursor-pointer rounded p-1.5 transition-colors ${
                    viewMode === "grid"
                      ? "brand-bg text-primary-foreground dark:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="mx-auto h-4 w-4" />
                </button>
                <button
                  className={`flex-1 cursor-pointer rounded p-1.5 transition-colors ${
                    viewMode === "list"
                      ? "brand-bg text-primary-foreground dark:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* active filter chips */}
          {hasFilters && !loading && (
            <div className="flex flex-wrap items-center gap-2">
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Search: "{debouncedSearch}"
                  <button onClick={() => setSearch("")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {genderFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">
                  Gender: {genderFilter}
                  <button onClick={() => setGenderFilter("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("all")}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Clear all
              </button>
            </div>
          )}

          {/* ── Main Content ────────────────────────────────────────────── */}
          {loading ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <table className="w-full">
                  <tbody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <RowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : sorted.length === 0 ? (
            <EmptyState
              hasFilters={hasFilters}
              onAdd={openCreate}
              onClear={clearFilters}
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sorted.map((c) => (
                <ClientCard
                  key={c._id}
                  client={c}
                  onView={openView}
                  onEdit={openEdit}
                  onDelete={openDelete}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {[
                        { label: "Client", field: "name" },
                        {
                          label: "Phone",
                          field: null,
                          cls: "hidden sm:table-cell",
                        },
                        {
                          label: "Gender",
                          field: "gender",
                          cls: "hidden md:table-cell",
                        },
                        {
                          label: "Status",
                          field: "status",
                          cls: "hidden lg:table-cell",
                        },
                        {
                          label: "Joined",
                          field: null,
                          cls: "hidden xl:table-cell",
                        },
                      ].map(({ label, field, cls = "" }) => (
                        <th
                          key={label}
                          className={`px-4 py-3 text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase ${cls}`}
                        >
                          {field ? (
                            <button
                              className="flex items-center gap-1 transition-colors hover:text-foreground"
                              onClick={() => toggleSort(field)}
                            >
                              {label}
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          ) : (
                            label
                          )}
                        </th>
                      ))}
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((c) => (
                      <ClientRow
                        key={c._id}
                        client={c}
                        onView={openView}
                        onEdit={openEdit}
                        onDelete={openDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Pagination ─────────────────────────────────────────────── */}
          {!loading && totalCount > 0 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={totalCount}
              pageSize={pageSize}
              from={from}
              to={to}
              onPageChange={setPage}
              onPageSizeChange={(s) => {
                setPageSize(s)
                setPage(1)
              }}
            />
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            Create / Edit Dialog with Status Toggle
        ══════════════════════════════════════════════════════════════ */}
        <Dialog
          open={showForm}
          onOpenChange={(v) => {
            if (!submitting) setShowForm(v)
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-[580px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editClient ? "Edit Client" : "Add New Client"}
              </DialogTitle>
              <DialogDescription>
                {editClient
                  ? "Update the client's details below and save."
                  : "Fill in the form to register a new client."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
              <FormField label="Full Name" required error={errors.name}>
                <Input
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  className={`border-border bg-background ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </FormField>

              <FormField label="Email Address" required error={errors.email}>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  className={`border-border bg-background ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </FormField>

              <FormField label="Phone Number" required error={errors.phone}>
                <Input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                  className={`border-border bg-background ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </FormField>

              <FormField
                label={editClient ? "New Password" : "Password"}
                required={!editClient}
                error={errors.password}
              >
                <Input
                  type="password"
                  placeholder={
                    editClient
                      ? "Leave blank to keep current"
                      : "Create a password"
                  }
                  value={form.password}
                  onChange={(e) => handleFormChange("password", e.target.value)}
                  className={`border-border bg-background ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
              </FormField>

              <FormField label="Date of Birth">
                <Input
                  type="date"
                  value={form.dateofBirth}
                  onChange={(e) =>
                    handleFormChange("dateofBirth", e.target.value)
                  }
                  className="border-border bg-background"
                />
              </FormField>

              <FormField label="Gender">
                <Select
                  value={form.gender}
                  onValueChange={(v) => handleFormChange("gender", v)}
                >
                  <SelectTrigger className="border-border bg-background">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g} className="capitalize">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Address">
                  <Input
                    placeholder="123 Main St, City, State"
                    value={form.address}
                    onChange={(e) =>
                      handleFormChange("address", e.target.value)
                    }
                    className="border-border bg-background"
                  />
                </FormField>
              </div>

              {/* Status Toggle - Full width */}
              <div className="sm:col-span-2">
                <StatusToggle
                  status={form.status || "active"}
                  onToggle={(newStatus) =>
                    handleFormChange("status", newStatus)
                  }
                  disabled={submitting}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="min-w-[130px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editClient ? "Saving…" : "Creating…"}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {editClient ? "Save Changes" : "Create Client"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════
            View Details Dialog
        ══════════════════════════════════════════════════════════════ */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="border-border bg-card sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Client Profile</DialogTitle>
              <DialogDescription>
                Full details for this client record.
              </DialogDescription>
            </DialogHeader>

            {activeClient && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 shrink-0 ring-4 ring-border">
                    <AvatarFallback
                      className={`${getAvatarColor(activeClient.name)} text-xl font-bold text-white`}
                    >
                      {getInitials(activeClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-foreground">
                      {activeClient.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {activeClient.gender || "—"}
                      </Badge>
                      <StatusBadge status={activeClient.status} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3.5">
                  {[
                    { icon: Mail, label: "Email", value: activeClient.email },
                    {
                      icon: Phone,
                      label: "Phone",
                      value: activeClient.phone || "—",
                    },
                    {
                      icon: Calendar,
                      label: "Date of Birth",
                      value: formatDate(activeClient.dateofBirth),
                    },
                    {
                      icon: MapPin,
                      label: "Address",
                      value: activeClient.address || "—",
                    },
                    {
                      icon: Clock,
                      label: "Joined",
                      value: formatDate(activeClient.createdAt),
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          {label}
                        </p>
                        <p className="mt-0.5 text-sm break-all text-foreground">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {activeClient.fitnessGoals?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Fitness Goals
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeClient.fitnessGoals.map((g, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetail(false)
                      openEdit(activeClient)
                    }}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowDetail(false)
                      openDelete(activeClient)
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ══════════════════════════════════════════════════════════════
            Delete Confirmation
        ══════════════════════════════════════════════════════════════ */}
        <AlertDialog
          open={showDelete}
          onOpenChange={(v) => {
            if (!deleting) setShowDelete(v)
          }}
        >
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                Delete Client
              </AlertDialogTitle>
              <AlertDialogDescription className="pl-[52px]">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {deleteTarget?.name}
                </span>
                ? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive-foreground min-w-[110px] bg-destructive hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete Client"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
