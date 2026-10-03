"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
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
import type {
  BillingSettings,
  UseSettingsApiReturn,
} from "@/hooks/useSettingsApi"
import { useAppDispatch } from "@/lib/redux/hooks"
import { showToast } from "@/lib/redux/slices/toastSlice"

// ─────────────────────────────────────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────────────────────────────────────
const billingSchema = z.object({
  tax_rate: z
    .number({ message: "Must be a number" })
    .min(0)
    .max(100, "Max 100"),
  grace_period_days: z
    .number({ message: "Must be a number" })
    .int("Must be a whole number")
    .min(0)
    .max(365, "Max 365"),
  late_fee: z
    .number({ message: "Must be a number" })
    .min(0, "Cannot be negative"),
  freeze_limit_days: z
    .number({ message: "Must be a number" })
    .int("Must be a whole number")
    .min(0)
    .max(365, "Max 365"),
  auto_renew: z.boolean(),
  allow_guest_passes: z.boolean(),
  invoice_prefix: z.string().max(20, "Max 20 chars"),
  invoice_footer: z.string().max(1000, "Max 1000 chars"),
})

type BillingFormValues = z.infer<typeof billingSchema>

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
function BillingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[3, 4, 2].map((rows, i) => (
        <SettingsCard key={i} title="">
          <div className="flex flex-col gap-4">
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 flex-1" />
              </div>
            ))}
          </div>
        </SettingsCard>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BillingSettings
// ─────────────────────────────────────────────────────────────────────────────
interface BillingSettingsProps extends Pick<
  UseSettingsApiReturn,
  "billing" | "isLoading" | "error" | "saveBilling" | "reload"
> {}

