// components/LoginForm.jsx  ← UPDATED
// ─────────────────────────────────────────────────────────────────────────────
// Changes from original:
//  • Removed all inline style={{ color: brandColor.hex }} etc.
//  • Every colored element now uses a brand-* className instead
//  • setBrandColor dispatch updates Redux → BrandProvider re-injects CSS globally
//  • No local brandColor state — truth lives in Redux
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import { useState } from "react"
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
import { useSelector } from "react-redux"
import { useAppDispatch } from "@/lib/redux/hooks"
import { setAuth } from "@/lib/redux/slices/authSlice"
import { setBrandColor, BRAND_COLORS } from "@/lib/redux/slices/brandSlice"

const API_URL = "http://localhost:8000/api/auth/login"

export function LoginForm({ className, ...props }) {
  const dispatch = useAppDispatch()
  const brandColor = useSelector((state) => state.brand)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleColorSelect = (color) => dispatch(setBrandColor(color))

  const handleSubmit = async (e) => {
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
      if (!res.ok) throw new Error(data?.message || "Invalid credentials.")
      if (data?.token) {
        localStorage.setItem("admin_token", data.token)
        dispatch(setAuth(data.token))
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="brand-bg mb-1 inline-block h-2 w-8 rounded-full transition-colors duration-300" />
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Sign in to access your gym dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Login successful! Redirecting...
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
            className="brand-focus"
          />
        </Field>

        {/* Password */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a href="#" className="brand-link ml-auto text-sm">
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
              className="brand-focus pr-10"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPass((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>

        {/* Color Picker */}
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
            <span className="brand-badge">{brandColor.label}</span>
          </div>
          <div className="grid grid-cols-8 gap-3">
            {BRAND_COLORS.map((color) => {
              const isSelected = color.id === brandColor.id
              return (
                <button
                  key={color.id}
                  type="button"
                  title={color.label}
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all duration-200",
                    "ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    isSelected
                      ? "scale-110 ring-2 ring-offset-2"
                      : "opacity-70 hover:scale-105 hover:opacity-100"
                  )}
                  style={{ background: color.hex }}
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
            className="brand-ui w-full"
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </Field>

        <FieldDescription className="text-center text-sm">
          Don&apos;t have an account?{" "}
          <a
            href="#"
            className="brand-link font-medium underline underline-offset-4"
          >
            Request access
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
