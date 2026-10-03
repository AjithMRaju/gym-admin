"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { UploadIcon, Loader2Icon, ImageIcon, XIcon } from "lucide-react"
import { useAppDispatch } from "@/lib/redux/hooks"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { SettingsCard, FormRow } from "./SettingsCard"
import type { GymSettings, UseSettingsApiReturn } from "@/hooks/useSettingsApi"
import { cn } from "@/lib/utils"
import { showToast } from "@/lib/redux/slices/toastSlice"

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────
const gymSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Max 100 chars"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(7, "Phone must be 7–20 chars")
    .max(20, "Phone must be 7–20 chars")
    .regex(/^[+\-()\s\d]+$/, "Invalid phone format"),
  gst_number: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(3).max(3, "Use ISO 4217 code"),
  language: z.string().min(2).max(10, "2–10 char language tag"),
  hours_weekday_open: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  hours_weekday_close: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  hours_weekend_open: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  hours_weekend_close: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
})

type GymFormValues = z.infer<typeof gymSchema>

// Common IANA timezones
const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
]

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD"]
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ar", label: "Arabic" },
]

// ─────────────────────────────────────────────────────────────────────────────
// Skeletons
// ─────────────────────────────────────────────────────────────────────────────
function GymProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <SettingsCard title="Logo">
        <Skeleton className="h-24 w-24 rounded-none" />
      </SettingsCard>
      <SettingsCard title="Basic Information">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 sm:flex-row sm:items-center"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 flex-1" />
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GymProfileSettings
// ─────────────────────────────────────────────────────────────────────────────
interface GymProfileSettingsProps extends Pick<
  UseSettingsApiReturn,
  "gym" | "isLoading" | "error" | "saveGym" | "uploadLogoFile" | "reload"
> {}

