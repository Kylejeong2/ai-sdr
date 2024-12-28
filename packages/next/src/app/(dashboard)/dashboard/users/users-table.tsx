'use client'

import { DataTable } from '@/components/ui/data-table'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  createdAt: string
}

interface Organization {
  id: string
  name: string
  users: User[]
}

interface UsersTableProps {
  organizations: Organization[]
}

export function UsersTable({ organizations }: UsersTableProps) {
  if (!organizations.length) {
    return (
      <Card className="p-6">
        <p>No organizations found.</p>
      </Card>
    )
  }

  return (
    <Tabs defaultValue={organizations[0]?.id}>
      <TabsList>
        {organizations.map(org => (
          <TabsTrigger key={org.id} value={org.id}>
            {org.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {organizations.map(org => (
        <TabsContent key={org.id} value={org.id}>
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">{org.name} Users</h2>
            
            <DataTable
              columns={[
                {
                  accessorKey: 'email',
                  header: 'Email'
                },
                {
                  accessorKey: 'firstName',
                  header: 'First Name'
                },
                {
                  accessorKey: 'lastName',
                  header: 'Last Name'
                },
                {
                  accessorKey: 'status',
                  header: 'Status'
                },
                {
                  accessorKey: 'createdAt',
                  header: 'Signed Up',
                  cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString()
                }
              ]}
              data={org.users}
            />
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
} 