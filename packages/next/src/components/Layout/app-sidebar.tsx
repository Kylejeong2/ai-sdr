'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { OrganizationSwitcher } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Users,
  Settings,
  Mail,
  MessageSquare,
  CalendarDays,
  LayoutDashboard,
  FileText,
  Database,
  Inbox,
  UserPlus,
  Building2,
  Webhook
} from 'lucide-react'

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Leads',
    href: '/dashboard/leads',
    icon: UserPlus
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: Users
  },
  {
    title: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Mail
  },
  {
    title: 'Templates',
    href: '/dashboard/templates',
    icon: FileText
  },
  {
    title: 'Sequences',
    href: '/dashboard/sequences',
    icon: MessageSquare
  },
  {
    title: 'Calendar',
    href: '/dashboard/calendar',
    icon: CalendarDays
  },
  {
    title: 'Data',
    href: '/dashboard/data',
    icon: Database
  },
  {
    title: 'Inbox',
    href: '/dashboard/inbox',
    icon: Inbox
  },
  {
    title: 'Webhooks',
    href: '/dashboard/webhooks',
    icon: Webhook
  }
]

const settingsNavItems = [
  {
    title: 'Team',
    href: '/dashboard/settings/team',
    icon: Users
  },
  {
    title: 'API Keys',
    href: '/dashboard/api-keys',
    icon: Database
  },
  {
    title: 'Clerk',
    href: '/dashboard/settings/clerk',
    icon: Settings
  },
  {
    title: 'Organization Settings',
    href: '/dashboard/settings/organization',
    icon: Building2
  }
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-64">
      {/* Organization Switcher */}
      <div className="p-4 border-b border-gray-800">
        <OrganizationSwitcher 
          appearance={{
            baseTheme: undefined,
            elements: {
              rootBox: 'w-full',
              organizationSwitcherTrigger: 'w-full bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-white'
            }
          }}
        />
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Settings Navigation */}
      <div className="border-t border-gray-800 py-4">
        <div className="px-3 mb-2">
          <h2 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Settings
          </h2>
        </div>
        <nav className="space-y-1 px-3">
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}