export function GymProfileSettings({
  gym,
  isLoading,
  error,
  saveGym,
  uploadLogoFile,
  reload,
}: GymProfileSettingsProps) {
  const dispatch = useAppDispatch()
  const [isSaving, setIsSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<GymFormValues>({
    resolver: zodResolver(gymSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gst_number: "",
      address: "",
      timezone: "Asia/Kolkata",
      currency: "INR",
      language: "en",
      hours_weekday_open: "06:00",
      hours_weekday_close: "22:00",
      hours_weekend_open: "07:00",
      hours_weekend_close: "20:00",
    },
  })

  // Populate from API data
  useEffect(() => {
    if (!gym) return
    form.reset({
      name: gym.name ?? "",
      email: gym.email ?? "",
      phone: gym.phone ?? "",
      gst_number: gym.gst_number ?? "",
      address: gym.address ?? "",
      timezone: gym.timezone ?? "Asia/Kolkata",
      currency: gym.currency ?? "INR",
      language: gym.language ?? "en",
      hours_weekday_open: gym.hours_weekday?.open ?? "06:00",
      hours_weekday_close: gym.hours_weekday?.close ?? "22:00",
      hours_weekend_open: gym.hours_weekend?.open ?? "07:00",
      hours_weekend_close: gym.hours_weekend?.close ?? "20:00",
    })
    setLogoPreview(gym.logo_url ?? null)
    setHasUnsaved(false)
  }, [gym, form])

  // Track unsaved changes
  useEffect(() => {
    const { unsubscribe } = form.watch(() => setHasUnsaved(true))
    return unsubscribe
  }, [form])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError(null)

    const allowed = ["image/png", "image/jpeg", "image/svg+xml"]
    if (!allowed.includes(file.type)) {
      setLogoError("Only PNG, JPG, and SVG files are allowed.")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("File must be under 2 MB.")
      return
    }

    setLogoFile(file)
    const url = URL.createObjectURL(file)
    setLogoPreview(url)
    setHasUnsaved(true)
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return
    setIsUploadingLogo(true)
    try {
      await uploadLogoFile(logoFile)
      setLogoFile(null)
      dispatch(
        showToast({ message: "Logo updated successfully.", type: "success" })
      )
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload logo."
      dispatch(showToast({ message: msg, type: "error" }))
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const onSubmit = async (values: GymFormValues) => {
    if (!gym) return
    setIsSaving(true)
    try {
      await saveGym({
        name: values.name,
        email: values.email,
        phone: values.phone,
        gst_number: values.gst_number || undefined,
        address: values.address,
        timezone: values.timezone,
        currency: values.currency,
        language: values.language,
        hours_weekday: {
          open: values.hours_weekday_open,
          close: values.hours_weekday_close,
        },
        hours_weekend: {
          open: values.hours_weekend_open,
          close: values.hours_weekend_close,
        },
        __v: gym.__v,
      })
      setHasUnsaved(false)
      dispatch(showToast({ message: "Gym profile saved", type: "success" }))
    } catch (err: unknown) {
      const apiErr = err as {
        response?: {
          data?: {
            message?: string
            fieldErrors?: Record<string, string[]>
            code?: string
          }
        }
      }
      const data = apiErr?.response?.data
      if (data?.code === "CONFLICT") {
        dispatch(
          showToast({
            message: "Settings conflict — please reload and try again.",
            type: "error",
          })
        )

        reload()
        return
      }
      if (data?.fieldErrors) {
        Object.entries(data.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof GymFormValues, {
            message: Array.isArray(msgs) ? msgs[0] : String(msgs),
          })
        })
        dispatch(
          showToast({
            message: "Please fix the errors below.",
            type: "error",
          })
        )
      } else {
        dispatch(
          showToast({
            message: "Failed to save gym profile.",
            type: "error",
          })
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <GymProfileSkeleton />

  if (error) {
    return (
      <Alert variant="destructive">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Failed to load gym settings</p>
          <p className="text-xs">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            className="mt-1 w-fit"
          >
            Retry
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Form>
        <div className="flex flex-col gap-5">
          {/* Logo */}
          <SettingsCard
            title="Gym logo"
            description="Upload your gym logo (PNG, JPG, or SVG, max 2 MB)."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
              <div
                className={cn(
                  "flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-none border border-border bg-muted"
                )}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Gym logo preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Recommended: 512×512px, transparent background.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    id="choose-logo-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadIcon className="size-3.5" />
                    Choose file
                  </Button>
                  {logoFile && (
                    <Button
                      type="button"
                      size="sm"
                      id="upload-logo-btn"
                      onClick={handleLogoUpload}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? (
                        <Loader2Icon className="size-3.5 animate-spin" />
                      ) : (
                        <UploadIcon className="size-3.5" />
                      )}
                      Upload
                    </Button>
                  )}
                  {logoPreview && !logoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogoPreview(null)
                        setLogoFile(null)
                      }}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  )}
                </div>
                {logoFile && (
                  <p className="text-xs text-muted-foreground">
                    {logoFile.name}
                  </p>
                )}
                {logoError && (
                  <p className="text-xs text-destructive">{logoError}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                  aria-label="Upload gym logo"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </div>
            </div>
          </SettingsCard>

          {/* Basic Info */}
          <SettingsCard title="Basic information">
            <div className="flex flex-col divide-y divide-border">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Gym name" htmlFor="gym-name">
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="gym-name"
                          placeholder="Iron Paradise Gym"
                          aria-required="true"
                        />
                        <FormMessage name="name" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Contact email" htmlFor="gym-email">
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="gym-email"
                          type="email"
                          placeholder="admin@example.com"
                        />
                        <FormMessage name="email" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Phone" htmlFor="gym-phone">
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="gym-phone"
                          placeholder="+91-9876543210"
                        />
                        <FormMessage name="phone" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />

              {/* GST */}
              <FormField
                control={form.control}
                name="gst_number"
                render={({ field }) => (
                  <FormItem>
                    <FormRow
                      label="GST number"
                      description="Optional — used on invoices"
                      htmlFor="gym-gst"
                    >
                      <Input
                        {...field}
                        id="gym-gst"
                        placeholder="27AAPFU0939F1ZV"
                      />
                    </FormRow>
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Address" htmlFor="gym-address">
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="gym-address"
                          placeholder="42 MG Road, Mumbai"
                        />
                        <FormMessage name="address" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
            </div>
          </SettingsCard>

          {/* Locale */}
          <SettingsCard title="Locale &amp; regional">
            <div className="flex flex-col divide-y divide-border">
              {/* Timezone */}
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Timezone" htmlFor="gym-timezone">
                      <div className="flex flex-col gap-1">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="gym-timezone" className="w-full">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage name="timezone" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />

              {/* Currency */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Currency" htmlFor="gym-currency">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="gym-currency" className="w-full">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormRow>
                  </FormItem>
                )}
              />

              {/* Language */}
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Language" htmlFor="gym-language">
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="gym-language" className="w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.code} value={l.code}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormRow>
                  </FormItem>
                )}
              />
            </div>
          </SettingsCard>

          {/* Hours */}
          <SettingsCard title="Operating hours">
            <div className="flex flex-col divide-y divide-border">
              {/* Weekdays */}
              <FormRow label="Weekdays" description="Monday – Friday">
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="hours_weekday_open"
                    render={({ field }) => (
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="weekday-open"
                          type="time"
                          aria-label="Weekday opening time"
                          className="w-28"
                        />
                        <FormMessage name="hours_weekday_open" />
                      </div>
                    )}
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <FormField
                    control={form.control}
                    name="hours_weekday_close"
                    render={({ field }) => (
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="weekday-close"
                          type="time"
                          aria-label="Weekday closing time"
                          className="w-28"
                        />
                        <FormMessage name="hours_weekday_close" />
                      </div>
                    )}
                  />
                </div>
              </FormRow>

              {/* Weekends */}
              <FormRow label="Weekends" description="Saturday – Sunday">
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="hours_weekend_open"
                    render={({ field }) => (
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="weekend-open"
                          type="time"
                          aria-label="Weekend opening time"
                          className="w-28"
                        />
                        <FormMessage name="hours_weekend_open" />
                      </div>
                    )}
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <FormField
                    control={form.control}
                    name="hours_weekend_close"
                    render={({ field }) => (
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="weekend-close"
                          type="time"
                          aria-label="Weekend closing time"
                          className="w-28"
                        />
                        <FormMessage name="hours_weekend_close" />
                      </div>
                    )}
                  />
                </div>
              </FormRow>
            </div>
          </SettingsCard>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2">
            {hasUnsaved && (
              <p className="mr-auto text-xs text-muted-foreground">
                You have unsaved changes.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                if (hasUnsaved) setShowUnsavedDialog(true)
              }}
              disabled={!hasUnsaved}
              id="discard-gym-btn"
            >
              Discard
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSaving}
              id="save-gym-btn"
            >
              {isSaving ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : null}
              Save changes
            </Button>
          </div>
        </div>
      </Form>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes to the gym profile will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-discard-gym-btn"
              onClick={() => {
                if (gym) {
                  form.reset({
                    name: gym.name,
                    email: gym.email,
                    phone: gym.phone,
                    gst_number: gym.gst_number ?? "",
                    address: gym.address,
                    timezone: gym.timezone,
                    currency: gym.currency,
                    language: gym.language,
                    hours_weekday_open: gym.hours_weekday.open,
                    hours_weekday_close: gym.hours_weekday.close,
                    hours_weekend_open: gym.hours_weekend.open,
                    hours_weekend_close: gym.hours_weekend.close,
                  })
                }
                setHasUnsaved(false)
                setShowUnsavedDialog(false)
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
