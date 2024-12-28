"use client"

import { useEffect, useState } from "react"
import { useTeam } from "@/providers/team-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Mail, Users, BarChart } from "lucide-react"

interface Campaign {
  id: string
  name: string
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  leads: number
  sent: number
  opened: number
  replied: number
  createdAt: string
}

export default function CampaignsPage() {
  const { team } = useTeam()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCampaigns() {
      if (!team?.id) return

      try {
        const response = await fetch(`/api/campaigns?teamId=${team.id}`)
        if (!response.ok) throw new Error('Failed to load campaigns')
        
        const data = await response.json()
        setCampaigns(data)
      } catch (error) {
        console.error('Failed to load campaigns:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaigns()
  }, [team?.id])

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500'
      case 'PAUSED':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  if (isLoading) {
    return <div>Loading campaigns...</div>
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10">
              <Mail className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Active Campaigns</h3>
              <p className="text-2xl font-bold mt-1">
                {campaigns.filter(c => c.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <Users className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Leads</h3>
              <p className="text-2xl font-bold mt-1">
                {campaigns.reduce((acc, c) => acc + c.leads, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/10">
              <BarChart className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">Reply Rate</h3>
              <p className="text-2xl font-bold mt-1">
                {campaigns.reduce((acc, c) => acc + c.replied, 0) / campaigns.reduce((acc, c) => acc + c.sent, 0) * 100}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Opened</TableHead>
              <TableHead>Replied</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell>{campaign.leads}</TableCell>
                <TableCell>{campaign.sent}</TableCell>
                <TableCell>{campaign.opened}</TableCell>
                <TableCell>{campaign.replied}</TableCell>
                <TableCell>{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
} 