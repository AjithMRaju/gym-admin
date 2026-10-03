"use client"

import { useEffect, useState } from "react"

import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { SettingsCard, FormRow } from "./SettingsCard"
import type {
  NotificationSettings,
  NotificationChannel,
  NotificationKey,
  UseSettingsApiReturn,
} from "@/hooks/useSettingsApi"
import { useAppDispatch } from "@/lib/redux/hooks"
import { showToast } from "@/lib/redux/slices/toastSlice"

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const NOTIFICATION_RULES: {
  key: NotificationKey
  label: string
  description: string
}[] = [
  {
    key: "expiry_reminder",
    label: "Expiry reminder",
    description: "Notify members before their membership expires",
  },
  {
    key: "payment_receipt",
    label: "Payment receipt",
    description: "Send receipt after a successful payment",
  },
  {
    key: "class_booking",
    label: "Class booking",
    description: "Confirm when a class booking is made or cancelled",
  },
  {
    key: "daily_summary",
    label: "Daily summary",
    description: "Send admin a daily report of gym activity",
  },
]

const CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "push", label: "Push" },
]

type LocalNotification = {
  enabled: boolean
  channels: NotificationChannel[]
}
type LocalState = Record<NotificationKey, LocalNotification>

function toLocal(settings: NotificationSettings): LocalState {
  return {
    expiry_reminder: { ...settings.expiry_reminder },
    payment_receipt: { ...settings.payment_receipt },
    class_booking: { ...settings.class_booking },
    daily_summary: { ...settings.daily_summary },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
function NotificationsSkeleton() {
  return (
    <SettingsCard title="Notification rules">
      <div className="flex flex-col gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-5 w-8 shrink-0" />
          </div>
        ))}
      </div>
    </SettingsCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsSettings
// ─────────────────────────────────────────────────────────────────────────────
interface NotificationsSettingsProps extends Pick<
  UseSettingsApiReturn,
  "notifications" | "isLoading" | "error" | "saveNotifications" | "reload"
> {}

export function NotificationsSettings({
  notifications,
  isLoading,
  error,
  saveNotifications,
  reload,
}: NotificationsSettingsProps) {
  const dispatch = useAppDispatch()
  const [local, setLocal] = useState<LocalState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)

  useEffect(() => {
    if (!notifications) return
    setLocal(toLocal(notifications))
    setHasUnsaved(false)
  }, [notifications])

  const toggleEnabled = (key: NotificationKey) => {
    setLocal((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [key]: { ...prev[key], enabled: !prev[key].enabled },
      }
    })
    setHasUnsaved(true)
  }

  const toggleChannel = (
    key: NotificationKey,
    channel: NotificationChannel
  ) => {
    setLocal((prev) => {
      if (!prev) return prev
      const current = prev[key].channels
      const updated = current.includes(channel)
        ? current.filter((c) => c !== channel)
        : [...current, channel]
      return { ...prev, [key]: { ...prev[key], channels: updated } }
    })
    setHasUnsaved(true)
  }

  const handleSave = async () => {
    if (!local) return
    setIsSaving(true)
    try {
      await saveNotifications(local)
      setHasUnsaved(false)
      dispatch(
        showToast({ message: "Notification settings saved.", type: "success" })
      )
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string } } })
        ?.response?.data
      dispatch(
        showToast({
          message: "Failed to save notification settings.",
          type: "error",
        })
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (notifications) {
      setLocal(toLocal(notifications))
      setHasUnsaved(false)
    }
  }

  if (isLoading) return <NotificationsSkeleton />

  if (error) {
    return (
      <Alert variant="destructive">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">
            Failed to load notification settings
          </p>
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

  if (!local) return null

  return (
    <div className="flex flex-col gap-5">
      <SettingsCard
        title="Notification rules"
        description="Control which events trigger notifications and which channels they use."
      >
        <div className="flex flex-col divide-y divide-border">
          {NOTIFICATION_RULES.map(({ key, label, description }) => (
            <div key={key} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor={`notif-${key}-toggle`}
                    className="cursor-pointer text-xs font-medium"
                  >
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <Switch
                  id={`notif-${key}-toggle`}
                  checked={local[key].enabled}
                  onCheckedChange={() => toggleEnabled(key)}
                  aria-label={`Enable ${label}`}
                />
              </div>

              {/* Channels */}
              {local[key].enabled && (
                <div className="mt-3 flex flex-wrap gap-3 pl-0 sm:pl-0">
                  <p className="w-full text-xs font-medium text-muted-foreground">
                    Channels
                  </p>
                  {CHANNELS.map(({ value, label: channelLabel }) => {
                    const checked = local[key]?.channels?.includes(value)
                    return (
                      <div key={value} className="flex items-center gap-1.5">
                        <Checkbox
                          className="cursor-pointer"
                          id={`notif-${key}-${value}`}
                          checked={checked}
                          onCheckedChange={() => toggleChannel(key, value)}
                          aria-label={`${channelLabel} for ${label}`}
                        />
                        <Label
                          htmlFor={`notif-${key}-${value}`}
                          className="cursor-pointer text-xs"
                        >
                          {channelLabel}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
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
          id="discard-notifications-btn"
          disabled={!hasUnsaved}
          onClick={handleDiscard}
        >
          Discard
        </Button>
        <Button
          type="button"
          size="lg"
          id="save-notifications-btn"
          disabled={isSaving || !hasUnsaved}
          onClick={handleSave}
        >
          {isSaving ? <Loader2Icon className="size-3.5 animate-spin" /> : null}
          Save changes
        </Button>
      </div>
    </div>
  )
}
