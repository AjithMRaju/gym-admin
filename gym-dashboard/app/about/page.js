/**
 * AboutAdminPanel.jsx
 * Admin panel for managing the About section content.
 * Uses shadcn/ui components, axiosInstance for API calls,
 * and reads brand color from localStorage (key: admin_brandcolor).
 */
"use client"
import React, { useState, useEffect, useRef, useCallback } from "react"
import axiosInstance from "@/lib/config/axiosConfig" // Adjust path as needed

// shadcn/ui components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
// import { useToast } from "@/components/ui/use-toast"
// import { Toaster } from "@/components/ui/toaster"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

// Lucide icons
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ImageIcon,
  BarChart2,
  RefreshCw,
  X,
  Check,
  Upload,
  ChevronRight,
  Info,
  Loader2,
  LayoutDashboard,
} from "lucide-react"

/* ─────────────────────────────────────────────
   Utility: read brand colour from localStorage
───────────────────────────────────────────── */
const getBrandColor = () =>
  localStorage.getItem("admin_brandcolor") || "#16a34a" // green-600 fallback

/* ─────────────────────────────────────────────
   StatsEditor – inline JSON stat row manager
───────────────────────────────────────────── */
const StatsEditor = ({ stats, onChange }) => {
  // Add a new blank stat row
  const addStat = () => onChange([...stats, { label: "", value: "" }])

  // Remove a stat row by index
  const removeStat = (idx) => onChange(stats.filter((_, i) => i !== idx))

  // Update a specific field of a stat row
  const updateStat = (idx, field, val) => {
    const updated = stats.map((s, i) =>
      i === idx ? { ...s, [field]: val } : s
    )
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      {stats.map((stat, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            placeholder="Label (e.g. Members)"
            value={stat.label}
            onChange={(e) => updateStat(idx, "label", e.target.value)}
            className="h-9 flex-1 text-sm"
          />
          <Input
            placeholder="Value (e.g. 1200+)"
            value={stat.value}
            onChange={(e) => updateStat(idx, "value", e.target.value)}
            className="h-9 flex-1 text-sm"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeStat(idx)}
            className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addStat}
        className="mt-1 h-8 gap-1.5 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Stat
      </Button>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ImageUploader – drag-and-drop image field
───────────────────────────────────────────── */
const ImageUploader = ({ file, preview, onFileChange, brandColor }) => {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith("image/")) onFileChange(dropped)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 ${dragging ? "border-opacity-100 bg-opacity-10" : "border-muted-foreground/30 hover:border-muted-foreground/60"} `}
      style={{ borderColor: dragging ? brandColor : undefined }}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt="Preview"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <Upload className="mb-1 h-6 w-6 text-white" />
            <span className="text-xs font-medium text-white">Change Image</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
          <div
            className="rounded-full p-3"
            style={{ backgroundColor: `${brandColor}18` }}
          >
            <ImageIcon className="h-6 w-6" style={{ color: brandColor }} />
          </div>
          <p className="text-sm font-medium">Drop image or click to upload</p>
          <p className="text-xs text-muted-foreground/70">
            PNG, JPG, WEBP up to 10MB
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
      />
    </div>
  )
}

/* ─────────────────────────────────────────────
   Empty state component
───────────────────────────────────────────── */
const EmptyState = ({ brandColor, onAdd }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
    <div
      className="rounded-full p-5"
      style={{ backgroundColor: `${brandColor}15` }}
    >
      <LayoutDashboard className="h-10 w-10" style={{ color: brandColor }} />
    </div>
    <div>
      <h3 className="text-lg font-semibold">No About Records Yet</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Create your first about section to display on your website.
      </p>
    </div>
    <Button
      onClick={onAdd}
      style={{ backgroundColor: brandColor }}
      className="mt-1 gap-2 text-white"
    >
      <Plus className="h-4 w-4" />
      Create About Section
    </Button>
  </div>
)

/* ─────────────────────────────────────────────
   Skeleton loader rows
───────────────────────────────────────────── */
const SkeletonRows = () =>
  Array.from({ length: 3 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 6 }).map((_, j) => (
        <TableCell key={j}>
          <Skeleton className="h-4 w-full rounded" />
        </TableCell>
      ))}
    </TableRow>
  ))

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
const AboutAdminPanel = () => {
  // const { toast } = useToast()
  const brandColor = getBrandColor()

  /* ── State ── */
  const [records, setRecords] = useState([])
  console.log("🚀 ~ AboutAdminPanel ~ records:", records)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Form dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false) // false = create, true = edit
  const [saving, setSaving] = useState(false)

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Form fields
  const emptyForm = {
    title: "",
    description: "",
    mission: "",
    vision: "",
    isActive: true,
    stats: [],
  }
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  /* ── Fetch all records ── */
  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await axiosInstance.get("/about/all")
      setRecords(res.data?.data || res.data || [])
    } catch (err) {
      // toast({
      //   variant: "destructive",
      //   title: "Failed to load records",
      //   description: err?.response?.data?.message || "Something went wrong.",
      // })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  /* ── Open create dialog ── */
  const openCreate = () => {
    setEditMode(false)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setEditId(null)
    setDialogOpen(true)
  }

  /* ── Open edit dialog ── */
  const openEdit = (record) => {
    setEditMode(true)
    setEditId(record._id)
    setForm({
      title: record.title || "",
      description: record.description || "",
      mission: record.mission || "",
      vision: record.vision || "",
      isActive: record.isActive ?? true,
      stats: Array.isArray(record.stats) ? record.stats : [],
    })
    // If record has an existing image URL, show it as preview
    setImagePreview(record.image || null)
    setImageFile(null)
    setDialogOpen(true)
  }

  /* ── Handle image file selection ── */
  const handleImageFile = (file) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  /* ── Build multipart/form-data payload ── */
  const buildFormData = () => {
    const fd = new FormData()
    fd.append("title", form.title)
    fd.append("description", form.description)
    if (form.mission) fd.append("mission", form.mission)
    if (form.vision) fd.append("vision", form.vision)
    fd.append("isActive", String(form.isActive))
    if (form.stats.length > 0) fd.append("stats", JSON.stringify(form.stats))
    if (imageFile) fd.append("image", imageFile)
    return fd
  }

  /* ── Validate form ── */
  const validate = () => {
    if (!form.title.trim()) return "Title is required."
    if (!form.description.trim()) return "Description is required."
    // Validate stats: both label and value must be filled if a stat row exists
    for (let i = 0; i < form.stats.length; i++) {
      const s = form.stats[i]
      if (!s.label.trim() || !s.value.trim())
        return `Stat row ${i + 1}: both label and value are required.`
    }
    return null
  }

  /* ── Submit (create or update) ── */
  const handleSubmit = async () => {
    const error = validate()
    if (error) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: error,
      })
      return
    }
    setSaving(true)
    try {
      const fd = buildFormData()
      if (editMode) {
        // PUT /about/:id
        await axiosInstance.put(`/about/${editId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        toast({
          title: "Updated!",
          description: "About section updated successfully.",
        })
      } else {
        // POST /about
        await axiosInstance.post("/about", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        toast({ title: "Created!", description: "New about section created." })
      }
      setDialogOpen(false)
      fetchRecords()
    } catch (err) {
    } finally {
      setSaving(false)
    }
  }

  /* ── Trigger delete confirm ── */
  const confirmDelete = (id) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  /* ── Perform delete ── */
  const handleDelete = async () => {
    setDeleting(true)
    try {
      // DELETE /about/:id
      await axiosInstance.delete(`/about/${deletingId}`)

      setDeleteDialogOpen(false)
      fetchRecords()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err?.response?.data?.message || "Something went wrong.",
      })
    } finally {
      setDeleting(false)
    }
  }

  /* ── Toggle active status inline ── */
  const toggleActive = async (record) => {
    try {
      const fd = new FormData()
      fd.append("title", record.title)
      fd.append("description", record.description)
      fd.append("isActive", String(!record.isActive))
      // PUT /about/:id with toggled isActive
      await axiosInstance.put(`/about/${record._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      // Optimistically update local state for instant feedback
      setRecords((prev) =>
        prev.map((r) =>
          r._id === record._id ? { ...r, isActive: !r.isActive } : r
        )
      )
      toast({
        title: !record.isActive ? "Activated" : "Deactivated",
        description: `"${record.title}" is now ${!record.isActive ? "active" : "inactive"}.`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Toggle Failed",
        description: err?.response?.data?.message || "Could not update status.",
      })
    }
  }

  /* ── Render ── */
  return (
    <TooltipProvider>
      <div className="min-h-screen space-y-6 bg-background p-4 md:p-8">
        {/* ── Page Header ── */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Admin</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span style={{ color: brandColor }} className="font-medium">
                About Section
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              About Section
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your website's about content, mission, vision and stats.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchRecords(true)}
                  disabled={refreshing}
                  className="h-9 w-9"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>

            {/* Create button */}
            <Button
              onClick={openCreate}
              className="gap-2 text-white shadow-sm"
              style={{ backgroundColor: brandColor }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add About</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* ── Stats Summary Cards ── */}
        {!loading && records.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Total Records", value: records.length, icon: Info },
              {
                label: "Active",
                value: records.filter((r) => r.isActive).length,
                icon: Eye,
              },
              {
                label: "Inactive",
                value: records.filter((r) => !r.isActive).length,
                icon: EyeOff,
              },
              {
                label: "With Stats",
                value: records.filter((r) => r.stats?.length > 0).length,
                icon: BarChart2,
              },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="border shadow-none">
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className="shrink-0 rounded-lg p-2"
                    style={{ backgroundColor: `${brandColor}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: brandColor }} />
                  </div>
                  <div>
                    <p className="text-xs leading-none text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xl font-bold">{value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── Main Table Card ── */}
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              All About Records
            </CardTitle>
            <CardDescription>
              {records.length} record{records.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[220px] pl-6">Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Image</TableHead>
                      <TableHead className="w-[80px]">Stats</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[110px] pr-6 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <SkeletonRows />
                    ) : records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <EmptyState
                            brandColor={brandColor}
                            onAdd={openCreate}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      records.map((record) => (
                        <TableRow
                          key={record._id}
                          className="group transition-colors hover:bg-muted/30"
                        >
                          {/* Title */}
                          <TableCell className="pl-6 font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: record.isActive
                                    ? brandColor
                                    : "#9ca3af",
                                }}
                              />
                              <span
                                className="max-w-[180px] truncate"
                                title={record.title}
                              >
                                {record.title}
                              </span>
                            </div>
                          </TableCell>

                          {/* Description */}
                          <TableCell>
                            <p className="max-w-[260px] truncate text-sm text-muted-foreground">
                              {record.description}
                            </p>
                          </TableCell>

                          {/* Image */}
                          <TableCell>
                            {record.image ? (
                              <img
                                // src={record.image}
                                src={`http://localhost:8000${record.image}`}
                                alt="about"
                                className="h-9 w-14 rounded-md border object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-14 items-center justify-center rounded-md border bg-muted">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>

                          {/* Stats count */}
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {record.stats?.length ?? 0}
                            </Badge>
                          </TableCell>

                          {/* Active toggle */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={record.isActive}
                                onCheckedChange={() => toggleActive(record)}
                                style={
                                  record.isActive
                                    ? { "--switch-bg": brandColor }
                                    : {}
                                }
                                className="data-[state=checked]:bg-[var(--switch-bg,#16a34a)]"
                              />
                              <span className="hidden text-xs text-muted-foreground lg:inline">
                                {record.isActive ? "Active" : "Off"}
                              </span>
                            </div>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="pr-6 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEdit(record)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => confirmDelete(record._id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Mobile Card List */}
            <div className="divide-y md:hidden">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              ) : records.length === 0 ? (
                <EmptyState brandColor={brandColor} onAdd={openCreate} />
              ) : (
                records.map((record) => (
                  <div key={record._id} className="space-y-3 p-4">
                    {/* Title + badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div
                          className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: record.isActive
                              ? brandColor
                              : "#9ca3af",
                          }}
                        />
                        <h3 className="truncate font-semibold">
                          {record.title}
                        </h3>
                      </div>
                      <Badge
                        variant={record.isActive ? "default" : "secondary"}
                        className="shrink-0 text-[10px]"
                        style={
                          record.isActive ? { backgroundColor: brandColor } : {}
                        }
                      >
                        {record.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {record.description}
                    </p>

                    {/* Image + stats row */}
                    <div className="flex items-center gap-3">
                      {record.image ? (
                        <img
                          src={record.image}
                          alt="about"
                          className="h-10 w-16 rounded-lg border object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded-lg border bg-muted">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      {record.stats?.length > 0 && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <BarChart2 className="h-3 w-3" />
                          {record.stats.length} stat
                          {record.stats.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={record.isActive}
                          onCheckedChange={() => toggleActive(record)}
                          className="data-[state=checked]:bg-green-600"
                          style={
                            record.isActive ? { "--switch-bg": brandColor } : {}
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {record.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => openEdit(record)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDelete(record._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>

          {/* Footer with record count */}
          {records.length > 0 && !loading && (
            <CardFooter className="border-t px-6 pt-3 pb-3">
              <p className="text-xs text-muted-foreground">
                Showing {records.length} record{records.length !== 1 ? "s" : ""}
              </p>
            </CardFooter>
          )}
        </Card>

        {/* ═════════════════════════════════════
            CREATE / EDIT DIALOG
        ═════════════════════════════════════ */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden p-0">
            {/* Dialog Header */}
            <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div
                  className="rounded-lg p-1.5"
                  style={{ backgroundColor: `${brandColor}18` }}
                >
                  {editMode ? (
                    <Pencil className="h-4 w-4" style={{ color: brandColor }} />
                  ) : (
                    <Plus className="h-4 w-4" style={{ color: brandColor }} />
                  )}
                </div>
                {editMode ? "Edit About Section" : "Create About Section"}
              </DialogTitle>
              <DialogDescription>
                {editMode
                  ? "Update the details of this about section."
                  : "Fill in the details to create a new about section."}
              </DialogDescription>
            </DialogHeader>

            <Separator />

            {/* Scrollable form body */}
            <ScrollArea className="flex-1 overflow-auto">
              <div className="space-y-5 px-6 py-4">
                {/* Title + Description */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g. About Our Organization"
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Write a compelling description..."
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Mission + Vision */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="mission">Mission</Label>
                    <Textarea
                      id="mission"
                      placeholder="Our mission..."
                      value={form.mission}
                      onChange={(e) =>
                        setForm({ ...form, mission: e.target.value })
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="vision">Vision</Label>
                    <Textarea
                      id="vision"
                      placeholder="Our vision..."
                      value={form.vision}
                      onChange={(e) =>
                        setForm({ ...form, vision: e.target.value })
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Image uploader */}
                <div className="space-y-1.5">
                  <Label>Image</Label>
                  <ImageUploader
                    file={imageFile}
                    preview={imagePreview}
                    onFileChange={handleImageFile}
                    brandColor={brandColor}
                  />
                  {imageFile && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>{imageFile.name}</span>
                      <button
                        type="button"
                        className="ml-auto text-destructive hover:text-destructive/80"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats editor */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <BarChart2 className="h-3.5 w-3.5" />
                    Statistics
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Add key stats to highlight (e.g. Members: 1200+)
                  </p>
                  <StatsEditor
                    stats={form.stats}
                    onChange={(stats) => setForm({ ...form, stats })}
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                  <div>
                    <p className="text-sm font-medium">Active Status</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Only the active record appears on the public site.
                    </p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(val) =>
                      setForm({ ...form, isActive: val })
                    }
                    className="data-[state=checked]:bg-green-600"
                    style={form.isActive ? { "--switch-bg": brandColor } : {}}
                  />
                </div>
              </div>
            </ScrollArea>

            <Separator />

            {/* Dialog Footer */}
            <DialogFooter className="shrink-0 flex-row justify-end gap-2 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="min-w-[110px] gap-2 text-white"
                style={{ backgroundColor: brandColor }}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {editMode ? "Update" : "Create"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═════════════════════════════════════
            DELETE CONFIRM DIALOG
        ═════════════════════════════════════ */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-destructive/10 p-1.5">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </div>
                Delete About Record
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The record will be permanently
                removed from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2 bg-destructive text-white hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Global toast renderer */}
      {/* <Toaster /> */}
    </TooltipProvider>
  )
}

export default AboutAdminPanel
