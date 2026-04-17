 
"use client"

import { usePathname } from "next/navigation" // Import the hook
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { PlusCircleIcon, EnvelopeIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname() // Get current path

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <PlusCircleIcon />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <EnvelopeIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu> */}
        <SidebarMenu>
          {items.map((item) => {
            // Check if the current path matches the item URL
            // Works for exact matches and sub-routes
            const isActive = pathname === item.url || pathname?.startsWith(`${item.url}/`)

            return (
              <Link href={item.url} key={item.title}>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                className={cn(
                      "transition-all duration-300  ",
                      isActive && [
                        // Light Mode: White to Green gradient
                        "bg-gradient-to-r from-white to-green-100 text-green-700",
                        // Dark Mode: Dark (zinc-900) to Green gradient
                        "dark:bg-gradient-to-r dark:from-zinc-900 dark:to-green-600/60 dark:text-green-400",
                        // Border to emphasize the active state
                      
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
