// app/settings/page.tsx
"use client"

import { Suspense } from "react"
import { SettingsPage } from "@/app/settings/SettingsPage"

export default function Page() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  )
}
