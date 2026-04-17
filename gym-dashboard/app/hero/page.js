"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertCircle,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  PlusCircle,
  Trash2,
  Upload,
  Video,
  X,
  Dumbbell,
  RefreshCw,
  LayoutDashboard,
} from "lucide-react"
import ErrorBanner from "@/common/clientError/ErrorBanner"

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api"
const NEXT_PUBLIC_API_URL = "http://localhost:8000"

// TODO: Replace with dynamic auth token from your auth system
const TEMP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGRlM2FkMzZmOTJjZjA2MmI4ODcxNiIsImlhdCI6MTc3NjE2MzQ2OSwiZXhwIjoxNzc2NzY4MjY5fQ.TvacUlbpxkRXMo9CZWe_gP5LTVHfbQpr29E4tF4_mcM"

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${TEMP_TOKEN}`,
})

// ─── Validation ───────────────────────────────────────────────────────────────

const validateHeroForm = (form) => {
  const errors = {}

  if (!form.title.trim()) errors.title = "Title is required."
  else if (form.title.trim().length < 3)
    errors.title = "Title must be at least 3 characters."
  else if (form.title.trim().length > 100)
    errors.title = "Title must be under 100 characters."

  if (!form.subtitle.trim()) errors.subtitle = "Subtitle is required."
  else if (form.subtitle.trim().length < 5)
    errors.subtitle = "Subtitle must be at least 5 characters."
  else if (form.subtitle.trim().length > 250)
    errors.subtitle = "Subtitle must be under 250 characters."

  if (!form.buttonTitle.trim()) errors.buttonTitle = "Button title is required."
  else if (form.buttonTitle.trim().length > 50)
    errors.buttonTitle = "Button title must be under 50 characters."

  // Image and video are mutually exclusive — only one allowed at a time
  if (form.imageUrl && form.videoUrl) {
    errors.media = "Only one media type (image or video) is allowed at a time."
  }

  if (form.imageUrl) {
    try {
      new URL(form.imageUrl)
    } catch {
      errors.imageUrl = "Enter a valid image URL."
    }
  }

  if (form.videoUrl) {
    try {
      new URL(form.videoUrl)
    } catch {
      errors.videoUrl = "Enter a valid video URL."
    }
  }

  return errors
}

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  buttonTitle: "",
  imageUrl: "",
  videoUrl: "",
  isActive: true,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ message }) {
  if (!message) return null
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  )
}

function MediaPreview({ imageUrl, videoUrl }) {
  if (!imageUrl && !videoUrl) return null
  return (
    <div className="mt-2 max-h-48 overflow-hidden rounded-lg border border-green-200 dark:border-green-900">
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Hero preview"
          className="h-full max-h-48 w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      )}
      {videoUrl && (
        <video
          src={videoUrl}
          className="max-h-48 w-full"
          controls
          muted
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      )}
    </div>
  )
}

// CREATING & EDITING DIALOG
function HeroFormDialog({ open, onOpenChange, editingHero, onSuccess }) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    backgroundImage: null,
    backgroundVideo: null,
  })

  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState("")
  const [mediaTab, setMediaTab] = useState("image")
  const [showChangeMedia, setShowChangeMedia] = useState(false)

  useEffect(() => {
    if (open) {
      if (editingHero) {
        setForm({
          title: editingHero.heading || "",
          subtitle: editingHero.subheading || "",
          buttonTitle: editingHero.ctaText || editingHero.button_title || "",
          imageUrl: editingHero.backgroundImage || editingHero.image_url || "",
          videoUrl: editingHero.backgroundVideo || editingHero.video_url || "",
          isActive: editingHero.isActive ?? editingHero.isActive ?? true,
        })

        setMediaTab(
          editingHero.mediaType === "video" ||
            editingHero.videoUrl ||
            editingHero.video_url
            ? "video"
            : "image"
        )
        setShowChangeMedia(false) // reset on open
      } else {
        setForm(EMPTY_FORM)
        setMediaTab("image")
        setShowChangeMedia(false)
      }
      setErrors({})
      setServerError("")
    }
  }, [open, editingHero])

  const set = (field) => (e) => {
    const value =
      e.target?.type === "checkbox" ? e.target.checked : (e.target?.value ?? e)
    setForm((prev) => {
      // Switching media tab clears the other field
      if (field === "imageUrl")
        return { ...prev, imageUrl: value, videoUrl: "" }
      if (field === "videoUrl")
        return { ...prev, videoUrl: value, imageUrl: "" }
      return { ...prev, [field]: value }
    })
    setErrors((prev) => ({ ...prev, [field]: undefined, media: undefined }))
  }

  const handleMediaTabChange = (tab) => {
    setMediaTab(tab)
    if (tab === "image") setForm((prev) => ({ ...prev, videoUrl: "" }))
    else setForm((prev) => ({ ...prev, imageUrl: "" }))
    setErrors((prev) => ({
      ...prev,
      imageUrl: undefined,
      videoUrl: undefined,
      media: undefined,
    }))
  }

  const handleFileChange = (field) => (e) => {
    const file = e.target.files[0]
    if (file) {
      setForm((prev) => ({
        ...prev,
        // When one is picked, the other is reset to ensure mutual exclusivity
        backgroundImage: field === "backgroundImage" ? file : null,
        backgroundVideo: field === "backgroundVideo" ? file : null,
      }))
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setServerError("")

    try {
      // 2. Use FormData for Multer compatibility
      const formData = new FormData()
      formData.append("heading", form.title)
      formData.append("subheading", form.subtitle)
      formData.append("ctaText", form.buttonTitle)
      formData.append("isActive", form.isActive)

      // 3. Attach files only if they exist
      if (form.backgroundImage) {
        formData.append("backgroundImage", form.backgroundImage)
      } else if (form.backgroundVideo) {
        formData.append("backgroundVideo", form.backgroundVideo)
      }

      const url = editingHero
        ? `${API_BASE}/hero/${editingHero._id || editingHero.id}`
        : `${API_BASE}/hero`

      const method = editingHero ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          // IMPORTANT: Do NOT set Content-Type header when sending FormData
          // The browser will set it automatically with the correct boundary
          Authorization: `Bearer ${TEMP_TOKEN}`,
        },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || "Request failed")

      onSuccess(data)
      onOpenChange(false)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg lg:max-w-2xl lg:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <Dumbbell className="h-5 w-5" />
            {editingHero ? "Edit Hero Section" : "Create Hero Section"}
          </DialogTitle>
          <DialogDescription>
            {editingHero
              ? "Update your landing page hero content below."
              : "Fill in the details for your gym's hero section."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-5 py-1">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Transform Your Body, Transform Your Life"
                value={form.title}
                onChange={set("title")}
                className={
                  errors.title
                    ? "border-red-400 focus-visible:ring-red-400"
                    : "focus-visible:ring-green-500"
                }
                maxLength={100}
              />
              <div className="flex items-center justify-between">
                <FieldError message={errors.title} />
                <span className="ml-auto text-xs text-muted-foreground">
                  {form.title.length}/100
                </span>
              </div>
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <Label htmlFor="subtitle" className="text-sm font-medium">
                Subtitle <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="subtitle"
                placeholder="e.g. Join thousands of members achieving their fitness goals with expert coaching."
                value={form.subtitle}
                onChange={set("subtitle")}
                rows={3}
                className={
                  errors.subtitle
                    ? "resize-none border-red-400 focus-visible:ring-red-400"
                    : "resize-none focus-visible:ring-green-500"
                }
                maxLength={250}
              />
              <div className="flex items-center justify-between">
                <FieldError message={errors.subtitle} />
                <span className="ml-auto text-xs text-muted-foreground">
                  {form.subtitle.length}/250
                </span>
              </div>
            </div>

            {/* Button Title */}
            <div className="space-y-1">
              <Label htmlFor="buttonTitle" className="text-sm font-medium">
                Primary Button Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="buttonTitle"
                placeholder="e.g. Start Free Trial"
                value={form.buttonTitle}
                onChange={set("buttonTitle")}
                className={
                  errors.buttonTitle
                    ? "border-red-400 focus-visible:ring-red-400"
                    : "focus-visible:ring-green-500"
                }
                maxLength={50}
              />
              <FieldError message={errors.buttonTitle} />
            </div>

            {/* Media — Image or Video (mutually exclusive) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Media{" "}
                <span className="text-xs text-muted-foreground">
                  (optional — image or video, not both)
                </span>
              </Label>

              {errors.media && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {errors.media}
                  </AlertDescription>
                </Alert>
              )}

              <Tabs value={mediaTab} onValueChange={handleMediaTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="image">
                    <ImageIcon className="mr-2 h-4 w-4" /> Image
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Video className="mr-2 h-4 w-4" /> Video
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="image" className="space-y-2">
                  {/* ✅ Existing image preview in edit mode */}
                  {editingHero && form.imageUrl && !showChangeMedia && (
                    <div className="space-y-2">
                      <div className="relative overflow-hidden rounded-md border border-border">
                        <img
                          src={`${NEXT_PUBLIC_API_URL}${form.imageUrl}`}
                          alt="Current hero background"
                          className="h-40 w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-end bg-black/30 p-2">
                          <span className="max-w-full truncate text-xs text-white/80">
                            {form.imageUrl.split("/").pop()}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setShowChangeMedia(true)}
                      >
                        <ImageIcon className="mr-2 h-3 w-3" />
                        Change Image
                      </Button>
                    </div>
                  )}

                  {/* Show file input when: creating new OR user clicked "Change" */}
                  {(!editingHero || !form.imageUrl || showChangeMedia) && (
                    <div className="space-y-1">
                      {showChangeMedia && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mb-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setShowChangeMedia(false)}
                        >
                          ← Keep existing image
                        </Button>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange("backgroundImage")}
                      />
                      {/* New file preview */}
                      {form.backgroundImage && (
                        <div className="relative mt-2 overflow-hidden rounded-md border border-green-500/40">
                          <img
                            src={URL.createObjectURL(form.backgroundImage)}
                            alt="New image preview"
                            className="h-40 w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-end bg-black/30 p-2">
                            <span className="max-w-full truncate text-xs text-white/80">
                              {form.backgroundImage.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="video" className="space-y-2">
                  {/* ✅ Existing video preview in edit mode */}
                  {editingHero && form.videoUrl && !showChangeMedia && (
                    <div className="space-y-2">
                      <div className="relative overflow-hidden rounded-md border border-border">
                        <video
                          src={`${NEXT_PUBLIC_API_URL}${form.videoUrl}`}
                          className="h-40 w-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-end bg-black/30 p-2">
                          <span className="max-w-full truncate text-xs text-white/80">
                            {form.videoUrl.split("/").pop()}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setShowChangeMedia(true)}
                      >
                        <Video className="mr-2 h-3 w-3" />
                        Change Video
                      </Button>
                    </div>
                  )}

                  {/* Show file input when: creating new OR user clicked "Change" */}
                  {(!editingHero || !form.videoUrl || showChangeMedia) && (
                    <div className="space-y-1">
                      {showChangeMedia && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mb-1 h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setShowChangeMedia(false)}
                        >
                          ← Keep existing video
                        </Button>
                      )}
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange("backgroundVideo")}
                      />
                      {/* New file preview */}
                      {form.backgroundVideo && (
                        <div className="relative mt-2 overflow-hidden rounded-md border border-green-500/40">
                          <video
                            src={URL.createObjectURL(form.backgroundVideo)}
                            className="h-40 w-full object-cover"
                            muted
                            loop
                            autoPlay
                            playsInline
                          />
                          <div className="pointer-events-none absolute inset-0 flex items-end bg-black/30 p-2">
                            <span className="max-w-full truncate text-xs text-white/80">
                              {form.backgroundVideo.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <Label
                  htmlFor="isActive"
                  className="cursor-pointer text-sm font-medium"
                >
                  Set as Active
                </Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Only one hero section will be shown publicly at a time.
                </p>
              </div>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(val) =>
                  setForm((prev) => ({ ...prev, isActive: val }))
                }
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="min-w-[120px] bg-green-600 text-white hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : editingHero ? (
              "Save Changes"
            ) : (
              "Create Hero"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// DELETE CONFIRMATION
function DeleteConfirmDialog({
  open,
  onOpenChange,
  hero,
  onConfirm,
  deleting,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Delete Hero Section
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              "{hero?.title}"
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={deleting}
            className="min-w-[100px]"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function HeroCard({ hero, onEdit, onDelete }) {
  const imageUrl = hero.backgroundImage || hero.image_url

  const videoUrl = hero.backgroundVideo || hero.video_url
  const buttonTitle = hero.ctaText || hero.button_title
  const isActive = hero.isActive ?? hero.is_active

  return (
    <Card className="group overflow-hidden rounded-sm border p-0 transition-all duration-200 hover:border-green-300 hover:shadow-md dark:hover:border-green-800">
      {/* Media thumbnail */}
      <div className="relative h-36 overflow-hidden bg-linear-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900">
        {imageUrl && (
          <img
            src={`${NEXT_PUBLIC_API_URL}${imageUrl}`}
            alt={hero.heading}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        )}
        {videoUrl && !imageUrl && (
          <video
            src={`${NEXT_PUBLIC_API_URL}${videoUrl}`}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-50"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
          // <div className="flex h-full items-center justify-center">
          //   <Video className="h-10 w-10 text-green-500 opacity-60" />
          // </div>
        )}
        {!imageUrl && !videoUrl && (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-green-400 opacity-40" />
          </div>
        )}

        {/* Active badge */}
        <div className="absolute top-2 right-2">
          <Badge
            className={
              isActive
                ? "bg-green-600 text-xs text-white hover:bg-green-600"
                : "bg-muted text-xs text-muted-foreground"
            }
          >
            {isActive ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <EyeOff className="h-3 w-3" /> Inactive
              </span>
            )}
          </Badge>
        </div>

        {/* Media type badge */}
        {(imageUrl || videoUrl) && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs opacity-80">
              {imageUrl ? (
                <>
                  <ImageIcon className="mr-1 h-3 w-3" />
                  Image
                </>
              ) : (
                <>
                  <Video className="mr-1 h-3 w-3" />
                  Video
                </>
              )}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="px-4 pt-3 pb-2">
        <CardTitle className="line-clamp-1 text-sm font-semibold text-foreground">
          {hero.heading}
        </CardTitle>
        <CardDescription className="mt-1 line-clamp-2 text-xs">
          {hero.subheading}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 pb-2">
        <div className="inline-flex items-center rounded-md border border-green-200 bg-green-50 px-2.5 py-1 dark:border-green-800 dark:bg-green-950">
          <span className="max-w-45 truncate text-xs font-medium text-green-700 dark:text-green-300">
            {buttonTitle}
          </span>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="flex justify-end gap-2 px-4 py-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(hero)}
                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-300"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(hero)}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  )
}

function HeroCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="mt-3 h-7 w-24" />
      </div>
    </Card>
  )
}

// ─── Live Preview ─────────────────────────────────────────────────────────────

function LiveHeroPreview({ hero }) {
  if (!hero) return null
  const imageUrl = hero.backgroundImage || hero.image_url
  const videoUrl = hero.backgroundVideo || hero.video_url
  const buttonTitle = hero.ctaText || hero.button_title

  return (
    <div className="relative flex min-h-75 items-end overflow-hidden rounded-xl bg-linear-to-br from-green-900 to-emerald-950 sm:min-h-[380px]">
      {imageUrl && (
        <img
          src={`${NEXT_PUBLIC_API_URL}${imageUrl}`}
          alt={hero.heading}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      )}
      {videoUrl && !imageUrl && (
        <video
          src={`${NEXT_PUBLIC_API_URL}${videoUrl}`}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full p-6 sm:p-10">
        <div className="max-w-xl">
          <h1 className="mb-3 text-2xl leading-tight font-bold text-white sm:text-4xl">
            {hero.heading}
          </h1>
          <p className="mb-5 text-sm leading-relaxed text-white/80 sm:text-base">
            {hero.subheading}
          </p>
          <button className="rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors duration-150 hover:bg-green-400 active:bg-green-600 sm:text-base">
            {buttonTitle}
          </button>
        </div>
      </div>

      {/* Live badge */}
      <Badge className="absolute top-3 right-3 animate-pulse bg-green-600 text-xs text-white">
        Live Preview
      </Badge>
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

const HeroDashboardPage = () => {
  const [heroes, setHeroes] = useState([])
  const [activeHero, setActiveHero] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  console.log("🚀 ~ HeroDashboardPage ~ fetchError:", fetchError)

  const [formOpen, setFormOpen] = useState(false)
  const [editingHero, setEditingHero] = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [successMsg, setSuccessMsg] = useState("")
  const successTimer = useRef(null)

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    clearTimeout(successTimer.current)
    successTimer.current = setTimeout(() => setSuccessMsg(""), 3500)
  }

  // Fetch all heroes (dashboard view) + active public hero

  const fetchData = async () => {
    setLoading(true)
    setFetchError("")
    try {
      const [allRes, activeRes] = await Promise.all([
        fetch(`${API_BASE}/hero/all`, { headers: authHeaders() }),
        fetch(`${API_BASE}/hero`),
      ])

      if (!allRes.ok)
        throw new Error(`Failed to load heroes (${allRes.status})`)

      const allData = await allRes.json()
      const activeData = activeRes.ok ? await activeRes.json() : null

      setHeroes(Array.isArray(allData) ? allData : (allData?.data ?? []))
      setActiveHero(activeData?.data ?? activeData ?? null)
    } catch (err) {
      setFetchError(err.message || "Failed to fetch hero data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    return () => clearTimeout(successTimer.current)
  }, [])

  const handleEdit = (hero) => {
    setEditingHero(hero)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingHero(null)
    setFormOpen(true)
  }

  const handleFormSuccess = (data) => {
    fetchData()
    showSuccess(
      editingHero
        ? "Hero section updated successfully!"
        : "Hero section created successfully!"
    )
  }

  const handleDeleteClick = (hero) => {
    setDeleteTarget(hero)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const id = deleteTarget._id || deleteTarget.id
      const res = await fetch(`${API_BASE}/hero/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.message || `Delete failed (${res.status})`)
      }
      setDeleteOpen(false)
      setDeleteTarget(null)
      fetchData()
      showSuccess("Hero section deleted.")
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const activeCount = heroes.filter((h) => h.isActive ?? h.is_active).length
  const totalCount = heroes.length

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex h-14 w-full items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <span className="hidden text-sm font-semibold text-foreground sm:block sm:text-base">
              GymPro Dashboard
            </span>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchData}
                    disabled={loading}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin text-green-500" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              size="sm"
              onClick={handleCreate}
              className="h-8 gap-1.5 bg-green-600 text-xs text-white hover:bg-green-700 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Hero</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="w-ful space-y-6 py-6 sm:py-8">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-green-600" />
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                Hero Section
              </h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your landing page hero content — title, subtitles, and
              media.
            </p>
          </div>
          {!loading && !fetchError && (
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {totalCount}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {activeCount}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          )}
        </div>

        {/* Success toast */}
        {successMsg && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-700 dark:text-green-300">
              {successMsg}
            </AlertDescription>
          </Alert>
        )}

        {/* Fetch error */}
        {fetchError && (
          <div className="flex h-[70dvh] w-full items-center justify-center">
            <ErrorBanner
              compact
              theme="red"
              title="Permission denied"
              message="Something went wrong"
              details="Failed to load data,Please try again later"
            />
          </div>
        )}

        {/* Live preview */}
        {activeHero && !loading && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              <h2 className="text-sm font-semibold text-foreground">
                Active Hero Preview
              </h2>
            </div>
            <LiveHeroPreview hero={activeHero} />
          </section>
        )}

        <Separator />

        {/* Hero cards grid */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Upload className="h-4 w-4 text-green-600" />
              All Hero Sections
            </h2>
            <Badge variant="secondary" className="text-xs">
              {totalCount} record{totalCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <HeroCardSkeleton key={i} />
              ))}
            </div>
          ) : heroes.length === 0 && !fetchError ? (
            <Card className="flex flex-col items-center justify-center border-2 border-dashed border-green-200 bg-green-50/30 py-16 dark:border-green-900 dark:bg-green-950/10">
              <Dumbbell className="mb-3 h-10 w-10 text-green-300" />
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                No hero sections yet
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Create your first hero to power up your landing page.
              </p>
              <Button
                size="sm"
                onClick={handleCreate}
                className="gap-1.5 bg-green-600 text-white hover:bg-green-700"
              >
                <PlusCircle className="h-4 w-4" /> Create Hero
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {heroes.map((hero) => (
                <HeroCard
                  key={hero._id || hero.id}
                  hero={hero}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Create / Edit Dialog */}
      <HeroFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingHero={editingHero}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        hero={deleteTarget}
        onConfirm={handleDeleteConfirm}
        deleting={deleting}
      />
    </div>
  )
}

export default HeroDashboardPage
