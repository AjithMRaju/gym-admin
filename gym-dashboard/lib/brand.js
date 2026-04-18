// lib/brand.js
// ─────────────────────────────────────────────────────────────────────────────
// THE CORE IDEA
// Instead of inline `style={{ color: brandColor.hex }}` scattered everywhere,
// every component just adds one className:  brand-ui
//
// The <BrandProvider> injects a <style> tag that maps  brand-*  classes to the
// current hex value via a single CSS custom property  --brand.
//
// You can use any of these utility classes anywhere:
//
//  brand-bg        → background-color: var(--brand)
//  brand-text      → color: var(--brand)
//  brand-border    → border-color: var(--brand)
//  brand-ring      → outline / ring color: var(--brand)
//  brand-fill      → fill: var(--brand)          (SVG icons)
//  brand-stroke    → stroke: var(--brand)        (SVG icons)
//  brand-ui        → bg + white text (primary button style)
//  brand-ui-ghost  → transparent bg, brand text + border (ghost button)
//  brand-hover     → hover:background-color: var(--brand)  + white text
//  brand-hover-text→ hover:color: var(--brand)
//  brand-hover-border→hover:border-color: var(--brand)
//  brand-placeholder→ ::placeholder color: var(--brand-subtle)
//  brand-focus     → focus:outline / ring with brand color
//  brand-badge     → small pill with brand bg + white text
//  brand-link      → colored link with hover underline
//  brand-icon      → icon colored with brand (sets currentColor)
//
// Dark-mode variants are handled automatically through the CSS.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates the global <style> block that powers all brand-* classes.
 * Called by BrandProvider whenever the active color changes.
 *
 * @param {string} hex  - e.g. "#2563eb"
 * @returns {string}    - raw CSS string
 */
