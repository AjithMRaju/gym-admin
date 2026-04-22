"use client"
import { useState, useEffect, useCallback } from "react"
import { useDispatch } from "react-redux"
import axiosInstance from "@/lib/config/axiosConfig"
import { showToast } from "@/lib/redux/slices/toastSlice"

// shadcn/ui components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

// Icons (lucide-react)
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  MessageSquare,
  Settings,
  Eye,
  Trash2,
  CheckCheck,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Save,
  X,
  Link2,
  ExternalLink,
  Inbox,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  EyeOff,
  CircleFadingPlus,
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

const SocialIcon = ({ platform, className = "h-4 w-4" }) => {
  const icons = {
    facebook: CircleFadingPlus,
    instagram: CircleFadingPlus,
    youtube: CircleFadingPlus,
    twitter: CircleFadingPlus,
  }
  const Icon = icons[platform] || Globe
  return <Icon className={className} />
}

// ─── Loading Skeletons ─────────────────────────────────────────────────────────

const ContactInfoSkeleton = () => (
  <div className="space-y-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
)

const MessageTableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-14 w-full rounded-lg" />
    ))}
  </div>
)

// ─── Message Detail Dialog ─────────────────────────────────────────────────────

const MessageDetailDialog = ({
  message,
  open,
  onClose,
  onMarkRead,
  onDelete,
}) => {
  const [deleting, setDeleting] = useState(false)
  const [marking, setMarking] = useState(false)

  if (!message) return null

  const handleMarkRead = async () => {
    setMarking(true)
    await onMarkRead(message._id)
    setMarking(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(message._id)
    setDeleting(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg font-semibold">
              {message.subject}
            </DialogTitle>
            {!message.isRead && (
              <Badge variant="secondary" className="text-xs font-medium">
                Unread
              </Badge>
            )}
          </div>
          <DialogDescription>
            Received on {formatDate(message.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sender Info */}
          <div className="space-y-2.5 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-xs font-bold">
                  {message.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium">{message.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <a
                href={`mailto:${message.email}`}
                className="transition-colors hover:text-foreground hover:underline"
              >
                {message.email}
              </a>
            </div>
            {message.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <a
                  href={`tel:${message.phone}`}
                  className="transition-colors hover:text-foreground hover:underline"
                >
                  {message.phone}
                </a>
              </div>
            )}
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Message
            </p>
            <p className="rounded-lg border bg-muted/20 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {message.message}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {!message.isRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkRead}
              disabled={marking}
            >
              {marking ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              )}
              Mark as Read
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Confirm Dialog ─────────────────────────────────────────────────────

const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  loading,
  subject,
}) => (
  <AlertDialog open={open} onOpenChange={onClose}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Message?</AlertDialogTitle>
        <AlertDialogDescription>
          You are about to permanently delete the message{" "}
          <span className="font-medium text-foreground">"{subject}"</span>. This
          action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={loading}
          className="text-destructive-foreground bg-destructive! hover:bg-destructive/90"
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          )}
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

// ─── Contact Info Form ─────────────────────────────────────────────────────────

const ContactInfoPanel = () => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    phone: "",
    email: "",
    address: "",
    workingHours: "",
    mapEmbed: "",
    socialLinks: { facebook: "", instagram: "", youtube: "", twitter: "" },
    isActive: true,
  })

  const fetchInfo = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axiosInstance.get("/contact/info")
      setInfo(data.data)
      setForm({
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
        workingHours: data.workingHours || "",
        mapEmbed: data.mapEmbed || "",
        socialLinks: {
          facebook: data.socialLinks?.facebook || "",
          instagram: data.socialLinks?.instagram || "",
          youtube: data.socialLinks?.youtube || "",
          twitter: data.socialLinks?.twitter || "",
        },
        isActive: data.isActive ?? true,
      })
    } catch {
      dispatch(
        showToast({ message: "Failed to load contact info", type: "error" })
      )
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    fetchInfo()
  }, [fetchInfo])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSocialChange = (platform, value) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (info?._id) {
        await axiosInstance.put(`/contact/info/${info._id}`, form)
        dispatch(
          showToast({
            message: "Contact info updated successfully",
            type: "success",
          })
        )
      } else {
        const { data } = await axiosInstance.post("/contact/info", form)
        setInfo(data)
        dispatch(
          showToast({
            message: "Contact info created successfully",
            type: "success",
          })
        )
      }
      setIsEditing(false)
      fetchInfo()
    } catch {
      dispatch(
        showToast({ message: "Failed to save contact info", type: "error" })
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (info) {
      setForm({
        phone: info.phone || "",
        email: info.email || "",
        address: info.address || "",
        workingHours: info.workingHours || "",
        mapEmbed: info.mapEmbed || "",
        socialLinks: {
          facebook: info.socialLinks?.facebook || "",
          instagram: info.socialLinks?.instagram || "",
          youtube: info.socialLinks?.youtube || "",
          twitter: info.socialLinks?.twitter || "",
        },
        isActive: info.isActive ?? true,
      })
    }
    setIsEditing(false)
  }

  if (loading) return <ContactInfoSkeleton />

  const fields = [
    {
      key: "phone",
      label: "Phone Number",
      icon: Phone,
      placeholder: "+91 98765 43210",
      type: "text",
    },
    {
      key: "email",
      label: "Email Address",
      icon: Mail,
      placeholder: "info@yourgym.com",
      type: "email",
    },
    {
      key: "address",
      label: "Address",
      icon: MapPin,
      placeholder: "MG Road, Thrissur, Kerala",
      type: "text",
    },
    {
      key: "workingHours",
      label: "Working Hours",
      icon: Clock,
      placeholder: "Mon–Sat: 5:30 AM – 10:00 PM",
      type: "text",
    },
  ]

  const socialPlatforms = ["facebook", "instagram", "youtube", "twitter"]

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Gym Contact Details</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage the public-facing contact information for your gym.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={fetchInfo}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button size="sm" onClick={() => setIsEditing(true)}>
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                {info ? "Edit Info" : "Add Info"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {!info && !isEditing && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Phone className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No contact info yet</p>
            <p className="mt-1 mb-4 text-xs text-muted-foreground">
              Add your gym's contact details to display them publicly.
            </p>
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Contact Info
            </Button>
          </CardContent>
        </Card>
      )}

      {(info || isEditing) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map(({ key, label, icon: Icon, placeholder, type }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                  </Label>
                  {isEditing ? (
                    <div className="relative">
                      <Icon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={type}
                        value={form[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        className="pl-9"
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-[2.25rem] items-center gap-2 rounded-md border bg-muted/30 px-3 text-sm">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span
                        className={
                          !info?.[key] ? "text-muted-foreground italic" : ""
                        }
                      >
                        {info?.[key] || "Not set"}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Active Status */}
              <div className="mt-2 flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active Status</p>
                  <p className="text-xs text-muted-foreground">
                    Show contact info publicly
                  </p>
                </div>
                {isEditing ? (
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(v) => handleChange("isActive", v)}
                  />
                ) : (
                  <Badge variant={info?.isActive ? "default" : "secondary"}>
                    {info?.isActive ? "Active" : "Inactive"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social & Map */}
          <div className="space-y-4">
            {/* Social Links */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">
                  Social Media Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {socialPlatforms.map((platform) => (
                  <div key={platform} className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground capitalize">
                      {platform}
                    </Label>
                    {isEditing ? (
                      <div className="relative">
                        <SocialIcon
                          platform={platform}
                          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                          value={form.socialLinks[platform]}
                          onChange={(e) =>
                            handleSocialChange(platform, e.target.value)
                          }
                          placeholder={`https://${platform}.com/yourgym`}
                          className="pl-9"
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-[2.25rem] items-center gap-2 rounded-md border bg-muted/30 px-3 text-sm">
                        <SocialIcon
                          platform={platform}
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                        />
                        {info?.socialLinks?.[platform] ? (
                          <a
                            href={info.socialLinks[platform]}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 truncate text-xs text-primary hover:underline"
                          >
                            {info.socialLinks[platform]}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Not set
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Map Embed */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold">
                  Google Maps Embed
                </CardTitle>
                <CardDescription className="text-xs">
                  Paste the embed URL from Google Maps share.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="relative">
                    <Link2 className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      value={form.mapEmbed}
                      onChange={(e) => handleChange("mapEmbed", e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="min-h-[80px] resize-none pl-9 text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[80px] items-start gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                    <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    {info?.mapEmbed ? (
                      <span className="text-xs break-all text-muted-foreground">
                        {info.mapEmbed}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No map embed set
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Messages Panel ────────────────────────────────────────────────────────────

const MessagesPanel = () => {
  const dispatch = useDispatch()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    unread: "all",
    search: "",
  })

  const [selectedMessage, setSelectedMessage] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.unread === "unread" && { unread: "true" }),
      }
      const { data } = await axiosInstance.get("/contact/messages", { params })
      setMessages(data.messages || data.data || data || [])
      setTotalPages(
        data.totalPages || Math.ceil((data.total || 0) / filters.limit) || 1
      )
      setTotalCount(data.total || data.totalCount || 0)
      setUnreadCount(data.unreadCount || 0)
    } catch {
      dispatch(showToast({ message: "Failed to load messages", type: "error" }))
    } finally {
      setLoading(false)
    }
  }, [dispatch, filters.page, filters.limit, filters.unread])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const handleMarkRead = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: "marking" }))
    try {
      await axiosInstance.put(`/contact/messages/${id}/read`)
      dispatch(
        showToast({ message: "Message marked as read", type: "success" })
      )
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, isRead: true } : m))
      )
      setSelectedMessage((prev) =>
        prev?._id === id ? { ...prev, isRead: true } : prev
      )
    } catch {
      dispatch(
        showToast({ message: "Failed to mark message as read", type: "error" })
      )
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }))
    }
  }

  const handleDelete = async (id) => {
    setDeleteLoading(true)
    try {
      await axiosInstance.delete(`/contact/messages/${id}`)
      dispatch(
        showToast({ message: "Message deleted successfully", type: "success" })
      )
      setMessages((prev) => prev.filter((m) => m._id !== id))
      setDeleteTarget(null)
      if (messages.length === 1 && filters.page > 1) {
        setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
      } else {
        fetchMessages()
      }
    } catch {
      dispatch(
        showToast({ message: "Failed to delete message", type: "error" })
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  const openDetail = (msg) => {
    setSelectedMessage(msg)
    setDetailOpen(true)
  }

  const filteredMessages = filters.search
    ? messages.filter(
        (m) =>
          m.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          m.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
          m.subject?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : messages

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl leading-none font-bold">{totalCount}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Total Messages
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl leading-none font-bold">{unreadCount}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl leading-none font-bold">
                  {totalCount - unreadCount}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Read</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or subject…"
            value={filters.search}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))
            }
            className="pl-9"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((p) => ({ ...p, search: "", page: 1 }))}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.unread}
            onValueChange={(v) =>
              setFilters((p) => ({ ...p, unread: v, page: 1 }))
            }
          >
            <SelectTrigger className="h-9 w-[140px]">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(filters.limit)}
            onValueChange={(v) =>
              setFilters((p) => ({ ...p, limit: Number(v), page: 1 }))
            }
          >
            <SelectTrigger className="h-9 w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={fetchMessages}
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Messages Table */}
      <Card>
        <div className="overflow-hidden rounded-lg">
          {loading ? (
            <div className="p-4">
              <MessageTableSkeleton />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No messages found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {filters.search || filters.unread !== "all"
                  ? "Try adjusting your filters."
                  : "Visitor messages will appear here."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16px]" />
                  <TableHead>Sender</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Subject
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((msg) => (
                  <TableRow
                    key={msg._id}
                    className={`cursor-pointer transition-colors ${!msg.isRead ? "bg-primary/[0.03]" : ""}`}
                    onClick={() => openDetail(msg)}
                  >
                    {/* Unread dot */}
                    <TableCell className="pr-0">
                      {!msg.isRead && (
                        <span className="flex h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </TableCell>

                    {/* Sender */}
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {msg.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm ${!msg.isRead ? "font-semibold" : "font-medium"}`}
                          >
                            {msg.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {msg.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Subject */}
                    <TableCell className="hidden sm:table-cell">
                      <p
                        className={`max-w-[200px] truncate text-sm ${!msg.isRead ? "font-medium" : ""}`}
                      >
                        {msg.subject}
                      </p>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="hidden text-xs whitespace-nowrap text-muted-foreground md:table-cell">
                      {formatDate(msg.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openDetail(msg)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Message</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {!msg.isRead && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={
                                    actionLoading[msg._id] === "marking"
                                  }
                                  onClick={() => handleMarkRead(msg._id)}
                                >
                                  {actionLoading[msg._id] === "marking" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mark as Read</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeleteTarget(msg)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-xs text-muted-foreground">
            Page {filters.page} of {totalPages} · {totalCount} total
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={filters.page <= 1 || loading}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page number pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page
                if (totalPages <= 5) page = i + 1
                else if (filters.page <= 3) page = i + 1
                else if (filters.page >= totalPages - 2)
                  page = totalPages - 4 + i
                else page = filters.page - 2 + i
                return (
                  <Button
                    key={page}
                    variant={filters.page === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setFilters((p) => ({ ...p, page }))}
                    disabled={loading}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={filters.page >= totalPages || loading}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <MessageDetailDialog
        message={selectedMessage}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedMessage(null)
        }}
        onMarkRead={handleMarkRead}
        onDelete={handleDelete}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget?._id)}
        loading={deleteLoading}
        subject={deleteTarget?.subject}
      />
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

const ContactAdminPanel = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Contact Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage gym contact info and respond to visitor enquiries.
          </p>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger
            value="info"
            className="flex items-center gap-1.5 text-sm"
          >
            <Settings className="h-3.5 w-3.5" />
            Contact Info
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="flex items-center gap-1.5 text-sm"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ContactInfoPanel />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ContactAdminPanel
