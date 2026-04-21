"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  SquaresFourIcon,
  ListIcon,
  ChartBarIcon,
  FolderIcon,
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  GearIcon,
  QuestionIcon,
  MagnifyingGlassIcon,
  DatabaseIcon,
  ChartLineIcon,
  FileIcon,
  CommandIcon,
  ImageSquareIcon,
  AddressBookIcon,
  SneakerMoveIcon,
  UserCircleCheckIcon,
  BarbellIcon,
  IdentificationCardIcon,
  StrategyIcon,
} from "@phosphor-icons/react"
import { ThemeToggle } from "@/common/mode/theme-toggle"
import {
  BellIcon,
  CalendarIcon,
  CreditCardIcon,
  MessageSquareIcon,
} from "lucide-react"
import NotificationPanel from "@/common/notification/NotificationPanel"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  // WEB
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: <SquaresFourIcon />,
    },
    {
      title: "Landing Page",
      url: "/hero",
      icon: <ListIcon />,
    },
    {
      title: "About Section",
      url: "/about",
      icon: <ChartBarIcon />,
    },
    {
      title: "Services",
      url: "/services",
      icon: <FolderIcon />,
    },
    {
      title: "Offerings",
      url: "/offerings  ",
      icon: <SneakerMoveIcon size={32} />,
    },
    {
      title: "Gallery",
      url: "/gallery",
      icon: <ImageSquareIcon />,
    },
    {
      title: "Contact",
      url: "/contact",
      icon: <AddressBookIcon />,
    },
  ],

  // Finance & Plans
  navFinance: [
    {
      title: "Memberships",
      url: "/memberships",
      icon: <IdentificationCardIcon size={32} />,
    },
    {
      title: "Payments",
      url: "/Payments",
      icon: <CreditCardIcon size={32} />,
    },
  ],

  // Scheduling
  navSchedule: [
    {
      title: "Class Schedule",
      url: "/schedule",
      icon: <CalendarIcon size={32} />,
    },
    {
      title: "Workout Plans",
      url: "/workouts",
      icon: <StrategyIcon size={40} />,
    },
  ],

  // Management
  navManagement: [
    {
      title: "Clients",
      url: "/clients",
      icon: <UsersIcon size={32} />,
    },
    {
      title: "Trainers",
      url: "/trainers",
      icon: <UserCircleCheckIcon size={32} />,
    },
    {
      title: "Equipments",
      url: "/inventory",
      icon: <BarbellIcon size={32} />,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <GearIcon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <QuestionIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <MagnifyingGlassIcon />,
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">Acme Inc.</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center justify-end">
          <ThemeToggle />
          <NotificationPanel align="right" />
          {/* <BellIcon size={18} /> */}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} label="Web" />
        <NavMain items={data.navManagement} label="Management" />
        <NavMain items={data.navFinance} label="Finance & Plans" />
        <NavMain items={data.navSchedule} label="Scheduling" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
