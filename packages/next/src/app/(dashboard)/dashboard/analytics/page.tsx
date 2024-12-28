"use client"

import { useEffect, useState } from "react"
import { useTeam } from "@/providers/team-provider"
import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts"

interface AnalyticsData {
  emailsSent: number
  emailsOpened: number
  emailsClicked: number
  emailsReplied: number
  dailyStats: {
    date: string
    sent: number
    opened: number
    clicked: number
    replied: number
  }[]
}

export default function AnalyticsPage() {
  const { team } = useTeam()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      if (!team?.id) return

      try {
        const response = await fetch(`/api/analytics?teamId=${team.id}`)
        if (!response.ok) throw new Error('Failed to load analytics')
        
        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [team?.id])

  if (isLoading) {
    return <div>Loading analytics...</div>
  }

  if (!data) {
    return <div>No analytics data available</div>
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Analytics</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-400">Emails Sent</h3>
          <p className="text-2xl font-bold mt-2">{data.emailsSent}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-400">Open Rate</h3>
          <p className="text-2xl font-bold mt-2">
            {((data.emailsOpened / data.emailsSent) * 100).toFixed(1)}%
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-400">Click Rate</h3>
          <p className="text-2xl font-bold mt-2">
            {((data.emailsClicked / data.emailsSent) * 100).toFixed(1)}%
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-400">Reply Rate</h3>
          <p className="text-2xl font-bold mt-2">
            {((data.emailsReplied / data.emailsSent) * 100).toFixed(1)}%
          </p>
        </Card>
      </div>

      {/* Daily Stats Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Performance</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sent" fill="#4F46E5" name="Sent" />
              <Bar dataKey="opened" fill="#10B981" name="Opened" />
              <Bar dataKey="clicked" fill="#F59E0B" name="Clicked" />
              <Bar dataKey="replied" fill="#EC4899" name="Replied" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
} 