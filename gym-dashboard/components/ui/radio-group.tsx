"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// RadioGroup – accessible, keyboard-navigable radio group
// Built without Radix; uses aria-checked + keyboard nav manually.
// ─────────────────────────────────────────────────────────────────────────────

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
  name: string
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({
  value: "",
  onValueChange: () => {},
  name: "",
})

interface RadioGroupProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
  children?: React.ReactNode
  name?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  id?: string
}

function RadioGroup({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  className,
  children,
  name,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  id,
}: RadioGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue)
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const uniqueName = React.useId()
  const groupName = name ?? uniqueName

  const handleChange = React.useCallback(
    (v: string) => {
      if (!isControlled) setUncontrolledValue(v)
      onValueChange?.(v)
    },
    [isControlled, onValueChange],
  )

  return (
    <RadioGroupContext.Provider
      value={{ value, onValueChange: handleChange, name: groupName }}
    >
      <div
        role="radiogroup"
        data-slot="radio-group"
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn("grid gap-3", className)}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RadioGroupItem
// ─────────────────────────────────────────────────────────────────────────────
interface RadioGroupItemProps extends React.ComponentProps<"button"> {
  value: string
  id?: string
  "aria-label"?: string
}

function RadioGroupItem({
  value,
  id,
  className,
  "aria-label": ariaLabel,
  ...props
}: RadioGroupItemProps) {
  const ctx = React.useContext(RadioGroupContext)
  const checked = ctx.value === value
  const ownId = React.useId()
  const resolvedId = id ?? ownId

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      ctx.onValueChange(value)
    }
  }

  return (
    <button
      type="button"
      role="radio"
      id={resolvedId}
      data-slot="radio-group-item"
      aria-checked={checked}
      aria-label={ariaLabel}
      tabIndex={checked ? 0 : -1}
      onClick={() => ctx.onValueChange(value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "aspect-square size-4 shrink-0 rounded-full border border-input shadow-xs outline-none transition-all",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[checked=true]:border-primary aria-[checked=true]:bg-primary aria-[checked=true]:text-primary-foreground",
        "relative flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {checked && (
        <span className="block size-1.5 rounded-full bg-background" />
      )}
    </button>
  )
}

export { RadioGroup, RadioGroupItem }
