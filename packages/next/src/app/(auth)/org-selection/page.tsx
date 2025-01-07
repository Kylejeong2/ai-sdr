'use client'

import { useRouter } from 'next/navigation'
import { useOrganizationList, CreateOrganization } from '@clerk/nextjs'
import type { 
  UserOrganizationInvitationResource,
} from '@clerk/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  AlertCircle,
  Building2, 
  Sparkles,
  Mail,
  Users
} from 'lucide-react'

export default function OrgSelectionPage() {
  const router = useRouter()
  const { 
    userInvitations,
    isLoaded 
  } = useOrganizationList()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black to-gray-900">
        <Card className="p-8 border-0 bg-black/40 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 text-yellow-500 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="text-lg font-medium">Organizations Not Available</h3>
          </div>
          <p className="text-gray-400 mb-6">
            Organizations feature is not enabled. Please contact your administrator.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
          >
            Return to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black to-gray-900">
      <div className="p-8 w-full max-w-6xl space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Get Started with Graham SDR</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            Create Your Organization
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Set up your workspace and start managing your team efficiently
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="group relative overflow-hidden border border-gray-800/50 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02] hover:-translate-y-1 w-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out" />
            <div className="relative p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 rounded-full bg-blue-500/20 ring-2 ring-blue-500/40 shadow-xl transform group-hover:scale-110 transition-all duration-300">
                  <Building2 className="h-8 w-8 text-blue-400" />
                </div>
                <div className="w-full">
                  <h3 className="text-2xl font-semibold text-white mb-3 transform group-hover:translate-y-[-2px] transition-all duration-300">Create New Organization</h3>
                  <p className="text-gray-400 mb-6 transform group-hover:translate-y-[-2px] transition-all duration-300">
                    Start fresh with a new workspace for your team
                  </p>
                  <CreateOrganization 
                    afterCreateOrganizationUrl="/api/organization/create"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="group relative overflow-hidden border border-gray-800/50 bg-black/40 backdrop-blur-xl transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 rounded-full bg-purple-500/20 ring-2 ring-purple-500/40 shadow-xl">
                  <Mail className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Waiting for an Invite?</h3>
                  <p className="text-gray-400">
                    To join an existing organization, you'll need an invitation from a team admin. They can invite you using your email address.
                  </p>
                  {userInvitations?.data?.length === 0 && (
                    <div className="mt-6 p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                      <p className="text-sm text-gray-400">
                        No pending invitations. Ask your team admin to send you an invitation to join their organization.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {isLoaded && userInvitations?.data?.length > 0 && (
          <div className="pt-4">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Pending Invitations
            </h2>
            <div className="grid gap-4">
              {userInvitations.data.map((invitation: UserOrganizationInvitationResource) => (
                <Card 
                  key={invitation.id}
                  className="p-6 border border-gray-800/50 bg-black/40 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-500/20 ring-1 ring-blue-500/40">
                        <Building2 className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white text-lg">{invitation.id}</h3>
                        <p className="text-gray-400">
                          Invited by {invitation.emailAddress || 'Team Admin'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={async () => {
                          try {
                            await invitation.accept()
                            toast.success('Invitation accepted')
                            router.push('/onboarding')
                          } catch (error) {
                            console.error('Failed to accept invitation:', error)
                            toast.error('Failed to accept invitation')
                          }
                        }}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-300"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            // @ts-expect-error - Clerk's types are not up to date
                            await invitation.reject()
                            toast.success('Invitation declined')
                          } catch (error) {
                            console.error('Failed to reject invitation:', error)
                            toast.error('Failed to reject invitation')
                          }
                        }}
                        className="border-gray-800 text-gray-300 hover:bg-red-500/20 hover:text-white hover:border-red-500/50 transition-all duration-300"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 