export function buildBrandCSS(hex) {
  // Derive a subtle (low-opacity) version for placeholders / backgrounds
  const subtle = hex + "22" // 13% opacity hex shorthand
  const soft = hex + "33" // 20% opacity

  return /* css */ `
    :root, .dark {
      --brand:        ${hex};
      --brand-subtle: ${subtle};
      --brand-soft:   ${soft};
    }


    /* ── New Gradient Utility ────────────────────────────────── */
  .brand-gradient-active {
    /* Light Mode: White to Subtle Brand */
    background: linear-gradient(to right, #ffffff, var(--brand-subtle)) !important;
    color: var(--brand) !important;
  }

  .dark .brand-gradient-active {
    /* Dark Mode: Zinc-900 to Soft Brand (matching your 60% opacity look) */
    background: linear-gradient(to right, #18181b, var(--brand-soft)) !important;
    color: var(--brand) !important;
  }

  .brand-gradient-hero {
  /* Dynamic brand hex to a fixed dark emerald */
  background: linear-gradient(to bottom right, var(--brand), #022c22) !important;
}


/* Add this inside the return string of buildBrandCSS */
.brand-gradient-surface {
  /* Light Mode: Very subtle tint to a slightly deeper tint */
  background: linear-gradient(to bottom right, var(--brand-subtle), var(--brand-soft)) !important;
}

.dark .brand-gradient-surface {
  /* Dark Mode: Deepest brand tint (approx 10-15% visibility) */
  background: linear-gradient(to bottom right, #09090b, var(--brand-subtle)) !important;
}


    /* ── Backgrounds ─────────────────────────────────────────── */
    .brand-bg {
      background-color: var(--brand) !important;
    }

    /* ── Text ────────────────────────────────────────────────── */
    .brand-text {
      color: var(--brand) !important;
    }

    /* ── Border ──────────────────────────────────────────────── */
    .brand-border {
      border-color: var(--brand) !important;
    }

    /* ── Ring / outline (inputs, focus rings) ────────────────── */
    .brand-ring {
      outline-color: var(--brand) !important;
      --tw-ring-color: var(--brand) !important;
    }
    .brand-ring:focus,
    .brand-ring:focus-visible {
      outline: 2px solid var(--brand) !important;
      outline-offset: 2px;
    }

    /* ── Focus helper (wrap on inputs) ───────────────────────── */
    .brand-focus:focus,
    .brand-focus:focus-visible {
      outline: 2px solid var(--brand) !important;
      outline-offset: 2px;
      box-shadow: 0 0 0 3px var(--brand-soft);
    }

    /* ── SVG icons ───────────────────────────────────────────── */
    .brand-fill   { fill:   var(--brand) !important; }
    .brand-stroke { stroke: var(--brand) !important; }

    /* ── Icon via currentColor  (put on the wrapper or svg) ─── */
    .brand-icon {
      color: var(--brand) !important;
    }

    /* ── Primary UI element (button, badge bg) ───────────────── */
    .brand-ui {
      background-color: var(--brand)  !important;
      border-color:     var(--brand)  !important;
      color:            #ffffff       !important;
      transition: filter 150ms ease, box-shadow 150ms ease;
    }
    .brand-ui:hover:not(:disabled) {
      filter: brightness(1.1);
      box-shadow: 0 0 0 3px var(--brand-soft);
    }
    .brand-ui:active:not(:disabled) {
      filter: brightness(0.92);
    }
    .brand-ui:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    /* ── Ghost / outline variant ─────────────────────────────── */
    .brand-ui-ghost {
      background-color: transparent         !important;
      border: 1.5px solid var(--brand)      !important;
      color:  var(--brand)                  !important;
      transition: background-color 150ms ease, color 150ms ease;
    }
    .brand-ui-ghost:hover:not(:disabled) {
      background-color: var(--brand-soft)   !important;
    }

    /* ── Hover helpers (for nav items, rows, etc.) ───────────── */
    .brand-hover {
      transition: background-color 150ms ease, color 150ms ease;
    }
    .brand-hover:hover {
      background-color: var(--brand)  !important;
      color:            #ffffff       !important;
    }

    .brand-hover-text:hover {
      color: var(--brand) !important;
    }

    .brand-hover-border:hover {
      border-color: var(--brand) !important;
    }

    /* ── Active / selected state (sidebar nav links, tabs) ───── */
    .brand-active {
      background-color: var(--brand-soft)  !important;
      color:            var(--brand)       !important;
      border-left: 3px solid var(--brand);
    }

    /* ── Subtle background tint (cards, highlights) ──────────── */
    .brand-tint {
      background-color: var(--brand-subtle) !important;
    }

    /* ── Placeholder text ─────────────────────────────────────── */
    .brand-placeholder::placeholder {
      color: var(--brand-soft) !important;
    }

    /* ── Badge / pill ─────────────────────────────────────────── */
    .brand-badge {
      background-color: var(--brand)  !important;
      color:            #ffffff       !important;
      border-radius:    9999px;
      padding:          2px 10px;
      font-size:        0.75rem;
      font-weight:      500;
      display:          inline-block;
    }

    /* ── Link ─────────────────────────────────────────────────── */
    .brand-link {
      color:            var(--brand)  !important;
      text-underline-offset: 3px;
      transition:       opacity 120ms ease;
    }
    .brand-link:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    /* ── Progress / indicator bar ─────────────────────────────── */
    .brand-progress {
      background-color: var(--brand) !important;
    }

    /* ── Checkbox / radio accent ──────────────────────────────── */
    .brand-accent {
      accent-color: var(--brand) !important;
    }

    /* ── Divider / separator line ─────────────────────────────── */
    .brand-divider {
      border-color: var(--brand-soft) !important;
    }

    /* ── Scrollbar (webkit) ───────────────────────────────────── */
    .brand-scrollbar::-webkit-scrollbar-thumb {
      background-color: var(--brand-soft);
      border-radius: 9999px;
    }
    .brand-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: var(--brand);
    }
  `
}
