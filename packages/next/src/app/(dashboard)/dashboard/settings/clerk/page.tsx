import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { ClerkSettingsForm } from './clerk-settings-form'

export default async function ClerkSettingsPage() {
  const { orgId } = await auth()
  
  if (!orgId) {
    return <div>No organization selected</div>
  }

  const team = await prisma.team.findFirst({
    where: {
      members: {
        some: {
          userId: orgId,
          role: 'OWNER'
        }
      }
    },
    include: {
      clerkConfig: true
    }
  })

  if (!team) {
    return <div>Team not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Clerk Integration Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="prose max-w-none mb-8">
          <h2>Connect Your Clerk Organization</h2>
          <p>
            Connect Graham to your Clerk organization to automatically enrich and process new user signups.
            You'll need to provide your Clerk API keys and webhook secret.
          </p>
          
          <h3 className="mt-4">Required Steps:</h3>
          <ol>
            <li>Go to your Clerk Dashboard → API Keys</li>
            <li>Copy your Publishable Key and Secret Key</li>
            <li>Create a new webhook in Clerk Dashboard → Webhooks</li>
            <li>Set the webhook URL to: <code>{process.env.NEXT_PUBLIC_API_URL}/api/webhook/clerk</code></li>
            <li>Select the following events:
              <ul>
                <li>user.created</li>
                <li>organization.created</li>
                <li>organizationMembership.created</li>
              </ul>
            </li>
            <li>Copy the webhook signing secret</li>
          </ol>
        </div>

        <ClerkSettingsForm 
          teamId={team.id}
          initialData={team.clerkConfig || undefined}
        />
      </div>
    </div>
  )
} 