"use client"
import { useState, useEffect, useCallback } from "react"
import { useAppDispatch } from "@/lib/redux/hooks"
import axiosInstance from "@/lib/config/axiosConfig"
import { showToast } from "@/lib/redux/slices/toastSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PackageOpen,
  RefreshCw,
  ImageOff,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Activity,
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  Hash,
  X,
  Loader2,
  Eye,
  TrendingUp,
  BarChart3,
} from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "cardio", label: "Cardio" },
  { value: "strength", label: "Strength" },
  { value: "flexibility", label: "Flexibility" },
  { value: "free_weights", label: "Free Weights" },
  { value: "machines", label: "Machines" },
  { value: "accessories", label: "Accessories" },
  { value: "other", label: "Other" },
]

const CONDITIONS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "needs_repair", label: "Needs Repair" },
  { value: "out_of_service", label: "Out of Service" },
]

const STATUSES = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "maintenance", label: "Maintenance" },
]

const ITEMS_PER_PAGE = 8

const EMPTY_FORM = {
  name: "",
  category: "",
  brand: "",
  model: "",
  serialNumber: "",
  purchaseDate: "",
  purchasePrice: "",
  condition: "good",
  location: "",
  description: "",
  image: "",
  maintenanceIntervalDays: 90,
  status: "available",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const conditionConfig = {
  excellent: {
    label: "Excellent",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  good: {
    label: "Good",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: CheckCircle2,
  },
  fair: {
    label: "Fair",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: AlertCircle,
  },
  needs_repair: {
    label: "Needs Repair",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: Wrench,
  },
  out_of_service: {
    label: "Out of Service",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: X,
  },
}

const statusConfig = {
  available: {
    label: "Available",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  in_use: {
    label: "In Use",
    className: "bg-brand-badge text-brand-text border-brand-border",
    dot: "bg-brand-text",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
  },
}

const formatCurrency = (v) =>
  v != null
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(v)
    : "—"

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—"

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConditionBadge({ condition }) {
  const cfg = conditionConfig[condition] ?? conditionConfig.good
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig.available
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {cfg.label}
    </span>
  )
}

function CategoryBadge({ category }) {
  const label = CATEGORIES.find((c) => c.value === category)?.label ?? category
  return (
    <span className="bg-brand-tint text-brand-text inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium">
      <Tag className="h-3 w-3" />
      {label}
    </span>
  )
}

function EquipmentImage({ src, name, size = "sm" }) {
  const [err, setErr] = useState(false)
  const dim = size === "sm" ? "w-10 h-10" : "w-16 h-16"
  if (!src || err) {
    return (
      <div
        className={`${dim} brand-tint brand-border flex flex-shrink-0 items-center justify-center rounded-lg border`}
      >
        <Dumbbell className="h-4 w-4 text-white opacity-50" />
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      className={`${dim} brand-border flex-shrink-0 rounded-lg border object-cover`}
    />
  )
}

function TableSkeleton({ rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <TableRow key={i} className="border-brand-divider">
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-24 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8 rounded" />
      </TableCell>
    </TableRow>
  ))
}

function EmptyState({ onAdd, filtered }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20">
      <div className="relative mb-6">
        <div className="bg-brand-tint brand-border flex h-20 w-20 items-center justify-center rounded-2xl border">
          <PackageOpen className="brand-icon h-9 w-9 opacity-60" />
        </div>
        <div className="brand-bg brand-border absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2">
          <Plus className="h-3 w-3 text-white" />
        </div>
      </div>
      <h3 className="brand-text mb-1 text-lg font-semibold">
        {filtered ? "No results found" : "No equipment yet"}
      </h3>
      <p className="mb-6 max-w-xs text-center text-sm text-muted-foreground">
        {filtered
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Start building your gym's equipment "}
      </p>
      {!filtered && (
        <Button onClick={onAdd} className="brand-ui gap-2">
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      )}
    </div>
  )
}

function StatsCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="brand-border bg-sidebar">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="brand-tint brand-border flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border">
          <Icon className="brand-icon h-5 w-5" />
        </div>
        <div>
          <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
          <p className="brand-text text-xl leading-none font-bold">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Equipment Form ───────────────────────────────────────────────────────────

function EquipmentForm({ form, setForm, onSubmit, loading, isEdit }) {
  const handleChange = (field, val) =>
    setForm((prev) => ({ ...prev, [field]: val }))

  const field = (id, label, placeholder, type = "text", required = false) => (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={form[id] ?? ""}
        onChange={(e) => handleChange(id, e.target.value)}
        className="bg-brand-tint border-brand-border brand-focus brand-text placeholder:text-muted-foreground/50"
      />
    </div>
  )

  return (
    <div className="space-y-5 py-1">
      {/* Basic Info */}
      <div>
        <p className="brand-icon mb-3 text-xs font-semibold tracking-widest uppercase">
          Basic Info
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field(
            "name",
            "Equipment Name",
            "e.g. Commercial Treadmill T900",
            "text",
            true
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Category <span className="text-red-400">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => handleChange("category", v)}
            >
              <SelectTrigger className="bg-brand-tint border-brand-border brand-focus">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="border-brand-border bg-sidebar">
                {CATEGORIES.map((c) => (
                  <SelectItem
                    key={c.value}
                    value={c.value}
                    className="brand-hover cursor-pointer"
                  >
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {field("brand", "Brand", "e.g. Matrix Fitness")}
          {field("model", "Model", "e.g. T900-V2")}
          {field("serialNumber", "Serial Number", "e.g. MTX-9988776655")}
          {field("location", "Location", "e.g. Main Floor - Zone A")}
        </div>
      </div>

      <Separator className="bg-brand-divider" />

      {/* Purchase Details */}
      <div>
        <p className="brand-icon mb-3 text-xs font-semibold tracking-widest uppercase">
          Purchase Details
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("purchaseDate", "Purchase Date", "", "date")}
          {field(
            "purchasePrice",
            "Purchase Price ($)",
            "e.g. 2499.99",
            "number"
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Condition
            </Label>
            <Select
              value={form.condition}
              onValueChange={(v) => handleChange("condition", v)}
            >
              <SelectTrigger className="bg-brand-tint border-brand-border brand-focus">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent className="border-brand-border bg-sidebar">
                {CONDITIONS.map((c) => (
                  <SelectItem
                    key={c.value}
                    value={c.value}
                    className="brand-hover cursor-pointer"
                  >
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Status
            </Label>
            <Select
              value={form.status}
              onValueChange={(v) => handleChange("status", v)}
            >
              <SelectTrigger className="bg-brand-tint border-brand-border brand-focus">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-brand-bg border-brand-border">
                {STATUSES.map((s) => (
                  <SelectItem
                    key={s.value}
                    value={s.value}
                    className="brand-hover"
                  >
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator className="bg-brand-divider" />

      {/* Maintenance */}
      <div>
        <p className="brand-icon mb-3 text-xs font-semibold tracking-widest uppercase">
          Maintenance
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="maintenanceIntervalDays"
              className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
              Maintenance Interval (Days)
            </Label>
            <Input
              id="maintenanceIntervalDays"
              type="number"
              min={1}
              placeholder="90"
              value={form.maintenanceIntervalDays ?? ""}
              onChange={(e) =>
                handleChange("maintenanceIntervalDays", Number(e.target.value))
              }
              className="bg-brand-tint border-brand-border brand-focus brand-text"
            />
          </div>
          {field("image", "Image URL", "https://example.com/image.jpg")}
        </div>
      </div>

      <Separator className="bg-brand-divider" />

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Description
        </Label>
        <Textarea
          placeholder="Describe the equipment..."
          value={form.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          className="border-brand-border brand-focus resize-none placeholder:text-muted-foreground/50"
        />
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="border-brand-border brand-hover brand-text"
          disabled={loading}
          onClick={() => setForm(EMPTY_FORM)}
        >
          Reset
        </Button>
        <Button
          className="brand-ui min-w-[120px] gap-2"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEdit ? "Saving..." : "Adding..."}
            </>
          ) : (
            <>{isEdit ? "Save Changes" : "Add Equipment"}</>
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function EquipmentDetailView({ equipment }) {
  const infoRow = (icon, label, value) =>
    value ? (
      <div className="flex items-start gap-2.5">
        <div className="brand-tint brand-border mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
    ) : null

  return (
    <div className="space-y-5">
      {/* Image + status */}
      <div className="flex items-start gap-4">
        <EquipmentImage src={equipment.image} name={equipment.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{equipment.name}</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            {equipment.brand} · {equipment.model}
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={equipment.status} />
            <ConditionBadge condition={equipment.condition} />
            <CategoryBadge category={equipment.category} />
          </div>
        </div>
      </div>

      <Separator className="bg-brand-divider" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {infoRow(
          <Hash className="brand-icon h-3.5 w-3.5" />,
          "Serial Number",
          equipment.serialNumber
        )}
        {infoRow(
          <MapPin className="brand-icon h-3.5 w-3.5" />,
          "Location",
          equipment.location
        )}
        {infoRow(
          <DollarSign className="brand-icon h-3.5 w-3.5" />,
          "Purchase Price",
          formatCurrency(equipment.purchasePrice)
        )}
        {infoRow(
          <Calendar className="brand-icon h-3.5 w-3.5" />,
          "Purchase Date",
          formatDate(equipment.purchaseDate)
        )}
        {infoRow(
          <Wrench className="brand-icon h-3.5 w-3.5" />,
          "Maintenance Interval",
          equipment.maintenanceIntervalDays
            ? `${equipment.maintenanceIntervalDays} days`
            : null
        )}
        {infoRow(
          <Calendar className="brand-icon h-3.5 w-3.5" />,
          "Last Maintenance",
          formatDate(equipment.lastMaintenanceDate)
        )}
        {infoRow(
          <Calendar className="brand-icon h-3.5 w-3.5" />,
          "Added On",
          formatDate(equipment.createdAt)
        )}
      </div>

      {equipment.description && (
        <>
          <Separator className="bg-brand-divider" />
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Description</p>
            <p className="text-sm leading-relaxed">{equipment.description}</p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, total, perPage, onChange }) {
  const from = Math.min((page - 1) * perPage + 1, total)
  const to = Math.min(page * perPage, total)

  const btn = (onClick, disabled, children, active = false) => (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={`border-brand-border brand-text brand-hover h-8 w-8 ${active ? "brand-active" : ""}`}
    >
      {children}
    </Button>
  )

  const pageNumbers = () => {
    const pages = []
    const delta = 1
    const left = page - delta
    const right = page + delta

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        pages.push(i)
      } else if (i === left - 1 || i === right + 1) {
        pages.push("...")
      }
    }
    return [...new Set(pages)]
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 pt-4 sm:flex-row">
      <p className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="brand-text font-medium">
          {from}–{to}
        </span>{" "}
        of <span className="brand-text font-medium">{total}</span> equipment
      </p>
      <div className="flex items-center gap-1">
        {btn(
          () => onChange(1),
          page === 1,
          <ChevronsLeft className="h-3.5 w-3.5" />
        )}
        {btn(
          () => onChange(page - 1),
          page === 1,
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
        {pageNumbers().map((p, i) =>
          p === "..." ? (
            <span
              key={`dot-${i}`}
              className="w-8 text-center text-xs text-muted-foreground"
            >
              ···
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              onClick={() => onChange(p)}
              className={`h-8 w-8 text-xs ${
                p === page
                  ? "brand-ui"
                  : "border-brand-border brand-text brand-hover"
              }`}
            >
              {p}
            </Button>
          )
        )}
        {btn(
          () => onChange(page + 1),
          page === totalPages,
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        {btn(
          () => onChange(totalPages),
          page === totalPages,
          <ChevronsRight className="h-3.5 w-3.5" />
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EquipmentSection() {
  const dispatch = useAppDispatch()

  // Data
  const [equipment, setEquipment] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Filters
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCondition, setFilterCondition] = useState("all")

  // Modals
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  // Form
  const [form, setForm] = useState(EMPTY_FORM)

  // Stats derived
  const availableCount = equipment.filter(
    (e) => e.status === "available"
  ).length
  const maintenanceCount = equipment.filter(
    (e) => e.status === "maintenance"
  ).length

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchEquipment = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: ITEMS_PER_PAGE }
      if (search) params.search = search
      if (filterCategory !== "all") params.category = filterCategory
      if (filterStatus !== "all") params.status = filterStatus
      if (filterCondition !== "all") params.condition = filterCondition

      const { data } = await axiosInstance.get("/equipment", { params })
      setEquipment(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message ?? "Failed to load equipment.",
          type: "error",
        })
      )
    } finally {
      setLoading(false)
    }
  }, [
    page,
    search,
    filterCategory,
    filterStatus,
    filterCondition,
    refreshKey,
    dispatch,
  ])

  useEffect(() => {
    fetchEquipment()
  }, [fetchEquipment])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [search, filterCategory, filterStatus, filterCondition])

  // ── Create ─────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.name.trim() || !form.category) {
      dispatch(
        showToast({ message: "Name and Category are required.", type: "error" })
      )
      return
    }
    setActionLoading(true)
    try {
      const payload = {
        ...form,
        purchasePrice: form.purchasePrice
          ? Number(form.purchasePrice)
          : undefined,
        maintenanceIntervalDays: Number(form.maintenanceIntervalDays),
      }
      await axiosInstance.post("/equipment", payload)
      dispatch(
        showToast({ message: "Equipment added successfully!", type: "success" })
      )
      setAddOpen(false)
      setForm(EMPTY_FORM)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message ?? "Failed to add equipment.",
          type: "error",
        })
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  const openEdit = (item) => {
    setSelected(item)
    setForm({
      name: item.name ?? "",
      category: item.category ?? "",
      brand: item.brand ?? "",
      model: item.model ?? "",
      serialNumber: item.serialNumber ?? "",
      purchaseDate: item.purchaseDate ? item.purchaseDate.split("T")[0] : "",
      purchasePrice: item.purchasePrice ?? "",
      condition: item.condition ?? "good",
      location: item.location ?? "",
      description: item.description ?? "",
      image: item.image ?? "",
      maintenanceIntervalDays: item.maintenanceIntervalDays ?? 90,
      status: item.status ?? "available",
    })
    setEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!form.name.trim() || !form.category) {
      dispatch(
        showToast({ message: "Name and Category are required.", type: "error" })
      )
      return
    }
    setActionLoading(true)
    try {
      const payload = {
        ...form,
        purchasePrice: form.purchasePrice
          ? Number(form.purchasePrice)
          : undefined,
        maintenanceIntervalDays: Number(form.maintenanceIntervalDays),
      }
      await axiosInstance.put(`/equipment/${selected._id}`, payload)
      dispatch(
        showToast({
          message: "Equipment updated successfully!",
          type: "success",
        })
      )
      setEditOpen(false)
      setSelected(null)
      setForm(EMPTY_FORM)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      dispatch(
        showToast({
          message:
            err?.response?.data?.message ?? "Failed to update equipment.",
          type: "error",
        })
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const openDelete = (item) => {
    setSelected(item)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await axiosInstance.delete(`/equipment/${selected._id}`)
      dispatch(
        showToast({
          message: "Equipment deleted successfully.",
          type: "success",
        })
      )
      setDeleteOpen(false)
      setSelected(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      dispatch(
        showToast({
          message:
            err?.response?.data?.message ?? "Failed to delete equipment.",
          type: "error",
        })
      )
    } finally {
      setActionLoading(false)
    }
  }

  // ── Detail ─────────────────────────────────────────────────────────────────

  const openDetail = (item) => {
    setSelected(item)
    setDetailOpen(true)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))
  const isFiltered =
    search ||
    filterCategory !== "all" ||
    filterStatus !== "all" ||
    filterCondition !== "all"

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <TooltipProvider delayDuration={200}>
      <div className="my5 space-y-6 lg:my-10">
        {/* ── Header ── */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="brand-text text-2xl font-bold tracking-tight">
              Equipment
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Manage your gym's equipment inventory
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-brand-border brand-hover"
                  onClick={() => setRefreshKey((k) => k + 1)}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`brand-icon h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            <Button
              className="brand-ui gap-2"
              onClick={() => {
                setForm(EMPTY_FORM)
                setAddOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              Add Equipment
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatsCard
            icon={Dumbbell}
            label="Total Equipment"
            value={total}
            sub="in inventory"
          />
          <StatsCard
            icon={Activity}
            label="Available"
            value={availableCount}
            sub="ready to use"
          />
          <StatsCard
            icon={Wrench}
            label="Maintenance"
            value={maintenanceCount}
            sub="being serviced"
          />
          <StatsCard
            icon={BarChart3}
            label="Categories"
            value={new Set(equipment.map((e) => e.category)).size}
            sub="different types"
          />
        </div>

        {/* ── Filters ── */}
        <Card className="bg-brand-bg border-brand-border">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, brand, model, serial..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-brand-tint border-brand-border brand-focus brand-text pl-9 placeholder:text-muted-foreground/50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="hover:brand-text absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category filter */}
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-brand-tint border-brand-border brand-focus brand-text w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="border-brand-border bg-sidebar">
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="brand-hover cursor-pointer"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-brand-tint border-brand-border brand-focus brand-text w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-brand-border bg-sidebar">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem
                      key={s.value}
                      value={s.value}
                      className="brand-hover cursor-pointer"
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Condition filter */}
              <Select
                value={filterCondition}
                onValueChange={setFilterCondition}
              >
                <SelectTrigger className="bg-brand-tint border-brand-border brand-focus brand-text w-full sm:w-40">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent className="border-brand-border bg-sidebar">
                  <SelectItem value="all">All Conditions</SelectItem>
                  {CONDITIONS.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="brand-hover cursor-pointer"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="brand-hover-text gap-1.5 whitespace-nowrap text-muted-foreground"
                  onClick={() => {
                    setSearch("")
                    setFilterCategory("all")
                    setFilterStatus("all")
                    setFilterCondition("all")
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Table ── */}
        <Card className="bg-brand-bg border-brand-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-brand-divider bg-brand-tint/50 hover:bg-brand-tint/50">
                  <TableHead className="w-[220px] text-xs font-semibold tracking-wide uppercase">
                    Equipment
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide uppercase">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide uppercase">
                    Location
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide uppercase">
                    Condition
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide uppercase">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide uppercase">
                    Purchase Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide uppercase">
                    Purchase Date
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton rows={ITEMS_PER_PAGE} />
                ) : equipment.length === 0 ? (
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableCell colSpan={8} className="p-0">
                      <EmptyState
                        onAdd={() => {
                          setForm(EMPTY_FORM)
                          setAddOpen(true)
                        }}
                        filtered={!!isFiltered}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  equipment.map((item) => (
                    <TableRow
                      key={item._id}
                      className="border-brand-divider group cursor-default transition-colors"
                    >
                      {/* Name + Image */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <EquipmentImage src={item.image} name={item.name} />
                          <div className="min-w-0">
                            <p className="max-w-[140px] truncate text-sm font-semibold">
                              {item.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[item.brand, item.model]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <CategoryBadge category={item.category} />
                      </TableCell>

                      <TableCell>
                        <div className="flex max-w-[130px] items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="brand-icon h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {item.location || "—"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <ConditionBadge condition={item.condition} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatCurrency(item.purchasePrice)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm whitespace-nowrap text-muted-foreground">
                          {formatDate(item.purchaseDate)}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="brand-hover h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="border-brand-border w-44 bg-sidebar shadow-xl"
                          >
                            <DropdownMenuItem
                              className="brand-hover cursor-pointer gap-2"
                              onClick={() => openDetail(item)}
                            >
                              <Eye className="brand-icon h-3.5 w-3.5" />
                              <span className="text-sm">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="brand-hover cursor-pointer gap-2"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="brand-icon h-3.5 w-3.5" />
                              <span className="text-sm">Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-brand-divider" />
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400"
                              onClick={() => openDelete(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="text-sm">Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && total > ITEMS_PER_PAGE && (
            <div className="brand-divider border-t px-4 pb-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                perPage={ITEMS_PER_PAGE}
                onChange={setPage}
              />
            </div>
          )}
        </Card>

        {/* ── Add Dialog ── */}
        <Dialog
          open={addOpen}
          onOpenChange={(o) => {
            setAddOpen(o)
            if (!o) setForm(EMPTY_FORM)
          }}
        >
          <DialogContent className="border-brand-border brand-scrollbar max-h-[90vh] max-w-2xl overflow-y-auto bg-sidebar lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="brand-tint brand-border flex h-8 w-8 items-center justify-center rounded-lg border">
                  <Plus className="brand-icon h-4 w-4" />
                </div>
                Add New Equipment
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Fill in the details to add a new piece of equipment to your
                inventory.
              </DialogDescription>
            </DialogHeader>
            <EquipmentForm
              form={form}
              setForm={setForm}
              onSubmit={handleCreate}
              loading={actionLoading}
              isEdit={false}
            />
          </DialogContent>
        </Dialog>

        {/* ── Edit Dialog ── */}
        <Dialog
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o)
            if (!o) {
              setSelected(null)
              setForm(EMPTY_FORM)
            }
          }}
        >
          <DialogContent className="border-brand-border brand-scrollbar max-h-[90vh] max-w-2xl overflow-y-auto bg-sidebar lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="brand-tint brand-border flex h-8 w-8 items-center justify-center rounded-lg border">
                  <Pencil className="brand-icon h-4 w-4" />
                </div>
                Edit Equipment
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update the details for{" "}
                <span className="brand-text font-medium">{selected?.name}</span>
                .
              </DialogDescription>
            </DialogHeader>
            <EquipmentForm
              form={form}
              setForm={setForm}
              onSubmit={handleUpdate}
              loading={actionLoading}
              isEdit
            />
          </DialogContent>
        </Dialog>

        {/* ── Detail Dialog ── */}
        <Dialog
          open={detailOpen}
          onOpenChange={(o) => {
            setDetailOpen(o)
            if (!o) setSelected(null)
          }}
        >
          <DialogContent className="border-brand-border brand-scrollbar max-h-[90vh] max-w-lg overflow-y-auto bg-sidebar lg:max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="bg-brand-tint brand-border flex h-8 w-8 items-center justify-center rounded-lg border">
                  <Eye className="brand-icon h-4 w-4" />
                </div>
                Equipment Details
              </DialogTitle>
            </DialogHeader>
            {selected && <EquipmentDetailView equipment={selected} />}
            <DialogFooter className="mt-2 gap-2">
              <Button
                variant="outline"
                className="border-brand-border brand-hover brand-text gap-2"
                onClick={() => {
                  setDetailOpen(false)
                  openEdit(selected)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => {
                  setDetailOpen(false)
                  openDelete(selected)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm ── */}
        <AlertDialog
          open={deleteOpen}
          onOpenChange={(o) => {
            setDeleteOpen(o)
            if (!o) setSelected(null)
          }}
        >
          <AlertDialogContent className="border-brand-border bg-sidebar">
            <AlertDialogHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-destructive">
                Delete Equipment?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently remove{" "}
                <span className="font-semibold text-destructive">
                  {selected?.name}
                </span>{" "}
                from your inventory. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                className="border-brand-border brand-hover bg-transparent text-white"
                disabled={actionLoading}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={actionLoading}
                className="gap-2 border-0 bg-red-500! text-white hover:bg-red-600"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" /> Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
