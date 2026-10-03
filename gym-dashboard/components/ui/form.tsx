"use client"

// ─────────────────────────────────────────────────────────────────────────────
// Form – thin wrappers around react-hook-form + shadcn style
// Matches the @base-ui pattern used in the rest of the codebase.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from "react"
import {
  useFormContext,
  Controller,
  type FieldPath,
  type FieldValues,
  type ControllerProps,
} from "react-hook-form"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

// ── FormField (Controller wrapper) ───────────────────────────────────────────
function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return <Controller {...props} />
}

// ── FormItem ─────────────────────────────────────────────────────────────────
interface FormItemContextValue {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>({ id: "" })

function FormItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const id = React.useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-1.5", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

// ── FormLabel ────────────────────────────────────────────────────────────────
function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  const { id } = React.useContext(FormItemContext)
  return (
    <Label
      data-slot="form-label"
      htmlFor={id}
      className={cn(className)}
      {...props}
    />
  )
}

// ── FormControl ───────────────────────────────────────────────────────────────
function FormControl({
  ...props
}: React.ComponentProps<"div">) {
  const { id } = React.useContext(FormItemContext)
  return (
    <div
      data-slot="form-control"
      id={id}
      {...props}
    />
  )
}

// ── FormDescription ───────────────────────────────────────────────────────────
function FormDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

// ── FormMessage ───────────────────────────────────────────────────────────────
function FormMessage({
  className,
  children,
  name,
  ...props
}: React.ComponentProps<"p"> & { name?: string }) {
  let formCtx: ReturnType<typeof useFormContext> | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    formCtx = useFormContext()
  } catch {
    // No form context — use children directly
  }

  const error =
    name && formCtx?.formState?.errors
      ? (formCtx.formState.errors as Record<string, { message?: string }>)[name]
      : undefined

  const message = error?.message ?? (typeof children === "string" ? children : null)

  if (!message) return null

  return (
    <p
      data-slot="form-message"
      className={cn(
        "text-xs font-medium text-destructive",
        className,
      )}
      {...props}
    >
      {message}
    </p>
  )
}

// ── Form (just a fragment wrapper – use react-hook-form's <form>) ─────────────
function Form({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}
