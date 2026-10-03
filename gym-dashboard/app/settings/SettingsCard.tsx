"use client"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// ─────────────────────────────────────────────────────────────────────────────
// SettingsCard — wraps a Card with a consistent header + optional footer slot
// ─────────────────────────────────────────────────────────────────────────────
interface SettingsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  id?: string
}

export function SettingsCard({
  title,
  description,
  children,
  footer,
  className,
  id,
}: SettingsCardProps) {
  return (
    <Card id={id} className={cn("gap-0 py-0", className)}>
      <CardHeader className="border-b border-border/60 px-5 pt-5 pb-4">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-5 py-4">{children}</CardContent>
      {footer && (
        <>
          <Separator />
          <div className="flex items-center justify-end gap-2 px-5 py-3">
            {footer}
          </div>
        </>
      )}
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FormRow — label + control in a consistent two-column layout
// ─────────────────────────────────────────────────────────────────────────────
interface FormRowProps {
  label: string
  description?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
  /** When true, stacks label above control instead of side-by-side */
  stacked?: boolean
}

export function FormRow({
  label,
  description,
  htmlFor,
  children,
  className,
  stacked = false,
}: FormRowProps) {
  return (
    <div
      className={cn(
        "flex gap-4 py-3",
        stacked
          ? "flex-col items-start"
          : "flex-col sm:flex-row sm:items-start",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-0.5",
          stacked ? "" : "sm:w-64 sm:shrink-0"
        )}
      >
        <label
          htmlFor={htmlFor}
          className="cursor-pointer text-xs leading-none font-medium"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className={cn("min-w-0 flex-1", stacked ? "w-full" : "")}>
        {children}
      </div>
    </div>
  )
}
