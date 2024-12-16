"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"
import { ABTest, sdrApi } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

interface ABTestResultsProps {
  test: ABTest
}

interface Metrics {
  opens: {
    total: number
    rate: number
    byVariant: Record<string, { count: number; rate: number }>
  }
  clicks: {
    total: number
    rate: number
    byVariant: Record<string, { count: number; rate: number }>
  }
  replies: {
    total: number
    rate: number
    byVariant: Record<string, { count: number; rate: number }>
  }
  conversions: {
    total: number
    rate: number
    byVariant: Record<string, { count: number; rate: number }>
  }
}

export function ABTestResults({ test }: ABTestResultsProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await sdrApi.getABTestResults(test.id)
        setMetrics(data)
      } catch (error) {
        console.error('Error fetching test results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [test.id])

  if (loading) {
    return <div className="flex justify-center py-8">Loading...</div>
  }

  if (!metrics) {
    return <div>No results available</div>
  }

  const chartData = Object.entries(metrics.opens.byVariant).map(
    ([variant, data]) => ({
      name: variant,
      "Open Rate": data.rate * 100,
      "Click Rate": metrics.clicks.byVariant[variant].rate * 100,
      "Reply Rate": metrics.replies.byVariant[variant].rate * 100,
      "Conversion Rate": metrics.conversions.byVariant[variant].rate * 100,
    })
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{test.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Started {formatDistanceToNow(new Date(test.startDate), { addSuffix: true })}
            </p>
          </div>
          <Badge variant={test.isActive ? "default" : "secondary"}>
            {test.isActive ? "Active" : "Completed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Detailed Results</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Open Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(metrics.opens.rate * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.opens.total} total opens
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Click Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(metrics.clicks.rate * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.clicks.total} total clicks
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Reply Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(metrics.replies.rate * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.replies.total} total replies
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(metrics.conversions.rate * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.conversions.total} total conversions
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance by Variant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="Open Rate"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Click Rate"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Reply Rate"
                          fill="#f59e0b"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="Conversion Rate"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-4">
              {Object.entries(test.variants).map(([variant, content]) => (
                <Card key={variant}>
                  <CardHeader>
                    <CardTitle className="text-lg">Variant {variant}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div>
                          <p className="font-medium">Open Rate</p>
                          <p className="text-2xl font-bold">
                            {(
                              metrics.opens.byVariant[variant].rate * 100
                            ).toFixed(1)}
                            %
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {metrics.opens.byVariant[variant].count} opens
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Click Rate</p>
                          <p className="text-2xl font-bold">
                            {(
                              metrics.clicks.byVariant[variant].rate * 100
                            ).toFixed(1)}
                            %
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {metrics.clicks.byVariant[variant].count} clicks
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Reply Rate</p>
                          <p className="text-2xl font-bold">
                            {(
                              metrics.replies.byVariant[variant].rate * 100
                            ).toFixed(1)}
                            %
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {metrics.replies.byVariant[variant].count} replies
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Conversion Rate</p>
                          <p className="text-2xl font-bold">
                            {(
                              metrics.conversions.byVariant[variant].rate * 100
                            ).toFixed(1)}
                            %
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {metrics.conversions.byVariant[variant].count}{" "}
                            conversions
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium mb-2">Email Content</p>
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: content as string }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 