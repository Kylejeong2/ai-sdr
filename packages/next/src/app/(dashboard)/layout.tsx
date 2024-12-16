'use client';

import { UserButton } from "@clerk/nextjs"
import { DashboardNav } from "@/components/dashboard-nav"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:block lg:w-64">
        <ScrollArea className="h-full">
          <DashboardNav />
        </ScrollArea>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="px-2 lg:hidden"
            size="icon"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <ScrollArea className="h-full">
            <DashboardNav />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main content */}
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
    </div>
  )
} 