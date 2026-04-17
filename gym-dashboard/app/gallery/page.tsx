"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useDispatch } from "react-redux"
import axiosInstance from "@/lib/config/axiosConfig" // your axios instance
import { showToast } from "@/lib/redux/slices/toastSlice" // your toast action

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  Upload,
  Images,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  X,
  ImageIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ZoomIn,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "gym" | "classes" | "equipment" | "events" | "other"

interface GalleryImage {
  _id: string
  title?: string
  caption?: string
  category?: Category
  order?: number
  isActive: boolean
  imageUrl: string
  createdAt: string
  updatedAt: string
}

interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface GalleryResponse {
  images: GalleryImage[]
  pagination?: PaginationMeta
  data: []
}

type ViewMode = "grid" | "list"
type UploadMode = "single" | "bulk"

const CATEGORIES: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "gym", label: "Gym" },
  { value: "classes", label: "Classes" },
  { value: "equipment", label: "Equipment" },
  { value: "events", label: "Events" },
  { value: "other", label: "Other" },
]

const CATEGORY_COLORS: Record<Category, string> = {
  gym: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  classes:
    "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  equipment:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  events:
    "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  other: "bg-muted text-muted-foreground border-border",
}

const LIMIT = 20
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

function resolveImageSrc(url: string): string {
  if (!url) return "/placeholder-image.png"
  if (url.startsWith("/uploads")) return `${BASE_URL}${url}`
  return url
}

// ─── Image Card Component ─────────────────────────────────────────────────────

function ImageCard({
  image,
  viewMode,
  onEdit,
  onDelete,
  onToggleActive,
  onPreview,
}: {
  image: GalleryImage
  viewMode: ViewMode
  onEdit: (img: GalleryImage) => void
  onDelete: (img: GalleryImage) => void
  onToggleActive: (img: GalleryImage) => void
  onPreview: (img: GalleryImage) => void
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const src = resolveImageSrc(image.imageUrl)

  if (viewMode === "list") {
    return (
      <div className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-all duration-200 hover:bg-accent/40">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          {!imgLoaded && !imgError && (
            <Skeleton className="absolute inset-0 h-full w-full" />
          )}
          {imgError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
          ) : (
            <img
              src={src}
              alt={image.title ?? "Gallery image"}
              className={`h-full w-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgError(true)
                setImgLoaded(true)
              }}
            />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {image.title ?? (
              <span className="text-muted-foreground italic">Untitled</span>
            )}
          </p>
          {image.caption && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {image.caption}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            {image.category && (
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[image.category]}`}
              >
                {image.category}
              </span>
            )}
            {image.order !== undefined && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <ArrowUpDown className="h-2.5 w-2.5" /> {image.order}
              </span>
            )}
          </div>
        </div>

        {/* Status + Actions */}
        <div className="flex flex-shrink-0 items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => onToggleActive(image)}
                  className={`h-2 w-2 rounded-full transition-colors ${image.isActive ? "bg-green-500" : "bg-muted-foreground/30"}`}
                />
              </TooltipTrigger>
              <TooltipContent>
                {image.isActive ? "Active" : "Inactive"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onPreview(image)}>
                <ZoomIn className="mr-2 h-3.5 w-3.5" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(image)}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(image)}>
                {image.isActive ? (
                  <EyeOff className="mr-2 h-3.5 w-3.5" />
                ) : (
                  <Eye className="mr-2 h-3.5 w-3.5" />
                )}
                {image.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(image)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="group relative aspect-4/3 cursor-pointer overflow-hidden rounded border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/30">
      {/* Image */}
      <div className="absolute inset-0 bg-muted">
        {!imgLoaded && !imgError && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        )}
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/50">
              Failed to load
            </span>
          </div>
        ) : (
          <img
            src={src}
            alt={image.title ?? "Gallery image"}
            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true)
              setImgLoaded(true)
            }}
          />
        )}
      </div>

      {/* Inactive overlay */}
      {!image.isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
          <span className="rounded-full border border-border bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground">
            Inactive
          </span>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Top badges */}
      <div className="absolute top-2 right-2 left-2 flex translate-y-[-4px] items-start justify-between gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        {image.category && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${CATEGORY_COLORS[image.category]}`}
          >
            {image.category}
          </span>
        )}
        <div
          className={`mt-1 ml-auto h-2 w-2 rounded-full ${image.isActive ? "bg-green-400" : "bg-muted-foreground/50"}`}
        />
      </div>

      {/* Bottom content */}
      <div className="absolute right-0 bottom-0 left-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        {image.title && (
          <p className="mb-2 truncate text-xs font-semibold text-white">
            {image.title}
          </p>
        )}
        <div className="flex items-center gap-1.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPreview(image)
                  }}
                  className="flex h-7 flex-1 cursor-pointer items-center justify-center rounded bg-white/20 px-4 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  <ZoomIn className="mr-1 h-3 w-3" /> Preview
                </button>
              </TooltipTrigger>
              <TooltipContent>Preview Image</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(image)
            }}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleActive(image)
            }}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            {image.isActive ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(image)
            }}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded bg-red-500/60 text-white backdrop-blur-sm transition-colors hover:bg-red-500/80"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Drop Zone ──────────────────────────────────────────────────────────

