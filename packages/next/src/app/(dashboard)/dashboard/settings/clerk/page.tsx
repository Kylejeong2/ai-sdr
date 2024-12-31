import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { ClerkSettingsForm } from './clerk-settings-form'
import { KeyRound, Webhook } from 'lucide-react'

export default async function ClerkSettingsPage() {
  const session = await auth()
  const orgId = session?.orgId
  
  if (!orgId) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-500">Please select an organization to configure Clerk settings.</p>
        </div>
      </div>
    )
  }

  // Fetch existing config
  const config = await prisma.clerkConfig.findUnique({
    where: { id: orgId }
  })

  // Transform Prisma data to match form data structure
  const initialData = config ? {
    id: config.id,
    publishableKey: config.publishableKey,
    secretKey: config.secretKey,
    webhookSecret: config.webhookSecret,
    organizationId: config.organizationId,
    isActive: config.isActive,
    environment: config.environment || undefined,
    webhookEvents: config.webhookEvents || undefined,
    lastWebhookReceived: config.lastWebhookReceived || undefined,
    webhookStatus: config.webhookStatus as 'healthy' | 'error' | undefined
  } : undefined

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <KeyRound className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Clerk Settings</h2>
            <p className="text-sm text-gray-400">
              Configure your Clerk integration settings for authentication and user management.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px,1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
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
                <span>Set the webhook URL to: <code className="px-2 py-0.5 bg-gray-800 rounded text-xs">{process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/clerk</code></span>
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

        <div className="rounded-lg border bg-card p-6">
          <ClerkSettingsForm 
            teamId={orgId} 
            initialData={initialData}
          />
        </div>
      </div>
    </div>
  )
} 