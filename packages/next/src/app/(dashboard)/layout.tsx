'use client';

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
          <main className="flex-1">
            <div className="container mx-auto py-8 px-4 lg:px-8">{children}</div>
          </main>
        </div>
      </SidebarLayout>
    </div>
  )
} 