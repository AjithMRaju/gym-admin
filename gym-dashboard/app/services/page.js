/**
 * ServicesAdminPanel.jsx
 * Place this file at: /components/ui/ServicesAdminPanel.jsx
 *
 * Dependencies (shadcn/ui + standard packages assumed in your project):
 *   npx shadcn@latest add button card dialog input label badge switch table
 *   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react axios
 *
 * Usage:
 *   import ServicesAdminPanel from "@/components/ui/ServicesAdminPanel";
 *   <ServicesAdminPanel />
 */

"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useDispatch } from "react-redux"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// shadcn/ui components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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

// Icons
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Search,
  ImageIcon,
  RefreshCw,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Layers,
  DollarSign,
  Clock,
  Hash,
} from "lucide-react"

// Your axios instance & redux toast action
import axiosInstance from "@/lib/config/axiosConfig" // adjust path as needed
import { showToast } from "@/lib/redux/slices/toastSlice" // adjust path as needed

// ─────────────────────────────────────────────────────────────
// EMPTY FORM STATE
// ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: "",
  description: "",
  icon: "",
  image: null,
  price: "",
  duration: "",
  order: "",
  isActive: true,
}

// ─────────────────────────────────────────────────────────────
// SORTABLE ROW (drag-and-drop table row)
// ─────────────────────────────────────────────────────────────
function SortableRow({ service, onEdit, onDelete, onToggleActive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group border-b border-green-50 transition-colors hover:bg-green-50/40 ${
        isDragging ? "rounded-lg bg-green-50 shadow-lg" : ""
      }`}
    >
      {/* Drag handle */}
      <td className="w-10 px-3 py-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 text-gray-300 transition-colors hover:text-green-500 active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>

      {/* Image / Icon */}
      <td className="w-16 px-4 py-4">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.title}
            className="h-10 w-10 rounded-lg object-cover ring-2 ring-green-100"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-200">
            {service.icon ? (
              <span className="text-lg text-green-700">{service.icon}</span>
            ) : (
              <Layers className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </td>

      {/* Title + Description */}
      <td className="min-w-[200px] px-4 py-4">
        <p className="text-sm leading-tight font-semibold text-gray-800">
          {service.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
          {service.description}
        </p>
      </td>

      {/* Price */}
      <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-600">
        {service.price ? (
          <span className="inline-flex items-center gap-1 font-medium text-green-700">
            {service.price}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>

      {/* Duration */}
      <td className="px-4 py-4 text-sm whitespace-nowrap text-gray-600">
        {service.duration ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-green-400" />
            {service.duration}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>

      {/* Order */}
      <td className="px-4 py-4 text-center">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-50 text-xs font-bold text-green-700">
          {service.order ?? "—"}
        </span>
      </td>

      {/* Status toggle */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Switch
            checked={service.isActive}
            onCheckedChange={() => onToggleActive(service)}
            className="data-[state=checked]:bg-green-600"
          />
          <Badge
            variant="outline"
            className={
              service.isActive
                ? "border-green-200 bg-green-50 text-xs text-green-700"
                : "border-gray-200 bg-gray-50 text-xs text-gray-400"
            }
          >
            {service.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:bg-green-50 hover:text-green-600"
            onClick={() => onEdit(service)}
            title="Edit service"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-500"
            onClick={() => onDelete(service)}
            title="Delete service"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
// SERVICE FORM DIALOG
// ─────────────────────────────────────────────────────────────
function ServiceFormDialog({ open, onClose, onSuccess, editingService }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(EMPTY_FORM)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const isEdit = Boolean(editingService)

  useEffect(() => {
    if (open) {
      if (editingService) {
        setForm({
          title: editingService.title || "",
          description: editingService.description || "",
          icon: editingService.icon || "",
          image: null,
          price: editingService.price || "",
          duration: editingService.duration || "",
          order: editingService.order ?? "",
          isActive: editingService.isActive ?? true,
        })
        setImagePreview(editingService.imageUrl || null)
      } else {
        setForm(EMPTY_FORM)
        setImagePreview(null)
      }
    }
  }, [open, editingService])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setForm((prev) => ({ ...prev, image: file }))
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      dispatch(
        showToast({
          message: "Title and description are required.",
          type: "error",
        })
      )
      return
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("title", form.title.trim())
      fd.append("description", form.description.trim())
      if (form.icon) fd.append("icon", form.icon)
      if (form.image) fd.append("image", form.image)
      if (form.price) fd.append("price", form.price)
      if (form.duration) fd.append("duration", form.duration)
      if (form.order !== "") fd.append("order", String(form.order))
      fd.append("isActive", String(form.isActive))

      if (isEdit) {
        await axiosInstance.put(`/services/${editingService._id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        dispatch(
          showToast({
            message: "Service updated successfully.",
            type: "success",
          })
        )
      } else {
        await axiosInstance.post("/services", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        dispatch(
          showToast({
            message: "Service created successfully.",
            type: "success",
          })
        )
      }
      onSuccess()
      onClose()
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message || "Something went wrong.",
          type: "error",
        })
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-lg shadow-green-200">
                {isEdit ? (
                  <Pencil className="h-5 w-5 text-white" />
                ) : (
                  <Plus className="h-5 w-5 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {isEdit ? "Edit Service" : "Create New Service"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-gray-400">
                  {isEdit
                    ? "Update the details for this service."
                    : "Fill in the details to add a new service."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* Basic Info */}
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-wider text-green-600 uppercase">
              Basic Information
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  placeholder="e.g. Personal Training"
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="h-11 rounded-lg border-gray-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Description <span className="text-red-400">*</span>
                </Label>
                <textarea
                  placeholder="Describe what this service includes..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition-all outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-wider text-green-600 uppercase">
              Media & Icon
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Image Upload */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Service Image
                </Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-green-400 hover:bg-green-50/30"
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                        <p className="text-xs font-medium text-white">
                          Change image
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="mx-auto mb-1 h-6 w-6 text-gray-300" />
                      <p className="text-xs text-gray-400">Click to upload</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Icon */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  Icon Class / Identifier
                </Label>
                <Input
                  placeholder="e.g. 💪 or fa-dumbbell"
                  value={form.icon}
                  onChange={(e) => handleChange("icon", e.target.value)}
                  className="h-11 rounded-lg border-gray-200 focus:border-green-400 focus:ring-green-400/20"
                />
                {form.icon && (
                  <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-green-200">
                    <span className="text-xl">{form.icon}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Meta */}
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-wider text-green-600 uppercase">
              Pricing & Details
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-green-500" />
                    Price
                  </span>
                </Label>
                <Input
                  placeholder="₹999/month"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  className="h-11 rounded-lg border-gray-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-green-500" />
                    Duration
                  </span>
                </Label>
                <Input
                  placeholder="60 min"
                  value={form.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                  className="h-11 rounded-lg border-gray-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-green-500" />
                    Sort Order
                  </span>
                </Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={form.order}
                  onChange={(e) => handleChange("order", e.target.value)}
                  className="h-11 rounded-lg border-gray-200 focus:border-green-400 focus:ring-green-400/20"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Service Status
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {form.isActive
                  ? "Visible to users on the public listing."
                  : "Hidden from public view."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium ${
                  form.isActive ? "text-green-600" : "text-gray-400"
                }`}
              >
                {form.isActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => handleChange("isActive", v)}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-green-600 px-6 text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEdit ? "Updating…" : "Creating…"}
              </span>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Service"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// STATS CARD
// ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function ServicesAdminPanel() {
  const dispatch = useDispatch()

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all") // all | active | inactive

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [reordering, setReordering] = useState(false)
  const [hasReordered, setHasReordered] = useState(false)

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // ── Fetch ──────────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axiosInstance.get("/services/admin/all")
      const list = Array.isArray(data)
        ? data
        : (data?.services ?? data?.data ?? [])
      setServices(list)
      setHasReordered(false)
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message || "Failed to fetch services.",
          type: "error",
        })
      )
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // ── Derived lists ──────────────────────────────────────────
  const filteredServices = services.filter((s) => {
    const matchSearch =
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && s.isActive) ||
      (filterStatus === "inactive" && !s.isActive)
    return matchSearch && matchStatus
  })

  const stats = {
    total: services.length,
    active: services.filter((s) => s.isActive).length,
    inactive: services.filter((s) => !s.isActive).length,
  }

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axiosInstance.delete(`/services/${deleteTarget._id}`)
      dispatch(
        showToast({ message: "Service deleted successfully.", type: "success" })
      )
      setDeleteTarget(null)
      fetchServices()
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message || "Failed to delete service.",
          type: "error",
        })
      )
    } finally {
      setDeleting(false)
    }
  }

  // ── Toggle active ──────────────────────────────────────────
  const handleToggleActive = async (service) => {
    try {
      const fd = new FormData()
      fd.append("isActive", String(!service.isActive))
      // keep required fields
      fd.append("title", service.title)
      fd.append("description", service.description)
      await axiosInstance.put(`/services/${service._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setServices((prev) =>
        prev.map((s) =>
          s._id === service._id ? { ...s, isActive: !s.isActive } : s
        )
      )
      dispatch(
        showToast({
          message: `Service ${!service.isActive ? "activated" : "deactivated"} successfully.`,
          type: "success",
        })
      )
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message || "Failed to update status.",
          type: "error",
        })
      )
    }
  }

  // ── Drag end ───────────────────────────────────────────────
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      setServices((prev) => {
        const oldIdx = prev.findIndex((s) => s._id === active.id)
        const newIdx = prev.findIndex((s) => s._id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
      setHasReordered(true)
    }
  }

  // ── Save reorder ───────────────────────────────────────────
  const saveReorder = async () => {
    setReordering(true)
    try {
      const items = services.map((s, idx) => ({ id: s._id, order: idx + 1 }))
      await axiosInstance.put("/services/admin/reorder", { items })
      dispatch(
        showToast({ message: "Order saved successfully.", type: "success" })
      )
      setHasReordered(false)
      fetchServices()
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message || "Failed to save order.",
          type: "error",
        })
      )
    } finally {
      setReordering(false)
    }
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/30 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── Page Header ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-6 w-1.5 rounded-full bg-green-600" />
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Services
              </h1>
            </div>
            <p className="pl-3.5 text-sm text-gray-500">
              Manage and organise your service offerings
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasReordered && (
              <Button
                onClick={saveReorder}
                disabled={reordering}
                variant="outline"
                className="h-10 gap-2 rounded-xl border-green-300 text-green-700 hover:bg-green-50"
              >
                {reordering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Layers className="h-4 w-4" />
                )}
                Save Order
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchServices}
              disabled={loading}
              className="h-10 w-10 rounded-xl text-gray-400 hover:bg-green-50 hover:text-green-600"
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              onClick={() => {
                setEditingService(null)
                setDialogOpen(true)
              }}
              className="h-10 gap-2 rounded-xl bg-green-600 px-5 text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              New Service
            </Button>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Services"
            value={stats.total}
            icon={Layers}
            accent="bg-gradient-to-br from-green-100 to-green-200 text-green-700"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={Eye}
            accent="bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700"
          />
          <StatCard
            label="Inactive"
            value={stats.inactive}
            icon={EyeOff}
            accent="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500"
          />
        </div>

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-gray-200 bg-white pl-10 focus:border-green-400 focus:ring-green-400/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex h-10 items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
            {["all", "active", "inactive"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-all ${
                  filterStatus === f
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table Card ──────────────────────────────────── */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
          <CardHeader className="border-b border-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  All Services
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs text-gray-400">
                  Drag rows to reorder • Toggle the switch to
                  activate/deactivate
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="border-green-200 bg-green-50 text-xs text-green-700"
              >
                {filteredServices.length} result
                {filteredServices.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-green-400" />
                <p className="text-sm">Loading services…</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                  <Layers className="h-7 w-7 text-green-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  No services found
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {search
                    ? "Try a different search term"
                    : "Create your first service"}
                </p>
                {!search && (
                  <Button
                    onClick={() => {
                      setEditingService(null)
                      setDialogOpen(true)
                    }}
                    className="mt-4 gap-2 rounded-xl bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    New Service
                  </Button>
                )}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredServices.map((s) => s._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/80">
                        <th className="w-10 px-3 py-3" />
                        <th className="w-16 px-4 py-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Image
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Service
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Price
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Duration
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Order
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredServices.map((service) => (
                        <SortableRow
                          key={service._id}
                          service={service}
                          onEdit={(s) => {
                            setEditingService(s)
                            setDialogOpen(true)
                          }}
                          onDelete={setDeleteTarget}
                          onToggleActive={handleToggleActive}
                        />
                      ))}
                    </tbody>
                  </table>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* reorder hint */}
          {hasReordered && (
            <div className="flex items-center justify-between border-t border-amber-100 bg-amber-50 px-6 py-3">
              <p className="text-xs font-medium text-amber-700">
                ⚠️ You have unsaved reorder changes.
              </p>
              <Button
                onClick={saveReorder}
                disabled={reordering}
                size="sm"
                className="h-8 gap-1.5 rounded-lg bg-amber-500 text-xs text-white hover:bg-amber-600"
              >
                {reordering ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Layers className="h-3 w-3" />
                )}
                Save Order
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ── Create / Edit Dialog ─────────────────────────── */}
      <ServiceFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingService(null)
        }}
        onSuccess={fetchServices}
        editingService={editingService}
      />

      {/* ── Delete Confirmation ──────────────────────────── */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-bold text-gray-900">
              Delete Service?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm text-gray-500">
              <strong className="text-gray-700">{deleteTarget?.title}</strong>{" "}
              will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 flex gap-3">
            <AlertDialogCancel
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="text- white flex-1 rounded-xl bg-red-500 shadow-lg shadow-red-100 hover:bg-red-600"
            >
              {deleting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting…
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
