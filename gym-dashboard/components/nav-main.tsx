"use client"

import { usePathname } from "next/navigation" // Import the hook
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { PlusCircleIcon, EnvelopeIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
  label,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
  label?: string
}) {
  const pathname = usePathname() // Get current path

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            // Check if the current path matches the item URL
            // Works for exact matches and sub-routes
            const isActive =
              pathname === item.url || pathname?.startsWith(`${item.url}/`)

            return (
              <Link href={item.url} key={item.title}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={cn(
                      "cursor-pointer text-sm transition-all duration-300",
                      isActive && [
                        // This single class now handles the gradient and dark mode logic
                        "brand-gradient-active",
                        // Use the brand-border utility for the active state indicator
                        "brand-border",
                      ]
                    )}
                    tooltip={item.title}
                    isActive={isActive} // shadcn/ui sidebar handles the styling via this prop
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
