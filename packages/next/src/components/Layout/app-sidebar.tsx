'use client'

import { ChevronDown, CreditCard, Home, Search, Settings, User2, BarChart2, PhoneCall, LineChart, Users, Mail, Settings2, HelpCircle, Plus } from "lucide-react"
import { UserButton, useAuth, useUser } from "@clerk/nextjs"
import { useRouter, usePathname } from "next/navigation"

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button"

// Menu items for main navigation
const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Leads",
    href: "/dashboard/leads",
    icon: Users,
  },
  {
    title: "Campaigns",
    href: "/dashboard/campaigns",
    icon: Mail,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart2,
  },
]

// Menu items for settings
const settingsNavItems = [
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings2,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User2,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
]

export function AppSidebar() {
  const { userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/dashboard" className="flex items-center gap-2">
                <span className="text-lg font-bold">Graham</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={pathname === item.href ? "bg-accent" : ""}
                  >
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={pathname === item.href ? "bg-accent" : ""}
                  >
                    <a href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                New Campaign
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User2 className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>{user?.emailAddresses[0]?.emailAddress ?? 'Guest'}</span>
                  <span className="text-xs text-muted-foreground">Pro Plan</span>
                </div>
              </div>
              <UserButton afterSignOutUrl="/sign-in" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}