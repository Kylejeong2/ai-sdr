import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { ClerkSettingsForm } from './clerk-settings-form'
import { AlertCircle, KeyRound, Webhook } from 'lucide-react'

export default async function ClerkSettingsPage() {
  const { userId, orgId } = await auth()
  
  if (!userId || !orgId) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="p-6 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-lg shadow-xl">
          <div className="flex items-center gap-3 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">No organization selected</p>
          </div>
        </div>
      </div>
    )
  }

  const team = await prisma.team.findFirst({
    where: {
      id: orgId,
      members: {
        some: {
          userId: userId,
          role: 'OWNER'
        }
      }
    },
    include: {
      clerkConfig: true
    }
  })

  if (!team) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-3 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              Team not found. Make sure you are logged in as an owner of this organization.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <KeyRound className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Clerk Integration</h1>
          <p className="text-sm text-gray-400">Connect your Clerk organization to enable user management</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-[300px,1fr]">
        <div className="space-y-6">
          <div className="p-6 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Webhook className="h-5 w-5 text-purple-400" />
              <h3 className="font-medium">Setup Guide</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="flex-none w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">1</span>
                <span>Go to your Clerk Dashboard → API Keys</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-none w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">2</span>
                <span>Copy your Publishable Key and Secret Key</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-none w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">3</span>
                <span>Create a new webhook in Clerk Dashboard → Webhooks</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-none w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">4</span>
                <span>Set the webhook URL to: <code className="px-2 py-0.5 bg-gray-800 rounded text-xs">{process.env.NEXT_PUBLIC_API_URL}/api/webhook/clerk</code></span>
              </li>
              <li className="flex gap-2">
                <span className="flex-none w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">5</span>
                <div>
                  <p>Enable these webhook events:</p>
                  <ul className="mt-2 ml-2 space-y-1 text-xs">
                    <li>• user.created</li>
                    <li>• organization.created</li>
                    <li>• organizationMembership.created</li>
                  </ul>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="flex-none w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-xs">6</span>
                <span>Copy the webhook signing secret</span>
              </li>
            </ol>
          </div>
        </div>

        <div className="p-6 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-lg">
          <ClerkSettingsForm 
            teamId={team.id}
            initialData={team.clerkConfig ? {
              id: team.clerkConfig.id,
              publishableKey: team.clerkConfig.publishableKey,
              secretKey: team.clerkConfig.secretKey,
              webhookSecret: team.clerkConfig.webhookSecret,
              organizationId: team.clerkConfig.organizationId,
              isActive: team.clerkConfig.isActive,
              environment: team.clerkConfig.environment || undefined,
              webhookEvents: team.clerkConfig.webhookEvents || undefined,
              lastWebhookReceived: team.clerkConfig.lastWebhookReceived || undefined,
              webhookStatus: (team.clerkConfig.webhookStatus as 'healthy' | 'error' | undefined) || undefined
            } : undefined}
          />
        </div>
      </div>
    </div>
  )
} 