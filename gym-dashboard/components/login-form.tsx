"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useAppDispatch } from "@/lib/redux/hooks"
import { setAuth } from "@/lib/redux/slices/authSlice"

const BRAND_COLORS = [
  { id: "green", label: "Forest", hex: "#16a34a", tw: "bg-green-600" },
  { id: "blue", label: "Ocean", hex: "#2563eb", tw: "bg-blue-600" },
  { id: "violet", label: "Violet", hex: "#7c3aed", tw: "bg-violet-600" },
  { id: "rose", label: "Rose", hex: "#e11d48", tw: "bg-rose-600" },
  { id: "amber", label: "Amber", hex: "#d97706", tw: "bg-amber-600" },
  { id: "cyan", label: "Cyan", hex: "#0891b2", tw: "bg-cyan-600" },
  { id: "slate", label: "Slate", hex: "#475569", tw: "bg-slate-600" },
  { id: "orange", label: "Blaze", hex: "#ea580c", tw: "bg-orange-600" },
]

const DEFAULT_COLOR = BRAND_COLORS[0]
const LS_KEY = "admin_brand_color"
const API_URL = "http://localhost:8000/api/auth/login"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const dispatch = useAppDispatch()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [brandColor, setBrandColor] = useState(DEFAULT_COLOR)

  // Load persisted brand color on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const found = BRAND_COLORS.find((c) => c.id === saved)
        if (found) setBrandColor(found)
      }
    } catch {}
  }, [])

  const handleColorSelect = (color: (typeof BRAND_COLORS)[number]) => {
    setBrandColor(color)
    try {
      localStorage.setItem(LS_KEY, color.id)
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data?.message || "Invalid credentials. Please try again."
        )
      }

      // Persist token if returned
      if (data?.token) {
        localStorage.setItem("admin_token", data.token)
        dispatch(setAuth(data.token))
     
      }

      setSuccess(true)
      // TODO: redirect to dashboard — e.g. router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  // Accent style derived from selected brand color
  const accentStyle = { "--brand": brandColor.hex } as React.CSSProperties

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      style={accentStyle}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          {/* Branded dot accent */}
          <span
            className="mb-1 inline-block h-2 w-8 rounded-full transition-colors duration-300"
            style={{ background: brandColor.hex }}
          />
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Sign in to access your gym dashboard
          </p>
        </div>

        {/* Server error */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Login successful! Redirecting…
          </div>
        )}

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="admin@gym.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
            style={
              {
                "--tw-ring-color": brandColor.hex,
                outlineColor: brandColor.hex,
              } as React.CSSProperties
            }
          />
        </Field>

        {/* Password */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
              style={{ color: brandColor.hex }}
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || success}
              className="pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPass((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        {/* ── Brand Color Picker ── */}
        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm leading-none font-medium">
                Dashboard theme
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Choose your accent color — saved automatically
              </p>
            </div>
            {/* Live preview pill */}
            <span
              className="rounded-full px-3 py-1 text-xs font-medium text-white transition-colors duration-300"
              style={{ background: brandColor.hex }}
            >
              {brandColor.label}
            </span>
          </div>

          <div className="grid grid-cols-8 gap-3">
            {BRAND_COLORS.map((color) => {
              const isSelected = color.id === brandColor.id
              return (
                <button
                  key={color.id}
                  type="button"
                  title={color.label}
                  aria-label={`Select ${color.label} theme`}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "group relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all duration-200",
                    "ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    isSelected
                      ? "scale-110 ring-2 ring-offset-2"
                      : "opacity-70 hover:scale-105 hover:opacity-100 hover:ring-1 hover:ring-offset-1"
                  )}
                  style={{
                    background: color.hex,
                    // ringColor: color.hex,
                  }}
                >
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-white drop-shadow-sm" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <Field>
          <Button
            type="submit"
            className="w-full text-white transition-colors duration-300"
            style={{ background: brandColor.hex, borderColor: brandColor.hex }}
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </Field>

        {/* Sign up link */}
        <FieldDescription className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <a
            href="#"
            className="font-medium underline underline-offset-4 transition-colors"
            style={{ color: brandColor.hex }}
          >
            Request access
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
