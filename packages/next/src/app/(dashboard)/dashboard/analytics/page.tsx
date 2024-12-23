"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, PieChart } from "lucide-react"
import { sdrApi, type Lead, type TeamMember } from "@/lib/api"
import { EmailMetrics } from "@/components/analytics/email-metrics"
import { LeadMetrics } from "@/components/analytics/lead-metrics"
import { UsageMetrics } from "@/components/analytics/usage-metrics"
import { differenceInDays } from "date-fns"

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsData, teamData] = await Promise.all([
          sdrApi.getLeads(),
          sdrApi.getTeamMembers()
        ])
        setLeads(leadsData)
        setTeamMembers(teamData)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const calculateEmailMetrics = () => {
    const totalEmails = leads.reduce((acc, lead) => acc + (lead.emails?.length || 0), 0)
    const openedEmails = leads.reduce((acc, lead) => 
      acc + (lead.emails?.filter(e => e.openedAt)?.length || 0), 0)
    const clickedEmails = leads.reduce((acc, lead) => 
      acc + (lead.emails?.filter(e => e.clickedAt)?.length || 0), 0)
    const repliedEmails = leads.reduce((acc, lead) => 
      acc + (lead.emails?.filter(e => e.repliedAt)?.length || 0), 0)

    return {
      totalEmails,
      openRate: totalEmails > 0 ? (openedEmails / totalEmails * 100) : 0,
      clickRate: totalEmails > 0 ? (clickedEmails / totalEmails * 100) : 0,
      replyRate: totalEmails > 0 ? (repliedEmails / totalEmails * 100) : 0
    }
  }

  const calculateLeadMetrics = () => {
    const convertedLeads = leads.filter(l => l.status === 'CONVERTED')
    const conversionRate = leads.length > 0 ? (convertedLeads.length / leads.length * 100) : 0

    // Calculate average time to convert
    const conversionTimes = convertedLeads.map(lead => {
      const firstEmail = lead.emails?.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0]
      if (!firstEmail) return null
      return differenceInDays(
        new Date(lead.updatedAt), // conversion date
        new Date(firstEmail.createdAt) // first contact date
      )
    }).filter(Boolean) as number[]

    const avgTimeToConvert = conversionTimes.length > 0 
      ? conversionTimes.reduce((acc, time) => acc + time, 0) / conversionTimes.length
      : 0

    // Calculate lead quality score based on engagement
    const qualityScores = leads.map(lead => {
      let score = 0
      if (lead.emails?.some(e => e.openedAt)) score += 2
      if (lead.emails?.some(e => e.clickedAt)) score += 3
      if (lead.emails?.some(e => e.repliedAt)) score += 5
      return score
    })

    const avgQualityScore = qualityScores.length > 0
      ? (qualityScores.reduce((acc, score) => acc + score, 0) / qualityScores.length)
      : 0

    return {
      totalLeads: leads.length,
      conversionRate,
      avgTimeToConvert,
      qualityScore: (avgQualityScore / 10) * 10 // Convert to 10-point scale
    }
  }

  const calculateUsageMetrics = () => {
    const emailCredits = leads.reduce((acc, lead) => acc + (lead.emails?.length || 0), 0)
    const storageUsed = Math.round(
      leads.reduce((acc, lead) => 
        acc + 
        JSON.stringify(lead).length + 
        (lead.emails?.reduce((sum, email) => sum + JSON.stringify(email).length, 0) || 0)
      , 0) / 1024 / 1024 // Convert to MB
    )

    return {
      emailCredits,
      storageUsed,
      teamMembers: teamMembers.length
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  const emailMetrics = calculateEmailMetrics()
  const leadMetrics = calculateLeadMetrics()
  const usageMetrics = calculateUsageMetrics()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>

      <Tabs defaultValue="email" className="space-y-8">
        <TabsList>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Email Performance
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Lead Analytics
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Usage & Quotas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Emails Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {emailMetrics.totalEmails}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {emailMetrics.openRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Click Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {emailMetrics.clickRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Reply Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {emailMetrics.replyRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          <EmailMetrics data={leads} />
        </TabsContent>

        <TabsContent value="leads" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leadMetrics.totalLeads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leadMetrics.conversionRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Time to Convert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leadMetrics.avgTimeToConvert.toFixed(1)} days
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lead Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leadMetrics.qualityScore.toFixed(1)}/10
                </div>
              </CardContent>
            </Card>
          </div>

          <LeadMetrics data={leads} />
        </TabsContent>

        <TabsContent value="usage" className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Email Credits Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageMetrics.emailCredits}/1000
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly quota
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  API Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-/5,000</div>
                <p className="text-xs text-muted-foreground">
                  Daily quota
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Storage Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.storageUsed}MB/5GB</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageMetrics.teamMembers}/5</div>
              </CardContent>
            </Card>
          </div>

          <UsageMetrics />
        </TabsContent>
      </Tabs>
    </div>
  )
} 