"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, PieChart } from "lucide-react"
import { sdrApi, type Lead } from "@/lib/api"
import { EmailMetrics } from "@/components/analytics/email-metrics"
import { LeadMetrics } from "@/components/analytics/lead-metrics"
import { UsageMetrics } from "@/components/analytics/usage-metrics"

export default function AnalyticsPage() {
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

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

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
                  {leads.reduce((acc, lead) => acc + lead.emails.length, 0)}
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
                  {(leads.reduce((acc, lead) => 
                    acc + lead.emails.filter(e => e.openedAt).length, 0
                  ) / leads.reduce((acc, lead) => acc + lead.emails.length, 0) * 100).toFixed(1)}%
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
                  {(leads.reduce((acc, lead) => 
                    acc + lead.emails.filter(e => e.clickedAt).length, 0
                  ) / leads.reduce((acc, lead) => acc + lead.emails.length, 0) * 100).toFixed(1)}%
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
                  {(leads.reduce((acc, lead) => 
                    acc + lead.emails.filter(e => e.repliedAt).length, 0
                  ) / leads.reduce((acc, lead) => acc + lead.emails.length, 0) * 100).toFixed(1)}%
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
                <div className="text-2xl font-bold">{leads.length}</div>
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
                  {(leads.filter(l => l.status === 'CONVERTED').length / leads.length * 100).toFixed(1)}%
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
                <div className="text-2xl font-bold">4.2 days</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Lead Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.4/10</div>
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
                  {leads.reduce((acc, lead) => acc + lead.emails.length, 0)}/1000
                </div>
                <p className="text-xs text-muted-foreground">
                  Resets in 12 days
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
                <div className="text-2xl font-bold">2,451/5,000</div>
                <p className="text-xs text-muted-foreground">
                  Resets in 12 days
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
                <div className="text-2xl font-bold">1.2GB/5GB</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3/5</div>
              </CardContent>
            </Card>
          </div>

          <UsageMetrics />
        </TabsContent>
      </Tabs>
    </div>
  )
} 