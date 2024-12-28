import { auth } from '@clerk/nextjs/server'
import { prisma } from '@graham/db'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { CreateOrganization } from '@clerk/nextjs'
import { Users, Settings } from 'lucide-react'

export default async function OrganizationsPage() {
  const { orgId } = await auth()
  
  if (!orgId) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold mb-4">Join or Create an Organization</h2>
          <p className="text-muted-foreground mb-6">
            You need to be part of an organization to use Graham SDR.
          </p>
          <CreateOrganization />
        </Card>
      </div>
    )
  }

  const team = await prisma.team.findFirst({
    where: {
      members: {
        some: {
          userId: orgId
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
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Connect Clerk</h2>
          <p className="text-muted-foreground mb-6">
            You need to connect your Clerk instance to manage organizations.
          </p>
          <Button asChild>
            <a href="/dashboard/settings/clerk">
              <Settings className="mr-2 h-4 w-4" />
              Configure Clerk
            </a>
          </Button>
        </Card>
      </div>
    )
  }

  const { managedOrganizations } = team.clerkConfig

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <CreateOrganization />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managedOrganizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {org.users.length}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(org.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                    Active
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/dashboard/organizations/${org.id}`}>
                      View Details
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 