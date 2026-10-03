"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Loader2Icon,
  QrCodeIcon,
  MonitorIcon,
  TrashIcon,
  ShieldCheckIcon,
} from "lucide-react"
import QRCode from "qrcode"

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
import { Skeleton } from "@/components/ui/skeleton"
import { SettingsCard, FormRow } from "./SettingsCard"
import axiosInstance from "@/lib/config/axiosConfig"
import { cn } from "@/lib/utils"
import { useEffect } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface Session {
  _id: string
  device: string
  ip: string
  last_active: string
  expires_at: string
  created_at: string
  is_current: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────────────────────
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "At least one uppercase letter")
      .regex(/\d/, "At least one number"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

const totpSchema = z.object({
  token: z
    .string()
    .length(6, "Must be exactly 6 digits")
    .regex(/^\d+$/, "Digits only"),
})
type TotpFormValues = z.infer<typeof totpSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SecuritySettings
// ─────────────────────────────────────────────────────────────────────────────
export function SecuritySettings() {
  // ── Change password ───────────────────────────────────────────────────────
  const [pwSaving, setPwSaving] = useState(false)

  const pwForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const onChangePassword = async (values: PasswordFormValues) => {
    setPwSaving(true)
    try {
      const res = await axiosInstance.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      if (res.data?.token) {
        localStorage.setItem("admin_token", res.data.token)
      }
      pwForm.reset()
      toast.success("Password updated. Other sessions have been revoked.")
    } catch (err: unknown) {
      const data = (
        err as {
          response?: {
            data?: {
              message?: string
              fieldErrors?: Record<string, string[]>
              code?: string
            }
          }
        }
      )?.response?.data
      if (data?.code === "RATE_LIMIT_EXCEEDED") {
        toast.error(data.message ?? "Too many attempts. Try again later.")
        return
      }
      if (data?.fieldErrors?.currentPassword) {
        pwForm.setError("currentPassword", {
          message: data.fieldErrors.currentPassword[0],
        })
      } else {
        toast.error(data?.message ?? "Failed to change password.")
      }
    } finally {
      setPwSaving(false)
    }
  }

  // ── 2FA ──────────────────────────────────────────────────────────────────
  const [twoFaStep, setTwoFaStep] = useState<"idle" | "setup" | "verify">(
    "idle"
  )
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [totpSecret, setTotpSecret] = useState<string | null>(null)
  const [isEnabling2fa, setIsEnabling2fa] = useState(false)

  const totpForm = useForm<TotpFormValues>({
    resolver: zodResolver(totpSchema),
    defaultValues: { token: "" },
  })

  const handleEnable2fa = async () => {
    setIsEnabling2fa(true)
    try {
      const res = await axiosInstance.post("/auth/2fa/enable")
      const { secret, otpauth_uri } = res.data.data
      setTotpSecret(secret)
      const dataUrl = await QRCode.toDataURL(otpauth_uri)
      setQrDataUrl(dataUrl)
      setTwoFaStep("setup")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg ?? "Failed to initiate 2FA setup.")
    } finally {
      setIsEnabling2fa(false)
    }
  }

  const onVerifyTotp = async (values: TotpFormValues) => {
    try {
      await axiosInstance.post("/auth/2fa/verify", { token: values.token })
      setTwoFaStep("idle")
      setQrDataUrl(null)
      setTotpSecret(null)
      totpForm.reset()
      toast.success("Two-factor authentication has been enabled.")
    } catch (err: unknown) {
      const data = (
        err as {
          response?: {
            data?: { message?: string; fieldErrors?: Record<string, string[]> }
          }
        }
      )?.response?.data
      if (data?.fieldErrors?.token) {
        totpForm.setError("token", { message: data.fieldErrors.token[0] })
      } else {
        toast.error(data?.message ?? "Invalid or expired TOTP token.")
      }
    }
  }

  // ── Sessions ─────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([])

  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [isRevokingAll, setIsRevokingAll] = useState(false)

  const loadSessions = async () => {
    setSessionsLoading(true)
    setSessionsError(null)
    try {
      const res = await axiosInstance.get("/auth/sessions")
      setSessions(res.data.data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setSessionsError(msg ?? "Failed to load sessions.")
    } finally {
      setSessionsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const revokeSession = async (id: string) => {
    setRevokingId(id)
    try {
      await axiosInstance.delete(`/auth/sessions/${id}`)
      setSessions((prev) => prev.filter((s) => s._id !== id))
      toast.success("Session revoked.")
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg ?? "Failed to revoke session.")
    } finally {
      setRevokingId(null)
    }
  }

  const revokeAllSessions = async () => {
    setIsRevokingAll(true)
    try {
      await axiosInstance.delete("/auth/sessions")
      toast.success("All other sessions revoked.")
      loadSessions()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      toast.error(msg ?? "Failed to revoke sessions.")
    } finally {
      setIsRevokingAll(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Change Password */}
      <SettingsCard
        title="Change password"
        description="Update your password. On success, all other active sessions will be revoked."
      >
        <form onSubmit={pwForm.handleSubmit(onChangePassword)} noValidate>
          <Form>
            <div className="flex flex-col divide-y divide-border">
              <FormField
                control={pwForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Current password" htmlFor="pw-current">
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="pw-current"
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                        />
                        <FormMessage name="currentPassword" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
              <FormField
                control={pwForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="New password" htmlFor="pw-new">
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="pw-new"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                        />
                        <FormMessage name="newPassword" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
              <FormField
                control={pwForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormRow label="Confirm password" htmlFor="pw-confirm">
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="pw-confirm"
                          type="password"
                          autoComplete="new-password"
                          placeholder="••••••••"
                        />
                        <FormMessage name="confirmPassword" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={pwSaving}
                id="save-password-btn"
              >
                {pwSaving ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : null}
                Update password
              </Button>
            </div>
          </Form>
        </form>
      </SettingsCard>

      {/* Two-Factor Authentication */}
      <SettingsCard
        title="Two-factor authentication"
        description="Add an extra layer of security to your account using an authenticator app."
      >
        {twoFaStep === "idle" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-none bg-muted">
                <ShieldCheckIcon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium">Authenticator app</p>
                <p className="text-xs text-muted-foreground">
                  Not configured — scan a QR code to set up
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              id="enable-2fa-btn"
              onClick={handleEnable2fa}
              disabled={isEnabling2fa}
            >
              {isEnabling2fa ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <QrCodeIcon className="size-3.5" />
              )}
              Set up 2FA
            </Button>
          </div>
        )}

        {twoFaStep === "setup" && qrDataUrl && (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              Scan the QR code with Google Authenticator, Authy, or any TOTP
              app.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <img
                src={qrDataUrl}
                alt="TOTP QR code — scan with your authenticator app"
                className="size-40 rounded-none border border-border"
              />
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  Or enter this key manually:
                </p>
                <code className="rounded-none bg-muted px-2 py-1 font-mono text-xs tracking-widest">
                  {totpSecret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTwoFaStep("verify")}
                  id="continue-2fa-btn"
                >
                  Continue — enter code
                </Button>
              </div>
            </div>
          </div>
        )}

        {twoFaStep === "verify" && (
          <form onSubmit={totpForm.handleSubmit(onVerifyTotp)} noValidate>
            <Form>
              <div className="flex flex-col gap-3">
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to verify.
                </p>
                <FormField
                  control={totpForm.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="totp-code"
                          aria-label="TOTP verification code"
                          placeholder="123456"
                          maxLength={6}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          className="w-36 font-mono tracking-widest"
                        />
                        <FormMessage name="token" />
                      </div>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" id="verify-totp-btn">
                    Verify &amp; enable
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTwoFaStep("idle")
                      setQrDataUrl(null)
                      setTotpSecret(null)
                      totpForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Form>
          </form>
        )}
      </SettingsCard>

      {/* Active Sessions */}
      <SettingsCard
        title="Active sessions"
        description="Manage where you're currently logged in."
        footer={
          sessions.filter((s) => !s.is_current).length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  id="revoke-all-sessions-btn"
                  disabled={isRevokingAll}
                >
                  {isRevokingAll ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : null}
                  Revoke all other sessions
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Revoke all other sessions?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    All sessions except your current one will be signed out.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    id="confirm-revoke-all-btn"
                    onClick={revokeAllSessions}
                  >
                    Revoke all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
        }
      >
        {sessionsLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-none" />
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : sessionsError ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-destructive">{sessionsError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSessions}
              className="w-fit"
            >
              Retry
            </Button>
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No active sessions found.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {sessions.map((session) => (
              <div key={session._id} className="flex items-center gap-3 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-none bg-muted">
                  <MonitorIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-medium">
                      {session.device}
                    </span>
                    {session.is_current && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {session.ip} · Last active {formatDate(session.last_active)}
                  </span>
                </div>
                {!session.is_current && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    id={`revoke-session-${session._id}`}
                    disabled={revokingId === session._id}
                    onClick={() => revokeSession(session._id)}
                    aria-label="Revoke this session"
                    className="shrink-0"
                  >
                    {revokingId === session._id ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <TrashIcon className="size-3.5 text-destructive" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </SettingsCard>
    </div>
  )
}
