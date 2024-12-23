"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/overview"
import { RecentLeads } from "@/components/recent-leads"
import { Button } from "@/components/ui/button"
import { LineChart, Mail, Plus, Users, TrendingUp } from "lucide-react"
import { sdrApi, type Lead } from "@/lib/api"

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const leadsData = await sdrApi.getLeads()
        setLeads(leadsData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = {
    totalLeads: leads.length,
    activeCampaigns: leads.filter(l => l.emails?.some(e => e.status === 'QUEUED')).length,
    responseRate: leads.filter(l => l.emails?.some(e => e.status === 'REPLIED')).length / (leads.length || 1) * 100,
    conversionRate: leads.filter(l => l.status === 'CONVERTED').length / (leads.length || 1) * 100
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  const getNewLeadsCount = () => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    return leads.filter(l => new Date(l.createdAt) > lastMonth).length
  }

  const getActiveCampaignsThisWeek = () => {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    return leads.filter(l => 
      l.emails?.some(e => new Date(e.createdAt) > lastWeek && e.status === 'QUEUED')
    ).length
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              +{getNewLeadsCount()} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Campaigns
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {getActiveCampaignsThisWeek()} campaigns this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Response Rate
            </CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.responseRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +{((leads.filter(l => {
                const lastMonth = new Date()
                lastMonth.setMonth(lastMonth.getMonth() - 1)
                return new Date(l.createdAt) > lastMonth && l.emails?.some(e => e.status === 'REPLIED')
              }).length / (leads.filter(l => {
                const lastMonth = new Date()
                lastMonth.setMonth(lastMonth.getMonth() - 1)
                return new Date(l.createdAt) > lastMonth
              }).length || 1) * 100) - stats.responseRate).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.conversionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +{((leads.filter(l => {
                const lastMonth = new Date()
                lastMonth.setMonth(lastMonth.getMonth() - 1)
                return new Date(l.createdAt) > lastMonth && l.status === 'CONVERTED'
              }).length / (leads.filter(l => {
                const lastMonth = new Date()
                lastMonth.setMonth(lastMonth.getMonth() - 1)
                return new Date(l.createdAt) > lastMonth
              }).length || 1) * 100) - stats.conversionRate).toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={leads} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentLeads leads={leads.slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 