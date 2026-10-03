"use client"

import { useTheme } from "next-themes"
import {
  useBrandColor,
  PRESET_SWATCHES,
  type SwatchId,
  contrastForeground,
} from "@/hooks/useBrandColor"
import { SettingsCard } from "./SettingsCard"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
import { cn } from "@/lib/utils"
import { CheckIcon, SunIcon, MoonIcon, MonitorIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTheme as useNextTheme } from "next-themes"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type ThemeMode = "light" | "dark" | "system"

const THEME_OPTIONS: {
  value: ThemeMode
  label: string
  icon: React.ElementType
  description: string
}[] = [
  {
    value: "light",
    label: "Light",
    icon: SunIcon,
    description: "Always use light mode",
  },
  {
    value: "dark",
    label: "Dark",
    icon: MoonIcon,
    description: "Always use dark mode",
  },
  {
    value: "system",
    label: "System",
    icon: MonitorIcon,
    description: "Follow your OS preference",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// AppearanceSettings
// ─────────────────────────────────────────────────────────────────────────────
export function AppearanceSettings() {
  const { theme, setTheme } = useNextTheme()
  const { hex, activeId, setPreset, setCustomHex, reset } = useBrandColor()

  const currentTheme = (theme as ThemeMode | undefined) ?? "system"

  return (
    <div className="flex flex-col gap-5">
      {/* ── Display Mode ─────────────────────────────────────────── */}
      <SettingsCard
        id="display-mode-card"
        title="Display mode"
        description="Choose how the admin panel looks. Changes apply instantly."
      >
        <RadioGroup
          value={currentTheme}
          onValueChange={(v) => setTheme(v as ThemeMode)}
          aria-label="Display mode"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {THEME_OPTIONS.map(({ value, label, icon: Icon, description }) => {
            const isActive = currentTheme === value
            return (
              <label
                key={value}
                htmlFor={`theme-${value}`}
                className={cn(
                  "relative flex cursor-pointer flex-col items-start gap-2 rounded-none border p-4 transition-all",
                  "focus-within:ring-2 focus-within:ring-ring hover:bg-accent/50",
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-none",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <RadioGroupItem
                    value={value}
                    id={`theme-${value}`}
                    aria-label={label}
                    className="sr-only"
                  />
                  {isActive && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-2.5" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </label>
            )
          })}
        </RadioGroup>
      </SettingsCard>

      {/* ── Color Theme ──────────────────────────────────────────── */}
      <SettingsCard
        id="color-theme-card"
        title="Color theme"
        description="Pick an accent color for buttons, highlights, and interactive elements."
        footer={
          <AlertDialog>
            <AlertDialogTrigger>
              <Button
                // variant="outline"
                size="lg"
                id="reset-brand-btn"
                className="bg-brand"
              >
                Reset to default
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset brand color?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your custom color and restore the default
                  Ember accent. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={reset} id="confirm-reset-brand-btn">
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Preset swatches */}
          <div
            role="radiogroup"
            aria-label="Brand color presets"
            className="flex flex-wrap gap-2"
          >
            {PRESET_SWATCHES.map((swatch) => {
              const isActive = activeId === swatch.id
              const fg = contrastForeground(swatch.hex)
              const isFgWhite = fg.includes("0.985")
              return (
                <button
                  key={swatch.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  aria-label={`${swatch.label} (${swatch.hex})`}
                  id={`swatch-${swatch.id}`}
                  onClick={() => setPreset(swatch.id as SwatchId)}
                  className={cn(
                    "relative flex h-8 min-w-16 cursor-pointer items-center justify-center gap-1.5 rounded-none px-3 text-xs font-medium transition-all",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none",
                    isActive
                      ? "scale-105 shadow-sm ring-2 ring-foreground/40 ring-offset-1"
                      : "opacity-85 hover:scale-105 hover:opacity-100"
                  )}
                  style={{
                    backgroundColor: swatch.hex,
                    color: isFgWhite ? "#ffffff" : "#111111",
                  }}
                >
                  {isActive && <CheckIcon className="size-3 shrink-0" />}
                  <span>{swatch.label}</span>
                </button>
              )
            })}
          </div>

          <Separator />

          {/* Custom color picker */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="custom-color-picker"
              className="text-xs font-medium"
            >
              Custom color
            </Label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  id="custom-color-picker"
                  aria-label="Pick a custom brand color"
                  value={hex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className={cn(
                    "h-9 w-12 cursor-pointer rounded-none border border-input p-0.5",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    activeId === "custom"
                      ? "ring-2 ring-ring ring-offset-1"
                      : ""
                  )}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-xs text-foreground">
                  {hex.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {activeId === "custom"
                    ? "Custom color active"
                    : "Click to pick a custom color"}
                </span>
              </div>
              {activeId === "custom" && (
                <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-2.5" />
                </span>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="mt-1 rounded-none border border-border bg-card px-4 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Preview
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-none px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: hex,
                  color: contrastForeground(hex).includes("0.985")
                    ? "#ffffff"
                    : "#111111",
                }}
              >
                Primary button
              </button>
              <button
                type="button"
                className="rounded-none border px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: hex,
                  color: hex,
                  backgroundColor: "transparent",
                }}
              >
                Outline button
              </button>
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: hex + "22",
                  color: hex,
                }}
              >
                Badge
              </span>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  )
}
