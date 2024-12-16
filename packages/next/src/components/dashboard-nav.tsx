'use client';

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Mail,
  Settings,
  LineChart,
  BarChart3,
  UserPlus,
  MessageSquare,
  PlusCircle,
  CreditCard,
  Settings2,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  title: string
  href: string
  icon: any
  variant?: "default" | "ghost"
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
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
    icon: BarChart3,
  },
]

const settingsNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings2,
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

interface NavProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[]
}

function Nav({ items, className, ...props }: NavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("grid items-start gap-2", className)} {...props}>
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <Link
            key={index}
            href={item.href}
          >
            <span
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent" : "transparent",
                item.variant === "ghost" ? "hover:bg-transparent hover:text-accent-foreground" : ""
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export function DashboardNav() {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold">GrahamSDR</span>
        </Link>
      </div>
      <div className="flex-1 space-y-6">
        <div className="space-y-2">
          <h2 className="px-4 text-lg font-semibold tracking-tight">Overview</h2>
          <Nav items={mainNavItems} />
        </div>
        <div className="space-y-2">
          <h2 className="px-4 text-lg font-semibold tracking-tight">Settings</h2>
          <Nav items={settingsNavItems} />
        </div>
      </div>
      <div className="mt-auto">
        <Button variant="outline" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>
    </div>
  )
} 