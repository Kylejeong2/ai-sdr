'use client';

import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import SidebarLayout from "@/components/Layout/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarLayout>
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-8">
            <div className="flex flex-1 items-center justify-end">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </div>
          </header>
          <main className="flex-1">
            <div className="container mx-auto py-8 px-4 lg:px-8">{children}</div>
          </main>
        </div>
      </SidebarLayout>
    </div>
  )
} 