"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useSettingsApi } from "@/hooks/useSettingsApi"
import { AppearanceSettings } from "./AppearanceSettings"
import { GymProfileSettings } from "./GymProfileSettings"
import { BillingSettings } from "./BillingSettings"
import { NotificationsSettings } from "./NotificationsSettings"
import { SecuritySettings } from "./SecuritySettings"
import {
  PaletteIcon,
  BuildingIcon,
  CreditCardIcon,
  BellIcon,
  ShieldIcon,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Tab configuration
// ─────────────────────────────────────────────────────────────────────────────
type TabValue = "appearance" | "gym" | "billing" | "notifications" | "security"

const TABS: {
  value: TabValue
  label: string
  icon: React.ElementType
  shortLabel: string
}[] = [
  {
    value: "appearance",
    label: "Appearance",
    shortLabel: "Look",
    icon: PaletteIcon,
  },
  {
    value: "gym",
    label: "Gym profile",
    shortLabel: "Gym",
    icon: BuildingIcon,
  },
  {
    value: "billing",
    label: "Membership & billing",
    shortLabel: "Billing",
    icon: CreditCardIcon,
  },
  {
    value: "notifications",
    label: "Notifications",
    shortLabel: "Alerts",
    icon: BellIcon,
  },
  {
    value: "security",
    label: "Security",
    shortLabel: "Security",
    icon: ShieldIcon,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SettingsPage
// ─────────────────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as TabValue | null) ?? "appearance"

  const {
    gym,
    billing,
    notifications,
    isLoading,
    error,
    saveGym,
    uploadLogoFile,
    saveBilling,
    saveNotifications,
    setGym,
    setBilling,
    setNotifications,
    reload,
  } = useSettingsApi()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="mx-auto flex w-full flex-1 flex-col py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-base font-semibold text-foreground">Settings</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your gym, billing, notifications, and account preferences.
        </p>
      </div>
      <Separator className="mb-6" />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col gap-6"
      >
        {/* Tab list — horizontally scrollable on mobile */}
        <ScrollArea className="w-full" style={{ scrollbarWidth: "none" }}>
          <TabsList
            variant="default"
            className="h-12! w-full shrink-0 flex-nowrap items-end justify-start gap-0 rounded-none border-b border-border bg-transparent p-0"
          >
            {TABS.map(({ value, label, icon: Icon, shortLabel }) => (
              <TabsTrigger
                key={value}
                value={value}
                id={`settings-tab-${value}`}
                className="flex h-auto shrink-0 cursor-pointer items-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs whitespace-nowrap transition-colors hover:text-foreground data-active:border-primary data-active:bg-transparent data-active:text-foreground"
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="sm:hidden">{shortLabel}</span>
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {/* Tab content panels */}
        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="gym">
          <GymProfileSettings
            gym={gym}
            isLoading={isLoading}
            error={error}
            saveGym={saveGym}
            uploadLogoFile={uploadLogoFile}
            reload={reload}
          />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings
            billing={billing}
            isLoading={isLoading}
            error={error}
            saveBilling={saveBilling}
            reload={reload}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSettings
            notifications={notifications}
            isLoading={isLoading}
            error={error}
            saveNotifications={saveNotifications}
            reload={reload}
          />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
