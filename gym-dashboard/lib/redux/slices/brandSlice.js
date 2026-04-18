// lib/redux/slices/brandSlice.js
// Manages the active brand/accent color across the entire admin panel.
// The color id is persisted to localStorage and synced into Redux on boot.

import { createSlice } from "@reduxjs/toolkit"

export const BRAND_COLORS = [
  { id: "green", label: "Forest", hex: "#16a34a" },
  { id: "blue", label: "Ocean", hex: "#2563eb" },
  { id: "violet", label: "Violet", hex: "#7c3aed" },
  { id: "rose", label: "Rose", hex: "#e11d48" },
  { id: "amber", label: "Amber", hex: "#d97706" },
  { id: "cyan", label: "Cyan", hex: "#0891b2" },
  { id: "slate", label: "Slate", hex: "#475569" },
  { id: "orange", label: "Blaze", hex: "#ea580c" },
]

export const LS_BRAND_KEY = "admin_brand_color"
export const DEFAULT_BRAND = BRAND_COLORS[0]

// ── Helper: resolve a color object from an id string ──────────────────────────
export const resolveBrand = (id) =>
  BRAND_COLORS.find((c) => c.id === id) ?? DEFAULT_BRAND

// ── Read initial color from localStorage (runs once at module load) ────────────
const getInitialBrand = () => {
  try {
    const saved =
      typeof window !== "undefined" && localStorage.getItem(LS_BRAND_KEY)
    return saved ? resolveBrand(saved) : DEFAULT_BRAND
  } catch {
    return DEFAULT_BRAND
  }
}

const brandSlice = createSlice({
  name: "brand",
  initialState: getInitialBrand(),
  reducers: {
    // Accepts either a full color object OR just an id string
    setBrandColor: (state, action) => {
      const incoming = action.payload
      const resolved =
        typeof incoming === "string" ? resolveBrand(incoming) : incoming

      // Persist to localStorage
      try {
        localStorage.setItem(LS_BRAND_KEY, resolved.id)
      } catch {}

      return resolved // replace entire state (it's a plain object)
    },
  },
})

export const { setBrandColor } = brandSlice.actions
export default brandSlice.reducer
