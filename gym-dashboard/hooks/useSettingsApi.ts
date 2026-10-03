// hooks/useSettingsApi.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import axiosInstance from "@/lib/config/axiosConfig"
import { useAppDispatch } from "@/lib/redux/hooks"
import { showToast } from "@/lib/redux/slices/toastSlice"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface HoursRange {
  open: string
  close: string
}

export interface GymSettings {
  gym_id: string
  name: string
  logo_url?: string
  email: string
  phone: string
  gst_number?: string
  address: string
  timezone: string
  currency: string
  language: string
  hours_weekday: HoursRange
  hours_weekend: HoursRange
  updated_at: string
  updated_by?: string
  __v: number
}

export interface BillingSettings {
  gym_id: string
  tax_rate: number
  grace_period_days: number
  late_fee: number
  freeze_limit_days: number
  auto_renew: boolean
  allow_guest_passes: boolean
  invoice_prefix: string
  invoice_footer: string
  updated_at: string
  __v: number
}

export type NotificationChannel = "email" | "sms" | "whatsapp" | "push"
export type NotificationKey =
  | "expiry_reminder"
  | "payment_receipt"
  | "class_booking"
  | "daily_summary"

export interface NotificationRule {
  enabled: boolean
  channels: NotificationChannel[]
}

export type NotificationSettings = Record<NotificationKey, NotificationRule>

export interface CombinedSettings {
  gym: GymSettings
  billing: BillingSettings
  notifications: NotificationSettings
}

// ─────────────────────────────────────────────────────────────────────────────
// API fetch helpers
// ─────────────────────────────────────────────────────────────────────────────
async function fetchCombined(): Promise<CombinedSettings> {
  const res = await axiosInstance.get("/settings")
  return res.data.data
}

async function putGym(data: Partial<GymSettings>): Promise<GymSettings> {
  const res = await axiosInstance.put("/settings/gym", data)
  return res.data.data
}

async function uploadLogo(file: File): Promise<GymSettings> {
  const form = new FormData()
  form.append("logo", file)
  const res = await axiosInstance.post("/settings/logo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data.data.gym
}

async function putBilling(
  data: Partial<BillingSettings>
): Promise<BillingSettings> {
  const res = await axiosInstance.put("/settings/billing", data)
  return res.data.data
}

async function putNotifications(
  data: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const res = await axiosInstance.put("/settings/notifications", data)
  return res.data.data
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export interface UseSettingsApiReturn {
  gym: GymSettings | null
  billing: BillingSettings | null
  notifications: NotificationSettings | null
  isLoading: boolean
  error: string | null

  saveGym: (data: Partial<GymSettings>) => Promise<GymSettings>
  uploadLogoFile: (file: File) => Promise<GymSettings>
  saveBilling: (data: Partial<BillingSettings>) => Promise<BillingSettings>
  saveNotifications: (
    data: Partial<NotificationSettings>
  ) => Promise<NotificationSettings>

  setGym: React.Dispatch<React.SetStateAction<GymSettings | null>>
  setBilling: React.Dispatch<React.SetStateAction<BillingSettings | null>>
  setNotifications: React.Dispatch<
    React.SetStateAction<NotificationSettings | null>
  >
  reload: () => void
}

export function useSettingsApi(): UseSettingsApiReturn {
  const dispatch = useAppDispatch()
  const [gym, setGym] = useState<GymSettings | null>(null)
  const [billing, setBilling] = useState<BillingSettings | null>(null)
  const [notifications, setNotifications] =
    useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchCombined()
      .then((data) => {
        if (cancelled) return
        setGym(data.gym)
        setBilling(data.billing)
        setNotifications(data.notifications)
      })
      .catch((err) => {
        if (cancelled) return
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          "Failed to load settings."
        dispatch(showToast({ message: msg, type: "error" }))
        // setError(msg)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const saveGym = useCallback(async (data: Partial<GymSettings>) => {
    const updated = await putGym(data)
    setGym(updated)
    return updated
  }, [])

  const uploadLogoFile = useCallback(async (file: File) => {
    const updated = await uploadLogo(file)
    setGym(updated)
    return updated
  }, [])

  const saveBilling = useCallback(async (data: Partial<BillingSettings>) => {
    const updated = await putBilling(data)
    setBilling(updated)
    return updated
  }, [])

  const saveNotifications = useCallback(
    async (data: Partial<NotificationSettings>) => {
      const updated = await putNotifications(data)
      setNotifications(updated)
      return updated
    },
    []
  )

  return {
    gym,
    billing,
    notifications,
    isLoading,
    error,
    saveGym,
    uploadLogoFile,
    saveBilling,
    saveNotifications,
    setGym,
    setBilling,
    setNotifications,
    reload,
  }
}
