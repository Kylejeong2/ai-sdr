'use client'

import { useOrganization, OrganizationProfile } from '@clerk/nextjs'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function InvitePage() {
  const { organization, isLoaded } = useOrganization()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 border-0 bg-black/40 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 text-yellow-500 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-medium">Loading...</h3>
          </div>
        </Card>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 border-0 bg-black/40 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 text-yellow-500 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-medium">No Organization Selected</h3>
          </div>
          <p className="text-gray-400 mb-6">
            Please select or create an organization to manage invites.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Organization Settings</h2>
          <p className="text-muted-foreground">
            Manage your organization settings (Invite members, etc.)
          </p>
        </div>
      </div>

      <Card className="backdrop-blur-xl border-gray-800/50 w-full">
        <div className="w-full">
          <OrganizationProfile
            path="/dashboard/settings/organization"
            routing="path"
          />
        </div>
      </Card>
    </div>
  )
}