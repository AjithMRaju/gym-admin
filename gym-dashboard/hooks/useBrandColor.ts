"use client"

import { useEffect, useCallback, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setBrandColor, LS_BRAND_KEY } from "@/lib/redux/slices/brandSlice"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const HEX_REGEX = /^#[0-9a-fA-F]{6}$/
const STYLE_ID = "brand-primary-sheet"

export const PRESET_SWATCHES = [
  { id: "ember",  label: "Ember",  hex: "#e4572e" },
  { id: "ocean",  label: "Ocean",  hex: "#1f7ae0" },
  { id: "forest", label: "Forest", hex: "#1f9d63" },
  { id: "violet", label: "Violet", hex: "#7c4dff" },
  { id: "gold",   label: "Gold",   hex: "#d99a00" },
  { id: "rose",   label: "Rose",   hex: "#d6336c" },
] as const

export type SwatchId = (typeof PRESET_SWATCHES)[number]["id"] | "custom"

// ─────────────────────────────────────────────────────────────────────────────
// Hex → oklch conversion (approximate, good enough for brand colors)
// ─────────────────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Convert hex to oklch string for CSS (e.g. "oklch(0.65 0.18 27)") */
function hexToOklch(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map(linearize) as [number, number, number]

  // sRGB → XYZ (D65)
  const X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375
  const Y = r * 0.2126729 + g * 0.7151522 + b * 0.072175
  const Z = r * 0.0193339 + g * 0.119192  + b * 0.9503041

  // XYZ → LMS (Oklab M1)
  const l = Math.cbrt(0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z)
  const m = Math.cbrt(0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z)
  const s = Math.cbrt(0.0482003018 * X + 0.2643662691 * Y + 0.6338517070 * Z)

  // LMS → Lab (Oklab M2)
  const L =  0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
  const a =  1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s

  // Lab → LCH
  const C = Math.sqrt(a * a + bb * bb)
  const H = Math.atan2(bb, a) * (180 / Math.PI)

  return `oklch(${L.toFixed(4)} ${C.toFixed(4)} ${((H % 360) + 360) % 360 | 0})`
}

/**
 * Calculate relative luminance for WCAG contrast
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rl, gl, bl] = [r, g, b].map(linearize)
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/**
 * Return "oklch(0.985 0 0)" (≈ white) or "oklch(0.145 0 0)" (≈ near-black)
 * to meet WCAG AA contrast against the given hex color.
 */
export function contrastForeground(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  const lum = relativeLuminance(r, g, b)
  // white contrast ratio vs lum = (1 + 0.05) / (lum + 0.05)
  const whiteContrast = 1.05 / (lum + 0.05)
  // black contrast ratio = (lum + 0.05) / 0.05
  const blackContrast = (lum + 0.05) / 0.05

  // Pick whichever has more contrast; prefer white for dark colors
  return whiteContrast >= blackContrast
    ? "oklch(0.985 0 0)"
    : "oklch(0.145 0 0)"
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply CSS variables onto <html>
// ─────────────────────────────────────────────────────────────────────────────
function applyBrandColor(hex: string): void {
  if (!HEX_REGEX.test(hex)) return
  const oklch = hexToOklch(hex)
  const fg    = contrastForeground(hex)

  // Derive a slightly lighter version for dark mode (boost lightness by ~0.08)
  const [L, C, H] = oklch.replace("oklch(", "").replace(")", "").split(" ").map(Number)
  const darkL = Math.min(L + 0.08, 0.9)
  const darkOklch = `oklch(${darkL.toFixed(4)} ${C.toFixed(4)} ${H})`

  let el = document.getElementById(STYLE_ID)
  if (!el) {
    el = document.createElement("style")
    el.id = STYLE_ID
    document.head.appendChild(el)
  }

  el.textContent = /* css */ `
    :root {
      --primary: ${oklch};
      --primary-foreground: ${fg};
      --ring: ${oklch};
    }
    .dark {
      --primary: ${darkOklch};
      --primary-foreground: ${fg};
      --ring: ${darkOklch};
    }
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// Safe localStorage helpers
// ─────────────────────────────────────────────────────────────────────────────
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch {}
}
function safeRemoveItem(key: string): void {
  try { localStorage.removeItem(key) } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export interface UseBrandColorReturn {
  /** Currently active hex color */
  hex: string
  /** ID of the currently active swatch (or "custom") */
  activeId: SwatchId
  /** Set to a preset swatch id */
  setPreset: (id: SwatchId) => void
  /** Set to any arbitrary hex string */
  setCustomHex: (hex: string) => void
  /** Reset to default (removes localStorage key) */
  reset: () => void
}

const DEFAULT_HEX = "#e4572e" // Ember as default

export function useBrandColor(): UseBrandColorReturn {
  const dispatch = useAppDispatch()
  const reduxHex = useAppSelector((s: any) => s.brand?.hex as string | undefined)

  // Derive hex from Redux store; fall back to localStorage, then default
  const resolveHex = (): string => {
    if (reduxHex && HEX_REGEX.test(reduxHex)) return reduxHex
    const stored = safeGetItem(LS_BRAND_KEY)
    if (stored && HEX_REGEX.test(stored)) return stored
    return DEFAULT_HEX
  }

  const [hex, setHexState] = useState<string>(resolveHex)

  // Sync from redux when it changes
  useEffect(() => {
    if (reduxHex && HEX_REGEX.test(reduxHex)) setHexState(reduxHex)
  }, [reduxHex])

  // Apply brand color CSS whenever hex changes
  useEffect(() => {
    applyBrandColor(hex)
  }, [hex])

  // Listen to cross-tab storage events
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== LS_BRAND_KEY) return
      const val = e.newValue
      if (val && HEX_REGEX.test(val)) {
        setHexState(val)
        // Sync into Redux without going through the old preset system
        dispatch(setBrandColor({ id: "custom", label: "Custom", hex: val }))
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [dispatch])

  const setPreset = useCallback(
    (id: SwatchId) => {
      const swatch = PRESET_SWATCHES.find((s) => s.id === id)
      if (!swatch) return
      safeSetItem(LS_BRAND_KEY, swatch.hex)
      setHexState(swatch.hex)
      dispatch(setBrandColor({ id: swatch.id, label: swatch.label, hex: swatch.hex }))
    },
    [dispatch],
  )

  const setCustomHex = useCallback(
    (value: string) => {
      if (!HEX_REGEX.test(value)) return
      safeSetItem(LS_BRAND_KEY, value)
      setHexState(value)
      dispatch(setBrandColor({ id: "custom", label: "Custom", hex: value }))
    },
    [dispatch],
  )

  const reset = useCallback(() => {
    safeRemoveItem(LS_BRAND_KEY)
    setHexState(DEFAULT_HEX)
    dispatch(setBrandColor({ id: "ember", label: "Ember", hex: DEFAULT_HEX }))
  }, [dispatch])

  // Determine activeId
  const activeId: SwatchId =
    PRESET_SWATCHES.find((s) => s.hex.toLowerCase() === hex.toLowerCase())?.id ?? "custom"

  return { hex, activeId, setPreset, setCustomHex, reset }
}
