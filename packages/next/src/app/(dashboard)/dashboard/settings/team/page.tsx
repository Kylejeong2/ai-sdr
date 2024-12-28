'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import type { OrganizationMembershipResource, OrganizationInvitationResource } from '@clerk/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Users,
  MoreVertical,
  Shield,
  Mail,
  AlertCircle,
  XCircle
} from 'lucide-react'

const roleColors = {
  'org:admin': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'org:member': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'org:guest': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
} as const

export default function TeamSettingsPage() {
  const { organization, isLoaded } = useOrganization()
  const [memberships, setMemberships] = useState<OrganizationMembershipResource[]>([])
  const [pendingInvites, setPendingInvites] = useState<OrganizationInvitationResource[]>([])

  // Fetch memberships and invitations when organization loads
  useEffect(() => {
    if (organization) {
      organization.getMemberships().then(response => setMemberships(response.data))
      organization.getInvitations().then(response => setPendingInvites(response.data))
    }
  }, [organization])

  if (!isLoaded) {
    return (
      <div className="p-6">
        <Card className="p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded"></div>
                <div className="h-4 bg-gray-800 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">No Organization Selected</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Please select or create an organization to manage team settings.
          </p>
        </Card>
      </div>
    )
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await organization.updateMember({ userId: memberId, role: newRole as 'org:admin' | 'org:member' })
      toast.success('Member role updated successfully')
      // Refresh memberships
      const response = await organization.getMemberships()
      setMemberships(response.data)
    } catch (error) {
      console.error('Failed to update member role:', error)
      toast.error('Failed to update member role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await organization.removeMember(memberId)
      toast.success('Member removed successfully')
      // Refresh memberships
      const response = await organization.getMemberships()
      setMemberships(response.data)
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error('Failed to remove member')
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      const invitation = pendingInvites.find(inv => inv.id === invitationId)
      if (invitation) {
        await invitation.revoke()
        toast.success('Invitation revoked')
        // Refresh pending invites
        const response = await organization.getInvitations()
        setPendingInvites(response.data)
      }
    } catch (error) {
      console.error('Failed to revoke invitation:', error)
      toast.error('Failed to revoke invitation')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Team Settings</h1>
          <p className="text-gray-400">Manage your team members and their roles</p>
        </div>
      </div>

      {/* Team Members List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-medium text-white">Team Members</h2>
          </div>
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => {
                  const member = membership.publicUserData
                  return (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                            {member?.firstName?.[0] || member?.lastName?.[0] || member?.identifier[0]}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {member?.firstName} {member?.lastName}
                            </div>
                            <div className="text-sm text-gray-400">
                              {member?.identifier}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={roleColors[membership.role as keyof typeof roleColors]}
                        >
                          {membership.role === 'org:admin' ? 'Admin' : 
                           membership.role === 'org:member' ? 'Member' : 'Guest'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-400">
                          {new Date(membership.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(membership.id, 'org:admin')}
                              disabled={membership.role === 'org:admin'}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(membership.id, 'org:member')}
                              disabled={membership.role === 'org:member'}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(membership.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Mail className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-medium text-white">Pending Invitations</h2>
            </div>
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited On</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="font-medium text-white">
                          {invitation.emailAddress}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={roleColors[invitation.role as keyof typeof roleColors]}
                        >
                          {invitation.role === 'org:admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-400">
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 