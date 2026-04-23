"use client"

import { useState, useEffect, useCallback } from "react"
import { useDispatch } from "react-redux"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Star,
  Phone,
  Mail,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Upload,
  Loader2,
  Users,
  TrendingUp,
  UserCheck,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
} from "lucide-react"
import axiosInstance from "@/lib/config/axiosConfig"
import { showToast } from "@/lib/redux/slices/toastSlice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

// ─── Constants ───────────────────────────────────────────────────────────────
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]
const STATUS_CONFIG = {
  active: {
    label: "Active",
    color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  },
  inactive: {
    label: "Inactive",
    color: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
  on_leave: {
    label: "On Leave",
    color: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  photo: "",
  bio: "",
  experience: "",
  salary: "",
  status: "active",
  specializations: [],
  certifications: [{ name: "", issuedBy: "", year: "" }],
  schedule: [],
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded border p-5 transition-all duration-300",
        "group border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          accent,
          "scale-150 blur-2xl"
        )}
      />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className={cn("rounded-xl p-3", accent, "bg-opacity-10")}>
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  )
}

// ─── Trainer Card ────────────────────────────────────────────────────────────
function TrainerCard({ trainer, onEdit, onDelete, onView }) {
  const status = STATUS_CONFIG[trainer.status] ?? STATUS_CONFIG.active

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded border border-border bg-card",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      )}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={trainer.photo} alt={trainer.name} />
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {trainer.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-card",
                  trainer.status === "active"
                    ? "bg-emerald-500"
                    : trainer.status === "on_leave"
                      ? "bg-amber-500"
                      : "bg-zinc-500"
                )}
              />
            </div>
            <div>
              <h3 className="text-sm leading-tight font-semibold text-foreground">
                {trainer.name}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {trainer.experience ?? 0} yrs exp.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn("border px-2 py-0.5 text-xs", status.color)}
            >
              {status.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => onView(trainer)}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Eye className="h-3.5 w-3.5" /> View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(trainer)}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(trainer)}
                  className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{trainer.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{trainer.phone}</span>
          </div>
          {trainer.salary && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3 shrink-0" />
              <span>${trainer.salary.toLocaleString()} / mo</span>
            </div>
          )}
        </div>

        {/* Specializations */}
        {trainer.specializations?.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {trainer.specializations.slice(0, 3).map((s, i) => (
              <span
                key={i}
                className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {s}
              </span>
            ))}
            {trainer.specializations.length > 3 && (
              <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                +{trainer.specializations.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-foreground">
              {trainer.rating?.toFixed(1) ?? "0.0"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({trainer.reviewCount ?? 0})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{trainer.schedule?.length ?? 0} days/wk</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Trainer Form ─────────────────────────────────────────────────────────────
function TrainerForm({ open, onClose, trainer, onSuccess }) {
  const dispatch = useDispatch()
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [specInput, setSpecInput] = useState("")
  const isEdit = !!trainer

  useEffect(() => {
    if (trainer) {
      setForm({
        ...trainer,
        experience: trainer.experience ?? "",
        salary: trainer.salary ?? "",
        certifications: trainer.certifications?.length
          ? trainer.certifications.map((c) => ({
              name: c.name,
              issuedBy: c.issuedBy,
              year: c.year,
            }))
          : [{ name: "", issuedBy: "", year: "" }],
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setSpecInput("")
  }, [trainer, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const addSpec = () => {
    const s = specInput.trim()
    if (!s || form.specializations.includes(s)) return
    set("specializations", [...form.specializations, s])
    setSpecInput("")
  }

  const removeSpec = (s) =>
    set(
      "specializations",
      form.specializations.filter((x) => x !== s)
    )

  const updateCert = (i, key, val) => {
    const certs = [...form.certifications]
    certs[i] = { ...certs[i], [key]: val }
    set("certifications", certs)
  }

  const addCert = () =>
    set("certifications", [
      ...form.certifications,
      { name: "", issuedBy: "", year: "" },
    ])
  const removeCert = (i) =>
    set(
      "certifications",
      form.certifications.filter((_, idx) => idx !== i)
    )

  const toggleDay = (day) => {
    const exists = form.schedule.find((s) => s.day === day)
    if (exists)
      set(
        "schedule",
        form.schedule.filter((s) => s.day !== day)
      )
    else
      set("schedule", [
        ...form.schedule,
        { day, startTime: "08:00", endTime: "17:00" },
      ])
  }

  const updateSchedule = (day, key, val) => {
    set(
      "schedule",
      form.schedule.map((s) => (s.day === day ? { ...s, [key]: val } : s))
    )
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      dispatch(
        showToast({
          message: "Name, email and phone are required.",
          type: "error",
        })
      )
      return
    }
    setLoading(true)
    try {
      const payload = {
        ...form,
        experience:
          form.experience !== "" ? Number(form.experience) : undefined,
        salary: form.salary !== "" ? Number(form.salary) : undefined,
        certifications: form.certifications.filter((c) => c.name),
      }
      if (isEdit) {
        await axiosInstance.put(`trainers/${trainer._id}`, payload)
        dispatch(
          showToast({
            message: "Trainer updated successfully.",
            type: "success",
          })
        )
      } else {
        await axiosInstance.post("/trainers", payload)
        dispatch(
          showToast({ message: "Trainer added successfully.", type: "success" })
        )
      }
      onSuccess()
      onClose()
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message ?? "Something went wrong.",
          type: "error",
        })
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0 lg:max-w-3xl">
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold">
            {isEdit ? "Edit Trainer" : "Add New Trainer"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEdit
              ? "Update trainer information."
              : "Fill in the details to add a new trainer."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-6">
            {/* Basic Info */}
            <section>
              <h4 className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="john@gym.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="+1234567890"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Photo URL</Label>
                  <Input
                    placeholder="https://..."
                    value={form.photo}
                    onChange={(e) => set("photo", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Experience (years)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="5"
                    value={form.experience}
                    onChange={(e) => set("experience", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Salary ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="3000"
                    value={form.salary}
                    onChange={(e) => set("salary", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => set("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Bio</Label>
                  <Textarea
                    rows={3}
                    placeholder="A brief description..."
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    className="resize-none"
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Specializations */}
            <section>
              <h4 className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Specializations
              </h4>
              <div className="mb-3 flex gap-2">
                <Input
                  placeholder="e.g. HIIT, Yoga..."
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSpec())
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSpec}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {form.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.specializations.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {s}
                      <button
                        onClick={() => removeSpec(s)}
                        className="transition-colors hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* Certifications */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  Certifications
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addCert}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              <div className="space-y-3">
                {form.certifications.map((cert, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/40 p-3"
                  >
                    <Input
                      placeholder="Cert. Name"
                      value={cert.name}
                      onChange={(e) => updateCert(i, "name", e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Input
                      placeholder="Issued By"
                      value={cert.issuedBy}
                      onChange={(e) =>
                        updateCert(i, "issuedBy", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Year"
                        type="number"
                        value={cert.year}
                        onChange={(e) => updateCert(i, "year", e.target.value)}
                        className="h-8 flex-1 text-xs"
                      />
                      {form.certifications.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCert(i)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Schedule */}
            <section>
              <h4 className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Weekly Schedule
              </h4>
              <div className="mb-3 flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const active = form.schedule.some((s) => s.day === day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
              {form.schedule.length > 0 && (
                <div className="space-y-2">
                  {form.schedule.map((s) => (
                    <div
                      key={s.day}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2.5"
                    >
                      <span className="w-20 text-xs font-medium text-foreground capitalize">
                        {s.day}
                      </span>
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          type="time"
                          value={s.startTime}
                          onChange={(e) =>
                            updateSchedule(s.day, "startTime", e.target.value)
                          }
                          className="h-7 w-28 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">
                          to
                        </span>
                        <Input
                          type="time"
                          value={s.endTime}
                          onChange={(e) =>
                            updateSchedule(s.day, "endTime", e.target.value)
                          }
                          className="h-7 w-28 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 gap-2 sm:flex-none"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Trainer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── View Modal ───────────────────────────────────────────────────────────────
function ViewTrainer({ open, onClose, trainer }) {
  if (!trainer) return null
  const status = STATUS_CONFIG[trainer.status] ?? STATUS_CONFIG.active
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 lg:max-w-xl">
        <div className="relative h-32 overflow-hidden">
          {/* Background Image */}
          <img
            src={
              trainer.backgroundImage ||
              "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"
            }
            alt="Trainer Background"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Black Faded Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Optional: Subtle Gradient on top of the black for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          <div className="absolute bottom-0 left-6">
            <Avatar className="h-16 w-16 border-4 border-background shadow-xl">
              <AvatarImage src={trainer.photo} />
              <AvatarFallback className="bg-primary/20 text-xl font-bold text-primary">
                {trainer.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="px-6 pt-12 pb-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {trainer.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {trainer.experience ?? 0} years experience
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn("border text-xs", status.color)}
            >
              {status.label}
            </Badge>
          </div>

          {trainer.bio && (
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {trainer.bio}
            </p>
          )}

          <div className="mb-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-primary" />
              {trainer.email}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 text-primary" />
              {trainer.phone}
            </div>
            {trainer.salary && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-primary" />$
                {trainer.salary.toLocaleString()} / month
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {trainer.rating?.toFixed(1)} ({trainer.reviewCount} reviews)
            </div>
          </div>

          {trainer.specializations?.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Specializations
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trainer.specializations.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {trainer.certifications?.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Certifications
              </p>
              <div className="space-y-1.5">
                {trainer.certifications.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2 text-xs"
                  >
                    <Award className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    <span className="font-medium text-foreground">
                      {c.name}
                    </span>
                    <span className="text-muted-foreground">
                      — {c.issuedBy}, {c.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trainer.schedule?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Schedule
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {trainer.schedule.map((s) => (
                  <div
                    key={s.day}
                    className="flex items-center gap-2 rounded border border-border bg-muted/50 p-2 text-xs"
                  >
                    <Clock className="h-3 w-3 shrink-0 text-primary" />
                    <span className="font-medium text-foreground capitalize">
                      {s.day.slice(0, 3)}
                    </span>
                    <span className="text-muted-foreground">
                      {s.startTime}–{s.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TrainersPage() {
  const dispatch = useDispatch()
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const totalPages = Math.ceil(total / limit)

  const fetchTrainers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (statusFilter !== "all") params.status = statusFilter
      if (search) params.search = search
      const res = await axiosInstance.get("/trainers", { params })
      setTrainers(res.data.data ?? [])
      setTotal(res.data.total ?? 0)
    } catch {
      dispatch(
        showToast({ message: "Failed to load trainers.", type: "error" })
      )
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter, search, dispatch])

  useEffect(() => {
    fetchTrainers()
  }, [fetchTrainers])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await axiosInstance.delete(`/trainers/${deleteTarget._id}`)
      dispatch(
        showToast({ message: "Trainer deleted successfully.", type: "success" })
      )
      setDeleteTarget(null)
      fetchTrainers()
    } catch (err) {
      dispatch(
        showToast({
          message: err?.response?.data?.message ?? "Failed to delete trainer.",
          type: "error",
        })
      )
    } finally {
      setDeleting(false)
    }
  }

  const stats = [
    {
      icon: Users,
      label: "Total Trainers",
      value: total,
      accent: "bg-primary/10",
    },
    {
      icon: UserCheck,
      label: "Active",
      value: trainers.filter((t) => t.status === "active").length,
      accent: "bg-emerald-500/10",
    },
    {
      icon: TrendingUp,
      label: "Avg Rating",
      value: trainers.length
        ? (
            trainers.reduce((a, t) => a + (t.rating ?? 0), 0) / trainers.length
          ).toFixed(1)
        : "—",
      accent: "bg-amber-500/10",
    },
    {
      icon: Award,
      label: "On Leave",
      value: trainers.filter((t) => t.status === "on_leave").length,
      accent: "bg-amber-500/10",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="my-5 space-y-8 lg:my-10">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Trainers
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your fitness team.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTrainers}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditTarget(null)
                setFormOpen(true)
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Trainer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search trainers..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Tabs
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v)}
            className="w-auto"
          >
            <TabsList className="h-9">
              {["all", "active", "inactive", "on_leave"].map((status) => (
                <TabsTrigger
                  key={status}
                  value={status}
                  className="cursor-pointer px-3 text-xs capitalize"
                >
                  {status.replace("_", " ")}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : trainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-foreground">
              No trainers found
            </h3>
            <p className="mb-6 text-sm text-muted-foreground">
              {search
                ? "Try adjusting your search or filters."
                : "Get started by adding your first trainer."}
            </p>
            {!search && (
              <Button
                size="sm"
                onClick={() => {
                  setEditTarget(null)
                  setFormOpen(true)
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Trainer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {trainers.map((t) => (
              <TrainerCard
                key={t._id}
                trainer={t}
                onEdit={(tr) => {
                  setEditTarget(tr)
                  setFormOpen(true)
                }}
                onDelete={(tr) => setDeleteTarget(tr)}
                onView={(tr) => setViewTarget(tr)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} trainers
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg =
                  totalPages <= 5
                    ? i + 1
                    : page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                        ? totalPages - 4 + i
                        : page - 2 + i
                return (
                  <Button
                    key={pg}
                    size="icon"
                    variant={pg === page ? "default" : "outline"}
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(pg)}
                  >
                    {pg}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TrainerForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditTarget(null)
        }}
        trainer={editTarget}
        onSuccess={fetchTrainers}
      />

      <ViewTrainer
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        trainer={viewTarget}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trainer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive-foreground gap-2 bg-destructive! hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