export function BillingSettings({
  billing,
  isLoading,
  error,
  saveBilling,
  reload,
}: BillingSettingsProps) {
  const dispatch = useAppDispatch()
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  const form = useForm<BillingFormValues>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      tax_rate: 18,
      grace_period_days: 5,
      late_fee: 100,
      freeze_limit_days: 30,
      auto_renew: false,
      allow_guest_passes: true,
      invoice_prefix: "GYM-INV",
      invoice_footer: "",
    },
  })

  useEffect(() => {
    if (!billing) return
    form.reset({
      tax_rate: billing.tax_rate,
      grace_period_days: billing.grace_period_days,
      late_fee: billing.late_fee,
      freeze_limit_days: billing.freeze_limit_days,
      auto_renew: billing.auto_renew,
      allow_guest_passes: billing.allow_guest_passes,
      invoice_prefix: billing.invoice_prefix,
      invoice_footer: billing.invoice_footer,
    })
    setHasUnsaved(false)
  }, [billing, form])

  useEffect(() => {
    const { unsubscribe } = form.watch(() => setHasUnsaved(true))
    return unsubscribe
  }, [form])

  const onSubmit = async (values: BillingFormValues) => {
    if (!billing) return
    setIsSaving(true)
    try {
      await saveBilling({ ...values, __v: billing.__v })
      setHasUnsaved(false)
      dispatch(
        showToast({ message: "Billing settings saved", type: "success" })
      )
    } catch (err: unknown) {
      const data = (
        err as {
          response?: {
            data?: { message?: string; fieldErrors?: Record<string, string[]> }
          }
        }
      )?.response?.data
      if (data?.fieldErrors) {
        Object.entries(data.fieldErrors).forEach(([field, msgs]) => {
          form.setError(field as keyof BillingFormValues, {
            message: Array.isArray(msgs) ? msgs[0] : String(msgs),
          })
        })
        dispatch(
          showToast({ message: "Please fix the errors below.", type: "error" })
        )
      } else {
        dispatch(
          showToast({
            message: data?.message ?? "Failed to save billing settings.",
            type: "error",
          })
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <BillingSkeleton />

  if (error) {
    return (
      <Alert variant="destructive">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Failed to load billing settings</p>
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
          {/* Tax & Fees */}
          <SettingsCard title="Tax &amp; fees">
            <div className="flex flex-col divide-y divide-border">
              <FormField
                control={form.control}
                name="tax_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormRow
                      label="Tax rate (%)"
                      description="Applied to all invoices"
                      htmlFor="billing-tax"
                    >
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          id="billing-tax"
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          className="w-32"
                        />
                        <FormMessage name="tax_rate" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="late_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormRow
                      label="Late fee"
                      description="Charged after grace period"
                      htmlFor="billing-latefee"
                    >
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          id="billing-latefee"
                          type="number"
                          min={0}
                          step={0.01}
                          className="w-32"
                        />
                        <FormMessage name="late_fee" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grace_period_days"
                render={({ field }) => (
                  <FormItem>
                    <FormRow
                      label="Grace period (days)"
                      description="Days after due date before late fee"
                      htmlFor="billing-grace"
                    >
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          id="billing-grace"
                          type="number"
                          min={0}
                          max={365}
                          className="w-32"
                        />
                        <FormMessage name="grace_period_days" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freeze_limit_days"
                render={({ field }) => (
                  <FormItem>
                    <FormRow
                      label="Freeze limit (days)"
                      description="Max days a membership can be frozen"
                      htmlFor="billing-freeze"
                    >
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? "" : Number(e.target.value)
                            )
                          }
                          id="billing-freeze"
                          type="number"
                          min={0}
                          max={365}
                          className="w-32"
                        />
                        <FormMessage name="freeze_limit_days" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
            </div>
          </SettingsCard>

          {/* Toggle options */}
          <SettingsCard title="Membership options">
            <div className="flex flex-col divide-y divide-border">
              <Controller
                control={form.control}
                name="auto_renew"
                render={({ field }) => (
                  <FormRow
                    label="Auto-renew"
                    description="Automatically renew memberships on expiry"
                  >
                    <Switch
                      id="billing-autorenew"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Auto-renew memberships"
                    />
                  </FormRow>
                )}
              />
              <Controller
                control={form.control}
                name="allow_guest_passes"
                render={({ field }) => (
                  <FormRow
                    label="Guest passes"
                    description="Allow members to bring guests"
                  >
                    <Switch
                      id="billing-guestpasses"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Allow guest passes"
                    />
                  </FormRow>
                )}
              />
            </div>
          </SettingsCard>

          {/* Invoice settings */}
          <SettingsCard title="Invoice settings">
            <div className="flex flex-col divide-y divide-border">
              <FormField
                control={form.control}
                name="invoice_prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormRow
                      label="Invoice prefix"
                      description="Prefix for invoice numbers (max 20 chars)"
                      htmlFor="billing-prefix"
                    >
                      <div className="flex flex-col gap-1">
                        <Input
                          {...field}
                          id="billing-prefix"
                          placeholder="GYM-INV"
                          className="w-40"
                          maxLength={20}
                        />
                        <FormMessage name="invoice_prefix" />
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="invoice_footer"
                render={({ field }) => (
                  <FormItem>
                    <FormRow
                      label="Invoice footer"
                      description="Text shown at the bottom of invoices"
                      htmlFor="billing-footer"
                      stacked
                    >
                      <div className="flex flex-col gap-1">
                        <Textarea
                          {...field}
                          id="billing-footer"
                          rows={3}
                          placeholder="Thank you for choosing us!"
                          maxLength={1000}
                        />
                        <div className="flex justify-between">
                          <FormMessage name="invoice_footer" />
                          <span className="ml-auto text-xs text-muted-foreground">
                            {(field.value ?? "").length}/1000
                          </span>
                        </div>
                      </div>
                    </FormRow>
                  </FormItem>
                )}
              />
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
              id="discard-billing-btn"
              disabled={!hasUnsaved}
              onClick={() => {
                if (hasUnsaved) setShowUnsavedDialog(true)
              }}
            >
              Discard
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSaving}
              id="save-billing-btn"
            >
              {isSaving ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : null}
              Save changes
            </Button>
          </div>
        </div>
      </Form>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Your billing settings changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-discard-billing-btn"
              onClick={() => {
                if (billing)
                  form.reset({
                    tax_rate: billing.tax_rate,
                    grace_period_days: billing.grace_period_days,
                    late_fee: billing.late_fee,
                    freeze_limit_days: billing.freeze_limit_days,
                    auto_renew: billing.auto_renew,
                    allow_guest_passes: billing.allow_guest_passes,
                    invoice_prefix: billing.invoice_prefix,
                    invoice_footer: billing.invoice_footer,
                  })
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