function DropZone({
  mode,
  files,
  onChange,
}: {
  mode: UploadMode
  files: File[]
  onChange: (files: File[]) => void
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const MAX = mode === "bulk" ? 20 : 1

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    )
    if (mode === "single") {
      onChange(dropped.slice(0, 1))
    } else {
      onChange([...files, ...dropped].slice(0, MAX))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (mode === "single") onChange(selected.slice(0, 1))
    else onChange([...files, ...selected].slice(0, MAX))
    if (inputRef.current) inputRef.current.value = ""
  }

  const removeFile = (idx: number) =>
    onChange(files.filter((_, i) => i !== idx))

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded border-2 border-dashed p-8 transition-all duration-200 ${dragging ? "scale-[1.01] border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"}`}
      >
        <div
          className={`rounded-full p-3 transition-colors ${dragging ? "bg-primary/15" : "bg-muted"}`}
        >
          <CloudUpload
            className={`h-6 w-6 transition-colors ${dragging ? "text-primary" : "text-muted-foreground"}`}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {dragging ? "Drop files here" : "Drag & drop or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "bulk"
              ? `Up to ${MAX} images • JPG, PNG, WebP, GIF`
              : "Single image • JPG, PNG, WebP, GIF"}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={mode === "bulk"}
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* File preview list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            <button
              onClick={() => onChange([])}
              className="text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              Clear all
            </button>
          </div>
          <ScrollArea className={files.length > 3 ? "h-40" : "h-auto"}>
            <div className="space-y-1.5 pr-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-lg border border-border bg-accent/50 p-2"
                >
                  <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="flex-shrink-0 rounded p-1 transition-colors hover:bg-destructive/15 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// ─── Edit / Upload Sheet ───────────────────────────────────────────────────────

function ImageFormSheet({
  open,
  onOpenChange,
  editTarget,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: GalleryImage | null
  onSuccess: () => void
}) {
  const dispatch = useDispatch()
  const isEdit = !!editTarget

  const [uploadMode, setUploadMode] = useState<UploadMode>("single")
  const [files, setFiles] = useState<File[]>([])
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [category, setCategory] = useState<Category | "">("")
  const [order, setOrder] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (editTarget) {
      setTitle(editTarget.title ?? "")
      setCaption(editTarget.caption ?? "")
      setCategory(editTarget.category ?? "")
      setOrder(editTarget.order !== undefined ? String(editTarget.order) : "")
      setIsActive(editTarget.isActive)
    } else {
      setTitle("")
      setCaption("")
      setCategory("")
      setOrder("")
      setIsActive(true)
      setFiles([])
    }
    setUploadProgress(0)
  }, [editTarget, open])

  const handleSubmit = async () => {
    if (!isEdit && files.length === 0) {
      dispatch(
        showToast({
          message: "Please select at least one image.",
          type: "error",
        })
      )
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      if (isEdit && editTarget) {
        // PUT update metadata
        await axiosInstance.put(`/gallery/${editTarget._id}`, {
          title: title || undefined,
          caption: caption || undefined,
          category: category || undefined,
          order: order !== "" ? Number(order) : undefined,
          isActive,
        })
        dispatch(
          showToast({ message: "Image updated successfully.", type: "success" })
        )
      } else if (uploadMode === "single") {
        const formData = new FormData()
        formData.append("image", files[0])
        if (title) formData.append("title", title)
        if (caption) formData.append("caption", caption)
        if (category) formData.append("category", category)
        if (order !== "") formData.append("order", order)
        formData.append("isActive", String(isActive))

        await axiosInstance.post("/gallery", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) =>
            setUploadProgress(Math.round((e.loaded * 100) / (e.total ?? 1))),
        })
        dispatch(
          showToast({
            message: "Image uploaded successfully.",
            type: "success",
          })
        )
      } else {
        const formData = new FormData()
        files.forEach((f) => formData.append("images", f))
        if (category) formData.append("category", category)

        await axiosInstance.post("/gallery/bulk", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) =>
            setUploadProgress(Math.round((e.loaded * 100) / (e.total ?? 1))),
        })
        dispatch(
          showToast({
            message: `${files.length} images uploaded successfully.`,
            type: "success",
          })
        )
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      dispatch(
        showToast({
          message:
            err?.response?.data?.message ??
            "Operation failed. Please try again.",
          type: "error",
        })
      )
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        {/* Header */}
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="flex items-center gap-2.5">
            {isEdit ? (
              <Pencil className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Upload className="h-4 w-4 text-muted-foreground" />
            )}
            {isEdit ? "Edit Image" : "Upload Images"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update image metadata and visibility."
              : "Add new images to your gallery."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 px-6 py-5">
            {/* Upload mode tabs (only for new upload) */}
            {!isEdit && (
              <div className="space-y-3">
                <Tabs
                  value={uploadMode}
                  onValueChange={(v) => {
                    setUploadMode(v as UploadMode)
                    setFiles([])
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single" className="gap-1.5 text-xs">
                      <ImageIcon className="h-3.5 w-3.5" /> Single
                    </TabsTrigger>
                    <TabsTrigger value="bulk" className="gap-1.5 text-xs">
                      <Images className="h-3.5 w-3.5" /> Bulk (max 20)
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <DropZone mode={uploadMode} files={files} onChange={setFiles} />
              </div>
            )}

            {/* Edit current image preview */}
            {isEdit && editTarget && (
              <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
                <ImageWithFallback
                  src={resolveImageSrc(editTarget.imageUrl)}
                  alt={editTarget.title ?? ""}
                />
              </div>
            )}

            <Separator />

            {/* Metadata fields (hidden for bulk upload) */}
            {(isEdit || uploadMode === "single") && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Title</Label>
                  <Input
                    placeholder="Enter image title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Caption</Label>
                  <Textarea
                    placeholder="Add a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="resize-none text-sm"
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as Category)}
                >
                  <SelectTrigger className="h-9! text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(isEdit || uploadMode === "single") && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Sort Order</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    className="h-9 text-sm"
                    min={0}
                  />
                </div>
              )}
            </div>

            {/* Active toggle */}
            {(isEdit || uploadMode === "single") && (
              <div className="flex items-center justify-between rounded border border-border bg-accent/30 px-4 py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Visibility</p>
                  <p className="text-xs text-muted-foreground">
                    {isActive
                      ? "Visible to the public"
                      : "Hidden from public view"}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}

            {/* Upload progress */}
            {loading && uploadProgress > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Uploading…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="gap-2 border-t border-border bg-background px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 py-3"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 gap-2 py-3"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Processing…
              </>
            ) : isEdit ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" /> Save Changes
              </>
            ) : (
              <>
                <CloudUpload className="h-3.5 w-3.5" /> Upload
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Simple lazy image helper ──────────────────────────────────────────────────

function ImageWithFallback({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  return (
    <div className="relative h-full w-full">
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true)
            setLoaded(true)
          }}
        />
      )}
    </div>
  )
}

// ─── Main Gallery Admin Page ───────────────────────────────────────────────────

export default function GalleryAdmin() {
  const dispatch = useDispatch()

  // State
  const [images, setImages] = useState<GalleryImage[]>([])
  console.log("🚀 ~ GalleryAdmin ~ images:", images)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: LIMIT,
    totalPages: 1,
  })

  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all")
  const [page, setPage] = useState(1)

  // Dialogs
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<GalleryImage | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null)
  const [previewTarget, setPreviewTarget] = useState<GalleryImage | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Fetch images
  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, limit: LIMIT }
      if (categoryFilter !== "all") params.category = categoryFilter

      const { data } = await axiosInstance.get<GalleryResponse>(
        "/gallery/admin/all",
        {
          params,
        }
      )
      setImages(data.data ?? [])
      if (data.pagination) setPagination(data.pagination)
    } catch {
      dispatch(
        showToast({ message: "Failed to load gallery images.", type: "error" })
      )
    } finally {
      setLoading(false)
    }
  }, [page, categoryFilter, dispatch])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // Client-side search filter
  const filteredImages = debouncedSearch
    ? images.filter((img) =>
        [img.title, img.caption, img.category].some((f) =>
          f?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      )
    : images

  // Toggle active
  const handleToggleActive = async (img: GalleryImage) => {
    try {
      await axiosInstance.put(`/gallery/${img._id}`, {
        isActive: !img.isActive,
      })
      setImages((prev) =>
        prev.map((i) =>
          i._id === img._id ? { ...i, isActive: !i.isActive } : i
        )
      )
      dispatch(
        showToast({
          message: `Image ${!img.isActive ? "activated" : "deactivated"}.`,
          type: "success",
        })
      )
    } catch {
      dispatch(
        showToast({ message: "Failed to update visibility.", type: "error" })
      )
    }
  }

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget._id)
    try {
      await axiosInstance.delete(`/gallery/${deleteTarget._id}`)
      setImages((prev) => prev.filter((i) => i._id !== deleteTarget._id))
      dispatch(
        showToast({ message: "Image deleted successfully.", type: "success" })
      )
    } catch {
      dispatch(showToast({ message: "Failed to delete image.", type: "error" }))
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  const openEdit = (img: GalleryImage) => {
    setEditTarget(img)
    setSheetOpen(true)
  }
  const openUpload = () => {
    setEditTarget(null)
    setSheetOpen(true)
  }

  const activeCount = images.filter((i) => i.isActive).length
  const inactiveCount = images.length - activeCount

  return (
    <TooltipProvider>
      <div className="my-5 flex h-full min-h-screen flex-col bg-background lg:my-10">
        {/* ── Header ── */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Images className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold tracking-tight">
                  Gallery
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Manage your visual content library
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchImages}
                className="hidden h-8 gap-1.5 px-3 text-xs sm:flex"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={openUpload}
                className="h-8 gap-1.5 px-3 text-xs"
              >
                <Upload className="h-3 w-3" /> Upload
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-6 px-6 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tabular-nums">
                {pagination.total}
              </span>
              <span className="text-xs text-muted-foreground">total</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium tabular-nums">
                {activeCount}
              </span>
              <span className="text-xs text-muted-foreground">active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-sm font-medium tabular-nums">
                {inactiveCount}
              </span>
              <span className="text-xs text-muted-foreground">inactive</span>
            </div>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col items-start gap-3 border-b border-border bg-background/50 px-6 py-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search title, caption, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full pl-8 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2"
              >
                <X className="h-3 w-3 text-muted-foreground transition-colors hover:text-foreground" />
              </button>
            )}
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            {/* Category filter */}
            <div className="flex flex-1 items-center gap-1.5 sm:flex-none">
              <Filter className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v as Category | "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem
                      key={c.value}
                      value={c.value}
                      className="text-xs"
                    >
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 px-6 py-5">
          {loading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
                  : "space-y-2"
              }
            >
              {Array.from({ length: 10 }).map((_, i) =>
                viewMode === "grid" ? (
                  <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
                ) : (
                  <Skeleton key={i} className="h-[72px] rounded-xl" />
                )
              )}
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="rounded-2xl bg-muted/50 p-5">
                <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  {search || categoryFilter !== "all"
                    ? "No images match your filters"
                    : "No images uploaded yet"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {search || categoryFilter !== "all"
                    ? "Try adjusting your search or filter"
                    : "Click Upload to add your first image"}
                </p>
              </div>
              {!search && categoryFilter === "all" && (
                <Button
                  size="sm"
                  onClick={openUpload}
                  className="mt-2 gap-1.5 text-xs"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Images
                </Button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
                  : "space-y-2"
              }
            >
              {filteredImages.map((img) => (
                <ImageCard
                  key={img._id}
                  image={img}
                  viewMode={viewMode}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                  onToggleActive={handleToggleActive}
                  onPreview={setPreviewTarget}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {Math.min((page - 1) * LIMIT + 1, pagination.total)}–
                {Math.min(page * LIMIT, pagination.total)} of {pagination.total}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                {Array.from(
                  { length: Math.min(pagination.totalPages, 5) },
                  (_, i) => {
                    const pg = i + 1
                    return (
                      <Button
                        key={pg}
                        variant={pg === page ? "default" : "outline"}
                        size="icon"
                        className="h-7 w-7 text-xs"
                        onClick={() => setPage(pg)}
                      >
                        {pg}
                      </Button>
                    )
                  }
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Upload / Edit Sheet ── */}
        <ImageFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          editTarget={editTarget}
          onSuccess={fetchImages}
        />

        {/* ── Delete Confirm ── */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(v) => !v && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Image</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove{" "}
                <strong>{deleteTarget?.title ?? "this image"}</strong> from your
                gallery. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteTarget && (
              <div className="relative my-1 aspect-video overflow-hidden rounded-lg bg-muted">
                <ImageWithFallback
                  src={resolveImageSrc(deleteTarget.imageUrl)}
                  alt={deleteTarget.title ?? ""}
                />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!!deletingId}
                className="text-destructive-foreground gap-1.5 bg-destructive hover:bg-destructive/90"
              >
                {deletingId ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Preview Modal ── */}
        <Dialog
          open={!!previewTarget}
          onOpenChange={(v) => !v && setPreviewTarget(null)}
        >
          <DialogContent className="max-w-4xl overflow-hidden rounded-2xl p-0">
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="flex items-center gap-2 text-sm">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                {previewTarget?.title ?? "Image Preview"}
              </DialogTitle>
              {previewTarget?.caption && (
                <DialogDescription>{previewTarget.caption}</DialogDescription>
              )}
            </DialogHeader>

            <div className="relative max-h-[60vh] min-h-[300px] bg-muted/50">
              {previewTarget && (
                <ImageWithFallback
                  src={resolveImageSrc(previewTarget.imageUrl)}
                  alt={previewTarget.title ?? ""}
                />
              )}
            </div>

            {previewTarget && (
              <div className="flex items-center gap-4 border-t border-border bg-background/80 px-5 py-4">
                {previewTarget.category && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[previewTarget.category]}`}
                  >
                    {previewTarget.category}
                  </span>
                )}
                <Badge
                  variant={previewTarget.isActive ? "default" : "secondary"}
                  className="py-0 text-[10px]"
                >
                  {previewTarget.isActive ? "Active" : "Inactive"}
                </Badge>
                {previewTarget.order !== undefined && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUpDown className="h-3 w-3" /> Order:{" "}
                    {previewTarget.order}
                  </span>
                )}
                <DialogFooter className="ml-auto p-0 sm:justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => {
                      setPreviewTarget(null)
                      openEdit(previewTarget)
                    }}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
