import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { UsersTable } from './users-table'

export default async function UsersPage() {
  const { orgId } = await auth()
  
  if (!orgId) {
    return <div>No organization selected</div>
  }

  const team = await prisma.team.findFirst({
    where: {
      members: {
        some: {
          userId: orgId,
          role: {
            in: ['OWNER', 'ADMIN']
          }
        }
      }
    },
    include: {
      clerkConfig: {
        include: {
          managedOrganizations: {
            include: {
              users: true
            }
          }
        }
      }
    }
  })

  if (!team?.clerkConfig) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p>No Clerk integration configured. Please set up Clerk in settings first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Users by Organization</h1>
      <UsersTable 
        organizations={team.clerkConfig.managedOrganizations.map(org => ({
          ...org,
          users: org.users.map(user => ({
            ...user,
            createdAt: user.createdAt.toISOString()
          }))
        }))} 
      />
    </div>
  )
} 