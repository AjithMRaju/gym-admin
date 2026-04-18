// components/BrandProvider.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Wrap your admin layout with this ONCE.
// It watches Redux brand state and injects a single <style id="brand-sheet">
// into <head> — no prop drilling, no inline styles needed anywhere else.
//
// Usage in your layout:
//   import { BrandProvider } from "@/components/BrandProvider"
//   <BrandProvider>{children}</BrandProvider>
// ─────────────────────────────────────────────────────────────────────────────

"use client"

import { useEffect } from "react"
import { useAppSelector } from "@/lib/redux/hooks"
import { buildBrandCSS } from "@/lib/brand"

const STYLE_ID = "brand-sheet"

export function BrandProvider({ children }) {
  // Select the active brand color from Redux (shape: { id, label, hex })
  const brand = useAppSelector((state) => {
    return state.brand
  })

  useEffect(() => {
    if (!brand?.hex) return

    // Find or create the dedicated <style> tag
    let el = document.getElementById(STYLE_ID)
    if (!el) {
      el = document.createElement("style")
      el.id = STYLE_ID
      document.head.appendChild(el)
    }

    // Swap the CSS — single DOM write, no flicker
    el.textContent = buildBrandCSS(brand.hex)
  }, [brand?.hex])

  return children
}
