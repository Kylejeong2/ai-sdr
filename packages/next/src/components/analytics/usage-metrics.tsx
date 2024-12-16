"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function UsageMetrics() {
  const metrics = [
    {
      title: "Email Credits",
      used: 450,
      total: 1000,
      nextReset: "12 days",
    },
    {
      title: "API Calls",
      used: 2451,
      total: 5000,
      nextReset: "12 days",
    },
    {
      title: "Storage",
      used: 1.2,
      total: 5,
      unit: "GB",
      nextReset: null,
    },
    {
      title: "Team Members",
      used: 3,
      total: 5,
      nextReset: null,
    },
  ]

  return (
    <div className="grid gap-8">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {metric.title} Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Progress
                    value={(metric.used / metric.total) * 100}
                    className="h-2"
                  />
                </div>
                <span className="ml-4 text-sm text-muted-foreground">
                  {metric.used}
                  {metric.unit ? metric.unit : ""}/{metric.total}
                  {metric.unit ? metric.unit : ""}
                </span>
              </div>
              {metric.nextReset && (
                <p className="text-xs text-muted-foreground">
                  Resets in {metric.nextReset}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Current Plan</span>
              <span>Pro</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Billing Period</span>
              <span>Monthly</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Next Invoice</span>
              <span>$99 on Dec 31, 2023</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Payment Method</span>
              <span>•••• 4242</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 